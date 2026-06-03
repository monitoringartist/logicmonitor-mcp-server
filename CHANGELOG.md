# Changelog

## [v0.1.0] - 2025-12-04

### 📦 Other Changes
- Update changelog before release (71a4007)
- Add important pagination note to API tool documentation (a72cb91)
- Update modelcontextprotocol/sdk to 12.4.2 (d207e47)


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Cost Optimization Recommendations tools: `list_cost_optimization_recommendations`, `get_cost_optimization_recommendation`, and `list_cost_optimization_recommendation_categories` (read-only, backed by the `/cost-optimization/recommendations` API)
- Dashboard Widget tools: `list_widgets`, `list_dashboard_widgets`, `get_widget`, `get_widget_data` (read-only) and `create_widget`, `update_widget`, `delete_widget` (write), backed by the `/dashboard/widgets` API
- Collector management tools: `create_collector`, `update_collector`, `delete_collector`, `acknowledge_collector_down_alert` (write) and `get_collector_installer` (read-only; returns an authenticated installer download URL rather than the binary), backed by the `/setting/collector/collectors` API
- Website monitoring data tools (read-only): `get_website_checkpoint_data` (raw checkpoint datapoint values) and `get_website_graph_data` (rendered graph series for a checkpoint), backed by the `/website/websites/{id}/checkpoints` API
- ConfigSource management tools: `create_configsource`, `update_configsource`, `delete_configsource`, and `import_configsource` (JSON/XML upload via multipart)
- EventSource management tools: `create_eventsource`, `update_eventsource`, `delete_eventsource`, and `import_eventsource` (JSON/XML upload via multipart)
- Expanded SDT management: `create_sdt` (any SDT target type) and `update_sdt`, complementing the existing device SDT tools
- Report management tools: `create_report`, `update_report`, and `delete_report`, backed by the `/report/reports` API
- LogSource tools (6 new): `list_logsources`, `get_logsource`, `create_logsource`, `update_logsource`, `delete_logsource`, and `import_logsource` (JSON multipart) — bringing the LogSources category to full coverage
- PropertySource (property rule) tools (6 new): `list_property_rules`, `get_property_rule`, `create_property_rule`, `update_property_rule`, `delete_property_rule`, and `import_property_rule` (JSON multipart) — bringing the PropertySources category to full coverage
- DataSource management tools (8 new): `create_datasource`, `update_datasource`, `delete_datasource`, `import_datasource` (XML/JSON multipart), `list_datasource_overview_graphs`, `get_datasource_overview_graph`, `list_datasource_devices`, `list_datasource_update_reasons` — bringing the DataSource Management category to full coverage
- Alert automation tools (11 new): action chains (`list_action_chains`, `get_action_chain`, `create_action_chain`, `update_action_chain`, `delete_action_chain`) and action rules (`list_action_rules`, `get_action_rule`, `create_action_rule`, `update_action_rule`, `delete_action_rule`, `set_action_rule_status`), backed by the `/setting/action/chains` and `/setting/action/rules` APIs — bringing the Alert Automation category to full coverage
- Device deep-dive tools (32 new): datasource instance CRUD (`create_resource_instance`, `update_resource_instance`, `delete_resource_instance`), instance groups (`list_resource_instance_groups`, `get_resource_instance_group`, `create_resource_instance_group`, `update_resource_instance_group`, `update_instance_group_alert_threshold`, `get_instance_group_overview_graph_data`), alert settings (`list_resource_alert_settings`, `list_instance_alert_settings`, `get_instance_alert_setting`, `update_instance_alert_setting`), collected configs (`list_resource_instance_configs`, `get_resource_instance_config`, `collect_resource_instance_config`), graph/data (`get_instance_graph_data`, `get_resource_datasource_data`), NetFlow (`list_resource_netflow_flows`, `list_resource_netflow_ports`, `list_resource_netflow_endpoints`, `get_resource_top_talkers_graph`), SDT history (`get_resource_sdt_history`, `get_resource_datasource_sdt_history`, `get_instance_sdt_history`), device properties (`create_resource_property`, `delete_resource_property`), and `list_resource_alerts`, `list_resource_eventsources`, `schedule_resource_auto_discovery`, `get_resources_delta_id`, `get_resources_delta` — bringing the Devices API category to full coverage

### Changed
- None

### Fixed
- None

## [0.0.1] - Initial Release

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

[Unreleased]: https://github.com/monitoringartist/logicmonitor-mcp-server/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/monitoringartist/logicmonitor-mcp-server/releases/tag/v0.0.1

