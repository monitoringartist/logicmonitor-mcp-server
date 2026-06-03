# LogicMonitor API Coverage Analysis

**API Specification:** [LogicMonitor Swagger v3](https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json)  
**Method:** Every operation in the Swagger spec is mapped to an implemented MCP tool (by endpoint + HTTP verb). "Missing" rows below are the exact operations still needed for 100% coverage.

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total API Operations** | 393 |
| **Operations Covered** | 374 |
| **Operations Missing** | 19 |
| **Coverage** | **95%** |
| **Implemented MCP Tools** | 341 (+4 custom link tools) |

> **How to read this doc:** Start with [What's Still Missing](#-whats-still-missing-prioritized) for the prioritized backlog, then jump to [Gap Detail by Category](#-gap-detail-by-category) for the exact operations and proposed tools. [Fully Covered Areas](#-fully-covered-areas) lists what's already done.

---

## 📊 Coverage at a Glance

| Category | Covered | Total | Status |
|----------|:-------:|:-----:|:------:|
| Device Groups — datasource alert settings, cluster, properties | 10 | 29 | 🟡 Partial |
| Access Group Module Mapping | 7 | 7 | ✅ Full |
| Alert Automation — Action Chains & Rules | 14 | 14 | ✅ Full |
| Alert Rules & Escalation Chains | 12 | 12 | ✅ Full |
| Alerts | 5 | 5 | ✅ Full |
| API Usage Stats | 1 | 1 | ✅ Full |
| AppliesTo Functions | 7 | 7 | ✅ Full |
| Audit / Access Logs | 2 | 2 | ✅ Full |
| AWS Cloud Onboarding | 4 | 4 | ✅ Full |
| Azure Cloud Onboarding | 3 | 3 | ✅ Full |
| Bulk Instance Data Fetch | 1 | 1 | ✅ Full |
| Collector Debug Commands | 2 | 2 | ✅ Full |
| Collector Groups & Agent Log Levels | 21 | 21 | ✅ Full |
| ConfigSource extras | 9 | 9 | ✅ Full |
| Contract / Usage Info | 1 | 1 | ✅ Full |
| Cost Optimization | 3 | 3 | ✅ Full |
| Dashboard Groups (write) | 7 | 7 | ✅ Full |
| Dashboard Widgets | 7 | 7 | ✅ Full |
| Dashboards | 7 | 7 | ✅ Full |
| DataSource Management (write/import) | 12 | 12 | ✅ Full |
| Default Dashboard (user data) | 2 | 2 | ✅ Full |
| Devices — instances, alert settings, config & netflow | 52 | 52 | ✅ Full |
| Diagnostic Remediation | 2 | 2 | ✅ Full |
| DiagnosticSources | 8 | 8 | ✅ Full |
| DNS Mappings | 1 | 1 | ✅ Full |
| EventSource extras | 8 | 8 | ✅ Full |
| GCP Cloud Onboarding | 1 | 1 | ✅ Full |
| Instance Graph Data (by instance id) | 1 | 1 | ✅ Full |
| Integration Audit Logs | 1 | 1 | ✅ Full |
| Job Monitors (BatchJobs) | 8 | 8 | ✅ Full |
| Log Partitions | 8 | 8 | ✅ Full |
| Log Pipelines / Log Alerts | 13 | 13 | ✅ Full |
| Log Query Groups | 9 | 9 | ✅ Full |
| LogicModule Metadata | 1 | 1 | ✅ Full |
| LogSources | 7 | 7 | ✅ Full |
| Metrics (Push/Usage) | 2 | 2 | ✅ Full |
| NetScans | 6 | 6 | ✅ Full |
| Ops Notes | 6 | 6 | ✅ Full |
| PropertySources / Property Rules | 7 | 7 | ✅ Full |
| Recipient Groups | 6 | 6 | ✅ Full |
| RemediationSources | 7 | 7 | ✅ Full |
| Report Execution | 8 | 8 | ✅ Full |
| Report Groups | 6 | 6 | ✅ Full |
| Roles (write) | 6 | 6 | ✅ Full |
| SaaS Account | 1 | 1 | ✅ Full |
| Scheduled Down Time (SDT) | 6 | 6 | ✅ Full |
| SNMP OIDs | 7 | 7 | ✅ Full |
| TopologySources (write) | 7 | 7 | ✅ Full |
| Tracked Query Groups | 6 | 6 | ✅ Full |
| Unmonitored Devices | 1 | 1 | ✅ Full |
| Users & API Tokens (write) | 12 | 12 | ✅ Full |
| Website Checkpoints | 1 | 1 | ✅ Full |
| Website extras | 13 | 13 | ✅ Full |
| Website Groups (write) | 9 | 9 | ✅ Full |

---

## 🔴 What's Still Missing (Prioritized)

Grouped by impact. Each item links to its detailed operation list below.

### 🔴 HIGH Priority — 19 operations

*Core monitoring & configuration management — highest user value*

- **Device Groups — datasource alert settings, cluster, properties** — 19 missing. Tools to add: group datasource/alert-setting, cluster-alert, property CRUD tools

### 🟡 MEDIUM Priority — 0 operations

*All MEDIUM-priority categories are fully covered.*

### 🟢 LOW Priority — 0 operations

*All LOW-priority categories are now fully covered (Log Pipelines/Log Alerts, Log Query Groups, Log Partitions, Tracked Query Groups, AWS/Azure/GCP/SaaS Cloud Onboarding, ConfigSource & EventSource & Website extras, Diagnostic Remediation, Metrics, Default Dashboard, Alerts escalate, Access Group Module Mapping, Integration Audit Logs, API Usage Stats, LogicModule Metadata, Unmonitored Devices, Contract Info, DNS Mappings).*

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

---

## ✅ Fully Covered Areas

These categories have every Swagger operation backed by an MCP tool:

- **Access Group Module Mapping** (7/7)
- **Alert Automation — Action Chains & Rules** (14/14)
- **Alert Rules & Escalation Chains** (12/12)
- **Alerts** (5/5)
- **API Usage Stats** (1/1)
- **AppliesTo Functions** (7/7)
- **Audit / Access Logs** (2/2)
- **AWS Cloud Onboarding** (4/4)
- **Azure Cloud Onboarding** (3/3)
- **Bulk Instance Data Fetch** (1/1)
- **Collector Debug Commands** (2/2)
- **Collector Groups & Agent Log Levels** (21/21)
- **ConfigSource extras** (9/9)
- **Contract / Usage Info** (1/1)
- **Cost Optimization** (3/3)
- **Dashboard Groups (write)** (7/7)
- **Dashboard Widgets** (7/7)
- **Dashboards** (7/7)
- **DataSource Management (write/import)** (12/12)
- **Default Dashboard (user data)** (2/2)
- **Devices — instances, alert settings, config & netflow** (52/52)
- **Diagnostic Remediation** (2/2)
- **DiagnosticSources** (8/8)
- **DNS Mappings** (1/1)
- **EventSource extras** (8/8)
- **GCP Cloud Onboarding** (1/1)
- **Instance Graph Data (by instance id)** (1/1)
- **Integration Audit Logs** (1/1)
- **Job Monitors (BatchJobs)** (8/8)
- **Log Partitions** (8/8)
- **Log Pipelines / Log Alerts** (13/13)
- **Log Query Groups** (9/9)
- **LogicModule Metadata** (1/1)
- **LogSources** (7/7)
- **Metrics (Push/Usage)** (2/2)
- **NetScans** (6/6)
- **Ops Notes** (6/6)
- **PropertySources / Property Rules** (7/7)
- **Recipient Groups** (6/6)
- **RemediationSources** (7/7)
- **Report Execution** (8/8)
- **Report Groups** (6/6)
- **Roles (write)** (6/6)
- **SaaS Account** (1/1)
- **Scheduled Down Time (SDT)** (6/6)
- **SNMP OIDs** (7/7)
- **TopologySources (write)** (7/7)
- **Tracked Query Groups** (6/6)
- **Unmonitored Devices** (1/1)
- **Users & API Tokens (write)** (12/12)
- **Website Checkpoints** (1/1)
- **Website extras** (13/13)
- **Website Groups (write)** (9/9)

### Custom Enhancements (not in the official API)

Four link-generation helpers prevent AI assistants from guessing URLs:
`generate_dashboard_link`, `generate_resource_link`, `generate_alert_link`, `generate_website_link`.

---

## 🗺️ Roadmap to 100% Coverage

| Phase | Focus | Operations to add | Cumulative coverage |
|-------|-------|:-----------------:|:-------------------:|
| Current | — | — | 95% |
| Phase 1 (HIGH) | Device Groups — datasource alert settings, cluster, properties | +19 | 100% |

---

## 🔬 Methodology

1. Parsed all operations from the LogicMonitor Swagger v3 spec.
2. Mapped each implemented MCP tool to its underlying endpoint + HTTP verb.
3. Marked every Swagger operation as covered/missing and grouped by resource category.
4. Assigned priority tiers by user value and scripting frequency.

*Coverage figures are computed directly from the spec (393 operations) against 310 covered operations.*
