# LogicMonitor API Coverage Analysis

**API Specification:** [LogicMonitor Swagger v3](https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json)  
**Method:** Every operation in the Swagger spec is mapped to an implemented MCP tool (by endpoint + HTTP verb). "Missing" rows below are the exact operations still needed for 100% coverage.

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total API Operations** | 393 |
| **Operations Covered** | 393 |
| **Operations Missing** | 0 |
| **Coverage** | **100%** |
| **Implemented MCP Tools** | 356 (+4 custom link tools) - sometimes multiple API operations are merged into single MCP tools |

> **How to read this doc:** Coverage is now **100%** — every Swagger operation is backed by an MCP tool. [Fully Covered Areas](#-fully-covered-areas) lists every category and its operation count.

---

## 📊 Coverage at a Glance

| Category | Covered | Total | Status |
|----------|:-------:|:-----:|:------:|
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
| Device Groups — datasource alert settings, cluster, properties | 29 | 29 | ✅ Full |
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

## 🎉 What's Still Missing (Prioritized)

**Nothing — 100% of the LogicMonitor Swagger v3 operations are now backed by MCP tools.**

All HIGH, MEDIUM, and LOW priority categories are fully covered. See [Fully Covered Areas](#-fully-covered-areas) for the complete category list.

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
- **Device Groups — datasource alert settings, cluster, properties** (29/29)
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

**🎉 100% coverage reached.** Every operation in the LogicMonitor Swagger v3 spec is now backed by an MCP tool. Future work focuses on maintaining parity as new API operations are released.

---

## 🔬 Methodology

1. Parsed all operations from the LogicMonitor Swagger v3 spec.
2. Mapped each implemented MCP tool to its underlying endpoint + HTTP verb.
3. Marked every Swagger operation as covered/missing and grouped by resource category.
4. Assigned priority tiers by user value and scripting frequency.

*Coverage figures are computed directly from the spec (393 operations) against 393 covered operations.*
