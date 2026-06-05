import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const netscansTools: Tool[] = [
  // NetScans
  {
    name: 'list_netscans',
    description: 'List all network discovery scans (NetScans) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of netscans with: id, name, description, scan method (nmap/script/ICMP/SNMP), schedule, target networks (IP ranges/subnets), collector, last run time, resource/device discovered. ' +
      '\n\n**What are netscans:** Automated network discovery that finds resource/device on your network and adds them to monitoring. Instead of manually adding resource/device one-by-one, netscan automatically discovers and onboards resource/device based on IP ranges or subnets. ' +
      '\n\n**When to use:**' +
      '\n- Audit existing discovery configurations' +
      '\n- Check which networks are being scanned' +
      '\n- Review netscan schedules' +
      '\n- Troubleshoot why resource/device not auto-discovered' +
      '\n- Find netscan IDs for modifications' +
      '\n' +
      '\n\n**How netscans work:** ' +
      'Scheduled job → Scan network range (e.g., 192.168.1.0/24) → Find live resource/device → Check if already monitored → If new, add to LogicMonitor → Apply resource/device properties and datasources → Begin monitoring ' +
      '\n\n**NetScan methods:** ' +
      '\n- **nmap:** Network mapper scan (comprehensive, detects OS, ports, services) ' +
      '\n- **ICMP Ping:** Simple ping sweep (fastest, basic reachability) ' +
      '\n- **SNMP Walk:** Query SNMP-enabled resource/device (network gear, servers with SNMP) ' +
      '\n- **Script:** Custom discovery logic (cloud APIs, CMDBs, etc.) ' +
      '\n- **AWS/Azure/GCP:** Cloud auto-discovery via APIs ' +
      '\n\n**Common use cases:** ' +
      '\n- **Data center discovery:** Scan 10.0.0.0/16 network, auto-add all servers ' +
      '\n- **Cloud auto-discovery:** Scan AWS account, add all EC2 instances daily ' +
      '\n- **Branch office monitoring:** Scan remote office subnets, discover network resource/device ' +
      '\n- **Dynamic infrastructure:** Auto-discover containers, VMs as they spin up ' +
      '\n\n**Example NetScan configurations:** ' +
      '\n- "Production Servers" - Scan 192.168.1.0/24 every 6 hours via nmap ' +
      '\n- "AWS EC2 Discovery" - Query AWS API every hour for new instances ' +
      '\n- "Network resources/Devices" - SNMP walk 10.0.0.0/8 daily for routers/switches ' +
      '\n\n**Workflow:** Use this tool to review netscans, then "get_netscan" for detailed configuration including filters and resource/device properties. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_netscan" (configuration details), "create_netscan" (set up auto-discovery), "run_netscan" (trigger manual scan).',
    annotations: {
      title: 'List NetScans',
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
    name: 'get_netscan',
    description: 'Get detailed information about a specific netscan by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete netscan details: name, description, scan method, schedule, target networks/IPs, credentials, filters (include/exclude rules), resource/device properties to apply, collector assignment, duplicate detection settings, last execution results. ' +
      '\n\n**When to use:**' +
      '\n- Review netscan configuration before running' +
      '\n- Troubleshoot why certain resource/device not discovered' +
      '\n- Check credentials and filters' +
      '\n- Verify resource/device properties applied to discovered resources/devices' +
      '\n- Understand duplicate detection logic' +
      '\n' +
      '\n\n**Configuration details returned:** ' +
      '\n- **Targets:** IP ranges, subnets, or cloud filters (e.g., "192.168.1.0/24", "All EC2 with tag:Environment=prod") ' +
      '\n- **Schedule:** How often scan runs (hourly, daily, weekly, on-demand) ' +
      '\n- **Credentials:** Which properties used for authentication (ssh.user, snmp.community) ' +
      '\n- **Filters:** Include/exclude rules (e.g., "Exclude IPs ending in .1", "Only Linux servers") ' +
      '\n- **Device properties:** Auto-applied to discovered resource/device (e.g., location, environment tags) ' +
      '\n- **Duplicate handling:** How to handle resource/device found in multiple scans ' +
      '\n\n**Troubleshooting use cases:** ' +
      '\n- "Why resource/device not discovered?" → Check if IP in target range and not excluded by filters ' +
      '\n- "Wrong credentials?" → Verify credential properties configured in netscan ' +
      '\n- "resources/Devices missing properties?" → Check default properties applied by netscan ' +
      '\n\n**Workflow:** Use "list_netscans" to find netscanId, then use this tool to review complete configuration. ' +
      '\n\n**Related tools:** "list_netscans" (find netscan), "update_netscan" (modify), "run_netscan" (execute now).',
    annotations: {
      title: 'Get NetScan details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        netscanId: {
          type: 'number',
          description: 'The ID of the netscan to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['netscanId'],
    },
  },
  {
    name: 'create_netscan',
    description: 'Create a new network discovery scan (NetScan) in LogicMonitor (LM) monitoring to automatically discover and add resources/devices. ' +
      '\n\n**What this does:** Creates automated network scanner that discovers resource/device by IP range/subnet and adds them to monitoring. Runs on schedule to continuously discover new infrastructure. ' +
      '\n\n**When to use:**' +
      '\n- Automate resource/device discovery instead of manual adds' +
      '\n- Onboard entire subnets' +
      '\n- Keep monitoring in sync with dynamic infrastructure (cloud/containers)' +
      '\n- Continuous discovery for DHCP/dynamic environments' +
      '\n- Bulk resource/device onboarding' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: NetScan name (e.g., "Production Network Scan", "AWS EC2 Discovery") ' +
      '\n- collectorId: Collector to perform scan (from "list_collectors") ' +
      '\n- targetType: "subnet", "iprange", "script", "awsEC2", "azureVMs", etc. ' +
      '\n- target: What to scan (depends on type - subnet CIDR, IP range, script, etc.) ' +
      '\n\n**Optional parameters:** ' +
      '\n- schedule: When to run ("manual", "daily", "weekly", cron expression) ' +
      '\n- deviceGroupId: Where to add discovered resource/device ' +
      '\n- credentials: Authentication for discovered resource/device ' +
      '\n- excludeFilters: IPs/ranges to skip ' +
      '\n\n**Common netscan patterns:** ' +
      '\n\n**Subnet discovery (on-prem):** ' +
      '{name: "Production Subnet", collectorId: 5, targetType: "subnet", target: "192.168.1.0/24", schedule: "daily", deviceGroupId: 100} ' +
      '// Scan 192.168.1.0/24 every day, add to Production group ' +
      '\n\n**IP range discovery:** ' +
      '{name: "Server Range", collectorId: 5, targetType: "iprange", target: "10.0.1.10-10.0.1.100", schedule: "0 0 2 * * ?", deviceGroupId: 200} ' +
      '// Scan IPs 10.0.1.10-100 at 2am daily ' +
      '\n\n**AWS EC2 discovery:** ' +
      '{name: "AWS Production EC2", collectorId: 5, targetType: "awsEC2", target: "us-east-1", schedule: "0 */6 * * ?", deviceGroupId: 300} ' +
      '// Discover EC2 instances every 6 hours ' +
      '\n\n**Azure VMs discovery:** ' +
      '{name: "Azure Production", collectorId: 5, targetType: "azureVMs", target: "subscription-id", schedule: "0 */4 * * ?", deviceGroupId: 400} ' +
      '// Discover Azure VMs every 4 hours ' +
      '\n\n**With exclusions:** ' +
      '{name: "Office Network", collectorId: 5, targetType: "subnet", target: "172.16.0.0/16", excludeFilters: ["172.16.1.0/24", "172.16.2.50"], deviceGroupId: 500} ' +
      '// Scan 172.16.0.0/16 except specific subnet/IP ' +
      '\n\n**Schedule options:** ' +
      '\n- "manual": Only run when manually triggered ' +
      '\n- "daily": Run once per day ' +
      '\n- "weekly": Run once per week ' +
      '\n- Cron: "0 0 2 * * ?" = 2am daily, "0 */6 * * * ?" = every 6 hours ' +
      '\n\n**TargetType options:** ' +
      '\n- subnet: Scan CIDR (e.g., "10.0.0.0/24") ' +
      '\n- iprange: Scan IP range (e.g., "10.0.1.1-10.0.1.255") ' +
      '\n- awsEC2: Discover AWS EC2 instances in region ' +
      '\n- azureVMs: Discover Azure VMs in subscription ' +
      '\n- script: Custom discovery script ' +
      '\n\n**Why use netscans:** ' +
      '\n- **Automation:** No manual resource/device adds ' +
      '\n- **Continuous:** Automatically discovers new infrastructure ' +
      '\n- **Dynamic environments:** Cloud, containers, DHCP networks ' +
      '\n- **Bulk onboarding:** Add hundreds of resource/device at once ' +
      '\n- **Compliance:** Ensure all resource/device are monitored ' +
      '\n\n**Best practices:** ' +
      '\n- Start with small subnets to test ' +
      '\n- Use excludeFilters for management IPs, printers, phones ' +
      '\n- Schedule during low-traffic hours (scans generate network traffic) ' +
      '\n- Test credentials before scheduling ' +
      '\n- Group resource/device appropriately with deviceGroupId ' +
      '\n\n**After creation:** NetScan runs on schedule. Use "list_netscans" to view, "get_netscan" for details. Check "list_resources" to see discovered resources/devices. ' +
      '\n\n**Related tools:** "list_collectors" (find collector), "list_resource_groups" (find deviceGroupId), "update_netscan" (modify), "delete_netscan" (remove).',
    annotations: {
      title: 'Create NetScan',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the netscan',
        },
        collectorId: {
          type: 'number',
          description: 'ID of the collector that will perform the scan',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
        schedule: {
          type: 'object',
          description: 'Schedule configuration (e.g., { cron: "0 0 * * *" })',
        },
        subnet: {
          type: 'string',
          description: 'Subnet to scan (e.g., "192.168.1.0/24")',
        },
        excludeDuplicateType: {
          type: 'string',
          description: 'How to handle duplicate resources/devices',
        },
      },
      additionalProperties: false,
      required: ['name', 'collectorId'],
    },
  },
  {
    name: 'update_netscan',
    description: 'Update an existing network discovery scan (NetScan) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify netscan name, target, schedule, credentials, or settings. Changes take effect on next scan run. ' +
      '\n\n**When to use:**' +
      '\n- Change IP range/subnet scanned' +
      '\n- Update scan schedule' +
      '\n- Modify credentials' +
      '\n- Change destination group for discovered resources/devices' +
      '\n- Update exclusion filters' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- netscanId: NetScan ID (from "list_netscans") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New NetScan name ' +
      '\n- target: New IP range/subnet ' +
      '\n- schedule: New schedule (daily, weekly, cron) ' +
      '\n- deviceGroupId: New destination group ' +
      '\n- excludeFilters: Updated exclusion list ' +
      '\n- credentials: Updated authentication ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Expand IP range:** ' +
      '{netscanId: 123, target: "192.168.0.0/16"} // Expanded from /24 to /16 ' +
      '\n\n**Change schedule:** ' +
      '{netscanId: 123, schedule: "0 0 3 * * ?"} // Changed to 3am daily ' +
      '\n\n**Update destination group:** ' +
      '{netscanId: 123, deviceGroupId: 456} // Move discovered resource/device to different group ' +
      '\n\n**Add exclusions:** ' +
      '{netscanId: 123, excludeFilters: ["192.168.1.0/24", "192.168.2.50-192.168.2.100"]} ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_netscan" to review current settings ' +
      '2. Update NetScan configuration ' +
      '3. Changes apply on next scheduled run ' +
      '\n\n**Related tools:** "get_netscan" (review), "list_netscans" (find netscan), "delete_netscan" (remove).',
    annotations: {
      title: 'Update NetScan',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        netscanId: {
          type: 'number',
          description: 'The ID of the netscan to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        schedule: {
          type: 'object',
          description: 'New schedule configuration',
        },
      },
      additionalProperties: false,
      required: ['netscanId'],
    },
  },
  {
    name: 'delete_netscan',
    description: 'Delete a network discovery scan (NetScan) from LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Permanently removes NetScan. Stops all future automatic resource/device discovery for this target. Previously discovered resource/device remain in monitoring. ' +
      '\n\n**When to use:**' +
      '\n- Decommissioned network/subnet' +
      '\n- Discovery no longer needed (static environment)' +
      '\n- Consolidating duplicate netscans' +
      '\n- Migrating to different discovery method' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- netscanId: NetScan ID to delete (from "list_netscans") ' +
      '\n\n**Impact:** ' +
      '\n- NetScan stops running (no more automatic discovery) ' +
      '\n- Previously discovered resource/device remain in monitoring (not deleted) ' +
      '\n- New resource/device in target range will NOT be automatically added ' +
      '\n- Cannot be undone ' +
      '\n\n**Best practice:** ' +
      'Before deleting, decide if you still need discovery for this network. resources/Devices already discovered remain monitored. ' +
      '\n\n**Related tools:** "list_netscans" (find NetScan), "get_netscan" (verify before delete), "list_resources" (see discovered resources/devices).',
    annotations: {
      title: 'Delete NetScan',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        netscanId: {
          type: 'number',
          description: 'The ID of the NetScan to delete',
        },
      },
      additionalProperties: false,
      required: ['netscanId'],
    },
  },

];
