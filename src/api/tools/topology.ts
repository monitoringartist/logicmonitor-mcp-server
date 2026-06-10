import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const topologyTools: Tool[] = [
  // TopologySources
  {
    name: 'list_topologysources',
    description: 'List TopologySources in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are TopologySources:** LogicModules that discover relationships between resources to build topology maps. ' +
      '\n\n**Related tools:** "get_topologysource", "create_topologysource".',
    annotations: { title: 'List topologysources', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_topologysource',
    description: 'Get details of a specific TopologySource in LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Get topologysource', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        topologySourceId: { type: 'number', description: 'The TopologySource ID' },
        format: { type: 'string', description: 'Response format (e.g., "file").' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['topologySourceId'],
    },
  },
  {
    name: 'create_topologysource',
    description: 'Create a TopologySource in LogicMonitor (LM) monitoring. Definition via `config`. ',
    annotations: { title: 'Create topologysource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The TopologySource definition.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_topologysource',
    description: 'Update a TopologySource in LogicMonitor (LM) monitoring. Partial update via `config`. Optional reason. ',
    annotations: { title: 'Update topologysource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        topologySourceId: { type: 'number', description: 'The TopologySource ID to update' },
        reason: { type: 'string', description: 'Optional audit reason.' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['topologySourceId', 'config'],
    },
  },
  {
    name: 'delete_topologysource',
    description: 'Delete a TopologySource from LogicMonitor (LM) monitoring. Cannot be undone. ',
    annotations: { title: 'Delete topologysource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        topologySourceId: { type: 'number', description: 'The TopologySource ID to delete' },
      },
      additionalProperties: false,
      required: ['topologySourceId'],
    },
  },
  {
    name: 'import_topologysource',
    description: 'Import a TopologySource definition (JSON) into LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Import topologysource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The JSON definition content to import.' },
        handleConflict: { type: 'string', description: 'Conflict handling.' },
        fieldsToPreserve: { type: 'string', description: 'Fields to preserve on conflict.' },
      },
      additionalProperties: false,
      required: ['content'],
    },
  },

  // Topology maps
  {
    name: 'list_topologies',
    description: 'List available topology maps in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of topology maps with: id, name, type, and configuration. Use the returned `id` with "get_topology" to fetch a map\'s vertex/edge data. ' +
      '\n\n**What are topology maps:** Dynamically generated network relationship maps built by TopologySources from LLDP/CDP/BGP/OSPF/EIGRP discovery and ERIs. ' +
      '\n\n**Common filter patterns:** ' +
      '\n- By name: filter:"name~\\*core\\*" ' +
      '\n\n**Workflow:** Use this tool to find a map `id`, then "get_topology" for its connectivity data. ' +
      '\n\n**Related tools:** "get_topology" (map data), "list_topologysources" (discovery modules).',
    annotations: { title: 'List topology maps', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_topology',
    description: 'Get the data (vertices and edges) for a specific topology map in LogicMonitor (LM) monitoring. ' +
      '\n\n**Requires:** A topology map `topologyId`. Use "list_topologies" first to discover available map IDs. ' +
      '\n\n**Returns:** Network topology data with: resource/device relationships (vertices), network connections (edges), parent-child hierarchies, Layer 2/Layer 3 connectivity maps. ' +
      '\n\n**What is topology:** Automatically discovered network relationship map showing how resource/device connect to each other. LogicMonitor uses SNMP, CDP (Cisco Discovery Protocol), LLDP (Link Layer Discovery Protocol), and other methods to build network topology maps. ' +
      '\n\n**When to use:**' +
      '\n- Understand network architecture and resource/device relationships' +
      '\n- Visualize network connectivity' +
      '\n- Plan network changes' +
      '\n- Troubleshoot connectivity issues' +
      '\n- Document network infrastructure' +
      '\n' +
      '\n\n**Topology information includes:** ' +
      '\n- **Physical connections:** Which resource/device are physically connected (switch ports, router interfaces) ' +
      '\n- **Logical relationships:** Parent-child relationships (gateway → firewall → switches → servers) ' +
      '\n- **Layer 2 topology:** MAC address tables, VLANs, switch port connections ' +
      '\n- **Layer 3 topology:** IP routing, subnets, default gateways ' +
      '\n\n**Use cases:** ' +
      '\n- **Network visualization:** See how your network is structured ' +
      '\n- **Impact analysis:** "If this switch fails, what resource/device lose connectivity?" ' +
      '\n- **Capacity planning:** Identify network bottlenecks and heavily-utilized links ' +
      '\n- **Documentation:** Auto-generated network diagrams ' +
      '\n- **Troubleshooting:** Trace connection paths between resource/device ' +
      '\n\n**How LogicMonitor discovers topology:** ' +
      '\n- CDP/LLDP: Cisco and other vendors broadcast neighbor information ' +
      '\n- SNMP: Query resource/device interface tables, ARP tables, routing tables ' +
      '\n- Traceroute: Active probing to discover paths ' +
      '\n- Parent/child relationships: Based on gateway configuration ' +
      '\n\n**Related tools:** "list_resources" (view resources/devices), "get_resource" (device details including connections).',
    annotations: {
      title: 'Get network topology',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        topologyId: {
          type: 'number',
          description: 'The ID of the topology map to retrieve data for (from "list_topologies").',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['topologyId'],
    },
  },

];
