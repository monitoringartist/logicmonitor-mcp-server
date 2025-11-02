/**
 * Tests for LogicMonitor MCP Tools
 */

import { describe, it, expect } from '@jest/globals';
import { getLogicMonitorTools } from './tools.js';

describe('getLogicMonitorTools', () => {
  describe('All Tools', () => {
    it('should return all tools when onlyReadOnly is false', () => {
      const tools = getLogicMonitorTools(false);

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should return all tools when onlyReadOnly is not specified', () => {
      const tools = getLogicMonitorTools();

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should include both read-only and write tools', () => {
      const tools = getLogicMonitorTools(false);

      const hasReadOnly = tools.some(tool => tool.annotations?.readOnlyHint === true);
      const hasWrite = tools.some(tool => tool.annotations?.readOnlyHint === false);

      expect(hasReadOnly).toBe(true);
      expect(hasWrite).toBe(true);
    });
  });

  describe('Read-Only Tools', () => {
    it('should return only read-only tools when onlyReadOnly is true', () => {
      const tools = getLogicMonitorTools(true);

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // All tools should have readOnlyHint: true
      tools.forEach(tool => {
        expect(tool.annotations?.readOnlyHint).toBe(true);
      });
    });

    it('should exclude write tools when filtering by read-only', () => {
      const allTools = getLogicMonitorTools(false);
      const readOnlyTools = getLogicMonitorTools(true);

      expect(readOnlyTools.length).toBeLessThan(allTools.length);
    });

    it('should not include create/update/delete tools in read-only mode', () => {
      const readOnlyTools = getLogicMonitorTools(true);

      const toolNames = readOnlyTools.map(tool => tool.name);

      // These tools should not be in read-only mode
      expect(toolNames).not.toContain('create_resource');
      expect(toolNames).not.toContain('update_resource');
      expect(toolNames).not.toContain('delete_resource');
      expect(toolNames).not.toContain('create_resource_group');
      expect(toolNames).not.toContain('update_resource_group');
      expect(toolNames).not.toContain('delete_resource_group');
    });

    it('should include list/get tools in read-only mode', () => {
      const readOnlyTools = getLogicMonitorTools(true);

      const toolNames = readOnlyTools.map(tool => tool.name);

      // These tools should be in read-only mode
      expect(toolNames).toContain('list_resources');
      expect(toolNames).toContain('get_resource');
      expect(toolNames).toContain('list_alerts');
      expect(toolNames).toContain('get_alert');
      expect(toolNames).toContain('list_collectors');
      expect(toolNames).toContain('get_collector');
    });
  });

  describe('Tool Structure', () => {
    it('should have valid tool structure for all tools', () => {
      const tools = getLogicMonitorTools(false);

      tools.forEach(tool => {
        // Each tool must have a name
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);

        // Each tool must have a description
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');

        // Each tool should have inputSchema
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');

        // Each tool should have annotations
        expect(tool.annotations).toBeDefined();
        expect(tool.annotations?.readOnlyHint).toBeDefined();
        expect(typeof tool.annotations?.readOnlyHint).toBe('boolean');
      });
    });

    it('should have unique tool names', () => {
      const tools = getLogicMonitorTools(false);
      const names = tools.map(tool => tool.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid inputSchema with properties', () => {
      const tools = getLogicMonitorTools(false);

      tools.forEach(tool => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');

        if (tool.inputSchema.required && tool.inputSchema.required.length > 0) {
          // If there are required fields, they must be in properties
          const properties = tool.inputSchema.properties || {};
          tool.inputSchema.required.forEach(requiredField => {
            expect(properties).toHaveProperty(requiredField);
          });
        }
      });
    });

    it('should have additionalProperties set to false', () => {
      const tools = getLogicMonitorTools(false);

      tools.forEach(tool => {
        // All tools should have additionalProperties: false for strict validation
        expect(tool.inputSchema.additionalProperties).toBe(false);
      });
    });
  });

  describe('Specific Tool Categories', () => {
    describe('Device Management Tools', () => {
      it('should include device management tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_resources');
        expect(toolNames).toContain('get_resource');
        expect(toolNames).toContain('create_resource');
        expect(toolNames).toContain('update_resource');
        expect(toolNames).toContain('delete_resource');
      });

      it('should have correct read-only hints for device tools', () => {
        const tools = getLogicMonitorTools(false);

        const listTool = tools.find(t => t.name === 'list_resources');
        const getTool = tools.find(t => t.name === 'get_resource');
        const createTool = tools.find(t => t.name === 'create_resource');
        const updateTool = tools.find(t => t.name === 'update_resource');
        const deleteTool = tools.find(t => t.name === 'delete_resource');

        expect(listTool?.annotations?.readOnlyHint).toBe(true);
        expect(getTool?.annotations?.readOnlyHint).toBe(true);
        expect(createTool?.annotations?.readOnlyHint).toBe(false);
        expect(updateTool?.annotations?.readOnlyHint).toBe(false);
        expect(deleteTool?.annotations?.readOnlyHint).toBe(false);
      });
    });

    describe('Alert Management Tools', () => {
      it('should include alert management tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_alerts');
        expect(toolNames).toContain('get_alert');
        expect(toolNames).toContain('acknowledge_alert');
        expect(toolNames).toContain('add_alert_note');
      });

      it('should have correct read-only hints for alert tools', () => {
        const tools = getLogicMonitorTools(false);

        const listTool = tools.find(t => t.name === 'list_alerts');
        const getTool = tools.find(t => t.name === 'get_alert');
        const ackTool = tools.find(t => t.name === 'acknowledge_alert');

        expect(listTool?.annotations?.readOnlyHint).toBe(true);
        expect(getTool?.annotations?.readOnlyHint).toBe(true);
        expect(ackTool?.annotations?.readOnlyHint).toBe(false);
      });
    });

    describe('Dashboard Tools', () => {
      it('should include dashboard tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_dashboards');
        expect(toolNames).toContain('get_dashboard');
        expect(toolNames).toContain('create_dashboard');
        expect(toolNames).toContain('update_dashboard');
        expect(toolNames).toContain('delete_dashboard');
      });
    });

    describe('Collector Tools', () => {
      it('should include collector tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_collectors');
        expect(toolNames).toContain('get_collector');
      });

      it('should mark collector tools as read-only', () => {
        const tools = getLogicMonitorTools(false);

        const listTool = tools.find(t => t.name === 'list_collectors');
        const getTool = tools.find(t => t.name === 'get_collector');

        expect(listTool?.annotations?.readOnlyHint).toBe(true);
        expect(getTool?.annotations?.readOnlyHint).toBe(true);
      });
    });

    describe('Search Tools', () => {
      it('should include search tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('search_devices');
        expect(toolNames).toContain('search_alerts');
      });

      it('should mark search tools as read-only', () => {
        const tools = getLogicMonitorTools(false);

        const searchDevices = tools.find(t => t.name === 'search_devices');
        const searchAlerts = tools.find(t => t.name === 'search_alerts');

        expect(searchDevices?.annotations?.readOnlyHint).toBe(true);
        expect(searchAlerts?.annotations?.readOnlyHint).toBe(true);
      });
    });

    describe('SDT Tools', () => {
      it('should include SDT tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_sdts');
        expect(toolNames).toContain('get_sdt');
        expect(toolNames).toContain('create_device_sdt');
        expect(toolNames).toContain('delete_sdt');
      });

      it('should have correct read-only hints for SDT tools', () => {
        const tools = getLogicMonitorTools(false);

        const listTool = tools.find(t => t.name === 'list_sdts');
        const getTool = tools.find(t => t.name === 'get_sdt');
        const createTool = tools.find(t => t.name === 'create_device_sdt');
        const deleteTool = tools.find(t => t.name === 'delete_sdt');

        expect(listTool?.annotations?.readOnlyHint).toBe(true);
        expect(getTool?.annotations?.readOnlyHint).toBe(true);
        expect(createTool?.annotations?.readOnlyHint).toBe(false);
        expect(deleteTool?.annotations?.readOnlyHint).toBe(false);
      });
    });

    describe('User and Role Tools', () => {
      it('should include user and role tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_users');
        expect(toolNames).toContain('get_user');
        expect(toolNames).toContain('list_roles');
        expect(toolNames).toContain('get_role');
      });

      it('should mark user/role tools as read-only', () => {
        const tools = getLogicMonitorTools(false);

        const listUsers = tools.find(t => t.name === 'list_users');
        const getUser = tools.find(t => t.name === 'get_user');
        const listRoles = tools.find(t => t.name === 'list_roles');
        const getRole = tools.find(t => t.name === 'get_role');

        expect(listUsers?.annotations?.readOnlyHint).toBe(true);
        expect(getUser?.annotations?.readOnlyHint).toBe(true);
        expect(listRoles?.annotations?.readOnlyHint).toBe(true);
        expect(getRole?.annotations?.readOnlyHint).toBe(true);
      });
    });

    describe('Website Tools', () => {
      it('should include website tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_websites');
        expect(toolNames).toContain('get_website');
        expect(toolNames).toContain('create_website');
        expect(toolNames).toContain('update_website');
        expect(toolNames).toContain('delete_website');
      });
    });

    describe('Link Tools', () => {
      it('should include link generation tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('generate_dashboard_link');
        expect(toolNames).toContain('generate_resource_link');
        expect(toolNames).toContain('generate_alert_link');
        expect(toolNames).toContain('generate_website_link');
      });

      it('should mark link tools as read-only', () => {
        const tools = getLogicMonitorTools(false);

        const dashboardLink = tools.find(t => t.name === 'generate_dashboard_link');
        const resourceLink = tools.find(t => t.name === 'generate_resource_link');
        const alertLink = tools.find(t => t.name === 'generate_alert_link');
        const websiteLink = tools.find(t => t.name === 'generate_website_link');

        expect(dashboardLink?.annotations?.readOnlyHint).toBe(true);
        expect(resourceLink?.annotations?.readOnlyHint).toBe(true);
        expect(alertLink?.annotations?.readOnlyHint).toBe(true);
        expect(websiteLink?.annotations?.readOnlyHint).toBe(true);
      });
    });

    describe('DataSource Tools', () => {
      it('should include datasource tools', () => {
        const tools = getLogicMonitorTools(false);
        const toolNames = tools.map(t => t.name);

        expect(toolNames).toContain('list_datasources');
        expect(toolNames).toContain('get_datasource');
        expect(toolNames).toContain('list_device_instances');
        expect(toolNames).toContain('get_device_instance_data');
      });

      it('should mark datasource query tools as read-only', () => {
        const tools = getLogicMonitorTools(false);

        const listDS = tools.find(t => t.name === 'list_datasources');
        const getDS = tools.find(t => t.name === 'get_datasource');
        const listInstances = tools.find(t => t.name === 'list_device_instances');
        const getData = tools.find(t => t.name === 'get_device_instance_data');

        expect(listDS?.annotations?.readOnlyHint).toBe(true);
        expect(getDS?.annotations?.readOnlyHint).toBe(true);
        expect(listInstances?.annotations?.readOnlyHint).toBe(true);
        expect(getData?.annotations?.readOnlyHint).toBe(true);
      });
    });
  });

  describe('Tool Descriptions', () => {
    it('should have non-empty descriptions for all tools', () => {
      const tools = getLogicMonitorTools(false);

      tools.forEach(tool => {
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.description!.length).toBeGreaterThan(10);
      });
    });

    it('should mention LogicMonitor or LM in most descriptions', () => {
      const tools = getLogicMonitorTools(false);

      // Count how many tools mention LogicMonitor or LM
      const toolsWithLM = tools.filter(tool => {
        const desc = tool.description?.toLowerCase() || '';
        return desc.includes('logicmonitor') || desc.includes('lm');
      });

      // At least 80% of tools should mention LogicMonitor or LM
      const percentage = (toolsWithLM.length / tools.length) * 100;
      expect(percentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Input Schema Properties', () => {
    it('should have pagination parameters for list tools', () => {
      const tools = getLogicMonitorTools(false);
      const listTools = tools.filter(t => t.name.startsWith('list_'));

      listTools.forEach(tool => {
        const properties = tool.inputSchema.properties || {};

        // Most list tools should have pagination
        if (tool.name !== 'list_website_checkpoints') { // Some exceptions
          expect(properties).toHaveProperty('size');
          expect(properties).toHaveProperty('offset');
        }
      });
    });

    it('should have filter parameter for list tools', () => {
      const tools = getLogicMonitorTools(false);
      const listTools = tools.filter(t => t.name.startsWith('list_'));

      listTools.forEach(tool => {
        const properties = tool.inputSchema.properties || {};

        // Most list tools should have filter (some exceptions exist)
        if (tool.name !== 'list_website_checkpoints' &&
            tool.name !== 'list_collector_versions') {
          expect(properties).toHaveProperty('filter');
        }
      });
    });

    it('should have ID parameter for get/update/delete tools', () => {
      const tools = getLogicMonitorTools(false);
      const idTools = tools.filter(t =>
        t.name.startsWith('get_') ||
        t.name.startsWith('update_') ||
        t.name.startsWith('delete_'),
      );

      // Count tools that have ID parameters
      const toolsWithId = idTools.filter(tool => {
        const required = tool.inputSchema.required || [];
        const properties = tool.inputSchema.properties || {};

        // Should have at least one ID parameter in required or properties
        return required.some(r =>
          r.toLowerCase().includes('id'),
        ) || Object.keys(properties).some(p =>
          p.toLowerCase().includes('id'),
        );
      });

      // Most get/update/delete tools should have an ID parameter
      const percentage = (toolsWithId.length / idTools.length) * 100;
      expect(percentage).toBeGreaterThanOrEqual(90);
    });

    it('should have required parameters for create tools', () => {
      const tools = getLogicMonitorTools(false);
      const createTools = tools.filter(t => t.name.startsWith('create_'));

      createTools.forEach(tool => {
        // Create tools should typically have required fields
        if (tool.inputSchema.required) {
          expect(tool.inputSchema.required.length).toBeGreaterThanOrEqual(1);
        }
      });
    });
  });

  describe('Annotations', () => {
    it('should have serverUrl annotation for all tools', () => {
      const tools = getLogicMonitorTools(false);

      tools.forEach(tool => {
        expect(tool.annotations?.serverUrl).toBeDefined();
        if (typeof tool.annotations?.serverUrl === 'string') {
          expect(tool.annotations.serverUrl).toContain('logicmonitor.com');
        }
      });
    });

    it('should have title annotation for all tools', () => {
      const tools = getLogicMonitorTools(false);

      tools.forEach(tool => {
        expect(tool.annotations?.title).toBeDefined();
        expect(typeof tool.annotations?.title).toBe('string');
      });
    });
  });

  describe('Tool Count', () => {
    it('should have a reasonable number of tools', () => {
      const allTools = getLogicMonitorTools(false);

      // Should have at least 50 tools (comprehensive API coverage)
      expect(allTools.length).toBeGreaterThanOrEqual(50);

      // Should have fewer than 200 tools (reasonable upper bound)
      expect(allTools.length).toBeLessThan(200);
    });

    it('should have at least 30% read-only tools', () => {
      const allTools = getLogicMonitorTools(false);
      const readOnlyTools = getLogicMonitorTools(true);

      const readOnlyPercentage = (readOnlyTools.length / allTools.length) * 100;

      expect(readOnlyPercentage).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Batch Operation Support', () => {
    it('should have batch parameters in create_resource tool', () => {
      const tools = getLogicMonitorTools(false);
      const createResource = tools.find(t => t.name === 'create_resource');

      expect(createResource).toBeDefined();
      const properties = createResource?.inputSchema.properties || {};

      // Should support batch operations
      expect(properties).toHaveProperty('devices');
      expect(properties).toHaveProperty('batchOptions');
    });

    it('should have batch parameters in update_resource tool', () => {
      const tools = getLogicMonitorTools(false);
      const updateResource = tools.find(t => t.name === 'update_resource');

      expect(updateResource).toBeDefined();
      const properties = updateResource?.inputSchema.properties || {};

      // Should support batch operations
      expect(properties).toHaveProperty('devices');
      expect(properties).toHaveProperty('batchOptions');
    });

    it('should have batch parameters in delete_resource tool', () => {
      const tools = getLogicMonitorTools(false);
      const deleteResource = tools.find(t => t.name === 'delete_resource');

      expect(deleteResource).toBeDefined();
      const properties = deleteResource?.inputSchema.properties || {};

      // Should support batch operations
      expect(properties).toHaveProperty('deviceIds');
      expect(properties).toHaveProperty('batchOptions');
    });
  });

  describe('Field Selection Support', () => {
    it('should support fields parameter in list tools', () => {
      const tools = getLogicMonitorTools(false);
      const listTools = tools.filter(t => t.name.startsWith('list_'));

      listTools.forEach(tool => {
        const properties = tool.inputSchema.properties || {};

        // Most list tools should support fields parameter
        if (tool.name !== 'list_website_checkpoints') {
          expect(properties).toHaveProperty('fields');
        }
      });
    });

    it('should support fields parameter in get tools', () => {
      const tools = getLogicMonitorTools(false);
      const getTools = tools.filter(t => t.name.startsWith('get_'));

      getTools.forEach(tool => {
        const properties = tool.inputSchema.properties || {};

        // Most get tools should support fields parameter
        if (tool.name !== 'get_device_instance_data' &&
            tool.name !== 'get_topology') {
          expect(properties).toHaveProperty('fields');
        }
      });
    });
  });
});

