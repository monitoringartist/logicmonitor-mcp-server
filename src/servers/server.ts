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
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { listLMResources, readLMResource } from '../api/resources.js';
import { listLMPrompts, getLMPrompt, generatePromptMessages } from '../api/prompts.js';

export interface ServerConfig {
  version: string;
  tools: Tool[];
  lmClient?: LogicMonitorClient;
  lmHandlers?: LogicMonitorHandlers;
  sessionId?: string;
  userScope?: string;
}

export interface ServerInstance {
  server: Server;
  cleanup?: () => Promise<void>;
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

  // Create the server instance
  const server = new Server(
    {
      name: 'logicmonitor-mcp-server',
      version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {},
        completions: {},
      },
    },
  );

  // Store session-specific metadata
  (server as any).currentUserScope = userScope;
  if (sessionId) {
    (server as any).sessionId = sessionId;
  }

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
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
          });
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

  // Cleanup function (optional, for future use)
  const cleanup = async () => {
    // Any cleanup needed when server is disposed
    // For example: disconnect from databases, clear intervals, etc.
  };

  return {
    server,
    cleanup,
  };
}

