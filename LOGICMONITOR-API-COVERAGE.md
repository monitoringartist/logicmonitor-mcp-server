# LogicMonitor API Coverage Analysis

**API Specification:** [LogicMonitor Swagger v3](https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json)  
**Method:** Every operation in the Swagger spec is mapped to an implemented MCP tool (by endpoint + HTTP verb). "Missing" rows below are the exact operations still needed for 100% coverage.

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total API Operations** | 393 |
| **Operations Covered** | 235 |
| **Operations Missing** | 158 |
| **Coverage** | **60%** |
| **Implemented MCP Tools** | 221 (+4 custom link tools) |

> **How to read this doc:** Start with [What's Still Missing](#-whats-still-missing-prioritized) for the prioritized backlog, then jump to [Gap Detail by Category](#-gap-detail-by-category) for the exact operations and proposed tools. [Fully Covered Areas](#-fully-covered-areas) lists what's already done.

---

## 📊 Coverage at a Glance

| Category | Covered | Total | Status |
|----------|:-------:|:-----:|:------:|
| Log Pipelines / Log Alerts | 0 | 13 | ❌ None |
| Log Query Groups | 0 | 9 | ❌ None |
| DiagnosticSources | 0 | 8 | ❌ None |
| Job Monitors (BatchJobs) | 0 | 8 | ❌ None |
| Log Partitions | 0 | 8 | ❌ None |
| AppliesTo Functions | 0 | 7 | ❌ None |
| RemediationSources | 0 | 7 | ❌ None |
| SNMP OIDs | 0 | 7 | ❌ None |
| Tracked Query Groups | 0 | 6 | ❌ None |
| AWS Cloud Onboarding | 0 | 4 | ❌ None |
| Azure Cloud Onboarding | 0 | 3 | ❌ None |
| Default Dashboard (user data) | 0 | 2 | ❌ None |
| Diagnostic Remediation | 0 | 2 | ❌ None |
| Metrics (Push/Usage) | 0 | 2 | ❌ None |
| API Usage Stats | 0 | 1 | ❌ None |
| Bulk Instance Data Fetch | 0 | 1 | ❌ None |
| Contract / Usage Info | 0 | 1 | ❌ None |
| DNS Mappings | 0 | 1 | ❌ None |
| GCP Cloud Onboarding | 0 | 1 | ❌ None |
| Instance Graph Data (by instance id) | 0 | 1 | ❌ None |
| Integration Audit Logs | 0 | 1 | ❌ None |
| LogicModule Metadata | 0 | 1 | ❌ None |
| SaaS Account | 0 | 1 | ❌ None |
| Unmonitored Devices | 0 | 1 | ❌ None |
| Device Groups — datasource alert settings, cluster, properties | 10 | 29 | 🟡 Partial |
| Collector Groups & Agent Log Levels | 11 | 21 | 🟡 Partial |
| Users & API Tokens (write) | 4 | 12 | 🟡 Partial |
| Website Groups (write) | 2 | 9 | 🟡 Partial |
| TopologySources (write) | 2 | 7 | 🟡 Partial |
| Roles (write) | 2 | 6 | 🟡 Partial |
| ConfigSource extras | 7 | 9 | 🟡 Partial |
| Report Execution | 6 | 8 | 🟡 Partial |
| Website extras | 11 | 13 | 🟡 Partial |
| Access Group Module Mapping | 6 | 7 | 🟡 Partial |
| Alerts | 4 | 5 | 🟡 Partial |
| EventSource extras | 7 | 8 | 🟡 Partial |
| Alert Automation — Action Chains & Rules | 14 | 14 | ✅ Full |
| Alert Rules & Escalation Chains | 12 | 12 | ✅ Full |
| Audit / Access Logs | 2 | 2 | ✅ Full |
| Collector Debug Commands | 2 | 2 | ✅ Full |
| Cost Optimization | 3 | 3 | ✅ Full |
| Dashboard Groups (write) | 7 | 7 | ✅ Full |
| Dashboard Widgets | 7 | 7 | ✅ Full |
| Dashboards | 7 | 7 | ✅ Full |
| DataSource Management (write/import) | 12 | 12 | ✅ Full |
| Devices — instances, alert settings, config & netflow | 52 | 52 | ✅ Full |
| LogSources | 7 | 7 | ✅ Full |
| NetScans | 6 | 6 | ✅ Full |
| Ops Notes | 6 | 6 | ✅ Full |
| PropertySources / Property Rules | 7 | 7 | ✅ Full |
| Recipient Groups | 6 | 6 | ✅ Full |
| Report Groups | 6 | 6 | ✅ Full |
| Scheduled Down Time (SDT) | 6 | 6 | ✅ Full |
| Website Checkpoints | 1 | 1 | ✅ Full |

---

## 🔴 What's Still Missing (Prioritized)

Grouped by impact. Each item links to its detailed operation list below.

### 🔴 HIGH Priority — 19 operations

*Core monitoring & configuration management — highest user value*

- **Device Groups — datasource alert settings, cluster, properties** — 19 missing. Tools to add: group datasource/alert-setting, cluster-alert, property CRUD tools
### 🟡 MEDIUM Priority — 75 operations

*Administration, automation modules, and infrastructure completeness*

- **Collector Groups & Agent Log Levels** — 10 missing. Tools to add: collector-group CRUD, agent-log-level, events/status tools
- **Job Monitors (BatchJobs)** — 8 missing. Tools to add: job-monitor CRUD + import tools
- **DiagnosticSources** — 8 missing. Tools to add: diagnostic-source CRUD + import + execute tools
- **Users & API Tokens (write)** — 8 missing. Tools to add: admin CRUD and API-token CRUD tools
- **AppliesTo Functions** — 7 missing. Tools to add: applies-to-function CRUD + import tools
- **SNMP OIDs** — 7 missing. Tools to add: oid CRUD + import tools
- **RemediationSources** — 7 missing. Tools to add: remediation-source CRUD + execute tools
- **Website Groups (write)** — 7 missing. Tools to add: website-group CRUD + SDT-list tools
- **TopologySources (write)** — 5 missing. Tools to add: topology-source CRUD + import tools
- **Roles (write)** — 4 missing. Tools to add: `create_role`, `update_role`, `delete_role`
- **Report Execution** — 2 missing. Tools to add: `generate_report`, `get_report_task_result`
- **Bulk Instance Data Fetch** — 1 missing. Tools to add: `fetch_instances_data`
- **Instance Graph Data (by instance id)** — 1 missing. Tools to add: `get_instance_graph_data`

### 🟢 LOW Priority — 64 operations

*Niche, cloud-onboarding, and rarely-scripted endpoints*

- **Log Pipelines / Log Alerts** — 13 missing. Tools to add: log-alert and log-alert-group CRUD tools
- **Log Query Groups** — 9 missing. Tools to add: log query group CRUD tools
- **Log Partitions** — 8 missing. Tools to add: log partition CRUD tools
- **Tracked Query Groups** — 6 missing. Tools to add: tracked-query-group CRUD tools
- **AWS Cloud Onboarding** — 4 missing. Tools to add: cloud account test/verify tools
- **Azure Cloud Onboarding** — 3 missing. Tools to add: cloud account test/verify tools
- **ConfigSource extras** — 2 missing. Tools to add: `get_configsource_update_reasons`, `import_configsource_json`
- **Website extras** — 2 missing. Tools to add: `get_website_sdt_history`, `get_website_graph_by_name`
- **Diagnostic Remediation** — 2 missing. Tools to add: diagnostic remediation listing tools
- **Metrics (Push/Usage)** — 2 missing. Tools to add: `get_metrics_summary`, `get_metrics_usage`
- **Default Dashboard (user data)** — 2 missing. Tools to add: `update_default_dashboard`
- **Alerts** — 1 missing. Tools to add: `escalate_alert`
- **Access Group Module Mapping** — 1 missing. Tools to add: `map_unmap_module_to_access_group`
- **Integration Audit Logs** — 1 missing. Tools to add: `get_integration_audit_logs`
- **GCP Cloud Onboarding** — 1 missing. Tools to add: `test_gcp_account`
- **API Usage Stats** — 1 missing. Tools to add: `get_external_api_stats`
- **LogicModule Metadata** — 1 missing. Tools to add: `get_logicmodule_metadata`
- **Unmonitored Devices** — 1 missing. Tools to add: `list_unmonitored_devices`
- **EventSource extras** — 1 missing. Tools to add: `import_eventsource_json`
- **Contract / Usage Info** — 1 missing. Tools to add: `get_contract_info`
- **DNS Mappings** — 1 missing. Tools to add: `add_dns_mapping`
- **SaaS Account** — 1 missing. Tools to add: `test_saas_account`

---

## 🔍 Gap Detail by Category

Only operations **not yet implemented** are listed. Categories that are 100% covered are in [Fully Covered Areas](#-fully-covered-areas).

### 🔴 Device Groups — datasource alert settings, cluster, properties

**Coverage:** 10/29 operations.  **Proposed tools:** group datasource/alert-setting, cluster-alert, property CRUD tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteDeviceGroupClusterAlertConfById` | `/device/groups/{deviceGroupId}/clusterAlertConf/{id}` |
| `DELETE` | `deleteDeviceGroupPropertyByName` | `/device/groups/{gid}/properties/{name}` |
| `GET` | `getAlertListByDeviceGroupId` | `/device/groups/{id}/alerts` |
| `GET` | `getDeviceGroupClusterAlertConfById` | `/device/groups/{deviceGroupId}/clusterAlertConf/{id}` |
| `GET` | `getDeviceGroupClusterAlertConfList` | `/device/groups/{deviceGroupId}/clusterAlertConf` |
| `GET` | `getDeviceGroupDatasourceAlertSetting` | `/device/groups/{deviceGroupId}/datasources/{dsId}/alertsettings` |
| `GET` | `getDeviceGroupDatasourceById` | `/device/groups/{deviceGroupId}/datasources/{id}` |
| `GET` | `getDeviceGroupDatasourceList` | `/device/groups/{deviceGroupId}/datasources` |
| `GET` | `getDeviceGroupSDTList` | `/device/groups/{id}/sdts` |
| `GET` | `getSDTHistoryByDeviceGroupId` | `/device/groups/{id}/historysdts` |
| `PATCH` | `patchDeviceGroupClusterAlertConfById` | `/device/groups/{deviceGroupId}/clusterAlertConf/{id}` |
| `PATCH` | `patchDeviceGroupDatasourceAlertSetting` | `/device/groups/{deviceGroupId}/datasources/{dsId}/alertsettings` |
| `PATCH` | `patchDeviceGroupDatasourceById` | `/device/groups/{deviceGroupId}/datasources/{id}` |
| `PATCH` | `patchDeviceGroupPropertyByName` | `/device/groups/{gid}/properties/{name}` |
| `POST` | `addDeviceGroupClusterAlertConf` | `/device/groups/{deviceGroupId}/clusterAlertConf` |
| `POST` | `addDeviceGroupProperty` | `/device/groups/{gid}/properties` |
| `PUT` | `updateDeviceGroupClusterAlertConfById` | `/device/groups/{deviceGroupId}/clusterAlertConf/{id}` |
| `PUT` | `updateDeviceGroupDatasourceAlertSetting` | `/device/groups/{deviceGroupId}/datasources/{dsId}/alertsettings` |
| `PUT` | `updateDeviceGroupDatasourceById` | `/device/groups/{deviceGroupId}/datasources/{id}` |

### 🟡 Collector Groups & Agent Log Levels

**Coverage:** 11/21 operations.  **Proposed tools:** collector-group CRUD, agent-log-level, events/status tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteCollectorGroupById` | `/setting/collector/groups/{id}` |
| `GET` | `getCollectorAgentLogLevelByComponent` | `/setting/collector/collectors/{id}/agentloglevels/{component}` |
| `GET` | `getCollectorAgentLogLevels` | `/setting/collector/collectors/{id}/agentloglevels` |
| `GET` | `getCollectorEvents` | `/setting/collector/collectors/{collectorId}/events` |
| `GET` | `getCollectorStatusCheck` | `/setting/collector/collectors/{collectorId}/services/getStatusCheck` |
| `PATCH` | `patchCollectorAgentLogLevel` | `/setting/collector/collectors/{id}/agentloglevels/{component}` |
| `PATCH` | `patchCollectorGroupById` | `/setting/collector/groups/{id}` |
| `POST` | `addCollectorGroup` | `/setting/collector/groups` |
| `PUT` | `updateCollectorAgentLogLevel` | `/setting/collector/collectors/{id}/agentloglevels/{component}` |
| `PUT` | `updateCollectorGroupById` | `/setting/collector/groups/{id}` |

### 🟡 Job Monitors (BatchJobs)

**Coverage:** 0/8 operations.  **Proposed tools:** job-monitor CRUD + import tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteJobMonitor` | `/setting/batchjobs/{id}` |
| `GET` | `getJobMonitorById` | `/setting/batchjobs/{id}` |
| `GET` | `getJobMonitorList` | `/setting/batchjobs` |
| `PATCH` | `patchJobMonitor` | `/setting/batchjobs/{id}` |
| `POST` | `addJobMonitor` | `/setting/batchjobs` |
| `POST` | `importBatchJob` | `/setting/batchjobs/importxml` |
| `POST` | `importJobMonitorJson` | `/setting/batchjobs/importjson` |
| `PUT` | `updateJobMonitor` | `/setting/batchjobs/{id}` |

### 🟡 DiagnosticSources

**Coverage:** 0/8 operations.  **Proposed tools:** diagnostic-source CRUD + import + execute tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteDiagnosticSourceById` | `/setting/diagnosticsources/{id}` |
| `GET` | `getDiagnosticSourcesById` | `/setting/diagnosticsources/{id}` |
| `GET` | `getDiagnosticSourcesList` | `/setting/diagnosticsources` |
| `PATCH` | `patchDiagnosticSourceById` | `/setting/diagnosticsources/{id}` |
| `POST` | `addDiagnosticSource` | `/setting/diagnosticsources` |
| `POST` | `executeDiagnosticsManually` | `/setting/diagnosticsources/executemanually` |
| `POST` | `importDiagnosticSourceJson` | `/setting/diagnosticsources/importjson` |
| `PUT` | `updateDiagnosticSourceById` | `/setting/diagnosticsources/{id}` |

### 🟡 Users & API Tokens (write)

**Coverage:** 4/12 operations.  **Proposed tools:** admin CRUD and API-token CRUD tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteAdminById` | `/setting/admins/{id}` |
| `DELETE` | `deleteApiTokenById` | `/setting/admins/{adminId}/apitokens/{apitokenId}` |
| `PATCH` | `patchAdminById` | `/setting/admins/{id}` |
| `PATCH` | `patchApiTokenByAdminId` | `/setting/admins/{adminId}/apitokens/{apitokenId}` |
| `POST` | `addAdmin` | `/setting/admins` |
| `POST` | `addApiTokenByAdminId` | `/setting/admins/{adminId}/apitokens` |
| `PUT` | `updateAdminById` | `/setting/admins/{id}` |
| `PUT` | `updateApiTokenByAdminId` | `/setting/admins/{adminId}/apitokens/{apitokenId}` |

### 🟡 AppliesTo Functions

**Coverage:** 0/7 operations.  **Proposed tools:** applies-to-function CRUD + import tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteAppliesToFunctionById` | `/setting/functions/{id}` |
| `GET` | `getAppliesToFunctionById` | `/setting/functions/{id}` |
| `GET` | `getAppliesToFunctionList` | `/setting/functions` |
| `PATCH` | `patchAppliesToFunction` | `/setting/functions/{id}` |
| `POST` | `addAppliesToFunction` | `/setting/functions` |
| `POST` | `importAppliesToFunctionJson` | `/setting/functions/importjson` |
| `PUT` | `updateAppliesToFunction` | `/setting/functions/{id}` |

### 🟡 SNMP OIDs

**Coverage:** 0/7 operations.  **Proposed tools:** oid CRUD + import tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteOID` | `/setting/oids/{id}` |
| `GET` | `getOIDList` | `/setting/oids` |
| `GET` | `getOidById` | `/setting/oids/{id}` |
| `PATCH` | `patchOID` | `/setting/oids/{id}` |
| `POST` | `addOid` | `/setting/oids` |
| `POST` | `importOidJson` | `/setting/oids/importjson` |
| `PUT` | `updateOID` | `/setting/oids/{id}` |

### 🟡 RemediationSources

**Coverage:** 0/7 operations.  **Proposed tools:** remediation-source CRUD + execute tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteRemediationSourceById` | `/setting/remediationsources/{id}` |
| `GET` | `getRemediationSourcesById` | `/setting/remediationsources/{id}` |
| `GET` | `getRemediationSourcesList` | `/setting/remediationsources` |
| `PATCH` | `patchRemediationSourceById` | `/setting/remediationsources/{id}` |
| `POST` | `addRemediationSource` | `/setting/remediationsources` |
| `POST` | `executeRemediationManually` | `/setting/remediationsources/executemanually` |
| `PUT` | `updateRemediationSourceById` | `/setting/remediationsources/{id}` |

### 🟡 Website Groups (write)

**Coverage:** 2/9 operations.  **Proposed tools:** website-group CRUD + SDT-list tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteWebsiteGroupById` | `/website/groups/{id}` |
| `GET` | `getAllSDTListByWebsiteGroupId` | `/website/groups/{id}/sdts` |
| `GET` | `getImmediateWebsiteListByWebsiteGroupId` | `/website/groups/{id}/websites` |
| `GET` | `getSDTHistoryByWebsiteGroupId` | `/website/groups/{id}/historysdts` |
| `PATCH` | `patchWebsiteGroupById` | `/website/groups/{id}` |
| `POST` | `addWebsiteGroup` | `/website/groups` |
| `PUT` | `updateWebsiteGroupById` | `/website/groups/{id}` |

### 🟡 TopologySources (write)

**Coverage:** 2/7 operations.  **Proposed tools:** topology-source CRUD + import tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteTopologySource` | `/setting/topologysources/{id}` |
| `PATCH` | `patchTopologySource` | `/setting/topologysources/{id}` |
| `POST` | `addTopologySource` | `/setting/topologysources` |
| `POST` | `importTopologySourceJson` | `/setting/topologysources/importjson` |
| `PUT` | `updateTopologySource` | `/setting/topologysources/{id}` |

### 🟡 Roles (write)

**Coverage:** 2/6 operations.  **Proposed tools:** `create_role`, `update_role`, `delete_role`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteRoleById` | `/setting/roles/{id}` |
| `PATCH` | `patchRoleById` | `/setting/roles/{id}` |
| `POST` | `addRole` | `/setting/roles` |
| `PUT` | `updateRoleById` | `/setting/roles/{id}` |

### 🟡 Report Execution

**Coverage:** 6/8 operations.  **Proposed tools:** `generate_report`, `get_report_task_result`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `fetchReportUsingTaskId` | `/report/reports/{id}/tasks/{taskId}` |
| `POST` | `generateReportById` | `/report/reports/{id}/executions` |

### 🟡 Bulk Instance Data Fetch

**Coverage:** 0/1 operations.  **Proposed tools:** `fetch_instances_data`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `fetchDeviceInstancesData` | `/device/instances/datafetch` |

### 🟡 Instance Graph Data (by instance id)

**Coverage:** 0/1 operations.  **Proposed tools:** `get_instance_graph_data`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getDeviceInstanceGraphDataOnlyByInstanceId` | `/device/devicedatasourceinstances/{instanceId}/graphs/{graphId}/data` |

### 🟢 Log Pipelines / Log Alerts

**Coverage:** 0/13 operations.  **Proposed tools:** log-alert and log-alert-group CRUD tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteLogAlertGroup` | `/logpipelines/{pipelineId}` |
| `DELETE` | `deleteLogAlertsById` | `/logpipelines/processors/{processorId}` |
| `GET` | `getLogAlertGroupById` | `/logpipelines/{pipelineId}` |
| `GET` | `getLogAlertGroupsList` | `/logpipelines` |
| `GET` | `getLogAlerts` | `/logpipelines/processors` |
| `GET` | `getLogAlertsById` | `/logpipelines/processors/{processorId}` |
| `PATCH` | `patchLogAlertGroup` | `/logpipelines/{pipelineId}` |
| `PATCH` | `patchLogAlerts` | `/logpipelines/processors/{processorId}` |
| `POST` | `addLogAlertGroup` | `/logpipelines` |
| `POST` | `addLogAlerts` | `/logpipelines/processors` |
| `PUT` | `updateDisableLogAlerts` | `/logpipelines/processors/{processorId}/{action}` |
| `PUT` | `updateLogAlertGroup` | `/logpipelines/{pipelineId}` |
| `PUT` | `updateLogAlerts` | `/logpipelines/processors/{processorId}` |

### 🟢 Log Query Groups

**Coverage:** 0/9 operations.  **Proposed tools:** log query group CRUD tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteLogQueryGroup` | `/log/logquerygroups/{id}` |
| `GET` | `getLogQueriesByGroupId` | `/log/logquerygroups/{id}/logqueries` |
| `GET` | `getLogQueryGroupById` | `/log/logquerygroups/{id}` |
| `GET` | `getLogQueryGroupList` | `/log/logquerygroups` |
| `GET` | `getLogQueryGroupListByGroupType` | `/log/logquerygroups/grouptype/{groupType}` |
| `PATCH` | `patchLogQueryGroup` | `/log/logquerygroups/{id}` |
| `POST` | `addLogQueryGroup` | `/log/logquerygroups` |
| `POST` | `moveLogQueries` | `/log/logquerygroups/{id}/move` |
| `PUT` | `updateLogQueryGroup` | `/log/logquerygroups/{id}` |

### 🟢 Log Partitions

**Coverage:** 0/8 operations.  **Proposed tools:** log partition CRUD tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteLogPartitionById` | `/log/partitions/{id}` |
| `GET` | `getAllLogPartitions` | `/log/partitions` |
| `GET` | `getPartitionById` | `/log/partitions/{id}` |
| `GET` | `getRetentionList` | `/log/partitions/retentions` |
| `PATCH` | `patchLogPartition` | `/log/partitions/{id}` |
| `POST` | `createLogPartition` | `/log/partitions` |
| `POST` | `partitionAction` | `/log/partitions/{id}/{action}` |
| `PUT` | `updateLogPartition` | `/log/partitions/{id}` |

### 🟢 Tracked Query Groups

**Coverage:** 0/6 operations.  **Proposed tools:** tracked-query-group CRUD tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `DELETE` | `deleteTrackedQueryGroup` | `/trackedquerygroups/{id}` |
| `GET` | `getTrackedQueryGroupById` | `/trackedquerygroups/{id}` |
| `GET` | `getTrackedQueryGroupList` | `/trackedquerygroups` |
| `PATCH` | `patchTrackedQueryGroup` | `/trackedquerygroups/{id}` |
| `POST` | `createTrackedQueryGroup` | `/trackedquerygroups` |
| `PUT` | `updateTrackedQueryGroup` | `/trackedquerygroups/{id}` |

### 🟢 AWS Cloud Onboarding

**Coverage:** 0/4 operations.  **Proposed tools:** cloud account test/verify tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getAwsAccountId` | `/aws/accountId` |
| `GET` | `getAwsExternalId` | `/aws/externalId` |
| `POST` | `testAWSAccount` | `/aws/functions/testAccount` |
| `POST` | `verifyAWSBillingPermissions` | `/aws/functions/verifyBillingPermissions` |

### 🟢 Azure Cloud Onboarding

**Coverage:** 0/3 operations.  **Proposed tools:** cloud account test/verify tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `discoverSubscriptions` | `/azure/functions/discoverSubscriptions` |
| `POST` | `testAzureAccount` | `/azure/functions/testAccount` |
| `POST` | `verifyStorageAccountsPermissions` | `/azure/functions/verifyStorageAccountsPermissions` |

### 🟢 ConfigSource extras

**Coverage:** 7/9 operations.  **Proposed tools:** `get_configsource_update_reasons`, `import_configsource_json`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getUpdateReasonListByConfigSourceId` | `/setting/configsources/{id}/updatereasons` |
| `POST` | `importConfigSourceJson` | `/setting/configsources/importjson` |

### 🟢 Website extras

**Coverage:** 11/13 operations.  **Proposed tools:** `get_website_sdt_history`, `get_website_graph_by_name`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getSDTHistoryByWebsiteId` | `/website/websites/{id}/historysdts` |
| `GET` | `getWebsiteDataByGraphName` | `/website/websites/{id}/graphs/{graphName}/data` |

### 🟢 Diagnostic Remediation

**Coverage:** 0/2 operations.  **Proposed tools:** diagnostic remediation listing tools

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getDiagnosticRemediationAssignedSources` | `/setting/diagnosticRemediation/list` |
| `GET` | `getDiagnosticRemediationExecutionResults` | `/setting/diagnosticRemediation/executionResults` |

### 🟢 Metrics (Push/Usage)

**Coverage:** 0/2 operations.  **Proposed tools:** `get_metrics_summary`, `get_metrics_usage`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getMetricsSummary` | `/metrics/summary` |
| `GET` | `getMetricsUsage` | `/metrics/usage` |

### 🟢 Default Dashboard (user data)

**Coverage:** 0/2 operations.  **Proposed tools:** `update_default_dashboard`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `PATCH` | `patchDefaultDashboard` | `/setting/userdata/{id}` |
| `PUT` | `updateDefaultDashboard` | `/setting/userdata/{id}` |

### 🟢 Alerts

**Coverage:** 4/5 operations.  **Proposed tools:** `escalate_alert`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `escalatedAlertById` | `/alert/alerts/{id}/escalate` |

### 🟢 Access Group Module Mapping

**Coverage:** 6/7 operations.  **Proposed tools:** `map_unmap_module_to_access_group`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `mapUnMapModuleToAccessGroup` | `/setting/accessgroup/mapunmap/modules` |

### 🟢 Integration Audit Logs

**Coverage:** 0/1 operations.  **Proposed tools:** `get_integration_audit_logs`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getIntegrationAuditLogs` | `/setting/integrations/auditlogs` |

### 🟢 GCP Cloud Onboarding

**Coverage:** 0/1 operations.  **Proposed tools:** `test_gcp_account`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `testGCPAccount` | `/gcp/functions/testAccount` |

### 🟢 API Usage Stats

**Coverage:** 0/1 operations.  **Proposed tools:** `get_external_api_stats`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getExternalApiStats` | `/apiStats/externalApis` |

### 🟢 LogicModule Metadata

**Coverage:** 0/1 operations.  **Proposed tools:** `get_logicmodule_metadata`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getV4Metadata` | `/setting/logicmodules/metadata` |

### 🟢 Unmonitored Devices

**Coverage:** 0/1 operations.  **Proposed tools:** `list_unmonitored_devices`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getUnmonitoredDeviceList` | `/device/unmonitoreddevices` |

### 🟢 EventSource extras

**Coverage:** 7/8 operations.  **Proposed tools:** `import_eventsource_json`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `importEventSourceJson` | `/setting/eventsources/importjson` |

### 🟢 Contract / Usage Info

**Coverage:** 0/1 operations.  **Proposed tools:** `get_contract_info`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `GET` | `getContractInfoByCompany` | `/usage/contractInfo` |

### 🟢 DNS Mappings

**Coverage:** 0/1 operations.  **Proposed tools:** `add_dns_mapping`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `addDNSMapping` | `/setting/dnsmappings` |

### 🟢 SaaS Account

**Coverage:** 0/1 operations.  **Proposed tools:** `test_saas_account`

| Method | Operation | Endpoint |
|--------|-----------|----------|
| `POST` | `testSaaSAccount` | `/saas/functions/testAccount` |

---

## ✅ Fully Covered Areas

These categories have every Swagger operation backed by an MCP tool:

- **Alert Automation — Action Chains & Rules** (14/14)
- **Alert Rules & Escalation Chains** (12/12)
- **Audit / Access Logs** (2/2)
- **Collector Debug Commands** (2/2)
- **Cost Optimization** (3/3)
- **Dashboard Groups (write)** (7/7)
- **Dashboard Widgets** (7/7)
- **Dashboards** (7/7)
- **DataSource Management (write/import)** (12/12)
- **Devices — instances, alert settings, config & netflow** (52/52)
- **LogSources** (7/7)
- **NetScans** (6/6)
- **Ops Notes** (6/6)
- **PropertySources / Property Rules** (7/7)
- **Recipient Groups** (6/6)
- **Report Groups** (6/6)
- **Scheduled Down Time (SDT)** (6/6)
- **Website Checkpoints** (1/1)

### Custom Enhancements (not in the official API)

Four link-generation helpers prevent AI assistants from guessing URLs:
`generate_dashboard_link`, `generate_resource_link`, `generate_alert_link`, `generate_website_link`.

---

## 🗺️ Roadmap to 100% Coverage

| Phase | Focus | Operations to add | Cumulative coverage |
|-------|-------|:-----------------:|:-------------------:|
| Current | — | — | 60% |
| Phase 1 (HIGH) | Core monitoring & config mgmt | +24 | 64% |
| Phase 2 (MEDIUM) | Admin, automation, infra | +77 | 84% |
| Phase 3 (LOW) | Cloud onboarding & niche | +64 | 100% |

---

## 🔬 Methodology

1. Parsed all operations from the LogicMonitor Swagger v3 spec.
2. Mapped each implemented MCP tool to its underlying endpoint + HTTP verb.
3. Marked every Swagger operation as covered/missing and grouped by resource category.
4. Assigned priority tiers by user value and scripting frequency.

*Coverage figures are computed directly from the spec (393 operations) against 235 covered operations.*
