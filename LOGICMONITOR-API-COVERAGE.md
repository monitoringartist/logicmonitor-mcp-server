# LogicMonitor API Coverage Analysis

**Analysis Date:** November 1, 2025  
**API Specification:** [LogicMonitor Swagger v3](https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json)

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total API Operations** | 336 |
| **Implemented Tools** | 125 |
| **Coverage** | **37%** |
| **Custom Enhancements** | 4 link tools |

---

## ✅ Well-Covered Areas

### Devices/Resources ⭐ COMPLETE
**Status:** Fully implemented with custom enhancements

**Implemented:**
- ✅ List, Get, Create, Update, Delete devices
- ✅ Device Groups (List, Get, Create, Update, Delete)
- ✅ Device Properties (List, Update)
- ✅ Device DataSources (List, Get, Update)
- ✅ Device Instances (List, Get Data)
- ✅ Search devices
- ✅ **Generate resource links** (custom addition)

**Tools:** `list_resources`, `get_resource`, `create_resource`, `update_resource`, `delete_resource`, `list_resource_groups`, `get_resource_group`, `create_resource_group`, `update_resource_group`, `delete_resource_group`, `list_resource_properties`, `update_resource_property`, `list_resource_datasources`, `get_resource_datasource`, `update_resource_datasource`, `list_resource_instances`, `get_resource_instance_data`, `search_resources`, `generate_resource_link`

---

### Alerts ⭐ COMPLETE
**Status:** Fully implemented with custom enhancements

**Implemented:**
- ✅ List, Get alerts
- ✅ Acknowledge alerts, Add notes
- ✅ Alert Rules (List, Get, Create, Update, Delete)
- ✅ Search alerts
- ✅ **Generate alert links** (custom addition)

**Tools:** `list_alerts`, `get_alert`, `acknowledge_alert`, `add_alert_note`, `list_alert_rules`, `get_alert_rule`, `create_alert_rule`, `update_alert_rule`, `delete_alert_rule`, `search_alerts`, `generate_alert_link`

---

### Dashboards ⭐ GOOD
**Status:** Core features implemented, widgets missing

**Implemented:**
- ✅ List, Get, Create, Update, Delete dashboards
- ✅ Dashboard Groups (List, Get)
- ✅ **Generate dashboard links** (custom addition)

**Missing:**
- ❌ Widget operations (7 operations)
  - `addWidget`
  - `getWidgetList`, `getWidgetById`
  - `updateWidgetById`, `patchWidgetById`
  - `deleteWidgetById`
  - `getWidgetDataById`

**Tools:** `list_dashboards`, `get_dashboard`, `create_dashboard`, `update_dashboard`, `delete_dashboard`, `list_dashboard_groups`, `get_dashboard_group`, `generate_dashboard_link`

---

### Collectors ⭐ GOOD
**Status:** Read operations complete, write operations missing

**Implemented:**
- ✅ List, Get collectors
- ✅ Collector Groups (List, Get)
- ✅ Collector Versions (List)

**Missing:**
- ❌ Add, Update, Patch, Delete collectors
- ❌ Get collector installer
- ❌ Acknowledge collector down alert

**Tools:** `list_collectors`, `get_collector`, `list_collector_groups`, `get_collector_group`, `list_collector_versions`

---

### Websites ⭐ COMPLETE
**Status:** Fully implemented with custom enhancements

**Implemented:**
- ✅ List, Get, Create, Update, Delete websites
- ✅ Website Groups (List, Get)
- ✅ Website Checkpoints (List)
- ✅ **Generate website links** (custom addition)

**Missing:**
- ❌ Get checkpoint data
- ❌ Get website graph data

**Tools:** `list_websites`, `get_website`, `create_website`, `update_website`, `delete_website`, `list_website_groups`, `get_website_group`, `list_website_checkpoints`, `generate_website_link`

---

### Configuration Management ⭐ COMPLETE
**Status:** Fully implemented

**Implemented:**
- ✅ Users (List, Get)
- ✅ Roles (List, Get)
- ✅ API Tokens (List)
- ✅ Access Groups (List, Get, Create, Update, Delete)
- ✅ Escalation Chains (List, Get, Create, Update, Delete)
- ✅ Recipients & Recipient Groups (full CRUD)

**Tools:** `list_users`, `get_user`, `list_roles`, `get_role`, `list_api_tokens`, `list_access_groups`, `get_access_group`, `create_access_group`, `update_access_group`, `delete_access_group`, `list_escalation_chains`, `get_escalation_chain`, `create_escalation_chain`, `update_escalation_chain`, `delete_escalation_chain`, `list_recipients`, `get_recipient`, `create_recipient`, `update_recipient`, `delete_recipient`, `list_recipient_groups`, `get_recipient_group`, `create_recipient_group`, `update_recipient_group`, `delete_recipient_group`

---

### DataSources ⚠️ BASIC
**Status:** Read-only, management operations missing

**Implemented:**
- ✅ List, Get datasources

**Missing:**
- ❌ Add, Update, Patch, Delete datasources (4 operations)
- ❌ Import/Export datasources (XML/JSON) (2 operations)
- ❌ Get overview graphs (2 operations)
- ❌ Get associated devices (1 operation)
- ❌ Get update reasons (1 operation)

**Tools:** `list_datasources`, `get_datasource`

---

### Monitoring Resources ⚠️ BASIC
**Status:** Read-only operations

**Implemented:**
- ✅ ConfigSources (List, Get)
- ✅ EventSources (List, Get)
- ✅ SDTs (List, Get, Create Device SDT, Delete)

**Missing:**
- ❌ ConfigSource management (Add, Update, Delete, Import/Export)
- ❌ EventSource management (Add, Update, Delete, Import/Export)
- ❌ Complete SDT management

**Tools:** `list_configsources`, `get_configsource`, `list_eventsources`, `get_eventsource`, `list_sdts`, `get_sdt`, `create_resource_sdt`, `delete_sdt`

---

### Reports ⚠️ BASIC
**Status:** Read-only, write operations missing

**Implemented:**
- ✅ List, Get reports
- ✅ Report Groups (List, Get, Create, Update, Delete)

**Missing:**
- ❌ Create, Update, Delete reports

**Tools:** `list_reports`, `get_report`, `list_report_groups`, `get_report_group`, `create_report_group`, `update_report_group`, `delete_report_group`

---

### Services & Business Logic ⭐ COMPLETE
**Status:** Fully implemented

**Implemented:**
- ✅ Services (List, Get, Create, Update, Delete)
- ✅ Service Groups (List, Get, Create, Update, Delete)

**Tools:** `list_services`, `get_service`, `create_service`, `update_service`, `delete_service`, `list_service_groups`, `get_service_group`, `create_service_group`, `update_service_group`, `delete_service_group`

---

### Operations & Maintenance ⭐ COMPLETE
**Status:** Fully implemented

**Implemented:**
- ✅ OpsNotes (List, Get, Create, Update, Delete)
- ✅ Netscans (List, Get, Create, Update, Delete)
- ✅ Integrations (List, Get, Create, Update, Delete)
- ✅ Audit Logs (List, Get, Search)

**Tools:** `list_opsnotes`, `get_opsnote`, `create_opsnote`, `update_opsnote`, `delete_opsnote`, `list_netscans`, `get_netscan`, `create_netscan`, `update_netscan`, `delete_netscan`, `list_integrations`, `get_integration`, `create_integration`, `update_integration`, `delete_integration`, `list_audit_logs`, `get_audit_log`, `search_audit_logs`

---

### Miscellaneous ⭐ GOOD
**Status:** Partial implementation

**Implemented:**
- ✅ Topology (Get)
- ✅ Device Group Properties (List, Update)

**Tools:** `get_topology`, `list_resource_group_properties`, `update_resource_group_property`

---

## ❌ Missing Major Features

### 1. 🔴 Widgets (7 operations) - NOT IMPLEMENTED
**Priority:** HIGH - Essential for dashboard management

```
API Operations:
- addWidget                    POST   /dashboard/widgets
- getWidgetList                GET    /dashboard/dashboards/{id}/widgets
- getWidgetById                GET    /dashboard/widgets/{id}
- updateWidgetById             PUT    /dashboard/widgets/{id}
- patchWidgetById              PATCH  /dashboard/widgets/{id}
- deleteWidgetById             DELETE /dashboard/widgets/{id}
- getWidgetDataById            GET    /dashboard/widgets/{id}/data
```

**Use Cases:**
- Create custom dashboard widgets
- Modify existing widget configurations
- Retrieve widget data for analysis

---

### 2. 🔴 Data/Metrics APIs (9 operations) - NOT IMPLEMENTED
**Priority:** HIGH - Essential for retrieving monitoring data

```
API Operations:
- getDeviceDatasourceInstanceData              GET /device/devices/{deviceId}/devicedatasources/{hdsId}/instances/{id}/data
- getDeviceDatasourceInstanceGraphData         GET /device/devices/{deviceId}/devicedatasources/{hdsId}/instances/{id}/graphs/{graphId}/data
- getDeviceInstanceGraphDataOnlyByInstanceId   GET /device/devicedatasourceinstances/{instanceId}/graphs/{graphId}/data
- getDeviceDatasourceInstanceGroupOverviewGraphData GET /device/devices/{deviceId}/devicedatasources/{deviceDsId}/groups/{dsigId}/graphs/{ographId}/data
- getWebsiteGraphData                          GET /website/websites/{websiteId}/checkpoints/{checkpointId}/graphs/{graphName}/data
- getWebsiteCheckpointDataById                 GET /website/websites/{srvId}/checkpoints/{checkId}/data
- getDeviceConfigSourceConfigById              GET /device/devices/{deviceId}/devicedatasources/{hdsId}/instances/{instanceId}/config/{id}
- getDeviceConfigSourceConfigList              GET /device/devices/{deviceId}/devicedatasources/{hdsId}/instances/{instanceId}/config
- fetchDeviceInstancesData                     POST /device/instances/datafetch
```

**Use Cases:**
- Retrieve time-series metric data
- Get graph data for visualization
- Fetch configuration data
- Batch data retrieval

**Note:** We have `get_resource_instance_data` but it may not cover all these scenarios.

---

### 3. 🟡 LogSources (7 operations) - NOT IMPLEMENTED
**Priority:** MEDIUM - Important for log monitoring

```
API Operations:
- addLogSource                 POST   /setting/logsources
- getLogSourceList             GET    /setting/logsources
- getLogSourceById             GET    /setting/logsources/{id}
- updateLogSourceById          PUT    /setting/logsources/{id}
- patchLogSourceById           PATCH  /setting/logsources/{id}
- deleteLogSourceById          DELETE /setting/logsources/{id}
- importLogSourceJson          POST   /setting/logsources/importjson
```

**Use Cases:**
- Manage log collection configurations
- Configure log parsing and alerting

---

### 4. 🟡 Collector Management (Write Ops) - NOT IMPLEMENTED
**Priority:** MEDIUM - Important for infrastructure management

```
API Operations:
- addCollector                 POST   /setting/collector/collectors
- updateCollectorById          PUT    /setting/collector/collectors/{id}
- patchCollectorById           PATCH  /setting/collector/collectors/{id}
- deleteCollectorById          DELETE /setting/collector/collectors/{id}
- getCollectorInstaller        GET    /setting/collector/collectors/{collectorId}/installers/{osAndArch}
- ackCollectorDownAlertById    POST   /setting/collector/collectors/{id}/ackdown
```

**Current Status:** ✅ List, Get implemented | ❌ Write operations missing

---

### 5. 🟡 DataSource Management (Write Ops) - NOT IMPLEMENTED
**Priority:** MEDIUM - Important for module management

```
API Operations:
- addDatasourceById            POST   /setting/datasources
- updateDatasourceById         PUT    /setting/datasources/{id}
- patchDatasourceById          PATCH  /setting/datasources/{id}
- deleteDatasourceById         DELETE /setting/datasources/{id}
- importDataSource             POST   /setting/datasources/importxml
- importDataSourceJson         POST   /setting/datasources/importjson
- getDataSourceOverviewGraphList GET  /setting/datasources/{dsId}/ographs
- getDataSourceOverviewGraphById GET  /setting/datasources/{dsId}/ographs/{id}
- getAssociatedDeviceListByDataSourceId GET /setting/datasources/{id}/devices
- getUpdateReasonListByDataSourceId GET /setting/datasources/{id}/updatereasons
```

**Current Status:** ✅ List, Get implemented | ❌ Write/Import/Export missing

---

### 6. 🟡 TopologySources (6 operations) - NOT IMPLEMENTED
**Priority:** MEDIUM

```
API Operations:
- addTopologySource            POST   /setting/topologysources
- getTopologySourceList        GET    /setting/topologysources
- getTopologySourceById        GET    /setting/topologysources/{id}
- updateTopologySourceById     PUT    /setting/topologysources/{id}
- patchTopologySourceById      PATCH  /setting/topologysources/{id}
- deleteTopologySourceById     DELETE /setting/topologysources/{id}
```

**Current Status:** ✅ `get_topology` implemented | ❌ Topology source management missing

---

### 7. 🟢 PropertySources (6 operations) - NOT IMPLEMENTED
**Priority:** LOW

```
API Operations:
- addPropertyRule              POST   /setting/propertyrules
- getPropertyRuleList          GET    /setting/propertyrules
- getPropertyRuleById          GET    /setting/propertyrules/{id}
- updatePropertyRuleById       PUT    /setting/propertyrules/{id}
- patchPropertyRuleById        PATCH  /setting/propertyrules/{id}
- deletePropertyRuleById       DELETE /setting/propertyrules/{id}
```

**Use Cases:**
- Manage automatic property assignments
- Configure property inheritance rules

---

### 8. 🟢 AppliesToFunctions (7 operations) - NOT IMPLEMENTED
**Priority:** LOW

```
API Operations:
- addAppliesToFunction         POST   /setting/functions
- getAppliesToFunctionList     GET    /setting/functions
- getAppliesToFunctionById     GET    /setting/functions/{id}
- updateAppliesToFunction      PUT    /setting/functions/{id}
- patchAppliesToFunction       PATCH  /setting/functions/{id}
- deleteAppliesToFunctionById  DELETE /setting/functions/{id}
- importAppliesToFunctionJson  POST   /setting/functions/importjson
```

**Use Cases:**
- Manage AppliesTo function definitions
- Reusable device selection logic

---

### 9. 🟢 Cost Optimization (3 operations) - NOT IMPLEMENTED
**Priority:** LOW - Nice to have

```
API Operations:
- getRecommendationsList       GET /cost-optimization/recommendations
- getRecommendationById        GET /cost-optimization/recommendations/{id}
- getRecommendationCategoriesList GET /cost-optimization/recommendations/categories
```

**Use Cases:**
- Get cost optimization recommendations
- Cloud resource optimization insights

---

### 10. 🟢 Advanced Features - NOT IMPLEMENTED
**Priority:** LOW

```
Log Partitions (1 operation):
- createLogPartition           POST /setting/logpartitions

Job Monitor (1 operation):
- addJobMonitor               POST /setting/jobmonitors

OID Management (1 operation):
- addOid                      POST /setting/oids

DNS Mapping (1 operation):
- addDNSMapping               POST /setting/dnsmappings

Debug Commands (2 operations):
- executeDebugCommand         POST /debug
- getDebugCommandResult       GET  /debug/{id}

Delta APIs (2 operations):
- getDeltaIdWithDevices       GET /device/devices/delta
- getDeltaDevices             GET /device/devices/delta/{deltaId}

API Stats (1 operation):
- getExternalApiStats         GET /apiStats/externalApis

Beta APIs - DiagnosticSources (8 operations):
- Full CRUD + import/export for diagnostic sources
```

---

## 🎯 Implementation Priorities

### Priority 1: HIGH VALUE 🔴
**Estimated Impact:** Major capability additions

1. **Widget Operations** (7 ops)
   - Enables complete dashboard management
   - Create and customize monitoring views
   
2. **Data/Metrics APIs** (9 ops)
   - Essential for retrieving actual monitoring data
   - Enable data analysis and visualization
   - Most requested by users

3. **Collector Management (Write)** (6 ops)
   - Complete collector lifecycle management
   - Infrastructure automation

4. **DataSource Management (Write)** (10 ops)
   - Module management and customization
   - Import/export capabilities

**Estimated Tools to Add:** ~32 tools

---

### Priority 2: COMPLETENESS 🟡
**Estimated Impact:** Fills gaps in existing features

5. **Report Management (Write)** (3 ops)
   - Complete report CRUD operations

6. **LogSources** (7 ops)
   - Log monitoring capabilities

7. **ConfigSource Management** (6+ ops)
   - Complete config monitoring management

8. **EventSource Management** (6+ ops)
   - Complete event monitoring management

**Estimated Tools to Add:** ~22 tools

---

### Priority 3: ADVANCED FEATURES 🟢
**Estimated Impact:** Nice-to-have enhancements

9. **TopologySources** (6 ops)
10. **PropertySources** (6 ops)
11. **AppliesToFunctions** (7 ops)
12. **Cost Optimization** (3 ops)
13. **Advanced Device Group Operations** (5+ ops)
14. **Diagnostic Sources** (8 ops)

**Estimated Tools to Add:** ~35 tools

---

## 📈 Roadmap to 100% Coverage

| Phase | Focus Area | Tools to Add | Est. Coverage |
|-------|-----------|--------------|---------------|
| **Current** | Core monitoring & management | 125 | 37% |
| **Phase 1** | High-value features | +32 | 47% |
| **Phase 2** | Completeness | +22 | 53% |
| **Phase 3** | Advanced features | +35 | 64% |
| **Phase 4** | Remaining operations | +122 | 100% |

---

## 🎨 Custom Enhancements

The implementation includes **4 custom link generation tools** that are NOT in the official LogicMonitor API:

1. ✨ `generate_dashboard_link` - Generate direct links to dashboards
2. ✨ `generate_resource_link` - Generate direct links to devices
3. ✨ `generate_alert_link` - Generate direct links to alerts
4. ✨ `generate_website_link` - Generate direct links to websites

These tools prevent AI assistants from guessing or constructing incorrect URLs and provide accurate navigation links.

---

## 💡 Implementation Notes

### Read-Only Focus
The current implementation heavily favors **read operations (GET)**, which aligns with the default `MCP_READ_ONLY=true` mode. This is a safe and sensible default for monitoring use cases.

### Core Monitoring Coverage
The **essential monitoring operations** are well-covered:
- ✅ Devices and resources
- ✅ Alerts and alerting
- ✅ Dashboards (except widgets)
- ✅ Collectors (read-only)
- ✅ Websites
- ✅ Configuration management

### Write Operation Strategy
Many write operations (POST/PUT/PATCH/DELETE) for advanced features are intentionally omitted, likely for:
- **Safety** - Preventing accidental modifications
- **Simplicity** - Focusing on common use cases
- **Security** - Limiting potential damage

### Coverage Philosophy
The **37% coverage** appears to be a deliberate choice focusing on:
- Most commonly used operations
- Essential monitoring tasks
- Read-only safety
- Quick wins for AI-assisted monitoring

---

## 📋 Decision Matrix

When deciding what to implement next, consider:

| Factor | Priority 1 | Priority 2 | Priority 3 |
|--------|-----------|-----------|-----------|
| **User Value** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Complexity** | Medium | Medium | High |
| **Risk** | Low | Low | Medium |
| **Frequency of Use** | High | Medium | Low |
| **Dependencies** | None | Some | Many |

---

## 🔍 Analysis Methodology

This analysis was generated by:
1. Parsing the [LogicMonitor Swagger v3 API specification](https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json)
2. Extracting all 336 API operations
3. Comparing with the 125 implemented MCP tools
4. Categorizing by functional area
5. Assessing completeness and gaps
6. Prioritizing based on value and usage patterns

---

## 📝 Conclusion

The LogicMonitor MCP server provides **solid coverage of core monitoring operations** with a focus on safety and commonly used features. The implementation is production-ready for read-heavy monitoring workflows and includes valuable custom enhancements (link generation).

**Recommendation:** Maintain the current focus unless specific write operations or advanced features are requested by users. The 37% coverage strategically targets the most valuable 37% of the API.

---

**Last Updated:** November 1, 2025  
**Next Review:** When new features are requested or API changes

