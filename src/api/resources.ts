/**
 * LogicMonitor MCP Server - Resources
 *
 * This module provides MCP resources for LogicMonitor API documentation
 * and related resources that can be retrieved by the AI assistant.
 */

import https from 'https';
import http from 'http';

/**
 * Resource definition for LogicMonitor API Swagger documentation
 */
export interface LMResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

/**
 * Available LogicMonitor resources
 */
export const LM_RESOURCES: LMResource[] = [
  {
    uri: 'lm://api/swagger',
    name: 'LogicMonitor (LM) API Definition (Swagger/OpenAPI)',
    description: 'Complete LogicMonitor REST API v3 definition in Swagger/OpenAPI format. ' +
      'Contains all available endpoints, request/response schemas, authentication methods, ' +
      'and API documentation. Use this to understand the LogicMonitor API structure, ' +
      'available operations, and data models. Source: https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json\n\n' +
      'Before making API calls, you should authenticate yourself. ' +
      'You can make v3 requests by including a \'?v=3\' query parameter or by including a \'X-Version:3\' header. ' +
      'Properties passed in the body of an API call are case sensitive. ' +
      'When adding cloud devices, do not use NetScan to discover cloud devices as it can lead to issues. Instead, follow the new onboarding process. ' +
      'For more information, see LM Cloud Monitoring Overview, Enabling Cloud Monitoring using Local Collector, and AWS Monitoring Setup.\n\n' +
      'Offset indicates the position of a specific record in the dataset. It is the starting point of the list. ' +
      'For example, there is an array of 10 elements and in the API request you specify offset as 4. The API response will return result from the 5th element onwards. ' +
      'For fetching alerts, the offset limit is 10000 alerts.\n\n' +
      'Size indicates the number of elements to return at a time in the response. For example, if you specify size=60, then the response will return result in a batch of 60. ' +
      'LogicMonitor REST API v3 supports maximum size of 1000 records. Even if you specify a number above 1000, the response will always return 1000 records. ' +
      'Example, there are 7000 alerts and you set offset=1000 and size=500. In the response, the API will return alerts from 1001 to 1500.\n\n' +
      'In case of SDTs endpoints, the response may contain extra fields depending upon the type of SDT that you select. ' +
      'In case of Widgets endpoints, based on the widget type you select, the request and response will contain additional attributes. ' +
      'For more details about the attributes, refer models specific to the selected widget type at the end of the Swagger documentation.',
    mimeType: 'application/json',
  },
];

/**
 * Fetches content from a URL using HTTPS or HTTP
 */
async function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'LogicMonitor-MCP-Server/1.0',
        'Accept': 'application/json',
      },
    };

    protocol.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirects
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          fetchUrl(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Reads the content of a LogicMonitor resource
 */
export async function readLMResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType?: string; text: string }> }> {
  const resource = LM_RESOURCES.find(r => r.uri === uri);

  if (!resource) {
    throw new Error(`Resource not found: ${uri}`);
  }

  // Handle different resource types
  if (uri === 'lm://api/swagger') {
    const swaggerUrl = 'https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json';

    try {
      const content = await fetchUrl(swaggerUrl);

      // Validate that it's valid JSON
      JSON.parse(content);

      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch LogicMonitor API definition: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(`Unsupported resource URI: ${uri}`);
}

/**
 * Lists all available LogicMonitor resources
 */
export function listLMResources(): LMResource[] {
  return LM_RESOURCES;
}

