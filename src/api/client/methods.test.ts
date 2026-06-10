/**
 * Contract tests for every LogicMonitor (LM) API client domain method.
 *
 * The domain clients are thin wrappers whose job is to map a method call onto a
 * specific HTTP verb + REST path (and, for list endpoints, optionally fan out via
 * pagination). These tests mock `fetch` and assert that each wrapper issues the
 * expected request, locking in the public API surface against accidental drift.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LogicMonitorClient } from './index.js';

const originalFetch = global.fetch;
const BASE = '/santaba/rest';

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const { status = 200, headers = {} } = init;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function makeClient(): LogicMonitorClient {
  return new LogicMonitorClient({ company: 'test', bearerToken: 'token' });
}

let fetchMock: jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  fetchMock = jest.fn(async () =>
    jsonResponse({ id: 1, total: 0, items: [] }),
  ) as jest.MockedFunction<typeof fetch>;
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function lastRequest(): { url: URL; method: string; body?: string } {
  const calls = fetchMock.mock.calls;
  const [input, options] = calls[calls.length - 1] as [string, RequestInit];
  return {
    url: new URL(input),
    method: String(options.method),
    body: options.body as string | undefined,
  };
}

type Case = {
  name: string;
  run: (c: LogicMonitorClient) => Promise<unknown>;
  method: string;
  path: string;
};

// Single-request endpoints (get / create / update / delete / import / actions).
const cases: Case[] = [
  // Devices
  { name: 'getDevice', run: c => c.getDevice(42), method: 'GET', path: '/device/devices/42' },
  { name: 'createDevice', run: c => c.createDevice({ name: 'x' }), method: 'POST', path: '/device/devices' },
  { name: 'updateDevice', run: c => c.updateDevice(42, { name: 'x' }), method: 'PATCH', path: '/device/devices/42' },
  { name: 'deleteDevice', run: c => c.deleteDevice(42), method: 'DELETE', path: '/device/devices/42' },
  { name: 'listDeviceInstanceConfigs', run: c => c.listDeviceInstanceConfigs(1, 2, 3), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/config' },
  { name: 'getDeviceInstanceConfig', run: c => c.getDeviceInstanceConfig(1, 2, 3, 'cfg'), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/config/cfg' },
  { name: 'collectDeviceInstanceConfig', run: c => c.collectDeviceInstanceConfig(1, 2, 3), method: 'POST', path: '/device/devices/1/devicedatasources/2/instances/3/config/configCollection' },
  { name: 'listNetflowFlows', run: c => c.listNetflowFlows(1), method: 'GET', path: '/device/devices/1/flows' },
  { name: 'listNetflowPorts', run: c => c.listNetflowPorts(1), method: 'GET', path: '/device/devices/1/ports' },
  { name: 'listNetflowEndpoints', run: c => c.listNetflowEndpoints(1), method: 'GET', path: '/device/devices/1/endpoints' },
  { name: 'getDeviceTopTalkersGraph', run: c => c.getDeviceTopTalkersGraph(1), method: 'GET', path: '/device/devices/1/topTalkersGraph' },
  { name: 'createDeviceProperty', run: c => c.createDeviceProperty(1, 'n', 'v'), method: 'POST', path: '/device/devices/1/properties' },
  { name: 'deleteDeviceProperty', run: c => c.deleteDeviceProperty(1, 'n'), method: 'DELETE', path: '/device/devices/1/properties/n' },
  { name: 'listDeviceAlerts', run: c => c.listDeviceAlerts(1), method: 'GET', path: '/device/devices/1/alerts' },
  { name: 'listDeviceEventSources', run: c => c.listDeviceEventSources(1), method: 'GET', path: '/device/devices/1/deviceeventsources' },
  { name: 'scheduleDeviceAutoDiscovery', run: c => c.scheduleDeviceAutoDiscovery(1), method: 'POST', path: '/device/devices/1/scheduleAutoDiscovery' },
  { name: 'getDevicesDeltaId', run: c => c.getDevicesDeltaId(), method: 'GET', path: '/device/devices/delta' },
  { name: 'getDevicesDelta', run: c => c.getDevicesDelta('d1'), method: 'GET', path: '/device/devices/delta/d1' },
  { name: 'updateDeviceProperty', run: c => c.updateDeviceProperty(1, 'n', 'v'), method: 'PATCH', path: '/device/devices/1/properties/n' },

  // Device Groups
  { name: 'getDeviceGroup', run: c => c.getDeviceGroup(1), method: 'GET', path: '/device/groups/1' },
  { name: 'createDeviceGroup', run: c => c.createDeviceGroup({}), method: 'POST', path: '/device/groups' },
  { name: 'updateDeviceGroup', run: c => c.updateDeviceGroup(1, {}), method: 'PATCH', path: '/device/groups/1' },
  { name: 'deleteDeviceGroup', run: c => c.deleteDeviceGroup(1), method: 'DELETE', path: '/device/groups/1' },
  { name: 'updateDeviceGroupProperty', run: c => c.updateDeviceGroupProperty(1, 'n', 'v'), method: 'PATCH', path: '/device/groups/1/properties/n' },
  { name: 'createDeviceGroupProperty', run: c => c.createDeviceGroupProperty(1, 'n', 'v'), method: 'POST', path: '/device/groups/1/properties' },
  { name: 'deleteDeviceGroupProperty', run: c => c.deleteDeviceGroupProperty(1, 'n'), method: 'DELETE', path: '/device/groups/1/properties/n' },
  { name: 'getDeviceGroupClusterAlertConf', run: c => c.getDeviceGroupClusterAlertConf(1, 2), method: 'GET', path: '/device/groups/1/clusterAlertConf/2' },
  { name: 'createDeviceGroupClusterAlertConf', run: c => c.createDeviceGroupClusterAlertConf(1, {}), method: 'POST', path: '/device/groups/1/clusterAlertConf' },
  { name: 'updateDeviceGroupClusterAlertConf', run: c => c.updateDeviceGroupClusterAlertConf(1, 2, {}), method: 'PATCH', path: '/device/groups/1/clusterAlertConf/2' },
  { name: 'deleteDeviceGroupClusterAlertConf', run: c => c.deleteDeviceGroupClusterAlertConf(1, 2), method: 'DELETE', path: '/device/groups/1/clusterAlertConf/2' },
  { name: 'getDeviceGroupDatasource', run: c => c.getDeviceGroupDatasource(1, 2), method: 'GET', path: '/device/groups/1/datasources/2' },
  { name: 'updateDeviceGroupDatasource', run: c => c.updateDeviceGroupDatasource(1, 2, {}), method: 'PATCH', path: '/device/groups/1/datasources/2' },
  { name: 'getDeviceGroupDatasourceAlertSetting', run: c => c.getDeviceGroupDatasourceAlertSetting(1, 2), method: 'GET', path: '/device/groups/1/datasources/2/alertsettings' },
  { name: 'updateDeviceGroupDatasourceAlertSetting', run: c => c.updateDeviceGroupDatasourceAlertSetting(1, 2, {}), method: 'PATCH', path: '/device/groups/1/datasources/2/alertsettings' },

  // Alerts
  { name: 'getAlert', run: c => c.getAlert('a1'), method: 'GET', path: '/alert/alerts/a1' },
  { name: 'acknowledgeAlert', run: c => c.acknowledgeAlert('a1'), method: 'POST', path: '/alert/alerts/a1/ack' },
  { name: 'addAlertNote', run: c => c.addAlertNote('a1', 'note'), method: 'POST', path: '/alert/alerts/a1/note' },
  { name: 'getAlertRule', run: c => c.getAlertRule(1), method: 'GET', path: '/setting/alert/rules/1' },
  { name: 'createAlertRule', run: c => c.createAlertRule({}), method: 'POST', path: '/setting/alert/rules' },
  { name: 'updateAlertRule', run: c => c.updateAlertRule(1, {}), method: 'PATCH', path: '/setting/alert/rules/1' },
  { name: 'deleteAlertRule', run: c => c.deleteAlertRule(1), method: 'DELETE', path: '/setting/alert/rules/1' },
  { name: 'getActionChain', run: c => c.getActionChain(1), method: 'GET', path: '/setting/action/chains/1' },
  { name: 'createActionChain', run: c => c.createActionChain({}), method: 'POST', path: '/setting/action/chains' },
  { name: 'updateActionChain', run: c => c.updateActionChain(1, {}), method: 'PATCH', path: '/setting/action/chains/1' },
  { name: 'deleteActionChain', run: c => c.deleteActionChain(1), method: 'DELETE', path: '/setting/action/chains/1' },
  { name: 'getActionRule', run: c => c.getActionRule(1), method: 'GET', path: '/setting/action/rules/1' },
  { name: 'createActionRule', run: c => c.createActionRule({}), method: 'POST', path: '/setting/action/rules' },
  { name: 'updateActionRule', run: c => c.updateActionRule(1, {}), method: 'PATCH', path: '/setting/action/rules/1' },
  { name: 'deleteActionRule', run: c => c.deleteActionRule(1), method: 'DELETE', path: '/setting/action/rules/1' },
  { name: 'setActionRuleStatus', run: c => c.setActionRuleStatus(1, true), method: 'PATCH', path: '/setting/action/rules/1/status' },
  { name: 'escalateAlert', run: c => c.escalateAlert('a1'), method: 'POST', path: '/alert/alerts/a1/escalate' },

  // Collectors
  { name: 'getCollector', run: c => c.getCollector(1), method: 'GET', path: '/setting/collector/collectors/1' },
  { name: 'createCollector', run: c => c.createCollector({}), method: 'POST', path: '/setting/collector/collectors' },
  { name: 'updateCollector', run: c => c.updateCollector(1, {}), method: 'PATCH', path: '/setting/collector/collectors/1' },
  { name: 'deleteCollector', run: c => c.deleteCollector(1), method: 'DELETE', path: '/setting/collector/collectors/1' },
  { name: 'acknowledgeCollectorDownAlert', run: c => c.acknowledgeCollectorDownAlert(1), method: 'POST', path: '/setting/collector/collectors/1/ackdown' },
  { name: 'executeDebugCommand', run: c => c.executeDebugCommand(1, 'ls'), method: 'POST', path: '/debug' },
  { name: 'getDebugCommandResult', run: c => c.getDebugCommandResult('s1', 1), method: 'GET', path: '/debug/s1' },
  { name: 'getCollectorGroup', run: c => c.getCollectorGroup(1), method: 'GET', path: '/setting/collector/groups/1' },
  { name: 'createCollectorGroup', run: c => c.createCollectorGroup({}), method: 'POST', path: '/setting/collector/groups' },
  { name: 'updateCollectorGroup', run: c => c.updateCollectorGroup(1, {}), method: 'PATCH', path: '/setting/collector/groups/1' },
  { name: 'deleteCollectorGroup', run: c => c.deleteCollectorGroup(1), method: 'DELETE', path: '/setting/collector/groups/1' },
  { name: 'listCollectorAgentLogLevels', run: c => c.listCollectorAgentLogLevels(1), method: 'GET', path: '/setting/collector/collectors/1/agentloglevels' },
  { name: 'getCollectorAgentLogLevel', run: c => c.getCollectorAgentLogLevel(1, 'comp'), method: 'GET', path: '/setting/collector/collectors/1/agentloglevels/comp' },
  { name: 'updateCollectorAgentLogLevel', run: c => c.updateCollectorAgentLogLevel(1, 'comp', {}), method: 'PATCH', path: '/setting/collector/collectors/1/agentloglevels/comp' },
  { name: 'getCollectorEvents', run: c => c.getCollectorEvents(1), method: 'GET', path: '/setting/collector/collectors/1/events' },
  { name: 'getCollectorStatusCheck', run: c => c.getCollectorStatusCheck(1), method: 'GET', path: '/setting/collector/collectors/1/services/getStatusCheck' },
  { name: 'listCollectorVersions', run: c => c.listCollectorVersions(), method: 'GET', path: '/setting/collector/collectors/versions' },

  // DataSources
  { name: 'getDataSource', run: c => c.getDataSource(1), method: 'GET', path: '/setting/datasources/1' },
  { name: 'createDataSource', run: c => c.createDataSource({}), method: 'POST', path: '/setting/datasources' },
  { name: 'updateDataSource', run: c => c.updateDataSource(1, {}), method: 'PATCH', path: '/setting/datasources/1' },
  { name: 'deleteDataSource', run: c => c.deleteDataSource(1), method: 'DELETE', path: '/setting/datasources/1' },
  { name: 'importDataSource (json)', run: c => c.importDataSource('{}', 'json'), method: 'POST', path: '/setting/datasources/importjson' },
  { name: 'importDataSource (xml)', run: c => c.importDataSource('<x/>', 'xml'), method: 'POST', path: '/setting/datasources/importxml' },
  { name: 'listDataSourceOverviewGraphs', run: c => c.listDataSourceOverviewGraphs(1), method: 'GET', path: '/setting/datasources/1/ographs' },
  { name: 'getDataSourceOverviewGraph', run: c => c.getDataSourceOverviewGraph(1, 2), method: 'GET', path: '/setting/datasources/1/ographs/2' },
  { name: 'listDataSourceDevices', run: c => c.listDataSourceDevices(1), method: 'GET', path: '/setting/datasources/1/devices' },
  { name: 'listDataSourceUpdateReasons', run: c => c.listDataSourceUpdateReasons(1), method: 'GET', path: '/setting/datasources/1/updatereasons' },
  { name: 'getDeviceDataSource', run: c => c.getDeviceDataSource(1, 2), method: 'GET', path: '/device/devices/1/devicedatasources/2' },
  { name: 'updateDeviceDataSource', run: c => c.updateDeviceDataSource(1, 2, {}), method: 'PATCH', path: '/device/devices/1/devicedatasources/2' },

  // Instances
  { name: 'getDeviceDataSourceInstanceData', run: c => c.getDeviceDataSourceInstanceData(1, 2, 3), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/data' },
  { name: 'createDeviceDataSourceInstance', run: c => c.createDeviceDataSourceInstance(1, 2, {}), method: 'POST', path: '/device/devices/1/devicedatasources/2/instances' },
  { name: 'updateDeviceDataSourceInstance', run: c => c.updateDeviceDataSourceInstance(1, 2, 3, {}), method: 'PATCH', path: '/device/devices/1/devicedatasources/2/instances/3' },
  { name: 'deleteDeviceDataSourceInstance', run: c => c.deleteDeviceDataSourceInstance(1, 2, 3), method: 'DELETE', path: '/device/devices/1/devicedatasources/2/instances/3' },
  { name: 'getDeviceDataSourceInstanceGraphData', run: c => c.getDeviceDataSourceInstanceGraphData(1, 2, 3, 4), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/graphs/4/data' },
  { name: 'getDeviceDataSourceData', run: c => c.getDeviceDataSourceData(1, 2), method: 'GET', path: '/device/devices/1/devicedatasources/2/data' },
  { name: 'getDeviceDataSourceInstanceGroup', run: c => c.getDeviceDataSourceInstanceGroup(1, 2, 3), method: 'GET', path: '/device/devices/1/devicedatasources/2/groups/3' },
  { name: 'createDeviceDataSourceInstanceGroup', run: c => c.createDeviceDataSourceInstanceGroup(1, 2, {}), method: 'POST', path: '/device/devices/1/devicedatasources/2/groups' },
  { name: 'updateDeviceDataSourceInstanceGroup', run: c => c.updateDeviceDataSourceInstanceGroup(1, 2, 3, {}), method: 'PATCH', path: '/device/devices/1/devicedatasources/2/groups/3' },
  { name: 'updateInstanceGroupAlertThreshold', run: c => c.updateInstanceGroupAlertThreshold(1, 2, 3, 4, {}), method: 'PUT', path: '/device/devices/1/devicedatasources/2/groups/3/datapoints/4/alertconfig' },
  { name: 'getDeviceDataSourceInstanceGroupOverviewGraphData', run: c => c.getDeviceDataSourceInstanceGroupOverviewGraphData(1, 2, 3, 4), method: 'GET', path: '/device/devices/1/devicedatasources/2/groups/3/graphs/4/data' },
  { name: 'listDeviceAlertSettings', run: c => c.listDeviceAlertSettings(1), method: 'GET', path: '/device/devices/1/alertsettings' },
  { name: 'listDeviceInstanceAlertSettings', run: c => c.listDeviceInstanceAlertSettings(1, 2, 3), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/alertsettings' },
  { name: 'getDeviceInstanceAlertSetting', run: c => c.getDeviceInstanceAlertSetting(1, 2, 3, 4), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/alertsettings/4' },
  { name: 'updateDeviceInstanceAlertSetting', run: c => c.updateDeviceInstanceAlertSetting(1, 2, 3, 4, {}), method: 'PATCH', path: '/device/devices/1/devicedatasources/2/instances/3/alertsettings/4' },
  { name: 'fetchDeviceInstancesData', run: c => c.fetchDeviceInstancesData({}), method: 'POST', path: '/device/instances/datafetch' },
  { name: 'getInstanceGraphDataById', run: c => c.getInstanceGraphDataById(1, 2), method: 'GET', path: '/device/devicedatasourceinstances/1/graphs/2/data' },
  { name: 'getMetricsSummary', run: c => c.getMetricsSummary(), method: 'GET', path: '/metrics/summary' },
  { name: 'getMetricsUsage', run: c => c.getMetricsUsage(), method: 'GET', path: '/metrics/usage' },

  // SDT
  { name: 'getDeviceSDTHistory', run: c => c.getDeviceSDTHistory(1), method: 'GET', path: '/device/devices/1/historysdts' },
  { name: 'getDeviceDataSourceSDTHistory', run: c => c.getDeviceDataSourceSDTHistory(1, 2), method: 'GET', path: '/device/devices/1/devicedatasources/2/historysdts' },
  { name: 'getDeviceInstanceSDTHistory', run: c => c.getDeviceInstanceSDTHistory(1, 2, 3), method: 'GET', path: '/device/devices/1/devicedatasources/2/instances/3/historysdts' },
  { name: 'getSDT', run: c => c.getSDT('s1'), method: 'GET', path: '/sdt/sdts/s1' },
  { name: 'createDeviceSDT', run: c => c.createDeviceSDT({}), method: 'POST', path: '/sdt/sdts' },
  { name: 'createSDT', run: c => c.createSDT({}), method: 'POST', path: '/sdt/sdts' },
  { name: 'updateSDT', run: c => c.updateSDT('s1', {}), method: 'PATCH', path: '/sdt/sdts/s1' },
  { name: 'deleteSDT', run: c => c.deleteSDT('s1'), method: 'DELETE', path: '/sdt/sdts/s1' },

  // Dashboards
  { name: 'getDashboard', run: c => c.getDashboard(1), method: 'GET', path: '/dashboard/dashboards/1' },
  { name: 'createDashboard', run: c => c.createDashboard({}), method: 'POST', path: '/dashboard/dashboards' },
  { name: 'updateDashboard', run: c => c.updateDashboard(1, {}), method: 'PATCH', path: '/dashboard/dashboards/1' },
  { name: 'deleteDashboard', run: c => c.deleteDashboard(1), method: 'DELETE', path: '/dashboard/dashboards/1' },
  { name: 'getDashboardGroup', run: c => c.getDashboardGroup(1), method: 'GET', path: '/dashboard/groups/1' },
  { name: 'createDashboardGroup', run: c => c.createDashboardGroup({}), method: 'POST', path: '/dashboard/groups' },
  { name: 'updateDashboardGroup', run: c => c.updateDashboardGroup(1, {}), method: 'PATCH', path: '/dashboard/groups/1' },
  { name: 'deleteDashboardGroup', run: c => c.deleteDashboardGroup(1), method: 'DELETE', path: '/dashboard/groups/1' },
  { name: 'cloneDashboardGroup', run: c => c.cloneDashboardGroup(1, {}), method: 'POST', path: '/dashboard/groups/1/asyncclone' },
  { name: 'updateDefaultDashboard', run: c => c.updateDefaultDashboard('u1', {}), method: 'PATCH', path: '/setting/userdata/u1' },
  { name: 'getWidget', run: c => c.getWidget(1), method: 'GET', path: '/dashboard/widgets/1' },
  { name: 'getWidgetData', run: c => c.getWidgetData(1), method: 'GET', path: '/dashboard/widgets/1/data' },
  { name: 'createWidget', run: c => c.createWidget({}), method: 'POST', path: '/dashboard/widgets' },
  { name: 'updateWidget', run: c => c.updateWidget(1, {}), method: 'PATCH', path: '/dashboard/widgets/1' },
  { name: 'deleteWidget', run: c => c.deleteWidget(1), method: 'DELETE', path: '/dashboard/widgets/1' },

  // Reports
  { name: 'getReport', run: c => c.getReport(1), method: 'GET', path: '/report/reports/1' },
  { name: 'createReport', run: c => c.createReport({}), method: 'POST', path: '/report/reports' },
  { name: 'updateReport', run: c => c.updateReport(1, {}), method: 'PATCH', path: '/report/reports/1' },
  { name: 'deleteReport', run: c => c.deleteReport(1), method: 'DELETE', path: '/report/reports/1' },
  { name: 'generateReport', run: c => c.generateReport(1), method: 'POST', path: '/report/reports/1/executions' },
  { name: 'getReportTaskResult', run: c => c.getReportTaskResult(1, 't1'), method: 'GET', path: '/report/reports/1/tasks/t1' },
  { name: 'getReportGroup', run: c => c.getReportGroup(1), method: 'GET', path: '/report/groups/1' },
  { name: 'createReportGroup', run: c => c.createReportGroup({}), method: 'POST', path: '/report/groups' },
  { name: 'updateReportGroup', run: c => c.updateReportGroup(1, {}), method: 'PATCH', path: '/report/groups/1' },
  { name: 'deleteReportGroup', run: c => c.deleteReportGroup(1), method: 'DELETE', path: '/report/groups/1' },

  // Websites
  { name: 'getWebsite', run: c => c.getWebsite(1), method: 'GET', path: '/website/websites/1' },
  { name: 'createWebsite', run: c => c.createWebsite({}), method: 'POST', path: '/website/websites' },
  { name: 'updateWebsite', run: c => c.updateWebsite(1, {}), method: 'PATCH', path: '/website/websites/1' },
  { name: 'deleteWebsite', run: c => c.deleteWebsite(1), method: 'DELETE', path: '/website/websites/1' },
  { name: 'getWebsiteCheckpointData', run: c => c.getWebsiteCheckpointData(1, 2), method: 'GET', path: '/website/websites/1/checkpoints/2/data' },
  { name: 'getWebsiteGraphData', run: c => c.getWebsiteGraphData(1, 2, 'g'), method: 'GET', path: '/website/websites/1/checkpoints/2/graphs/g/data' },
  { name: 'getWebsiteGroup', run: c => c.getWebsiteGroup(1), method: 'GET', path: '/website/groups/1' },
  { name: 'createWebsiteGroup', run: c => c.createWebsiteGroup({}), method: 'POST', path: '/website/groups' },
  { name: 'updateWebsiteGroup', run: c => c.updateWebsiteGroup(1, {}), method: 'PATCH', path: '/website/groups/1' },
  { name: 'deleteWebsiteGroup', run: c => c.deleteWebsiteGroup(1), method: 'DELETE', path: '/website/groups/1' },
  { name: 'getWebsiteGraphByName', run: c => c.getWebsiteGraphByName(1, 'g'), method: 'GET', path: '/website/websites/1/graphs/g/data' },
  { name: 'listWebsiteCheckpoints', run: c => c.listWebsiteCheckpoints(), method: 'GET', path: '/website/smcheckpoints' },

  // Users / Roles / Tokens
  { name: 'getUser', run: c => c.getUser(1), method: 'GET', path: '/setting/admins/1' },
  { name: 'getRole', run: c => c.getRole(1), method: 'GET', path: '/setting/roles/1' },
  { name: 'createRole', run: c => c.createRole({}), method: 'POST', path: '/setting/roles' },
  { name: 'updateRole', run: c => c.updateRole(1, {}), method: 'PATCH', path: '/setting/roles/1' },
  { name: 'deleteRole', run: c => c.deleteRole(1), method: 'DELETE', path: '/setting/roles/1' },
  { name: 'createUser', run: c => c.createUser({}), method: 'POST', path: '/setting/admins' },
  { name: 'updateUser', run: c => c.updateUser(1, {}), method: 'PATCH', path: '/setting/admins/1' },
  { name: 'deleteUser', run: c => c.deleteUser(1), method: 'DELETE', path: '/setting/admins/1' },
  { name: 'createApiToken', run: c => c.createApiToken(1, {}), method: 'POST', path: '/setting/admins/1/apitokens' },
  { name: 'updateApiToken', run: c => c.updateApiToken(1, 2, {}), method: 'PATCH', path: '/setting/admins/1/apitokens/2' },
  { name: 'deleteApiToken', run: c => c.deleteApiToken(1, 2), method: 'DELETE', path: '/setting/admins/1/apitokens/2' },
  { name: 'getExternalApiStats', run: c => c.getExternalApiStats(), method: 'GET', path: '/apiStats/externalApis' },

  // ConfigSources
  { name: 'getConfigSource', run: c => c.getConfigSource(1), method: 'GET', path: '/setting/configsources/1' },
  { name: 'createConfigSource', run: c => c.createConfigSource({}), method: 'POST', path: '/setting/configsources' },
  { name: 'updateConfigSource', run: c => c.updateConfigSource(1, {}), method: 'PATCH', path: '/setting/configsources/1' },
  { name: 'deleteConfigSource', run: c => c.deleteConfigSource(1), method: 'DELETE', path: '/setting/configsources/1' },
  { name: 'importConfigSource (xml)', run: c => c.importConfigSource('<x/>', 'xml'), method: 'POST', path: '/setting/configsources/importxml' },
  { name: 'getConfigSourceUpdateReasons', run: c => c.getConfigSourceUpdateReasons(1), method: 'GET', path: '/setting/configsources/1/updatereasons' },

  // Audit
  { name: 'getAuditLog', run: c => c.getAuditLog('a1'), method: 'GET', path: '/setting/accesslogs/a1' },

  // Access Groups
  { name: 'getAccessGroup', run: c => c.getAccessGroup(1), method: 'GET', path: '/setting/accessgroup/1' },
  { name: 'createAccessGroup', run: c => c.createAccessGroup({ name: 'n', description: 'd' }), method: 'POST', path: '/setting/accessgroup' },
  { name: 'updateAccessGroup', run: c => c.updateAccessGroup(1, {}), method: 'PATCH', path: '/setting/accessgroup/1' },
  { name: 'deleteAccessGroup', run: c => c.deleteAccessGroup(1), method: 'DELETE', path: '/setting/accessgroup/1' },
  { name: 'mapUnmapModuleToAccessGroup', run: c => c.mapUnmapModuleToAccessGroup({}), method: 'POST', path: '/setting/accessgroup/mapunmap/modules' },

  // EventSources
  { name: 'getEventSource', run: c => c.getEventSource(1), method: 'GET', path: '/setting/eventsources/1' },
  { name: 'createEventSource', run: c => c.createEventSource({}), method: 'POST', path: '/setting/eventsources' },
  { name: 'updateEventSource', run: c => c.updateEventSource(1, {}), method: 'PATCH', path: '/setting/eventsources/1' },
  { name: 'deleteEventSource', run: c => c.deleteEventSource(1), method: 'DELETE', path: '/setting/eventsources/1' },
  { name: 'importEventSource (json)', run: c => c.importEventSource('{}', 'json'), method: 'POST', path: '/setting/eventsources/importjson' },

  // Escalation
  { name: 'getEscalationChain', run: c => c.getEscalationChain(1), method: 'GET', path: '/setting/alert/chains/1' },
  { name: 'createEscalationChain', run: c => c.createEscalationChain({}), method: 'POST', path: '/setting/alert/chains' },
  { name: 'updateEscalationChain', run: c => c.updateEscalationChain(1, {}), method: 'PATCH', path: '/setting/alert/chains/1' },
  { name: 'deleteEscalationChain', run: c => c.deleteEscalationChain(1), method: 'DELETE', path: '/setting/alert/chains/1' },
  { name: 'getRecipientGroup', run: c => c.getRecipientGroup(1), method: 'GET', path: '/setting/recipientgroups/1' },
  { name: 'createRecipientGroup', run: c => c.createRecipientGroup({}), method: 'POST', path: '/setting/recipientgroups' },
  { name: 'updateRecipientGroup', run: c => c.updateRecipientGroup(1, {}), method: 'PATCH', path: '/setting/recipientgroups/1' },
  { name: 'deleteRecipientGroup', run: c => c.deleteRecipientGroup(1), method: 'DELETE', path: '/setting/recipientgroups/1' },

  // Property Rules
  { name: 'getPropertyRule', run: c => c.getPropertyRule(1), method: 'GET', path: '/setting/propertyrules/1' },
  { name: 'createPropertyRule', run: c => c.createPropertyRule({}), method: 'POST', path: '/setting/propertyrules' },
  { name: 'updatePropertyRule', run: c => c.updatePropertyRule(1, {}), method: 'PATCH', path: '/setting/propertyrules/1' },
  { name: 'deletePropertyRule', run: c => c.deletePropertyRule(1), method: 'DELETE', path: '/setting/propertyrules/1' },
  { name: 'importPropertyRule', run: c => c.importPropertyRule('{}'), method: 'POST', path: '/setting/propertyrules/importjson' },

  // LogSources & log pipelines
  { name: 'getLogSource', run: c => c.getLogSource(1), method: 'GET', path: '/setting/logsources/1' },
  { name: 'createLogSource', run: c => c.createLogSource({}), method: 'POST', path: '/setting/logsources' },
  { name: 'updateLogSource', run: c => c.updateLogSource(1, {}), method: 'PATCH', path: '/setting/logsources/1' },
  { name: 'deleteLogSource', run: c => c.deleteLogSource(1), method: 'DELETE', path: '/setting/logsources/1' },
  { name: 'importLogSource', run: c => c.importLogSource('{}'), method: 'POST', path: '/setting/logsources/importjson' },
  { name: 'getLogAlertGroup', run: c => c.getLogAlertGroup(1), method: 'GET', path: '/logpipelines/1' },
  { name: 'createLogAlertGroup', run: c => c.createLogAlertGroup({}), method: 'POST', path: '/logpipelines' },
  { name: 'updateLogAlertGroup', run: c => c.updateLogAlertGroup(1, {}), method: 'PATCH', path: '/logpipelines/1' },
  { name: 'deleteLogAlertGroup', run: c => c.deleteLogAlertGroup(1), method: 'DELETE', path: '/logpipelines/1' },
  { name: 'getLogAlert', run: c => c.getLogAlert(1), method: 'GET', path: '/logpipelines/processors/1' },
  { name: 'createLogAlert', run: c => c.createLogAlert({}), method: 'POST', path: '/logpipelines/processors' },
  { name: 'updateLogAlert', run: c => c.updateLogAlert(1, {}), method: 'PATCH', path: '/logpipelines/processors/1' },
  { name: 'deleteLogAlert', run: c => c.deleteLogAlert(1), method: 'DELETE', path: '/logpipelines/processors/1' },
  { name: 'setLogAlertStatus', run: c => c.setLogAlertStatus(1, 'enable'), method: 'PUT', path: '/logpipelines/processors/1/enable' },
  { name: 'getLogQueryGroup', run: c => c.getLogQueryGroup(1), method: 'GET', path: '/log/logquerygroups/1' },
  { name: 'createLogQueryGroup', run: c => c.createLogQueryGroup({}), method: 'POST', path: '/log/logquerygroups' },
  { name: 'updateLogQueryGroup', run: c => c.updateLogQueryGroup(1, {}), method: 'PATCH', path: '/log/logquerygroups/1' },
  { name: 'deleteLogQueryGroup', run: c => c.deleteLogQueryGroup(1), method: 'DELETE', path: '/log/logquerygroups/1' },
  { name: 'listLogQueryGroupsByType', run: c => c.listLogQueryGroupsByType('foo'), method: 'GET', path: '/log/logquerygroups/grouptype/foo' },
  { name: 'moveLogQueries', run: c => c.moveLogQueries(1, {}), method: 'POST', path: '/log/logquerygroups/1/move' },
  { name: 'getLogPartition', run: c => c.getLogPartition(1), method: 'GET', path: '/log/partitions/1' },
  { name: 'createLogPartition', run: c => c.createLogPartition({}), method: 'POST', path: '/log/partitions' },
  { name: 'updateLogPartition', run: c => c.updateLogPartition(1, {}), method: 'PATCH', path: '/log/partitions/1' },
  { name: 'deleteLogPartition', run: c => c.deleteLogPartition(1), method: 'DELETE', path: '/log/partitions/1' },
  { name: 'getLogPartitionRetentions', run: c => c.getLogPartitionRetentions(), method: 'GET', path: '/log/partitions/retentions' },
  { name: 'logPartitionAction', run: c => c.logPartitionAction(1, 'rotate'), method: 'POST', path: '/log/partitions/1/rotate' },
  { name: 'getTrackedQueryGroup', run: c => c.getTrackedQueryGroup(1), method: 'GET', path: '/trackedquerygroups/1' },
  { name: 'createTrackedQueryGroup', run: c => c.createTrackedQueryGroup({}), method: 'POST', path: '/trackedquerygroups' },
  { name: 'updateTrackedQueryGroup', run: c => c.updateTrackedQueryGroup(1, {}), method: 'PATCH', path: '/trackedquerygroups/1' },
  { name: 'deleteTrackedQueryGroup', run: c => c.deleteTrackedQueryGroup(1), method: 'DELETE', path: '/trackedquerygroups/1' },

  // OpsNotes
  { name: 'getOpsNote', run: c => c.getOpsNote('o1'), method: 'GET', path: '/setting/opsnotes/o1' },
  { name: 'createOpsNote', run: c => c.createOpsNote({}), method: 'POST', path: '/setting/opsnotes' },
  { name: 'updateOpsNote', run: c => c.updateOpsNote('o1', {}), method: 'PATCH', path: '/setting/opsnotes/o1' },
  { name: 'deleteOpsNote', run: c => c.deleteOpsNote('o1'), method: 'DELETE', path: '/setting/opsnotes/o1' },

  // Services (biz_service devices)
  { name: 'getService', run: c => c.getService(1), method: 'GET', path: '/device/devices/1' },
  { name: 'createService', run: c => c.createService({}), method: 'POST', path: '/device/devices' },
  { name: 'updateService', run: c => c.updateService(1, {}), method: 'PATCH', path: '/device/devices/1' },
  { name: 'deleteService', run: c => c.deleteService(1), method: 'DELETE', path: '/device/devices/1' },
  { name: 'getServiceGroup', run: c => c.getServiceGroup(1), method: 'GET', path: '/device/groups/1' },
  { name: 'createServiceGroup', run: c => c.createServiceGroup({}), method: 'POST', path: '/device/groups' },
  { name: 'updateServiceGroup', run: c => c.updateServiceGroup(1, {}), method: 'PATCH', path: '/device/groups/1' },
  { name: 'deleteServiceGroup', run: c => c.deleteServiceGroup(1), method: 'DELETE', path: '/device/groups/1' },

  // Job Monitors
  { name: 'getJobMonitor', run: c => c.getJobMonitor(1), method: 'GET', path: '/setting/batchjobs/1' },
  { name: 'createJobMonitor', run: c => c.createJobMonitor({}), method: 'POST', path: '/setting/batchjobs' },
  { name: 'updateJobMonitor', run: c => c.updateJobMonitor(1, {}), method: 'PATCH', path: '/setting/batchjobs/1' },
  { name: 'deleteJobMonitor', run: c => c.deleteJobMonitor(1), method: 'DELETE', path: '/setting/batchjobs/1' },
  { name: 'importJobMonitor (json)', run: c => c.importJobMonitor('{}', 'json'), method: 'POST', path: '/setting/batchjobs/importjson' },

  // Diagnostics & Remediation
  { name: 'getDiagnosticSource', run: c => c.getDiagnosticSource(1), method: 'GET', path: '/setting/diagnosticsources/1' },
  { name: 'createDiagnosticSource', run: c => c.createDiagnosticSource({}), method: 'POST', path: '/setting/diagnosticsources' },
  { name: 'updateDiagnosticSource', run: c => c.updateDiagnosticSource(1, {}), method: 'PATCH', path: '/setting/diagnosticsources/1' },
  { name: 'deleteDiagnosticSource', run: c => c.deleteDiagnosticSource(1), method: 'DELETE', path: '/setting/diagnosticsources/1' },
  { name: 'importDiagnosticSource', run: c => c.importDiagnosticSource('{}'), method: 'POST', path: '/setting/diagnosticsources/importjson' },
  { name: 'executeDiagnosticSource', run: c => c.executeDiagnosticSource({}), method: 'POST', path: '/setting/diagnosticsources/executemanually' },
  { name: 'getRemediationSource', run: c => c.getRemediationSource(1), method: 'GET', path: '/setting/remediationsources/1' },
  { name: 'createRemediationSource', run: c => c.createRemediationSource({}), method: 'POST', path: '/setting/remediationsources' },
  { name: 'updateRemediationSource', run: c => c.updateRemediationSource(1, {}), method: 'PATCH', path: '/setting/remediationsources/1' },
  { name: 'deleteRemediationSource', run: c => c.deleteRemediationSource(1), method: 'DELETE', path: '/setting/remediationsources/1' },
  { name: 'executeRemediation', run: c => c.executeRemediation({}), method: 'POST', path: '/setting/remediationsources/executemanually' },
  { name: 'getDiagnosticRemediationSources', run: c => c.getDiagnosticRemediationSources(), method: 'GET', path: '/setting/diagnosticRemediation/list' },
  { name: 'getDiagnosticRemediationResults', run: c => c.getDiagnosticRemediationResults(), method: 'GET', path: '/setting/diagnosticRemediation/executionResults' },

  // LogicModules (functions / OIDs)
  { name: 'getAppliesToFunction', run: c => c.getAppliesToFunction(1), method: 'GET', path: '/setting/functions/1' },
  { name: 'createAppliesToFunction', run: c => c.createAppliesToFunction({}), method: 'POST', path: '/setting/functions' },
  { name: 'updateAppliesToFunction', run: c => c.updateAppliesToFunction(1, {}), method: 'PATCH', path: '/setting/functions/1' },
  { name: 'deleteAppliesToFunction', run: c => c.deleteAppliesToFunction(1), method: 'DELETE', path: '/setting/functions/1' },
  { name: 'importAppliesToFunction', run: c => c.importAppliesToFunction('{}'), method: 'POST', path: '/setting/functions/importjson' },
  { name: 'getOID', run: c => c.getOID(1), method: 'GET', path: '/setting/oids/1' },
  { name: 'createOID', run: c => c.createOID({}), method: 'POST', path: '/setting/oids' },
  { name: 'updateOID', run: c => c.updateOID(1, {}), method: 'PATCH', path: '/setting/oids/1' },
  { name: 'deleteOID', run: c => c.deleteOID(1), method: 'DELETE', path: '/setting/oids/1' },
  { name: 'importOID', run: c => c.importOID('{}'), method: 'POST', path: '/setting/oids/importjson' },
  { name: 'getLogicModuleMetadata', run: c => c.getLogicModuleMetadata(), method: 'GET', path: '/setting/logicmodules/metadata' },

  // Topology
  { name: 'getTopologySource', run: c => c.getTopologySource(1), method: 'GET', path: '/setting/topologysources/1' },
  { name: 'createTopologySource', run: c => c.createTopologySource({}), method: 'POST', path: '/setting/topologysources' },
  { name: 'updateTopologySource', run: c => c.updateTopologySource(1, {}), method: 'PATCH', path: '/setting/topologysources/1' },
  { name: 'deleteTopologySource', run: c => c.deleteTopologySource(1), method: 'DELETE', path: '/setting/topologysources/1' },
  { name: 'importTopologySource', run: c => c.importTopologySource('{}'), method: 'POST', path: '/setting/topologysources/importjson' },
  { name: 'getTopology', run: c => c.getTopology(1), method: 'GET', path: '/topology/topologies/1/data' },

  // Cloud onboarding
  { name: 'getAwsAccountId', run: c => c.getAwsAccountId(), method: 'GET', path: '/aws/accountId' },
  { name: 'getAwsExternalId', run: c => c.getAwsExternalId(), method: 'GET', path: '/aws/externalId' },
  { name: 'testAwsAccount', run: c => c.testAwsAccount({}), method: 'POST', path: '/aws/functions/testAccount' },
  { name: 'verifyAwsBillingPermissions', run: c => c.verifyAwsBillingPermissions({}), method: 'POST', path: '/aws/functions/verifyBillingPermissions' },
  { name: 'discoverAzureSubscriptions', run: c => c.discoverAzureSubscriptions({}), method: 'POST', path: '/azure/functions/discoverSubscriptions' },
  { name: 'testAzureAccount', run: c => c.testAzureAccount({}), method: 'POST', path: '/azure/functions/testAccount' },
  { name: 'verifyAzureStoragePermissions', run: c => c.verifyAzureStoragePermissions({}), method: 'POST', path: '/azure/functions/verifyStorageAccountsPermissions' },
  { name: 'testGcpAccount', run: c => c.testGcpAccount({}), method: 'POST', path: '/gcp/functions/testAccount' },
  { name: 'testSaaSAccount', run: c => c.testSaaSAccount({}), method: 'POST', path: '/saas/functions/testAccount' },

  // Integrations
  { name: 'getIntegrationAuditLogs', run: c => c.getIntegrationAuditLogs(), method: 'GET', path: '/setting/integrations/auditlogs' },
  { name: 'getIntegration', run: c => c.getIntegration(1), method: 'GET', path: '/setting/integrations/1' },
  { name: 'createIntegration', run: c => c.createIntegration({}), method: 'POST', path: '/setting/integrations' },
  { name: 'updateIntegration', run: c => c.updateIntegration(1, {}), method: 'PATCH', path: '/setting/integrations/1' },
  { name: 'deleteIntegration', run: c => c.deleteIntegration(1), method: 'DELETE', path: '/setting/integrations/1' },

  // Misc
  { name: 'getContractInfo', run: c => c.getContractInfo(), method: 'GET', path: '/usage/contractInfo' },
  { name: 'addDNSMapping', run: c => c.addDNSMapping({}), method: 'POST', path: '/setting/dnsmappings' },

  // Netscans
  { name: 'getNetscan', run: c => c.getNetscan(1), method: 'GET', path: '/setting/netscans/1' },
  { name: 'createNetscan', run: c => c.createNetscan({}), method: 'POST', path: '/setting/netscans' },
  { name: 'updateNetscan', run: c => c.updateNetscan(1, {}), method: 'PATCH', path: '/setting/netscans/1' },
  { name: 'deleteNetscan', run: c => c.deleteNetscan(1), method: 'DELETE', path: '/setting/netscans/1' },

  // Cost Optimization
  { name: 'listCostOptimizationRecommendations', run: c => c.listCostOptimizationRecommendations(), method: 'GET', path: '/cost-optimization/recommendations' },
  { name: 'getCostOptimizationRecommendation', run: c => c.getCostOptimizationRecommendation('r1'), method: 'GET', path: '/cost-optimization/recommendations/r1' },
  { name: 'listCostOptimizationRecommendationCategories', run: c => c.listCostOptimizationRecommendationCategories(), method: 'GET', path: '/cost-optimization/recommendations/categories' },
];

describe('LM client domain methods issue the expected request', () => {
  describe.each(cases)('$name', ({ run, method, path }) => {
    it(`issues ${'$method'} ${'$path'}`, async () => {
      const client = makeClient();
      await run(client);
      const req = lastRequest();
      expect(req.method).toBe(method);
      expect(req.url.pathname).toBe(`${BASE}${path}`);
    });
  });
});

// List endpoints support an `autoPaginate` flag that switches the implementation
// between a single `request` and the `paginateAll` fan-out helper. Both branches
// should target the same REST path.
type ListCase = {
  name: string;
  run: (c: LogicMonitorClient, autoPaginate: boolean) => Promise<unknown>;
  path: string;
};

const listCases: ListCase[] = [
  { name: 'listResources', run: (c, ap) => c.listResources({ autoPaginate: ap }), path: '/device/devices' },
  { name: 'listDeviceProperties', run: (c, ap) => c.listDeviceProperties(1, { autoPaginate: ap }), path: '/device/devices/1/properties' },
  { name: 'listUnmonitoredDevices', run: (c, ap) => c.listUnmonitoredDevices({ autoPaginate: ap }), path: '/device/unmonitoreddevices' },
  { name: 'listDeviceGroups', run: (c, ap) => c.listDeviceGroups({ autoPaginate: ap }), path: '/device/groups' },
  { name: 'listDeviceGroupProperties', run: (c, ap) => c.listDeviceGroupProperties(1, { autoPaginate: ap }), path: '/device/groups/1/properties' },
  { name: 'listDeviceGroupClusterAlertConfs', run: (c, ap) => c.listDeviceGroupClusterAlertConfs(1, { autoPaginate: ap }), path: '/device/groups/1/clusterAlertConf' },
  { name: 'listDeviceGroupDatasources', run: (c, ap) => c.listDeviceGroupDatasources(1, { autoPaginate: ap }), path: '/device/groups/1/datasources' },
  { name: 'listDeviceGroupAlerts', run: (c, ap) => c.listDeviceGroupAlerts(1, { autoPaginate: ap }), path: '/device/groups/1/alerts' },
  { name: 'listDeviceGroupSDTs', run: (c, ap) => c.listDeviceGroupSDTs(1, { autoPaginate: ap }), path: '/device/groups/1/sdts' },
  { name: 'getDeviceGroupSDTHistory', run: (c, ap) => c.getDeviceGroupSDTHistory(1, { autoPaginate: ap }), path: '/device/groups/1/historysdts' },
  { name: 'listAlerts', run: (c, ap) => c.listAlerts({ autoPaginate: ap }), path: '/alert/alerts' },
  { name: 'listAlertRules', run: (c, ap) => c.listAlertRules({ autoPaginate: ap }), path: '/setting/alert/rules' },
  { name: 'listActionChains', run: (c, ap) => c.listActionChains({ autoPaginate: ap }), path: '/setting/action/chains' },
  { name: 'listActionRules', run: (c, ap) => c.listActionRules({ autoPaginate: ap }), path: '/setting/action/rules' },
  { name: 'listCollectors', run: (c, ap) => c.listCollectors({ autoPaginate: ap }), path: '/setting/collector/collectors' },
  { name: 'listCollectorGroups', run: (c, ap) => c.listCollectorGroups({ autoPaginate: ap }), path: '/setting/collector/groups' },
  { name: 'listDataSources', run: (c, ap) => c.listDataSources({ autoPaginate: ap }), path: '/setting/datasources' },
  { name: 'listDeviceDataSources', run: (c, ap) => c.listDeviceDataSources(1, { autoPaginate: ap }), path: '/device/devices/1/devicedatasources' },
  { name: 'listDeviceDataSourceInstances', run: (c, ap) => c.listDeviceDataSourceInstances(1, 2, { autoPaginate: ap }), path: '/device/devices/1/devicedatasources/2/instances' },
  { name: 'listDeviceDataSourceInstanceGroups', run: (c, ap) => c.listDeviceDataSourceInstanceGroups(1, 2, { autoPaginate: ap }), path: '/device/devices/1/devicedatasources/2/groups' },
  { name: 'listSDTs', run: (c, ap) => c.listSDTs({ autoPaginate: ap }), path: '/sdt/sdts' },
  { name: 'listDashboards', run: (c, ap) => c.listDashboards({ autoPaginate: ap }), path: '/dashboard/dashboards' },
  { name: 'listDashboardGroups', run: (c, ap) => c.listDashboardGroups({ autoPaginate: ap }), path: '/dashboard/groups' },
  { name: 'listWidgets', run: (c, ap) => c.listWidgets({ autoPaginate: ap }), path: '/dashboard/widgets' },
  { name: 'listDashboardWidgets', run: (c, ap) => c.listDashboardWidgets(1, { autoPaginate: ap }), path: '/dashboard/dashboards/1/widgets' },
  { name: 'listReports', run: (c, ap) => c.listReports({ autoPaginate: ap }), path: '/report/reports' },
  { name: 'listReportGroups', run: (c, ap) => c.listReportGroups({ autoPaginate: ap }), path: '/report/groups' },
  { name: 'listWebsites', run: (c, ap) => c.listWebsites({ autoPaginate: ap }), path: '/website/websites' },
  { name: 'listWebsiteGroups', run: (c, ap) => c.listWebsiteGroups({ autoPaginate: ap }), path: '/website/groups' },
  { name: 'listWebsiteGroupWebsites', run: (c, ap) => c.listWebsiteGroupWebsites(1, { autoPaginate: ap }), path: '/website/groups/1/websites' },
  { name: 'listWebsiteGroupSDTs', run: (c, ap) => c.listWebsiteGroupSDTs(1, { autoPaginate: ap }), path: '/website/groups/1/sdts' },
  { name: 'getWebsiteGroupSDTHistory', run: (c, ap) => c.getWebsiteGroupSDTHistory(1, { autoPaginate: ap }), path: '/website/groups/1/historysdts' },
  { name: 'getWebsiteSDTHistory', run: (c, ap) => c.getWebsiteSDTHistory(1, { autoPaginate: ap }), path: '/website/websites/1/historysdts' },
  { name: 'listUsers', run: (c, ap) => c.listUsers({ autoPaginate: ap }), path: '/setting/admins' },
  { name: 'listRoles', run: (c, ap) => c.listRoles({ autoPaginate: ap }), path: '/setting/roles' },
  { name: 'listApiTokens', run: (c, ap) => c.listApiTokens(1, { autoPaginate: ap }), path: '/setting/admins/1/apitokens' },
  { name: 'listConfigSources', run: (c, ap) => c.listConfigSources({ autoPaginate: ap }), path: '/setting/configsources' },
  { name: 'listAuditLogs', run: (c, ap) => c.listAuditLogs({ autoPaginate: ap }), path: '/setting/accesslogs' },
  { name: 'listAccessGroups', run: (c, ap) => c.listAccessGroups({ autoPaginate: ap }), path: '/setting/accessgroup' },
  { name: 'listEventSources', run: (c, ap) => c.listEventSources({ autoPaginate: ap }), path: '/setting/eventsources' },
  { name: 'listEscalationChains', run: (c, ap) => c.listEscalationChains({ autoPaginate: ap }), path: '/setting/alert/chains' },
  { name: 'listRecipientGroups', run: (c, ap) => c.listRecipientGroups({ autoPaginate: ap }), path: '/setting/recipientgroups' },
  { name: 'listPropertyRules', run: (c, ap) => c.listPropertyRules({ autoPaginate: ap }), path: '/setting/propertyrules' },
  { name: 'listLogSources', run: (c, ap) => c.listLogSources({ autoPaginate: ap }), path: '/setting/logsources' },
  { name: 'listLogAlertGroups', run: (c, ap) => c.listLogAlertGroups({ autoPaginate: ap }), path: '/logpipelines' },
  { name: 'listLogAlerts', run: (c, ap) => c.listLogAlerts({ autoPaginate: ap }), path: '/logpipelines/processors' },
  { name: 'listLogQueryGroups', run: (c, ap) => c.listLogQueryGroups({ autoPaginate: ap }), path: '/log/logquerygroups' },
  { name: 'listLogQueryGroupQueries', run: (c, ap) => c.listLogQueryGroupQueries(1, { autoPaginate: ap }), path: '/log/logquerygroups/1/logqueries' },
  { name: 'listLogPartitions', run: (c, ap) => c.listLogPartitions({ autoPaginate: ap }), path: '/log/partitions' },
  { name: 'listTrackedQueryGroups', run: (c, ap) => c.listTrackedQueryGroups({ autoPaginate: ap }), path: '/trackedquerygroups' },
  { name: 'listOpsNotes', run: (c, ap) => c.listOpsNotes({ autoPaginate: ap }), path: '/setting/opsnotes' },
  { name: 'listServices', run: (c, ap) => c.listServices({ autoPaginate: ap }), path: '/device/devices' },
  { name: 'listServiceGroups', run: (c, ap) => c.listServiceGroups({ autoPaginate: ap }), path: '/device/groups' },
  { name: 'listJobMonitors', run: (c, ap) => c.listJobMonitors({ autoPaginate: ap }), path: '/setting/batchjobs' },
  { name: 'listDiagnosticSources', run: (c, ap) => c.listDiagnosticSources({ autoPaginate: ap }), path: '/setting/diagnosticsources' },
  { name: 'listRemediationSources', run: (c, ap) => c.listRemediationSources({ autoPaginate: ap }), path: '/setting/remediationsources' },
  { name: 'listAppliesToFunctions', run: (c, ap) => c.listAppliesToFunctions({ autoPaginate: ap }), path: '/setting/functions' },
  { name: 'listOIDs', run: (c, ap) => c.listOIDs({ autoPaginate: ap }), path: '/setting/oids' },
  { name: 'listTopologySources', run: (c, ap) => c.listTopologySources({ autoPaginate: ap }), path: '/setting/topologysources' },
  { name: 'listTopologies', run: (c, ap) => c.listTopologies({ autoPaginate: ap }), path: '/topology/topologies' },
  { name: 'listIntegrations', run: (c, ap) => c.listIntegrations({ autoPaginate: ap }), path: '/setting/integrations' },
  { name: 'listNetscans', run: (c, ap) => c.listNetscans({ autoPaginate: ap }), path: '/setting/netscans' },
];

describe('LM client list endpoints', () => {
  describe.each(listCases)('$name', ({ run, path }) => {
    it('issues a single GET without autoPaginate', async () => {
      const client = makeClient();
      await run(client, false);
      const req = lastRequest();
      expect(req.method).toBe('GET');
      expect(req.url.pathname).toBe(`${BASE}${path}`);
    });

    it('fans out via paginateAll with autoPaginate', async () => {
      const client = makeClient();
      await run(client, true);
      const req = lastRequest();
      expect(req.method).toBe('GET');
      expect(req.url.pathname).toBe(`${BASE}${path}`);
      // paginateAll always requests with size/offset query params.
      expect(req.url.searchParams.has('size')).toBe(true);
      expect(req.url.searchParams.has('offset')).toBe(true);
    });
  });
});

describe('LM client link generators', () => {
  it('generateDashboardLink builds a uiv4 dashboard URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 7, name: 'd', groupId: 0 }));
    const result = await makeClient().generateDashboardLink(7);
    expect(result.url).toBe('https://test.logicmonitor.com/santaba/uiv4/dashboards/dashboards-7');
  });

  it('generateDashboardLink walks the group hierarchy', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 7, name: 'd', groupId: 10 }))
      .mockResolvedValueOnce(jsonResponse({ id: 10, name: 'child', parentId: 20 }))
      .mockResolvedValueOnce(jsonResponse({ id: 20, name: 'root', parentId: 0 }));
    const result = await makeClient().generateDashboardLink(7);
    expect(result.url).toBe(
      'https://test.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-20,dashboardGroups-10,dashboards-7',
    );
    expect(result.groupPath).toHaveLength(2);
  });

  it('generateDashboardLink throws when the dashboard is missing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await expect(makeClient().generateDashboardLink(7)).rejects.toMatchObject({ status: 404 });
  });

  it('generateResourceLink builds a uiv4 resource URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 5, displayName: 'host' }));
    const result = await makeClient().generateResourceLink(5);
    expect(result.url).toBe('https://test.logicmonitor.com/santaba/uiv4/resources/treeNodes/t-d,id-5?source=details');
  });

  it('generateResourceLink throws when the device is missing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await expect(makeClient().generateResourceLink(5)).rejects.toMatchObject({ status: 404 });
  });

  it('generateAlertLink builds a uiv4 alert URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'DS123' }));
    const result = await makeClient().generateAlertLink('DS123');
    expect(result.url).toBe('https://test.logicmonitor.com/santaba/uiv4/alerts/DS123');
  });

  it('generateWebsiteLink builds a uiv4 website URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 9, name: 'w', groupId: 0 }));
    const result = await makeClient().generateWebsiteLink(9);
    expect(result.url).toBe('https://test.logicmonitor.com/santaba/uiv4/websites/treeNodes#websites-9');
  });
});

describe('getCollectorInstallerUrl', () => {
  it('builds an installer URL with normalized OS/arch and query params', () => {
    const result = makeClient().getCollectorInstallerUrl(3, 'Windows 64', { collectorVersion: 33001 });
    expect(result.osAndArch).toBe('win64');
    expect(result.url).toContain('/setting/collector/collectors/3/installers/win64');
    expect(result.url).toContain('collectorVersion=33001');
    expect(result.downloadInstructions).toContain('.exe');
  });

  it('normalizes linux variants', () => {
    const result = makeClient().getCollectorInstallerUrl(3, 'linux_64');
    expect(result.osAndArch).toBe('linux64');
    expect(result.downloadInstructions).toContain('.bin');
  });

  it('throws when osAndArch is missing', () => {
    expect(() => makeClient().getCollectorInstallerUrl(3, '')).toThrow(/osAndArch/);
  });
});
