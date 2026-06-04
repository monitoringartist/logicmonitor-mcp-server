import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_WEBSITE_FIELDS, DEFAULT_WEBSITE_GROUP_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class WebsitesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Websites
        case 'list_websites': {
          const result = await this.client.listWebsites({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((website: any) =>
              filterFields(website, DEFAULT_WEBSITE_FIELDS),
            ),
          };
        }

        case 'get_website':
          return await this.client.getWebsite(args.websiteId, {
            fields: args.fields,
          });

        case 'create_website': {
          const website: any = {
            name: args.name,
            domain: args.domain,
            type: args.type,
          };
          if (args.description) website.description = args.description;
          if (args.checkpointId) website.checkpointId = args.checkpointId;
          return await this.client.createWebsite(website);
        }

        case 'update_website': {
          const { websiteId, ...websiteData } = args;
          return await this.client.updateWebsite(websiteId, websiteData);
        }

        case 'delete_website':
          return await this.client.deleteWebsite(args.websiteId);

        // Website Groups
        case 'list_website_groups': {
          const result = await this.client.listWebsiteGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((group: any) =>
              filterFields(group, DEFAULT_WEBSITE_GROUP_FIELDS),
            ),
          };
        }

        case 'get_website_group':
          return await this.client.getWebsiteGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_website_group': {
          const { config, ...rest } = args;
          return await this.client.createWebsiteGroup({ ...rest, ...(config || {}) });
        }

        case 'update_website_group': {
          const { groupId, opType, config, ...rest } = args;
          return await this.client.updateWebsiteGroup(
            groupId,
            { ...rest, ...(config || {}) },
            { opType },
          );
        }

        case 'delete_website_group':
          return await this.client.deleteWebsiteGroup(args.groupId, {
            deleteChildren: args.deleteChildren,
          });

        case 'list_website_group_websites':
          return await this.client.listWebsiteGroupWebsites(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'list_website_group_sdts':
          return await this.client.listWebsiteGroupSDTs(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_website_group_sdt_history':
          return await this.client.getWebsiteGroupSDTHistory(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        // Website extras
        case 'get_website_sdt_history':
          return await this.client.getWebsiteSDTHistory(args.websiteId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_website_graph_by_name':
          return await this.client.getWebsiteGraphByName(args.websiteId, args.graphName, {
            start: args.start, end: args.end, format: args.format,
          });

        // Website Checkpoints
        case 'list_website_checkpoints':
          return await this.client.listWebsiteCheckpoints({
            fields: args.fields,
          });

        case 'get_website_checkpoint_data':
          return await this.client.getWebsiteCheckpointData(args.websiteId, args.checkpointId, {
            period: args.period,
            start: args.start,
            end: args.end,
            datapoints: args.datapoints,
            aggregate: args.aggregate,
            format: args.format,
          });

        case 'get_website_graph_data':
          return await this.client.getWebsiteGraphData(args.websiteId, args.checkpointId, args.graphName, {
            start: args.start,
            end: args.end,
            format: args.format,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
