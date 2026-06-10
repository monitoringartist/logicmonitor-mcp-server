# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0] - 2026-06-06

### Added
- **352 MCP tools** (177 read-only, 175 write) — **100% LogicMonitor API v3 coverage** across 29 tool categories:
  - Alerts (21): `list_alerts`, `get_alert`, `acknowledge_alert`, `add_alert_note`, `escalate_alert`, alert rules (`list/get/create/update/delete_alert_rule`), action chains (`list/get/create/update/delete_action_chain`), action rules (`list/get/create/update/delete_action_rule`, `set_action_rule_status`)
  - Resources/Devices (8): `list_resources`, `get_resource`, `create_resource`, `update_resource`, `delete_resource`, `list_resource_properties`, `update_resource_property`, `list_unmonitored_devices`
  - Resource Instances & Deep-Dive (38): instance CRUD (`list_resource_instances`, `get_resource_instance_data`, `create/update/delete_resource_instance`), instance groups (`list/get/create/update_resource_instance_group`, `update_instance_group_alert_threshold`, `get_instance_group_overview_graph_data`), alert settings (`list_resource_alert_confs`, `list_instance_alert_confs`, `get/update_instance_alert_conf`), collected configs (`list/get_resource_instance_config`, `collect_resource_instance_config`), graph/data (`get_instance_graph_data`, `get_resource_datasource_data`, `fetch_instances_data`, `get_instance_graph_data_by_id`, `get_metrics_summary`, `get_metrics_usage`), NetFlow (`list_resource_netflow_flows/ports/endpoints`, `get_resource_top_talkers_graph`), SDT history (`get_resource/resource_datasource/instance_sdt_history`), properties (`create/delete_resource_property`), and `list_resource_alerts`, `list_resource_eventsources`, `schedule_resource_auto_discovery`, `get_resources_delta_id`, `get_resources_delta`
  - Resource Groups (22): `list/get/create/update/delete_resource_group`, properties (`list/update/create/delete_resource_group_property`), cluster alert configs (`list/get/create/update/delete_resource_group_cluster_alert_conf`), group datasources (`list/get/update_resource_group_datasource`, `get/update_resource_group_datasource_alert_conf`), `list_resource_group_alerts`, `list_resource_group_sdts`, `get_resource_group_sdt_history`
  - Dashboards & Groups (23): `list/get/create/update/delete_dashboard`, `link_dashboard`, `link_resource`, `link_alert`, `link_website`, dashboard groups (`list/get/create/update/delete/clone_dashboard_group`), `update_default_dashboard`, widgets (`list_widgets`, `list_dashboard_widgets`, `get/create/update/delete_widget`, `get_widget_data`)
  - Collectors (20): `list/get/create/update/delete_collector`, `get_collector_installer`, `acknowledge_collector_down_alert`, debug commands (`execute_debug_command`, `get_debug_command_result`), collector groups (`list/get/create/update/delete_collector_group`), agent log levels (`list/get/update_collector_agent_log_level`), `get_collector_events`, `get_collector_status_check`, `list_collector_versions`
  - DataSources (13): `list/get/create/update/delete_datasource`, `import_datasource`, `list_datasource_overview_graphs`, `get_datasource_overview_graph`, `list_datasource_devices`, `list_datasource_update_reasons`, resource datasources (`list/get/update_resource_datasource`)
  - Websites (18): `list/get/create/update/delete_website`, website groups (`list/get/create/update/delete_website_group`, `list_website_group_websites`, `list_website_group_sdts`, `get_website_group_sdt_history`), `get_website_sdt_history`, `get_website_graph_by_name`, `list_website_checkpoints`, `get_website_checkpoint_data`, `get_website_graph_data`
  - Reports (12): `list/get/create/update/delete_report`, `generate_report`, `get_report_task_result`, report groups (`list/get/create/update/delete_report_group`)
  - Users & Roles (15): `list/get/create/update/delete_user`, `list/get/create/update/delete_role`, API tokens (`list/create/update/delete_api_token`), `get_external_api_stats`
  - SDTs (6): `list_sdts`, `get_sdt`, `create_resource_sdt`, `create_sdt`, `update_sdt`, `delete_sdt`
  - Escalation & Recipient Groups (10): `list/get/create/update/delete_escalation_chain`, `list/get/create/update/delete_recipient_group`
  - Log Sources & Management (37): `list/get/create/update/delete/import_logsource`, log alert groups (`list/get/create/update/delete_log_alert_group`), log alerts (`list/get/create/update/delete_log_alert`, `set_log_alert_status`), log query groups (`list/get/create/update/delete_log_query_group`, `list_log_query_group_queries`, `list_log_query_groups_by_type`, `move_log_queries`), log partitions (`list/get/create/update/delete_log_partition`, `get_log_partition_retentions`, `log_partition_action`), tracked query groups (`list/get/create/update/delete_tracked_query_group`)
  - ConfigSources (7): `list/get/create/update/delete_configsource`, `import_configsource`, `get_configsource_update_reasons`
  - EventSources (6): `list/get/create/update/delete_eventsource`, `import_eventsource`
  - PropertySources (6): `list/get/create/update/delete_property_rule`, `import_property_rule`
  - Services (10): `list/get/create/update/delete_service`, service groups (`list/get/create/update/delete_service_group`)
  - LogicModules (13): AppliesTo functions (`list/get/create/update/delete/import_applies_to_function`), SNMP OIDs (`list/get/create/update/delete/import_oid`), `get_logicmodule_metadata`
  - Topology (8): `list/get/create/update/delete/import_topologysource`, `list_topologies`, `get_topology`
  - Diagnostics (15): diagnostic sources (`list/get/create/update/delete/import_diagnosticsource`, `execute_diagnosticsource`), remediation sources (`list/get/create/update/delete_remediationsource`, `execute_remediation`), `get_diagnostic_remediation_sources`, `get_diagnostic_remediation_results`
  - Job Monitors (6): `list/get/create/update/delete/import_job_monitor`
  - Cost Optimization (3): `list_cost_recommendations`, `get_cost_recommendation`, `list_cost_recommendation_categories`
  - Cloud Onboarding (9): `get_aws_account_id`, `get_aws_external_id`, `test_aws_account`, `verify_aws_billing_permissions`, `discover_azure_subscriptions`, `test_azure_account`, `verify_azure_storage_permissions`, `test_gcp_account`, `test_saas_account`
  - Integrations (6): `list/get/create/update/delete_integration`, `get_integration_audit_logs`
  - Access Groups (6): `list/get/create/update/delete_access_group`, `map_unmap_module_to_access_group`
  - NetScans (5): `list/get/create/update/delete_netscan`
  - OpsNotes (5): `list/get/create/update/delete_opsnote`
  - Audit Logs (2): `list_audit_logs`, `get_audit_log`
  - Miscellaneous (2): `get_contract_info`, `add_dns_mapping`
- **Tool collapsing** — 2 levels of CRUD tool collapsing to reduce the advertised tool count for AI agents:
  - Level 1 (`MCP_COLLAPSE_TOOLS_LEVEL_1=true`): merges per-verb CRUD tools (`list_`/`get_`/`create_`/`update_`/`delete_`/`import_`) of the same resource into a single `manage_<resource>` tool with an `operation` parameter. Reduces full tool count from 352 to ~144 and read-only from 177 to ~124
  - Level 2 (`MCP_COLLAPSE_TOOLS_LEVEL_2=true`, additive on level 1): folds remaining leaf tools (sub-collection reads, data/graph/history endpoints, and actions like `acknowledge_*`) into the matching parent `manage_<resource>` tool as extra `<verb>_<remainder>` operations. Reduces further to ~92 (full) / ~80 (read-only)
  - No functionality is lost: original operations remain available through the consolidated tools via the `operation` parameter. Write operations are still rejected in read-only mode
- Strict `fields` validation against the Swagger v3 spec for 42 canonical list/get tools. An invalid `fields` name now raises a clear `INVALID_PARAMETERS` error with closest-match suggestions. Valid field names are generated from the spec via `npm run generate:field-schemas`
- OAuth 2.1 Authorization Server endpoints for MCP clients (e.g. Claude's remote connector): `/.well-known/oauth-protected-resource` (RFC 9728), `/.well-known/oauth-authorization-server` (RFC 8414), `POST /oauth/register` (RFC 7591 DCR), `GET /oauth/authorize` (authorization code + PKCE S256), `POST /oauth/token` (authorization_code and rotating refresh_token grants)
- `EXPRESS_TRUST_PROXY` environment variable to honor `X-Forwarded-For` behind reverse proxies (Azure Container Apps, Cloudflare, nginx)
- `MCP_COLLAPSE_TOOLS_LEVEL_1` and `MCP_COLLAPSE_TOOLS_LEVEL_2` environment variables / CLI flags
- Read-only mode (`MCP_READ_ONLY=true`) — enabled by default; restricts to 177 safe, read-only tools

### Changed
- Restructured codebase: extracted HTTP transport from monolithic `index.ts` into `run-http.ts`, tools split into per-domain files under `src/api/tools/`, handlers under `src/api/handlers/`

### Fixed
- Passport strategies are now registered under their provider name, so `passport.authenticate('azure'|'google'|'okta'|'auth0'|'custom')` resolves correctly instead of failing with "Unknown authentication strategy" for non-GitHub providers

## [0.1.0] - 2025-12-04

### Added
- Initial implementation of LogicMonitor MCP Server
- 125 MCP tools for LogicMonitor operations
- Support for STDIO, SSE, and HTTP transports
- Multiple authentication options (no auth, bearer token, OAuth)
- Read-only mode for safe operations
- Rate limiting with exponential backoff
- Batch operations support
- TLS/HTTPS support
- Docker support
