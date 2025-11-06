/**
 * Server Factory - Core MCP Server Logic
 *
 * This module provides the factory function to create configured MCP server instances.
 * Following the pattern from @modelcontextprotocol/servers/everything example.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  SetLevelRequestSchema,
  CompleteRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { listLMResources, readLMResource } from '../api/resources.js';
import { listLMPrompts, getLMPrompt, generatePromptMessages } from '../api/prompts.js';
import { readFileSync } from 'fs';
import path from 'path';

export interface ServerConfig {
  version: string;
  tools: Tool[];
  lmClient?: LogicMonitorClient;
  lmHandlers?: LogicMonitorHandlers;
  sessionId?: string;
  userScope?: string;
  enablePeriodicUpdates?: boolean;
}

export interface ServerInstance {
  server: Server;
  cleanup: () => Promise<void>;
  startNotificationIntervals?: (sessionId?: string) => void;
}

/**
 * Creates a configured MCP server instance with all handlers set up
 *
 * @param config Server configuration
 * @returns Configured server instance with cleanup function
 */
export function createServer(config: ServerConfig): ServerInstance {
  const {
    version,
    tools,
    lmClient: _lmClient,
    lmHandlers,
    sessionId,
    userScope = 'mcp:tools',
  } = config;

  const instructions = readFileSync(path.join(__dirname, 'instructions.md'), 'utf8');

  // Create the server instance
  const server = new Server(
    {
      name: 'logicmonitor-mcp-server',
      title: 'LogicMonitor MCP Server',
      version,
    },
    {
      capabilities: {
        tools: {},
        resources: { subscribe: true },
        prompts: {},
        logging: {},
        completions: {},
      },
      instructions,
    },
  );

  // Store session-specific metadata
  (server as any).currentUserScope = userScope;
  if (sessionId) {
    (server as any).sessionId = sessionId;
  }

  // Track subscriptions and intervals
  const intervals: NodeJS.Timeout[] = [];
  const subscriptions = new Set<string>();

  // ===========================
  // Request Handlers
  // ===========================

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle resource listing
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = listLMResources();
    return {
      resources: resources.map(r => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  });

  // Handle resource read requests
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    return await readLMResource(uri);
  });

  // Handle resource subscription requests
  server.setRequestHandler(SubscribeRequestSchema, async (request) => {
    const { uri } = request.params;
    subscriptions.add(uri);
    console.error(`[LogicMonitor MCP] Subscribed to resource: ${uri}`);
    return {};
  });

  // Handle resource unsubscribe requests
  server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
    const { uri } = request.params;
    subscriptions.delete(uri);
    console.error(`[LogicMonitor MCP] Unsubscribed from resource: ${uri}`);
    return {};
  });

  // Handle prompt listing
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const prompts = listLMPrompts();
    return {
      prompts: prompts.map(p => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    };
  });

  // Handle get prompt requests
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompt = getLMPrompt(name);

    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    // Generate the prompt messages using centralized logic
    return generatePromptMessages(name, args);
  });

  // Handle logging/setLevel requests
  server.setRequestHandler(SetLevelRequestSchema, async (request) => {
    const { level } = request.params;
    // Logging level is typically set at startup, so this is informational
    console.error(`[LogicMonitor MCP] Logging level set to: ${level}`);
    return {};
  });

  // Handle completion requests
  server.setRequestHandler(CompleteRequestSchema, async (request) => {
    const { ref, argument } = request.params;

    if (!lmHandlers) {
      // Return empty completions if no credentials configured
      return {
        completion: {
          values: [],
          total: 0,
          hasMore: false,
        },
      };
    }

    const completion = await lmHandlers.handleCompletion(ref, argument);

    return {
      completion,
    };
  });

  // Handle tool execution requests
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args, _meta } = request.params;
    const progressToken = _meta?.progressToken;

    if (!lmHandlers) {
      throw new Error('LogicMonitor credentials not configured. Please set LM_COMPANY and LM_BEARER_TOKEN environment variables.');
    }

    // Create progress callback if progress token is provided
    const progressCallback = progressToken !== undefined
      ? async (progress: number, total: number) => {
        try {
          await server.notification({
            method: 'notifications/progress',
            params: {
              progressToken,
              progress,
              total,
            },
          }, { relatedRequestId: extra.requestId });
        } catch (err) {
          // Silently ignore notification errors
          console.error('[LogicMonitor MCP] Progress notification error:', err);
        }
      }
      : undefined;

    const result = await lmHandlers.handleToolCall(name, args || {}, progressCallback);

    return {
      content: [
        {
          type: 'text' as const,
          text: lmHandlers.formatResponse(result),
        },
      ],
    };
  });

  // Start notification intervals for subscribed resources
  const startNotificationIntervals = (_sessionId?: string) => {
    // Optional: Add periodic tasks for resource updates
    if (config.enablePeriodicUpdates) {
      console.error('[LogicMonitor MCP] Starting periodic resource update notifications');
      const interval = setInterval(async () => {
        for (const uri of subscriptions) {
          try {
            await server.notification({
              method: 'notifications/resources/updated',
              params: { uri },
            });
            console.error(`[LogicMonitor MCP] Sent update notification for resource: ${uri}`);
          } catch (err) {
            // Silently ignore notification errors
            console.error('[LogicMonitor MCP] Resource notification error:', err);
          }
        }
      }, 10000); // Send notifications every 10 seconds
      intervals.push(interval);
    }
  };

  // Cleanup function - clear all intervals
  const cleanup = async () => {
    console.error('[LogicMonitor MCP] Cleaning up server resources');
    intervals.forEach(clearInterval);
    intervals.length = 0;
    subscriptions.clear();
  };

  return {
    server,
    cleanup,
    startNotificationIntervals,
  };
}

