import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const accessGroupsTools: Tool[] = [
  // Access Groups Tools
  {
    name: 'list_access_groups',
    description: 'List all access groups in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of access groups with: id, name, description, tenant ID, number of associated resources, number of users. ' +
      '\n\n**What are access groups:** Permission boundaries that control WHICH resources users can see and manage. Used in multi-tenant environments to isolate customer data, or to segment access by team/department. Users assigned to access group can only see resources in that group. ' +
      '\n\n**When to use:** ' +
      '\n- Manage multi-tenant environments (MSPs)' +
      '\n- Segment monitoring by department/team' +
      '\n- Control resource visibility' +
      '\n- Audit access control configuration' +
      '\n- Find access group IDs for user assignment' +
      '\n\n**Access groups vs Roles (important distinction):** ' +
      '\n- **Access Groups:** Control WHAT resources you can see (visibility, data isolation)' +
      '\n- **Roles:** Control WHAT actions you can perform (view/edit/delete permissions)' +
      '\n- Users need BOTH: Role (what they can do) + Access Group (what they can see)' +
      '\n\n**Common use cases:** ' +
      '\n\n**MSP / Multi-tenant:** ' +
      '\n- Access Group "Customer A" - User sees only Customer A resource/device' +
      '\n- Access Group "Customer B" - User sees only Customer B resource/device' +
      '\n- Prevents customers from seeing each other\'s data' +
      '\n\n**Departmental isolation:** ' +
      '\n- Access Group "Network Team" - See only network resource/device' +
      '\n- Access Group "Server Team" - See only servers' +
      '\n- Access Group "Database Team" - See only database servers' +
      '\n\n**Environment separation:** ' +
      '\n- Access Group "Production" - Only prod resource/device' +
      '\n- Access Group "Dev/Test" - Only non-prod resource/device' +
      '\n- Junior staff limited to dev/test access group' +
      '\n\n**Workflow:** Use this tool to find access groups, then assign users to groups via "update\\_user" to control resource visibility. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_access\\_group" (details), "create\\_access\\_group" (create new), "list\\_users" (see user assignments), "list\\_resources" (associate resource/device with groups).',
    annotations: {
      title: 'List access groups',
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
    name: 'get_access_group',
    description: 'Get detailed information about a specific access group in LogicMonitor (LM) monitoring by its ID. ' +
      '\n\n**Returns:** Complete access group details: name, description, tenant ID, list of associated resources (which resources/devices/groups are in this access group), list of users assigned to this access group. ' +
      '\n\n**When to use:** ' +
      '\n- Review which resources are in this access group' +
      '\n- Check which users have access to this group' +
      '\n- Audit access control before modifications' +
      '\n- Verify tenant isolation configuration' +
      '\n\n**Key information returned:** ' +
      '\n- **Resources:** Which resource/device groups and resources users in this access group can see' +
      '\n- **Users:** Which users are assigned to this access group' +
      '\n- **Tenant ID:** Multi-tenant identifier (MSP environments)' +
      '\n\n**Impact analysis:** ' +
      'Before modifying access group: ' +
      '\n- Removing resource: Users lose visibility to those resource/device' +
      '\n- Removing user: User loses visibility to all resources in group' +
      '\n- Deleting group: All users lose their access scope' +
      '\n\n**Workflow:** Use "list\\_access\\_groups" to find accessGroupId, then use this tool to review complete configuration before modifications. ' +
      '\n\n**Related tools:** "list\\_access\\_groups" (find groups), "update\\_access\\_group" (modify), "list\\_users" (see user access).',
    annotations: {
      title: 'Get access group details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        accessGroupId: {
          type: 'number',
          description: 'The ID of the access group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['accessGroupId'],
    },
  },
  {
    name: 'create_access_group',
    description: 'Create a new access group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates permission boundary controlling which resources/devices users can see and manage. Essential for multi-tenant environments (MSPs) or departmental isolation. ' +
      '\n\n**When to use:** ' +
      '\n- Set up multi-tenant monitoring (MSP with multiple customers)' +
      '\n- Segment access by department/team' +
      '\n- Create read-only views for specific resource/device groups' +
      '\n- Isolate production from dev/test access' +
      '\n- Control customer/client data visibility' +
      '\n\n**Required parameters:** ' +
      '\n- name: Access group name (e.g., "Customer A", "Network Team", "Production Access")' +
      '\n- description: Purpose/scope (e.g., "Access to Customer A resource/device only")' +
      '\n\n**Optional parameters:** ' +
      '\n- tenantId: Multi-tenant identifier (for MSP environments)' +
      '\n- resourceGroups: Array of resource/device group IDs users can access' +
      '\n- websites: Array of website monitor IDs' +
      '\n- dashboards: Array of dashboard IDs' +
      '\n\n**Access Groups = Data Isolation:** ' +
      'Users assigned to access group can ONLY see resources in that group. Perfect for: ' +
      '\n- MSPs managing multiple customers' +
      '\n- Enterprises with separate business units' +
      '\n- Teams managing different environments (prod/staging/dev)' +
      '\n- Contractors needing limited access' +
      '\n\n**Multi-tenant setup (MSP example):** ' +
      '\n\n**Customer A Access:** ' +
      '{name: "Customer A", description: "Customer A resource/device and dashboards", resourceGroups: [10,11,12]} ' +
      '// Users see only Customer A resource/device ' +
      '\n\n**Customer B Access:** ' +
      '{name: "Customer B", description: "Customer B resource/device and dashboards", resourceGroups: [20,21,22]} ' +
      '// Users see only Customer B resource/device ' +
      '\n\n**Internal Team (all access):** ' +
      '{name: "MSP Admin Team", description: "Full access to all customers", resourceGroups: []} ' +
      '// Empty resourceGroups = access to everything ' +
      '\n\n**Department isolation example:** ' +
      '\n\n**Network Team:** ' +
      '{name: "Network Team", description: "Access to network resource/device only", resourceGroups: [100]} ' +
      '// Group 100 = "Network resources/Devices" folder ' +
      '\n\n**Server Team:** ' +
      '{name: "Server Team", description: "Access to servers only", resourceGroups: [200]} ' +
      '// Group 200 = "Servers" folder ' +
      '\n\n**Database Team:** ' +
      '{name: "Database Team", description: "Access to database servers", resourceGroups: [300]} ' +
      '// Group 300 = "Database Servers" folder ' +
      '\n\n**Environment isolation example:** ' +
      '\n\n**Production Access:** ' +
      '{name: "Production Team", description: "Production environment only", resourceGroups: [1]} ' +
      '\n\n**Dev/Test Access:** ' +
      '{name: "Developers", description: "Development and test environments", resourceGroups: [2,3]} ' +
      '\n\n**Access Group + Role (both needed):** ' +
      '\n- **Access Group:** Controls WHAT resources user sees (visibility)' +
      '\n- **Role:** Controls WHAT actions user can perform (permissions)' +
      '\n- Users need BOTH assigned to have any access' +
      '\n\n**After creation workflow:** ' +
      '\n- Create access group with resource scope' +
      '\n- Create users and assign them to this access group' +
      '\n- Assign appropriate role to users (view/manage/admin)' +
      '\n- Users now see only resources in their access group' +
      '\n\n**Best practices:** ' +
      '\n- One access group per customer (MSP)' +
      '\n- One access group per team (department isolation)' +
      '\n- Empty resourceGroups = full access (admin groups)' +
      '\n- Descriptive names: "Customer Name - Environment"' +
      '\n\n**Related tools:** "update\\_access\\_group" (add/remove resources), "list\\_access\\_groups" (view all), "create\\_user" (assign users to group), "list\\_resource\\_groups" (find group IDs).',
    annotations: {
      title: 'Create access group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the access group',
        },
        description: {
          type: 'string',
          description: 'Description of the access group',
        },
        tenantId: {
          type: 'number',
          description: 'Tenant ID (optional, for multi-tenant environments)',
        },
      },
      additionalProperties: false,
      required: ['name', 'description'],
    },
  },
  {
    name: 'update_access_group',
    description: 'Update an existing access group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify access group properties, add/remove resources, or change tenant assignment. Affects all users assigned to this group immediately. ' +
      '\n\n**When to use:**' +
      '\n- Add/remove resource/device groups from access scope' +
      '\n- Rename access group' +
      '\n- Update description' +
      '\n- Add new resources after customer growth' +
      '\n- Remove decommissioned resources' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- accessGroupId: Access group ID (from "list\\_access\\_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New access group name ' +
      '\n- description: Updated description ' +
      '\n- resourceGroups: New array of resource/device group IDs (replaces existing) ' +
      '\n- websites: Update website monitor access ' +
      '\n- dashboards: Update dashboard access ' +
      '\n- tenantId: Change tenant assignment ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Add more resource/device groups to access:** ' +
      '{accessGroupId: 123, resourceGroups: [10,11,12,13,14]} // Added groups 13,14 ' +
      '\n\n**Remove access to resource/device group:** ' +
      '{accessGroupId: 123, resourceGroups: [10,11]} // Removed group 12 (decomm resources/devices) ' +
      '\n\n**Rename access group:** ' +
      '{accessGroupId: 123, name: "Customer A - Updated Name"} ' +
      '\n\n**Grant full access (admin group):** ' +
      '{accessGroupId: 123, resourceGroups: []} // Empty = see everything ' +
      '\n\n**⚠️ Important - Immediate Impact:** ' +
      '\n- Updating resourceGroups affects ALL users in this access group immediately ' +
      '\n- Removing resource/device group: Users instantly lose access to those resource/device ' +
      '\n- Adding resource/device group: Users instantly gain access to new resource/device ' +
      '\n- Users currently viewing removed resources will see "no access" errors ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get\\_access\\_group" to see current configuration ' +
      '2. Use "list\\_users" to see which users affected by change ' +
      '3. Update access group with new resource scope ' +
      '4. Notify users of access changes ' +
      '\n\n**Example: Customer adds new infrastructure:** ' +
      '1. Customer provisions new resource/device group (e.g., "Customer A - AWS") ' +
      '2. Get current access: get_access_group(accessGroupId: 123) ' +
      '   // Returns: resourceGroups: [10,11] ' +
      '3. Add new group: update_access_group(accessGroupId: 123, resourceGroups: [10,11,12]) ' +
      '4. Customer users now see new AWS resource/device ' +
      '\n\n**Related tools:** "get\\_access\\_group" (review before update), "list\\_access\\_groups" (find group), "list\\_users" (see affected users), "list\\_resource\\_groups" (find group IDs).',
    annotations: {
      title: 'Update access group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        accessGroupId: {
          type: 'number',
          description: 'The ID of the access group to update',
        },
        name: {
          type: 'string',
          description: 'New name for the access group',
        },
        description: {
          type: 'string',
          description: 'New description for the access group',
        },
        tenantId: {
          type: 'number',
          description: 'New tenant ID (optional)',
        },
      },
      additionalProperties: false,
      required: ['accessGroupId'],
    },
  },
  {
    name: 'delete_access_group',
    description: 'Delete an access group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: CRITICAL IMPACT ON USERS** ' +
      '\n- Users assigned to this group lose ALL access immediately ' +
      '\n- Users cannot login or see any resources until reassigned ' +
      '\n- Cannot be undone - users must be manually reassigned ' +
      '\n- Active user sessions may be terminated ' +
      '\n\n**What this does:** Permanently removes access group. All users assigned to this group lose their resource visibility immediately. ' +
      '\n\n**When to use:**' +
      '\n- Customer/client offboarded (MSP)' +
      '\n- Department dissolved/restructured' +
      '\n- Consolidating duplicate access groups' +
      '\n- Cleanup unused access groups' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- accessGroupId: Access group ID to delete (from "list\\_access\\_groups") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "get\\_access\\_group" to see which resources are in scope ' +
      '2. Use "list\\_users" with filter to find ALL users assigned to this group ' +
      '3. Verify users have alternate access groups to move to ' +
      '4. Coordinate with users - they will lose access immediately ' +
      '\n\n**Impact of deletion:** ' +
      '\n- **Users:** Cannot login or see resources until reassigned to new group ' +
      '\n- **Active sessions:** May be terminated immediately ' +
      '\n- **Resources:** Not deleted, just become inaccessible to these users ' +
      '\n- **Dashboards:** Users lose access to dashboards shared via this group ' +
      '\n\n**Safe deletion workflow:** ' +
      '\n\n**Step 1: Identify affected users** ' +
      'list_users() // Find users with accessGroup: "Customer A" ' +
      '\n\n**Step 2: Create/identify replacement access group** ' +
      'create_access_group(name: "Customer A - New") // Or use existing group ' +
      '\n\n**Step 3: Reassign users BEFORE deleting group** ' +
      'For each user: update_user(userId: X, accessGroupId: NEW_GROUP_ID) ' +
      '\n\n**Step 4: Verify no users remain** ' +
      'get_access_group(accessGroupId: 123) // Check users list is empty ' +
      '\n\n**Step 5: Delete group** ' +
      'delete_access_group(accessGroupId: 123) ' +
      '\n\n**Common scenarios:** ' +
      '\n\n**MSP customer offboarding:** ' +
      '1. Verify customer contract ended ' +
      '2. Export customer data for records ' +
      '3. Check no customer users remain in access group ' +
      '4. Delete access group ' +
      '5. Optionally delete customer resources ' +
      '\n\n**Department restructuring:** ' +
      '1. Create new access group for reorganized team ' +
      '2. Move all users to new group ' +
      '3. Verify old group has zero users ' +
      '4. Delete old access group ' +
      '\n\n**⚠️ NEVER delete access group with active users unless intentionally revoking their access immediately!** ' +
      '\n\n**Best practice:** Always reassign users to new access group BEFORE deleting old group to prevent access disruption. ' +
      '\n\n**Related tools:** "get\\_access\\_group" (check users), "list\\_users" (find affected users), "update\\_user" (reassign users), "create\\_access\\_group" (create replacement).',
    annotations: {
      title: 'Delete access group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        accessGroupId: {
          type: 'number',
          description: 'The ID of the access group to delete',
        },
      },
      additionalProperties: false,
      required: ['accessGroupId'],
    },
  },

  // Access group module mapping
  {
    name: 'map_unmap_module_to_access_group',
    description: 'Map or unmap LogicModules to/from access groups in LogicMonitor (LM). Provide the mapping payload via "config".',
    annotations: { title: 'Map/unmap module to access group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Mapping payload (moduleIds, accessGroupIds, operation).' } },
      additionalProperties: false,
      required: ['config'],
    },
  },

];
