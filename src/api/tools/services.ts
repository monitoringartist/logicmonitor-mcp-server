import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const servicesTools: Tool[] = [
  // Services
  {
    name: 'list_services',
    description: 'List all business services in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of services with: id, name, description, health status, dependencies, monitored resources, service level objectives (SLOs), availability percentage. ' +
      '\n\n**What are services:** Business-level monitoring constructs that aggregate multiple resources/devices/resources into a single health status. Represent customer-facing services, applications, or business processes. Example: "E-Commerce Platform" service includes web servers, databases, load balancers, and APIs - one health indicator for entire platform. ' +
      '\n\n**When to use:**' +
      '\n- Monitor business service health vs individual resource/device health' +
      '\n- Track SLA compliance for customer-facing services' +
      '\n- Understand service dependencies' +
      '\n- Create business-level dashboards' +
      '\n- Report on application availability' +
      '\n' +
      '\n\n**Service health calculation:** ' +
      'Service health = Aggregate of all dependent resources. If critical resource fails, service status = down. Allows stakeholders to see "Is the application working?" instead of "Is server X working?" ' +
      '\n\n**Use cases and examples:** ' +
      '\n\n**Customer-facing services:** ' +
      '\n- "E-Commerce Website" - Web servers + database + payment gateway + CDN ' +
      '\n- "Mobile App Backend" - API servers + auth service + push notifications ' +
      '\n- "SaaS Platform" - All infrastructure for multi-tenant application ' +
      '\n\n**Internal services:** ' +
      '\n- "Employee VPN" - VPN servers + RADIUS auth + firewall ' +
      '\n- "Corporate Email" - Mail servers + spam filter + archiving ' +
      '\n- "CI/CD Pipeline" - Jenkins + artifact storage + deployment agents ' +
      '\n\n**Benefits:** ' +
      '\n- **Business perspective:** Non-technical stakeholders understand "Shopping Cart is 99.5% available" ' +
      '\n- **SLA tracking:** Measure uptime for customer SLAs ' +
      '\n- **Root cause:** When service is down, see which specific resource failed ' +
      '\n- **Dependencies:** Visualize what resources comprise a service ' +
      '\n\n**Common filter patterns:** ' +
      '\n- By status: filter:"status:normal" or filter:"status:dead" ' +
      '\n- By name: filter:"name~*production*" ' +
      '\n\n**Workflow:** Use this tool to find services, then "get\\_service" for detailed dependency tree and health status. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_service" (details and dependencies), "list\\_service\\_groups" (organization), "create\\_service" (define new business service).',
    annotations: {
      title: 'List services',
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
    name: 'get_service',
    description: 'Get detailed information about a specific service by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete service details: name, description, health status, dependency tree (all resources comprising service), SLA/SLO configuration, availability statistics, alert rules, service group. ' +
      '\n\n**When to use:**' +
      '\n- Review service dependencies (what resources are included)' +
      '\n- Check current health status and root cause' +
      '\n- Verify SLA/SLO configuration' +
      '\n- Troubleshoot service downtime' +
      '\n- Understand service architecture' +
      '\n' +
      '\n\n**Key information returned:** ' +
      '\n- **Dependency tree:** All resources/devices/resources that comprise this service ' +
      '\n- **Health calculation:** How service status is determined (e.g., "If ANY web server is down, service is degraded") ' +
      '\n- **Current status:** Operational / Degraded / Down ' +
      '\n- **SLA metrics:** Uptime percentage, outage history ' +
      '\n- **Alert configuration:** When to alert on service issues ' +
      '\n\n**Troubleshooting workflow:** ' +
      'Service shows "Down" → Check dependency tree → Identify which specific resource(s) failed → Address those resources → Service auto-recovers when dependencies healthy ' +
      '\n\n**Workflow:** Use "list\\_services" to find serviceId, then use this tool for complete dependency analysis. ' +
      '\n\n**Related tools:** "list\\_services" (find service), "update\\_service" (modify dependencies), "list\\_resources" (see health of dependent resources).',
    annotations: {
      title: 'Get service details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'number',
          description: 'The ID of the service to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['serviceId'],
    },
  },
  {
    name: 'create_service',
    description: 'Create a new business service in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates business-level service aggregating multiple resources into single health status. Think "E-commerce Website" service composed of web servers, databases, load balancers, etc. Service health calculated from member resource/device health. ' +
      '\n\n**When to use:**' +
      '\n- Monitor application-level health (not just infrastructure)' +
      '\n- Create business-facing dashboards' +
      '\n- SLA tracking for customer-facing services' +
      '\n- Executive reporting (business view, not technical)' +
      '\n- Complex dependency modeling' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: Service name (e.g., "E-commerce Website", "Payment API", "Mobile App Backend") ' +
      '\n- groupId: Service group ID for organization (from "list\\_service\\_groups") ' +
      '\n\n**Optional parameters:** ' +
      '\n- description: Service purpose/details ' +
      '\n- resources/devices: Array of resource/device IDs that comprise this service ' +
      '\n- alertStatus: Service alert status (calculated or manual) ' +
      '\n\n**What are business services?** ' +
      'Business services represent application/service from business perspective, not infrastructure perspective. Examples: ' +
      '\n- "E-commerce Website" = web servers + database + Redis + CDN ' +
      '\n- "Payment Processing" = payment API + payment database + fraud detection service ' +
      '\n- "Mobile App Backend" = API gateway + app servers + auth service + database ' +
      '\n\n**Why use services?** ' +
      '\n- **Business view:** Executives care about "Is checkout working?" not "Is web-01 up?" ' +
      '\n- **SLA tracking:** Monitor service availability for SLA compliance ' +
      '\n- **Dependencies:** Model which resource/device affect which services ' +
      '\n- **Simplified dashboards:** Show service health, not 50 individual resource/device ' +
      '\n- **Impact analysis:** "Which services affected when database down?" ' +
      '\n\n**Service health calculation:** ' +
      'Service health = rollup of member resource/device health: ' +
      '\n- All resource/device healthy → Service healthy (green) ' +
      '\n- Any resource/device warning → Service warning (yellow) ' +
      '\n- Any resource/device critical → Service critical (red) ' +
      '\n- Any resource/device dead → Service dead (gray) ' +
      '\n\n**Common service patterns:** ' +
      '\n\n**Web application service:** ' +
      '{name: "E-commerce Website", groupId: 10, description: "Customer-facing e-commerce platform", resources/devices: [webserver1Id, webserver2Id, dbserverId, redisId, loadbalancerId]} ' +
      '// All components needed for website to function ' +
      '\n\n**API service:** ' +
      '{name: "Payment API v2", groupId: 20, description: "Payment processing API - SLA 99.9%", resources/devices: [apiserver1Id, apiserver2Id, paymentDbId, queueId]} ' +
      '// API servers + supporting infrastructure ' +
      '\n\n**Tiered application:** ' +
      '// Create separate services per tier for granular monitoring ' +
      '{name: "Mobile App - Web Tier", groupId: 30, resources/devices: [nginx1Id, nginx2Id]} ' +
      '{name: "Mobile App - App Tier", groupId: 30, resources/devices: [app1Id, app2Id, app3Id]} ' +
      '{name: "Mobile App - Data Tier", groupId: 30, resources/devices: [db1Id, db2Id, cacheId]} ' +
      '\n\n**Multi-region service:** ' +
      '{name: "Global API - US-East", groupId: 40, resources/devices: [usEastDevices...]} ' +
      '{name: "Global API - EU-West", groupId: 40, resources/devices: [euWestDevices...]} ' +
      '{name: "Global API - Asia-Pacific", groupId: 40, resources/devices: [asiaPacificDevices...]} ' +
      '\n\n**Workflow for creating services:** ' +
      '1. Identify business-critical application/service ' +
      '2. List all resources/devices/components required for service to function ' +
      '3. Create service group for organization (if needed) ' +
      '4. Create service with all member resource/device ' +
      '5. Create dashboard showing service health ' +
      '6. Configure service-level alerting ' +
      '\n\n**Best practices:** ' +
      '\n- **Business names:** "Customer Portal" not "Web Stack 3" ' +
      '\n- **Complete membership:** Include ALL critical dependencies ' +
      '\n- **Granular services:** One service per distinct business function ' +
      '\n- **Use service groups:** Organize by department, product, or region ' +
      '\n- **Document SLAs:** Add SLA targets to description ' +
      '\n\n**After creation:** ' +
      'Service appears in Services view with aggregated health status. Use in dashboards to show business-level health. Use "update\\_service" to modify membership as infrastructure changes. ' +
      '\n\n**Related tools:** "list\\_service\\_groups" (create groups first), "update\\_service" (modify), "list\\_resources" (find resources/devices), "create\\_service\\_dashboard" (visualize).',
    annotations: {
      title: 'Create service',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service',
        },
        type: {
          type: 'string',
          description: 'Type of service (default: "default")',
        },
        description: {
          type: 'string',
          description: 'Description of the service',
        },
        groupId: {
          type: 'number',
          description: 'ID of the service group to place this service in',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_service',
    description: 'Update an existing business service in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify service name, description, or member resources/devices. Updates service health calculation when membership changes. ' +
      '\n\n**When to use:**' +
      '\n- Add/remove resource/device as infrastructure changes' +
      '\n- Rename service' +
      '\n- Update description/SLA' +
      '\n- Reorganize service structure' +
      '\n- Reflect architecture changes' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- serviceId: Service ID (from "list\\_services") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New service name ' +
      '\n- description: Updated description ' +
      '\n- resources/devices: New array of resource/device IDs (replaces all members) ' +
      '\n- groupId: Move to different service group ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Add new infrastructure:** ' +
      '{serviceId: 123, resources/devices: [existingDevices..., newDb2Id, newCache2Id]} ' +
      '// Added replica database and cache to service ' +
      '\n\n**Remove decommissioned resources/devices:** ' +
      '{serviceId: 123, resources/devices: [dev1, dev2, dev4]} // Removed dev3 (decomm) ' +
      '\n\n**Rename service:** ' +
      '{serviceId: 123, name: "E-commerce Platform v2"} ' +
      '\n\n**Update SLA documentation:** ' +
      '{serviceId: 123, description: "Customer-facing checkout - SLA 99.95% (updated Q4 2024)"} ' +
      '\n\n**⚠️ Important:** ' +
      'Updating resource/device array REPLACES all members. Include existing + new resources/devices, or resource/device will be removed from service. ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get\\_service" to see current membership ' +
      '2. Update service with complete resource/device list ' +
      '3. Service health recalculates immediately ' +
      '\n\n**Related tools:** "get\\_service" (review), "list\\_services" (find service), "list\\_resources" (find resources/devices).',
    annotations: {
      title: 'Update service',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'number',
          description: 'The ID of the service to update',
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
      required: ['serviceId'],
    },
  },
  {
    name: 'delete_service',
    description: 'Delete a business service from LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Permanently removes service. Service disappears from dashboards and Services view. Member resource/device remain unaffected (only service container deleted). ' +
      '\n\n**When to use:**' +
      '\n- Application/service decommissioned' +
      '\n- Service no longer needed' +
      '\n- Consolidating duplicate services' +
      '\n- Restructuring service hierarchy' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- serviceId: Service ID to delete (from "list\\_services") ' +
      '\n\n**Impact:** ' +
      '\n- Service removed from all dashboards ' +
      '\n- Service health history deleted ' +
      '\n- Member resource/device NOT deleted (remain in monitoring) ' +
      '\n- Cannot be undone ' +
      '\n\n**Common deletion scenarios:** ' +
      '\n- Application decommissioned: Delete service after shutting down application ' +
      '\n- Consolidation: Merge multiple services into one, delete duplicates ' +
      '\n- Restructuring: Delete old service structure, create new one ' +
      '\n\n**Before deleting:** ' +
      '1. Check if service used in dashboards (will break dashboard widgets) ' +
      '2. Check if service used in alert rules (will break routing) ' +
      '3. Verify service no longer represents active business function ' +
      '\n\n**Best practice:** Update dashboards to remove service widgets BEFORE deleting service. ' +
      '\n\n**Related tools:** "list\\_services" (find service), "get\\_service" (verify before delete), "list\\_dashboards" (check usage).',
    annotations: {
      title: 'Delete service',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'number',
          description: 'The ID of the service to delete',
        },
      },
      additionalProperties: false,
      required: ['serviceId'],
    },
  },

  // Service Groups
  {
    name: 'list_service_groups',
    description: 'List all service groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of service groups with: id, name, parentId, full path, description, number of services, number of subgroups. ' +
      '\n\n**What are service groups:** Organizational folders for business services, similar to resource/device groups for resources/devices. Used to categorize services by business unit, region, customer, or application stack. ' +
      '\n\n**When to use:**' +
      '\n- Browse service organization before creating services' +
      '\n- Find group IDs for service operations' +
      '\n- Understand service hierarchy' +
      '\n- Navigate to specific service folders' +
      '\n' +
      '\n\n**Common organization patterns:** ' +
      '\n- By business unit: "E-Commerce", "Marketing Platform", "Internal IT" ' +
      '\n- By customer: "Customer A Services", "Customer B Services" (MSP environments) ' +
      '\n- By region: "APAC Services", "EMEA Services", "Americas Services" ' +
      '\n- By tier: "Tier 1 Critical", "Tier 2 Standard", "Tier 3 Best Effort" ' +
      '\n\n**Use cases:** ' +
      '\n- Organize services for different stakeholders ' +
      '\n- Group services by SLA tiers ' +
      '\n- Separate internal vs customer-facing services ' +
      '\n- Structure multi-tenant service monitoring ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list\\_services" filtered by groupId to see services in specific folder. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_service\\_group" (details), "list\\_services" (services in group), "create\\_service\\_group" (create folder).',
    annotations: {
      title: 'List service groups',
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
    name: 'get_service_group',
    description: 'Get detailed information about a specific service group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete service group details: name, full path, parentId, description, number of services (direct and total), number of subgroups. ' +
      '\n\n**When to use:**' +
      '\n- Get group path for documentation' +
      '\n- Check service membership counts' +
      '\n- Verify group hierarchy' +
      '\n- Review group structure before creating services' +
      '\n' +
      '\n\n**Workflow:** Use "list\\_service\\_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list\\_service\\_groups" (find groups), "list\\_services" (services in group), "create\\_service\\_group" (create new).',
    annotations: {
      title: 'Get service group details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the service group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_service_group',
    description: 'Create a new service group (folder) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates organizational folder for business services. Like resource/device groups for resources/devices, service groups organize services by team, product, region, or function. ' +
      '\n\n**When to use:**' +
      '\n- Organize services before creating them' +
      '\n- Group services by department/team' +
      '\n- Separate services by product line' +
      '\n- Organize by region/environment' +
      '\n- Create service hierarchy' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: Group name (e.g., "E-commerce Services", "Payment Services", "Mobile App Services") ' +
      '\n\n**Optional parameters:** ' +
      '\n- description: Group purpose ' +
      '\n- parentId: Parent group ID for nested hierarchy ' +
      '\n\n**Common service group patterns:** ' +
      '\n\n**By department/team:** ' +
      '{name: "Platform Engineering Services", description: "Core platform services"} ' +
      '{name: "Data Engineering Services", description: "Data pipelines and analytics"} ' +
      '{name: "Customer Services", description: "Customer-facing applications"} ' +
      '\n\n**By product line:** ' +
      '{name: "E-commerce Platform", description: "Online store services"} ' +
      '{name: "Mobile Banking", description: "Mobile banking app services"} ' +
      '{name: "Enterprise Suite", description: "B2B product services"} ' +
      '\n\n**By environment:** ' +
      '{name: "Production Services", description: "Customer-facing production"} ' +
      '{name: "Staging Services", description: "Pre-production testing"} ' +
      '\n\n**Nested hierarchy example:** ' +
      '1. Create parent: {name: "All Services"} → groupId: 100 ' +
      '2. Create children: {name: "Web Services", parentId: 100} ' +
      '3. Create children: {name: "API Services", parentId: 100} ' +
      '4. Create children: {name: "Data Services", parentId: 100} ' +
      '\n\n**Best practices:** ' +
      '\n- Create groups before creating services ' +
      '\n- Use descriptive names matching organizational structure ' +
      '\n- Organize by how business views applications ' +
      '\n- Keep hierarchy shallow (2-3 levels max) ' +
      '\n\n**After creation:** Use groupId when creating services to place them in appropriate folder. ' +
      '\n\n**Related tools:** "list\\_service\\_groups" (view hierarchy), "create\\_service" (add services to group), "update\\_service\\_group" (modify).',
    annotations: {
      title: 'Create service group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service group',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
        parentId: {
          type: 'number',
          description: 'Parent group ID (use 1 for root)',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_service_group',
    description: 'Update an existing service group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group name, description, or parent (move in hierarchy). Does not affect services within group. ' +
      '\n\n**When to use:**' +
      '\n- Rename group after reorg' +
      '\n- Update description' +
      '\n- Move group in hierarchy' +
      '\n- Reorganize service structure' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Service group ID (from "list\\_service\\_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New group name ' +
      '\n- description: Updated description ' +
      '\n- parentId: New parent group (moves group) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Rename after reorg:** ' +
      '{groupId: 123, name: "Platform Services (Cloud Native)"} ' +
      '\n\n**Move in hierarchy:** ' +
      '{groupId: 123, parentId: 456} // Move to different parent ' +
      '\n\n**Update description:** ' +
      '{groupId: 123, description: "Updated to include new microservices"} ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "list\\_service\\_groups" to find group ' +
      '2. Update group settings ' +
      '3. Services within group unaffected ' +
      '\n\n**Related tools:** "list\\_service\\_groups" (find group), "get\\_service\\_group" (verify), "list\\_services" (services in group).',
    annotations: {
      title: 'Update service group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the service group to update',
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
      required: ['groupId'],
    },
  },
  {
    name: 'delete_service_group',
    description: 'Delete a service group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: CHECK FOR SERVICES FIRST** ' +
      '\n- Cannot delete group containing services ' +
      '\n- Cannot delete group containing subgroups ' +
      '\n- Must be empty to delete ' +
      '\n\n**What this does:** Removes empty service group folder. Group must have no services and no subgroups. ' +
      '\n\n**When to use:**' +
      '\n- Cleanup empty groups after reorganization' +
      '\n- Remove unused organizational folders' +
      '\n- Simplify service hierarchy' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Service group ID to delete (from "list\\_service\\_groups") ' +
      '\n\n**Before deleting:** ' +
      '1. Move all services to different group (or delete services) ' +
      '2. Move or delete all subgroups ' +
      '3. Verify group is empty ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Use "list\\_services" to find services in this group ' +
      '2. Move services: update_service(serviceId: X, groupId: NEW_GROUP) ' +
      '3. Check for subgroups in group ' +
      '4. Delete empty subgroups first ' +
      '5. Delete empty group ' +
      '\n\n**Error handling:** ' +
      'If deletion fails, group likely not empty. Check for: ' +
      '\n- Services still in group ' +
      '\n- Subgroups still under this group ' +
      '\n\n**Related tools:** "list\\_services" (check for services), "list\\_service\\_groups" (check for subgroups), "update\\_service" (move services).',
    annotations: {
      title: 'Delete service group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the service group to delete',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

];
