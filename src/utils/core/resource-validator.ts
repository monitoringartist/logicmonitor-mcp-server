/**
 * RFC 8707 Resource Indicators for OAuth 2.0
 * Validates and manages resource parameters in OAuth flows
 * https://tools.ietf.org/html/rfc8707
 */

/**
 * Normalizes a URL by removing trailing slashes
 * This ensures consistent URL comparison regardless of trailing slashes
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash from pathname (even from root "/")
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    // If pathname becomes empty, keep it empty (will result in no path)
    // Reconstruct URL without trailing slash
    return `${urlObj.protocol}//${urlObj.host}${pathname}${urlObj.search}${urlObj.hash}`;
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Validates that a resource parameter is a valid absolute URI
 * Per RFC 8707 Section 2: "The value of the resource parameter MUST be an absolute URI"
 */
export function isValidResourceUri(resource: string): boolean {
  try {
    const url = new URL(resource);
    // Must be absolute URI (has scheme and authority)
    return url.protocol !== '' && url.hostname !== '';
  } catch {
    return false;
  }
}

/**
 * Validates that the requested resource(s) match the authorized resource(s)
 * Per RFC 8707 Section 2.2: "The authorization server MUST validate that the requested resources
 * are the same as or a subset of the resources originally authorized"
 */
export function validateResourceMatch(
  requestedResources: string | string[] | undefined,
  authorizedResources: string | string[] | undefined,
): { valid: boolean; error?: string } {
  // If no resources were requested or authorized, allow (backward compatibility)
  if (!requestedResources && !authorizedResources) {
    return { valid: true };
  }

  // Normalize to arrays and normalize URLs
  const requested = normalizeResources(requestedResources).map(normalizeUrl);
  const authorized = normalizeResources(authorizedResources).map(normalizeUrl);

  // If resources were authorized but none requested in token call, use authorized ones
  if (requested.length === 0 && authorized.length > 0) {
    return { valid: true };
  }

  // If resources were requested but none authorized, reject
  if (requested.length > 0 && authorized.length === 0) {
    return {
      valid: false,
      error: 'Resource parameters not included in authorization request',
    };
  }

  // Check that all requested resources are in the authorized set (with normalized comparison)
  for (const resource of requested) {
    if (!authorized.includes(resource)) {
      return {
        valid: false,
        error: `Requested resource '${resource}' was not authorized`,
      };
    }
  }

  return { valid: true };
}

/**
 * Normalizes resource parameter(s) to an array of strings
 */
export function normalizeResources(resources: string | string[] | undefined): string[] {
  if (!resources) {
    return [];
  }

  if (Array.isArray(resources)) {
    return resources.filter(r => r && typeof r === 'string');
  }

  if (typeof resources === 'string') {
    // RFC 8707 allows space-separated values, but typically it's a single URI
    // or multiple 'resource' parameters in the request
    return resources.split(' ').filter(r => r.trim() !== '');
  }

  return [];
}

/**
 * Validates all resources in a list are valid absolute URIs
 */
export function validateResourceUris(resources: string[]): { valid: boolean; invalidResources: string[] } {
  const invalidResources: string[] = [];

  for (const resource of resources) {
    if (!isValidResourceUri(resource)) {
      invalidResources.push(resource);
    }
  }

  return {
    valid: invalidResources.length === 0,
    invalidResources,
  };
}

/**
 * Determines the audience claim for a JWT based on requested resources
 * Per RFC 8707 Section 4: "the authorization server SHOULD set the aud claim to the
 * same value as the requested resource parameter"
 */
export function determineAudience(
  requestedResources: string | string[] | undefined,
  authorizedResources: string | string[] | undefined,
  defaultAudience: string,
): string | string[] {
  // Get the requested resources, falling back to authorized resources
  const requested = normalizeResources(requestedResources).map(normalizeUrl);
  const authorized = normalizeResources(authorizedResources).map(normalizeUrl);
  const resources = requested.length > 0 ? requested : authorized;

  // If no resources specified, use default (server's BASE_URL), normalized
  if (resources.length === 0) {
    return normalizeUrl(defaultAudience);
  }

  // If single resource, return as string
  if (resources.length === 1) {
    return resources[0];
  }

  // Multiple resources, return as array
  return resources;
}

/**
 * Checks if a resource is supported by this server
 * In a multi-tenant or multi-service environment, this would check against
 * a list of supported resource servers
 */
export function isSupportedResource(resource: string, supportedResources: string[]): boolean {
  // Normalize URLs for comparison (handles trailing slashes)
  const normalizedResource = normalizeUrl(resource);
  const normalizedSupportedResources = supportedResources.map(normalizeUrl);
  return normalizedSupportedResources.includes(normalizedResource);
}

/**
 * Gets the list of supported resources for this server
 */
export function getSupportedResources(baseUrl: string): string[] {
  // For this MCP server, we support our own BASE_URL as a resource
  // In a more complex setup, you might support multiple resource servers
  // Normalize the URL to ensure consistent comparison
  return [normalizeUrl(baseUrl)];
}

/**
 * Validates and normalizes resource parameters from an authorization or token request
 */
export function processResourceParameter(
  resourceParam: string | string[] | undefined,
  baseUrl: string,
  requestId?: string,
): { valid: boolean; resources: string[]; error?: string; error_description?: string } {
  // Normalize to array
  const resources = normalizeResources(resourceParam);

  // If no resources specified, allow (backward compatibility)
  if (resources.length === 0) {
    return { valid: true, resources: [] };
  }

  // Validate all resources are absolute URIs
  const uriValidation = validateResourceUris(resources);
  if (!uriValidation.valid) {
    return {
      valid: false,
      resources: [],
      error: 'invalid_target',
      error_description: `Invalid resource URIs: ${uriValidation.invalidResources.join(', ')}. Resources must be absolute URIs.`,
    };
  }

  // Check if resources are supported by this server (with normalized comparison)
  const supportedResources = getSupportedResources(baseUrl);
  const unsupportedResources = resources.filter(r => !isSupportedResource(r, supportedResources));

  if (unsupportedResources.length > 0) {
    return {
      valid: false,
      resources: [],
      error: 'invalid_target',
      error_description: `Unsupported resources: ${unsupportedResources.join(', ')}. This server supports: ${supportedResources.join(', ')}`,
    };
  }

  // Return normalized resources
  return { valid: true, resources: resources.map(normalizeUrl) };
}

