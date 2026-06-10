import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const opsnotesTools: Tool[] = [
  // OpsNotes
  {
    name: 'list_opsnotes',
    description: 'List all operational notes (OpsNotes) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of OpsNotes with: id, note text, timestamp (epoch), who created it, tags, scope (applies to which resources/devices/groups), related SDTs. ' +
      '\n\n**What are OpsNotes:** Timestamped operational annotations displayed on graphs and dashboards. Document changes, deployments, maintenance, incidents - anything that might affect metrics. Appear as vertical lines on metric graphs at the time they occurred. ' +
      '\n\n**When to use:**' +
      '\n- Correlate metric changes with operational events' +
      '\n- Document deployments/changes' +
      '\n- Create timeline of incidents and responses' +
      '\n- Track maintenance activities' +
      '\n- Generate operational reports' +
      '\n' +
      '\n\n**Use cases and examples:** ' +
      '\n\n**Deployments:** ' +
      '\n- "Deployed v2.5.0 to production" (explains CPU spike at deploy time) ' +
      '\n- "Database schema migration" (explains slow queries during migration) ' +
      '\n\n**Incidents:** ' +
      '\n- "Customer reported slow load times - investigating" ' +
      '\n- "Found memory leak, restarting services" ' +
      '\n- "Incident resolved - bad cache configuration" ' +
      '\n\n**Maintenance:** ' +
      '\n- "Scaled from 10 to 15 instances" ' +
      '\n- "Updated SSL certificates" ' +
      '\n- "Cleared old logs, freed 500GB disk" ' +
      '\n\n**Benefits:** ' +
      '\n- **Troubleshooting:** "Latency increased at 2pm" → Check OpsNotes: "Deploy happened at 2pm" ' +
      '\n- **Correlation:** Understand cause of metric anomalies ' +
      '\n- **Documentation:** Automatic operational timeline ' +
      '\n- **Communication:** Share what happened with team ' +
      '\n\n**Common filter patterns:** ' +
      '\n- By time: filter:"happenedOn>1730851200" (recent notes) ' +
      '\n- By tags: filter:"tags~*deployment*" ' +
      '\n- By device: filter:"monitorObjectName~*prod-web*" ' +
      '\n\n**Displayed on:** Graphs, dashboards, resource/device pages - visible wherever metrics are shown. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_opsnote" (details), "create_opsnote" (add new), "create_device_sdt" (maintenance windows).',
    annotations: {
      title: 'List OpsNotes',
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
    name: 'get_opsnote',
    description: 'Get detailed information about a specific operational note by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete OpsNote details: note text, timestamp, creator, tags, scope (resources/devices/groups affected), related SDTs, linked resources. ' +
      '\n\n**When to use:**' +
      '\n- Get full note details after finding ID via list' +
      '\n- Review what was documented at specific time' +
      '\n- Check scope of operational event' +
      '\n- Verify linked resources' +
      '\n' +
      '\n\n**Workflow:** Use "list_opsnotes" to find note ID, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_opsnotes" (find notes), "create_opsnote" (add new), "update_opsnote" (modify).',
    annotations: {
      title: 'Get OpsNote details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        opsNoteId: {
          type: 'string',
          description: 'The ID of the OpsNote to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['opsNoteId'],
    },
  },
  {
    name: 'create_opsnote',
    description: 'Create a new operational note (OpsNote) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates timestamped annotation displayed on graphs/dashboards at specific time. Documents changes, deployments, incidents, maintenance - anything that might correlate with metric changes. ' +
      '\n\n**When to use:**' +
      '\n- Document deployments/releases' +
      '\n- Track incident timelines' +
      '\n- Note configuration changes' +
      '\n- Record maintenance windows' +
      '\n- Annotate known events that affect metrics' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- note: The annotation text (what happened) ' +
      '\n- timestamp: When it happened (epoch milliseconds) ' +
      '\n\n**Optional parameters (scope - what it applies to):** ' +
      '\n- deviceId: Specific resource/device (shows on that device\'s graphs) ' +
      '\n- deviceGroupId: Device group (shows on all resource/device in group) ' +
      '\n- websiteId: Website monitor ' +
      '\n- tags: Keywords for filtering/searching (e.g., ["deployment", "database"]) ' +
      '\n\n**Why OpsNotes are valuable:** ' +
      '\n- **Troubleshooting:** Quickly see "what changed" around metric spikes/drops ' +
      '\n- **Correlation:** Link operational events to performance impact ' +
      '\n- **Documentation:** Automatic timeline of changes ' +
      '\n- **Team communication:** Share context on dashboards ' +
      '\n\n**Common OpsNote patterns:** ' +
      '\n\n**Deployment tracking:** ' +
      '{note: "Deployed v2.5.0 to production web servers - build #12345", timestamp: 1699889400000, deviceGroupId: 123, tags: ["deployment", "web"]} ' +
      '// Shows on all web server graphs ' +
      '\n\n**Incident documentation:** ' +
      '{note: "Incident INC-5678: Database performance issue - investigating", timestamp: 1699890000000, deviceId: 456, tags: ["incident", "database"]} ' +
      '{note: "INC-5678: Root cause - slow query. Optimized index.", timestamp: 1699891800000, deviceId: 456, tags: ["incident", "resolved"]} ' +
      '// Timeline of incident on affected resource/device ' +
      '\n\n**Configuration changes:** ' +
      '{note: "Updated Nginx config - increased worker processes from 4 to 8", timestamp: 1699892000000, deviceId: 789, tags: ["config-change"]} ' +
      '{note: "Applied firewall rule changes - blocked port 8080", timestamp: 1699893000000, deviceGroupId: 100, tags: ["security", "firewall"]} ' +
      '\n\n**Maintenance windows:** ' +
      '{note: "Started OS patching on all Linux servers", timestamp: 1699894000000, deviceGroupId: 200, tags: ["maintenance", "patching"]} ' +
      '{note: "Completed OS patching - all servers rebooted", timestamp: 1699898000000, deviceGroupId: 200, tags: ["maintenance", "completed"]} ' +
      '\n\n**Known events:** ' +
      '{note: "AWS announced maintenance in us-east-1", timestamp: 1699895000000, tags: ["aws", "external"]} ' +
      '{note: "Batch job running - expected high CPU", timestamp: 1699896000000, deviceId: 111, tags: ["batch-job", "expected"]} ' +
      '\n\n**Scope options explained:** ' +
      '\n- **deviceId:** Shows on specific resource/device\'s graphs only ' +
      '\n- **deviceGroupId:** Shows on all resource/device in that group ' +
      '\n- **websiteId:** Shows on website monitoring graphs ' +
      '\n- **No scope (global):** Shows on all graphs (use sparingly) ' +
      '\n\n**Timestamp tips:** ' +
      '\n- Use actual event time (not current time) for accurate correlation ' +
      '\n- Epoch milliseconds: Date.now() in JavaScript, time.time()*1000 in Python ' +
      '\n- For past events: Calculate epoch milliseconds for that date/time ' +
      '\n\n**Best practices:** ' +
      '\n- **Be specific:** "Deployed v2.5.0" not "deployed" ' +
      '\n- **Include identifiers:** Build numbers, ticket IDs, version numbers ' +
      '\n- **Use tags:** Makes finding related notes easy ' +
      '\n- **Scope appropriately:** Don\'t make global notes for single resource/device changes ' +
      '\n- **Document resolution:** Add note when incident resolved, not just when started ' +
      '\n\n**Workflow examples:** ' +
      '\n\n**During deployment:** ' +
      '1. Start: Create note "Deployment started - v2.5.0" ' +
      '2. Progress: Create note "Database migrations complete" ' +
      '3. Complete: Create note "Deployment complete - all services healthy" ' +
      '\n\n**During incident:** ' +
      '1. Detection: Create note "High CPU detected - investigating" ' +
      '2. Updates: Add notes as you discover findings ' +
      '3. Resolution: Create note "RESOLVED: Killed runaway process" ' +
      '\n\n**After creation:** ' +
      'OpsNotes appear as vertical lines on graphs at the timestamp. Hover to see note text. Use "list_opsnotes" to search/review notes. ' +
      '\n\n**Related tools:** "list_opsnotes" (view all notes), "update_opsnote" (modify), "delete_opsnote" (remove).',
    annotations: {
      title: 'Create OpsNote',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: 'The note text content',
        },
        scopes: {
          type: 'array',
          description: 'Array of scopes (resources/devices, groups) this note applies to',
          items: { type: 'object', additionalProperties: true },
        },
        tags: {
          type: 'array',
          description: 'Array of tags for categorizing the note',
          items: { type: 'object', additionalProperties: true },
        },
        happenOnInSec: {
          type: 'number',
          description: 'Timestamp (in seconds since epoch) when the event occurred',
        },
      },
      additionalProperties: false,
      required: ['note'],
    },
  },
  {
    name: 'update_opsnote',
    description: 'Update an existing operational note in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify OpsNote text, timestamp, tags, or scope. Useful for correcting mistakes or adding details after initial creation. ' +
      '\n\n**When to use:**' +
      '\n- Fix typos in note text' +
      '\n- Add more details after investigation' +
      '\n- Correct timestamp' +
      '\n- Update tags for better organization' +
      '\n- Change scope (different device/group)' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- opsNoteId: OpsNote ID (from "list_opsnotes") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- note: New note text ' +
      '\n- timestamp: Corrected time (epoch milliseconds) ' +
      '\n- tags: Updated tag array ' +
      '\n- deviceId: Change to different resource/device ' +
      '\n- deviceGroupId: Change to different group ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Add more details after investigation:** ' +
      '{opsNoteId: 123, note: "Deployed v2.5.0 - ROLLBACK at 3:45pm due to memory leak in new code"} ' +
      '// Updated after discovering issue ' +
      '\n\n**Fix typo:** ' +
      '{opsNoteId: 456, note: "Database migration completed successfully"} ' +
      '// Fixed spelling error ' +
      '\n\n**Correct timestamp:** ' +
      '{opsNoteId: 789, timestamp: 1699899000000} ' +
      '// Used wrong time initially ' +
      '\n\n**Add tags for better organization:** ' +
      '{opsNoteId: 111, tags: ["deployment", "rollback", "production", "critical"]} ' +
      '// Added more descriptive tags ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "list_opsnotes" to find note to update ' +
      '2. Update with new information ' +
      '3. Graph annotations update immediately ' +
      '\n\n**Related tools:** "list_opsnotes" (find note), "create_opsnote" (create new), "delete_opsnote" (remove).',
    annotations: {
      title: 'Update OpsNote',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        opsNoteId: {
          type: 'string',
          description: 'The ID of the OpsNote to update',
        },
        note: {
          type: 'string',
          description: 'Updated note text',
        },
        scopes: {
          type: 'array',
          description: 'Updated scopes',
          items: { type: 'object', additionalProperties: true },
        },
        tags: {
          type: 'array',
          description: 'Updated tags',
          items: { type: 'object', additionalProperties: true },
        },
      },
      additionalProperties: false,
      required: ['opsNoteId'],
    },
  },
  {
    name: 'delete_opsnote',
    description: 'Delete an operational note from LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Permanently removes OpsNote. Annotation disappears from graphs and dashboards immediately. ' +
      '\n\n**When to use:**' +
      '\n- Created note by mistake' +
      '\n- Note contains incorrect information' +
      '\n- Note is no longer relevant' +
      '\n- Cleanup old test notes' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- opsNoteId: OpsNote ID to delete (from "list_opsnotes") ' +
      '\n\n**Impact:** ' +
      '\n- Note removed from all graphs and dashboards immediately ' +
      '\n- Historical record deleted (cannot be recovered) ' +
      '\n- Other notes unaffected ' +
      '\n\n**Common deletion scenarios:** ' +
      '\n- Wrong device: Created note on wrong resource/device - delete and recreate on correct one ' +
      '\n- Wrong time: Timestamp significantly wrong - easier to delete and recreate ' +
      '\n- Test note: Remove test annotations after experimenting ' +
      '\n- Irrelevant: "Testing new deployment process" after test completed ' +
      '\n\n**Best practice:** ' +
      'Consider updating note instead of deleting if it just needs correction. Deletion removes historical record. ' +
      '\n\n**Workflow:** ' +
      '1. Use "list_opsnotes" to find note ' +
      '2. Verify correct note before deleting ' +
      '3. Delete note ' +
      '4. Annotation disappears from graphs immediately ' +
      '\n\n**Related tools:** "list_opsnotes" (find note), "update_opsnote" (alternative to deletion), "create_opsnote" (recreate if needed).',
    annotations: {
      title: 'Delete OpsNote',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        opsNoteId: {
          type: 'string',
          description: 'The ID of the OpsNote to delete',
        },
      },
      additionalProperties: false,
      required: ['opsNoteId'],
    },
  },

];
