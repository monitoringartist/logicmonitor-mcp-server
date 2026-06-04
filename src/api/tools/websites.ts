import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const websitesTools: Tool[] = [
  // Website (Synthetic Monitoring) Tools
  {
    name: 'list_websites',
    description: 'List all website monitors (synthetic checks) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of website monitors with: id, name, type (webcheck/pingcheck), domain/URL, status, checkpoint locations, response time, availability percentage. ' +
      '\n\n**What are website monitors:** Synthetic checks that test URL/service availability from multiple global locations. Like "ping from the internet" to verify your services are accessible. ' +
      '\n\n**When to use:** ' +
      '\n- List all monitored URLs/services' +
      '\n- Check website availability status' +
      '\n- Find website IDs for other operations' +
      '\n- Audit monitored endpoints' +
      '\n\n**Monitor types:** ' +
      '\n- webcheck: Full HTTP/HTTPS check (status code, response time, content validation, SSL cert)' +
      '\n- pingcheck: Simple ICMP ping test (faster, simpler)' +
      '\n\n**Common filter patterns:** ' +
      '\n- By domain: filter:"domain\\~\\*example.com\\*"' +
      '\n- By type: filter:"type:webcheck" or filter:"type:pingcheck"' +
      '\n- By status: filter:"overallAlertStatus:critical" (find down sites)' +
      '\n- By name: filter:"name\\~\\*production\\*"' +
      '\n\n**Use cases:** Monitor public websites, API endpoints, login pages, load balancer health checks, SaaS service availability. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_website" (details), "create\\_website" (add new), "generate\\_website\\_link" (get URL).',
    annotations: {
      title: 'List website monitors',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_website',
    description: 'Get detailed information about a specific website monitor by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete website monitor details: name, type (webcheck/pingcheck), domain/URL, monitoring configuration, checkpoint locations, response time thresholds, SSL settings, authentication, custom headers, alert status. ' +
      '\n\n**When to use:** ' +
      '\n- Review monitoring configuration' +
      '\n- Check checkpoint locations' +
      '\n- Verify URL and settings' +
      '\n- Troubleshoot failed checks' +
      '\n- Audit SSL certificate monitoring' +
      '\n\n**Configuration details returned:** ' +
      '\n- steps: Multi-step transaction monitoring (for complex workflows)' +
      '\n- checkpoints: Which global locations perform checks (e.g., US-East, EU-West, Asia-Pacific)' +
      '\n- schema: HTTP vs HTTPS' +
      '\n- testLocation: Internal (from collector) vs External (from cloud)' +
      '\n- responseTimeThreshold: Alert if slower than X ms' +
      '\n- sslCertExpirationDays: Alert X days before cert expires' +
      '\n\n**Use cases:** ' +
      '\n- Verify website is monitored from correct geographic locations' +
      '\n- Check if SSL certificate expiration monitoring is enabled' +
      '\n- Review response time thresholds (too strict? too lenient?)' +
      '\n- Troubleshoot why website checks are failing' +
      '\n- Document what endpoints are monitored' +
      '\n\n**Workflow:** Use "list\\_websites" to find websiteId, then use this tool for complete monitoring configuration. ' +
      '\n\n**Related tools:** "list\\_websites" (find website), "update\\_website" (modify), "generate\\_website\\_link" (get URL), "list\\_website\\_checkpoints" (available locations).',
    annotations: {
      title: 'Get website monitor details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'create_website',
    description: 'Create a new website monitor (synthetic check) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates synthetic monitoring for websites, APIs, or services. Tests from global checkpoint locations to verify availability, performance, and SSL certificate health. ' +
      '\n\n**When to use:** ' +
      '\n- Monitor customer-facing websites' +
      '\n- Check API endpoint availability' +
      '\n- Track response times from multiple regions' +
      '\n- Monitor SSL certificate expiration' +
      '\n- Verify multi-step transactions' +
      '\n- Monitor third-party services' +
      '\n\n**Required parameters:** ' +
      '\n- name: Monitor name (e.g., "Production Website", "API Health Check")' +
      '\n- domain: URL or hostname (e.g., "example.com", "https://api.example.com")' +
      '\n- type: "webcheck" (HTTP/HTTPS) or "pingcheck" (ICMP ping")' +
      '\n\n**Optional parameters:** ' +
      '\n- groupId: Website folder ID (from "list\\_website\\_groups", default: root)' +
      '\n- description: Monitor purpose/notes' +
      '\n- checkpoints: Array of checkpoint IDs (from "list\\_website\\_checkpoints") for multi-region testing' +
      '\n- steps: Array of HTTP steps for multi-step transactions (login, add to cart, checkout)' +
      '\n- testLocation: "external" (from cloud) or "internal" (from collector)' +
      '\n- schema: "https" or "http"' +
      '\n- responseTimeThreshold: Alert if response time > X milliseconds' +
      '\n- sslCertExpirationDays: Alert X days before SSL expires' +
      '\n- failedCount: Alert after X consecutive failures (default: 2)' +
      '\n\n**Monitor types explained:** ' +
      '\n\n**webcheck (HTTP/HTTPS):** ' +
      '\n- Full HTTP/HTTPS request with response validation' +
      '\n- Check status codes, response time, content matching' +
      '\n- Monitor SSL certificate expiration' +
      '\n- Support for multi-step transactions' +
      '\n- Custom headers, authentication, POST data' +
      '\n\n**pingcheck (ICMP Ping):** ' +
      '\n- Simple reachability test' +
      '\n- Faster, lower overhead than webcheck' +
      '\n- Good for network resources/devices, non-HTTP services' +
      '\n- Only tests if host is reachable' +
      '\n\n**Common monitoring scenarios:** ' +
      '\n\n**Simple website availability:** ' +
      '{name: "Company Website", domain: "example.com", type: "webcheck", checkpoints: [1,2,3], responseTimeThreshold: 3000} ' +
      '\n\n**API health check:** ' +
      '{name: "API /health", domain: "https://api.example.com/health", type: "webcheck", responseTimeThreshold: 500} ' +
      '\n\n**SSL monitoring:** ' +
      '{name: "SSL Cert Check", domain: "example.com", type: "webcheck", sslCertExpirationDays: 30} ' +
      '\n\n**Multi-step transaction (e-commerce):** ' +
      '{name: "Checkout Flow", domain: "shop.example.com", type: "webcheck", steps: [{url: "/login", method: "POST"}, {url: "/cart/add"}, {url: "/checkout"}]} ' +
      '\n\n**Regional performance monitoring:** ' +
      '{name: "Global Website Performance", domain: "example.com", type: "webcheck", checkpoints: [1,2,3,4,5,6]} // Test from US, EU, Asia ' +
      '\n\n**Best practices:** ' +
      '\n- Use multiple checkpoints for production sites (avoid false positives)' +
      '\n- Set realistic responseTimeThreshold (not too sensitive)' +
      '\n- Monitor SSL expiration 30+ days in advance' +
      '\n- Use internal testLocation for private/VPN applications' +
      '\n- Test multi-step transactions for critical user flows' +
      '\n- Set failedCount >=2 to reduce false alarms' +
      '\n\n**After creation:** Use "generate\\_website\\_link" to get direct URL to view monitor results. ' +
      '\n\n**Related tools:** "list\\_website\\_checkpoints" (find locations), "generate\\_website\\_link" (get URL), "update\\_website" (modify), "list\\_websites" (browse existing).',
    annotations: {
      title: 'Create website monitor',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the website monitor',
        },
        domain: {
          type: 'string',
          description: 'Domain or URL to monitor',
        },
        type: {
          type: 'string',
          description: 'Monitor type: "webcheck" or "pingcheck"',
        },
        description: {
          type: 'string',
          description: 'Description of the monitor',
        },
        checkpointId: {
          type: 'number',
          description: 'Checkpoint location ID',
        },
      },
      additionalProperties: false,
      required: ['name', 'domain', 'type'],
    },
  },
  {
    name: 'update_website',
    description: 'Update an existing website monitor in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify website monitor settings including URL, checkpoints, thresholds, SSL settings, or multi-step transaction flows. ' +
      '\n\n**When to use:** ' +
      '\n- Change monitored URL' +
      '\n- Add/remove checkpoint locations' +
      '\n- Update response time thresholds' +
      '\n- Modify SSL expiration alerts' +
      '\n- Update multi-step transaction steps' +
      '\n- Enable/disable monitoring' +
      '\n\n**Required parameters:** ' +
      '\n- websiteId: Website monitor ID (from "list\\_websites")' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New monitor name' +
      '\n- domain: New URL/hostname' +
      '\n- description: Updated description' +
      '\n- groupId: Move to different folder' +
      '\n- checkpoints: Update checkpoint locations' +
      '\n- responseTimeThreshold: New response time alert threshold' +
      '\n- sslCertExpirationDays: Update SSL warning days' +
      '\n- failedCount: Change consecutive failure threshold' +
      '\n- steps: Update multi-step transaction flow' +
      '\n- stopMonitoring: true (pause) or false (resume monitoring)' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update URL after migration:** ' +
      '{websiteId: 123, domain: "https://new-domain.com"} ' +
      '\n\n**Add more checkpoint locations:** ' +
      '{websiteId: 123, checkpoints: [1,2,3,4,5,6]} // Add Asia-Pacific checkpoints ' +
      '\n\n**Adjust response time threshold:** ' +
      '{websiteId: 123, responseTimeThreshold: 5000} // Increase to 5 seconds ' +
      '\n\n**Update SSL certificate warning:** ' +
      '{websiteId: 123, sslCertExpirationDays: 60} // Alert 60 days before expiry ' +
      '\n\n**Temporarily pause monitoring:** ' +
      '{websiteId: 123, stopMonitoring: true} // During maintenance ' +
      '\n\n**Update multi-step transaction:** ' +
      '{websiteId: 123, steps: [{url: "/api/v2/health"}, {url: "/api/v2/status"}]} // New API version ' +
      '\n\n**Best practice:** Use "get\\_website" first to review current configuration, then update specific fields. ' +
      '\n\n**After update:** Monitor may take 1-2 minutes to reflect changes in next check cycle. ' +
      '\n\n**Related tools:** "get\\_website" (review before update), "list\\_websites" (find website), "generate\\_website\\_link" (get updated URL).',
    annotations: {
      title: 'Update website monitor',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'delete_website',
    description: 'Delete a website monitor from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION** ' +
      '\n- Website monitor and all historical data permanently removed' +
      '\n- Response time history lost (cannot be recovered)' +
      '\n- Active alerts for this monitor cleared' +
      '\n- Cannot be undone' +
      '\n\n**What this does:** Permanently removes website/synthetic monitor from LogicMonitor. All monitoring stops immediately and historical performance data is deleted. ' +
      '\n\n**When to use:** ' +
      '\n- Service/website decommissioned' +
      '\n- URL permanently moved to different monitor' +
      '\n- Duplicate monitors cleanup' +
      '\n- Replacing with different monitoring approach' +
      '\n\n**Required parameters:** ' +
      '\n- websiteId: Website monitor ID to delete (from "list\\_websites")' +
      '\n\n**Before deleting - check:** ' +
      '\n- Use "get\\_website" to verify correct monitor' +
      '\n- Check if others depend on this monitor (dashboards, reports)' +
      '\n- Consider exporting historical data if needed' +
      '\n- Verify no active incidents related to this monitor' +
      '\n\n**Impact of deletion:** ' +
      '\n- Monitoring stops immediately (no more checks)' +
      '\n- Historical response time data deleted' +
      '\n- Dashboards showing this website will display "no data"' +
      '\n- Reports including this monitor need updating' +
      '\n- Alert rules filtering on this monitor may break' +
      '\n\n**Alternatives to deletion:** ' +
      '\n- **Pause instead:** Use "update\\_website" with stopMonitoring:true (preserves history)' +
      '\n- **Rename:** Mark as "DISABLED - [name]" instead of deleting' +
      '\n- **Move to archive folder:** Keep monitor but organize differently' +
      '\n- **Reduce check frequency:** Update to check less often instead of deleting' +
      '\n\n**Best practice:** Use "update\\_website" to pause monitoring (stopMonitoring:true) instead of deleting if you might need to resume monitoring later. ' +
      '\n\n**Workflow:** Use "get\\_website" to verify, export historical data if needed, then delete. ' +
      '\n\n**Related tools:** "get\\_website" (verify before delete), "list\\_websites" (find website), "update\\_website" (pause instead of delete).',
    annotations: {
      title: 'Delete website monitor',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website to delete',
        },
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },

  // Website Group Tools
  {
    name: 'list_website_groups',
    description: 'List all website groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of website groups with: id, name, parentId, full path, description, number of websites, number of subgroups. ' +
      '\n\n**What are website groups:** Organizational folders for website monitors (synthetic checks), similar to resource/device groups. Used to categorize monitored URLs/services by application, environment, or customer. ' +
      '\n\n**When to use:** ' +
      '\n- Browse website organization before creating monitors' +
      '\n- Find group IDs for website operations' +
      '\n- Understand monitoring hierarchy' +
      '\n- Navigate to specific website folders' +
      '\n\n**Common organization patterns:** ' +
      '\n- By application: "E-Commerce Site", "API Endpoints", "Marketing Pages"' +
      '\n- By environment: "Production URLs", "Staging URLs", "DR Sites"' +
      '\n- By location: "US Sites", "EU Sites", "APAC Sites"' +
      '\n- By customer: "Customer A Sites", "Customer B Sites" (MSP)' +
      '\n- By type: "Public Websites", "Internal Apps", "Third-Party APIs"' +
      '\n\n**Use cases:** ' +
      '\n- Organize monitors by application or service' +
      '\n- Group customer-facing vs internal endpoints' +
      '\n- Separate production vs non-production monitoring' +
      '\n- Structure multi-region website monitoring' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list\\_websites" filtered by groupId to see monitors in specific folder. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_website\\_group" (details), "list\\_websites" (websites in group), "create\\_website\\_group" (create folder).',
    annotations: {
      title: 'List website groups',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_website_group',
    description: 'Get detailed information about a specific website group by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete website group details: name, full path, parentId, description, number of websites (direct and total), number of subgroups, alert status. ' +
      '\n\n**When to use:** ' +
      '\n- Get group path for documentation' +
      '\n- Check website membership counts' +
      '\n- Verify group hierarchy' +
      '\n- Review group structure before creating monitors' +
      '\n\n**Workflow:** Use "list\\_website\\_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list\\_website\\_groups" (find groups), "list\\_websites" (websites in group), "create\\_website\\_group" (create new).',
    annotations: {
      title: 'Get website group details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the website group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_website_group',
    description: 'Create a new website (synthetic monitoring) group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a folder to organize website monitors (web checks / ping checks) into a hierarchy. ' +
      '\n\n**Required:** name. ' +
      '\n\n**Optional:** description, parentId (defaults to root group 1 if omitted), disableAlerting, stopMonitoring, plus properties/testLocation via `config`. ' +
      '\n\n**Related tools:** "list\\_website\\_groups", "create\\_website" (place monitors in the group).',
    annotations: { title: 'Create website group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The website group name' },
        description: { type: 'string', description: 'The website group description' },
        parentId: { type: 'number', description: 'The parent website group ID (root = 1)' },
        disableAlerting: { type: 'boolean', description: 'Disable alerting for the group' },
        stopMonitoring: { type: 'boolean', description: 'Stop monitoring for the group' },
        config: {
          type: 'object',
          description: 'Additional website group attributes (e.g., properties, testLocation) merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_website_group',
    description: 'Update a website group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** groupId plus any of name, description, parentId (move the group), disableAlerting, stopMonitoring, or additional fields via `config`. Partial update. ' +
      '\n\n**Optional:** opType ("refresh"/"add"/"replace") controls how `properties` are merged when supplied. ' +
      '\n\n**Related tools:** "get\\_website\\_group", "list\\_website\\_groups".',
    annotations: { title: 'Update website group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The website group ID to update' },
        name: { type: 'string', description: 'New website group name' },
        description: { type: 'string', description: 'New description' },
        parentId: { type: 'number', description: 'Move the group under a different parent group ID' },
        disableAlerting: { type: 'boolean', description: 'Disable alerting for the group' },
        stopMonitoring: { type: 'boolean', description: 'Stop monitoring for the group' },
        opType: { type: 'string', description: 'How to merge properties: "refresh", "add", or "replace".' },
        config: {
          type: 'object',
          description: 'Additional website group attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_website_group',
    description: 'Delete a website group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Cannot be undone. By default a non-empty group cannot be deleted; set deleteChildren=1 to also delete its websites and subgroups. ' +
      '\n\n**Parameters:** groupId; optional deleteChildren (1 = delete contained websites/subgroups too, 0 = only an empty group). ' +
      '\n\n**Before deleting:** Use "get\\_website\\_group" to check the website/subgroup counts. ' +
      '\n\n**Related tools:** "get\\_website\\_group", "list\\_website\\_groups".',
    annotations: { title: 'Delete website group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The website group ID to delete' },
        deleteChildren: { type: 'number', description: 'Set to 1 to also delete contained websites and subgroups (default 0).' },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'list_website_group_websites',
    description: 'List the website monitors that belong directly to a specific website group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of website monitors (web/ping checks) in the group, with id, name, type, status. ' +
      '\n\n**Related tools:** "list\\_website\\_groups", "get\\_website\\_group", "list\\_websites".',
    annotations: { title: 'List websites in group', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The website group ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'list_website_group_sdts',
    description: 'List the active/scheduled down times (SDTs) configured on a specific website group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of SDT entries affecting the group: id, type, start/end time, comment. ' +
      '\n\n**Related tools:** "get\\_website\\_group\\_sdt\\_history" (past SDTs), "create\\_sdt", "list\\_website\\_groups".',
    annotations: { title: 'List website group SDTs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The website group ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'get_website_group_sdt_history',
    description: 'Get the scheduled down time (SDT) history for a specific website group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of historical (expired) SDT entries for the group: id, type, start/end time, comment. ' +
      '\n\n**Related tools:** "list\\_website\\_group\\_sdts" (active SDTs), "list\\_website\\_groups".',
    annotations: { title: 'Get website group SDT history', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The website group ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Website extras
  {
    name: 'get_website_sdt_history',
    description: 'Get the scheduled downtime (SDT) history for a website in LogicMonitor (LM).',
    annotations: { title: 'Get website SDT history', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: { type: 'number', description: 'The website ID' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'get_website_graph_by_name',
    description: 'Get rendered graph data for a website by graph name in LogicMonitor (LM). ' +
      '\n\n**Parameters:** websiteId, graphName, optional start/end (epoch seconds) and format. ' +
      '\n\n**⚠️ graphName must be an exact existing graph name** for the website (LM returns "No such graph(name=...)" otherwise). Names depend on the check type, e.g. "Response Time", "Rendering Time", "Status" — they are not datapoint names like "ping". Inspect the website config via "get\\_website" to find valid graph names.',
    annotations: { title: 'Get website graph by name', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: { type: 'number', description: 'The website ID' },
        graphName: { type: 'string', description: 'The graph name' },
        start: { type: 'number', description: 'Start epoch seconds.' },
        end: { type: 'number', description: 'End epoch seconds.' },
        format: { type: 'string', description: 'Response format.' },
      },
      additionalProperties: false,
      required: ['websiteId', 'graphName'],
    },
  },

  // Website Checkpoints
  {
    name: 'list_website_checkpoints',
    description: 'List available checkpoint locations for website monitoring in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of checkpoint locations with: id, name, geographic region, status, type (internal/external). ' +
      '\n\n**What are checkpoints:** Global testing locations from which LogicMonitor runs synthetic website checks. Think "test my website from New York, London, Tokyo" - checkpoints are those global vantage points. ' +
      '\n\n**When to use:**' +
      '\n- Check available checkpoint locations before creating website monitors' +
      '\n- Verify geographic coverage for multi-region testing' +
      '\n- Select appropriate locations for SLA monitoring' +
      '\n- Plan website monitoring strategy' +
      '\n' +
      '\n\n**Checkpoint types:** ' +
      '\n- **External (Cloud):** LogicMonitor-managed locations around the world (US-East, EU-West, Asia-Pacific, etc.) ' +
      '\n- **Internal (Collector-based):** Tests run from your own collectors (test internal apps, VPNs, private networks) ' +
      '\n\n**Common checkpoint locations:** ' +
      '\n- North America: US-East, US-West, US-Central, Canada ' +
      '\n- Europe: EU-West (Ireland), EU-Central (Frankfurt), UK ' +
      '\n- Asia-Pacific: Singapore, Sydney, Tokyo ' +
      '\n- South America: São Paulo ' +
      '\n\n**Use cases:** ' +
      '\n- **Global SLA monitoring:** Test from regions where customers are located ' +
      '\n- **CDN verification:** Ensure content delivery works worldwide ' +
      '\n- **Regional compliance:** Monitor from specific geographic locations ' +
      '\n- **Multi-region performance:** Compare response times across locations ' +
      '\n- **Failover testing:** Verify DR sites accessible from all regions ' +
      '\n\n**Best practices:** ' +
      '\n- Select checkpoints near your user base ' +
      '\n- Use multiple checkpoints for critical services (avoid false positives from single location issues) ' +
      '\n- Mix internal and external checkpoints for comprehensive coverage ' +
      '\n- Consider timezone differences for result interpretation ' +
      '\n\n**Workflow:** Use this tool to discover available locations, then use those checkpoint IDs when creating website monitors via "create\\_website". ' +
      '\n\n**Related tools:** "list\\_websites" (existing monitors), "create\\_website" (configure checkpoints), "get\\_website" (verify checkpoint configuration).',
    annotations: {
      title: 'List checkpoint locations',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_website_checkpoint_data',
    description: 'Get raw monitoring data for a specific website checkpoint in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Raw time-series data collected by one checkpoint location for a website monitor - datapoint values (e.g., response time, status, availability) over the requested time range. ' +
      '\n\n**What this does:** Retrieves the actual measured values a single checkpoint (global test location) recorded for a website, as opposed to a rendered graph. Useful for analyzing performance from a specific region. ' +
      '\n\n**When to use:**' +
      '\n- Analyze response time / availability from one checkpoint location' +
      '\n- Compare raw datapoint values across regions' +
      '\n- Export checkpoint measurements for custom analysis' +
      '\n\n**Required parameters:**' +
      '\n- websiteId: The website monitor ID (from "list\\_websites")' +
      '\n- checkpointId: The checkpoint location ID (from "list\\_website\\_checkpoints" or the website\'s configuration)' +
      '\n\n**Optional parameters:**' +
      '\n- period: Number of periods of data to return (alternative to start/end)' +
      '\n- start: Start of the time range, in epoch seconds' +
      '\n- end: End of the time range, in epoch seconds' +
      '\n- datapoints: Comma-separated datapoint names to return (e.g., "responseTime,status")' +
      '\n- aggregate: Aggregation option for the returned values' +
      '\n- format: Response format for the data payload' +
      '\n\n**Related tools:** "get\\_website\\_graph\\_data" (rendered graph series), "list\\_website\\_checkpoints" (find checkpoint IDs), "get\\_website" (website configuration).',
    annotations: {
      title: 'Get website checkpoint data',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website monitor (from "list_websites").',
        },
        checkpointId: {
          type: 'number',
          description: 'The ID of the checkpoint location (from "list_website_checkpoints").',
        },
        period: {
          type: 'number',
          description: 'Number of periods of data to return (alternative to start/end).',
        },
        start: {
          type: 'number',
          description: 'Start of the time range, in epoch seconds (optional).',
        },
        end: {
          type: 'number',
          description: 'End of the time range, in epoch seconds (optional).',
        },
        datapoints: {
          type: 'string',
          description: 'Comma-separated datapoint names to return (e.g., "responseTime,status").',
        },
        aggregate: {
          type: 'string',
          description: 'Aggregation option for the returned values.',
        },
        format: {
          type: 'string',
          description: 'Optional response format for the data payload.',
        },
      },
      additionalProperties: false,
      required: ['websiteId', 'checkpointId'],
    },
  },
  {
    name: 'get_website_graph_data',
    description: 'Get rendered graph data for a website monitor checkpoint in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Graph plot data (series, lines, and datapoint values) for a named graph of a website monitor, as measured from a specific checkpoint location. ' +
      '\n\n**What this does:** Returns the data behind a specific website graph (e.g., a response-time graph) for one checkpoint, suitable for charting or analysis. ' +
      '\n\n**When to use:**' +
      '\n- Pull the data series shown by a website monitor graph' +
      '\n- Visualize response time / availability trends from a checkpoint' +
      '\n- Feed website graph data into downstream analysis' +
      '\n\n**Required parameters:**' +
      '\n- websiteId: The website monitor ID (from "list\\_websites")' +
      '\n- checkpointId: The checkpoint location ID (from "list\\_website\\_checkpoints")' +
      '\n- graphName: The name of the graph to retrieve (as configured on the website monitor)' +
      '\n\n**Optional parameters:**' +
      '\n- start: Start of the time range, in epoch seconds' +
      '\n- end: End of the time range, in epoch seconds' +
      '\n- format: Response format for the data payload' +
      '\n\n**Related tools:** "get\\_website\\_checkpoint\\_data" (raw datapoint values), "list\\_website\\_checkpoints" (find checkpoint IDs), "get\\_website" (website configuration).',
    annotations: {
      title: 'Get website graph data',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website monitor (from "list_websites").',
        },
        checkpointId: {
          type: 'number',
          description: 'The ID of the checkpoint location (from "list_website_checkpoints").',
        },
        graphName: {
          type: 'string',
          description: 'The name of the graph to retrieve (as configured on the website monitor).',
        },
        start: {
          type: 'number',
          description: 'Start of the time range, in epoch seconds (optional).',
        },
        end: {
          type: 'number',
          description: 'End of the time range, in epoch seconds (optional).',
        },
        format: {
          type: 'string',
          description: 'Optional response format for the data payload.',
        },
      },
      additionalProperties: false,
      required: ['websiteId', 'checkpointId', 'graphName'],
    },
  },

];
