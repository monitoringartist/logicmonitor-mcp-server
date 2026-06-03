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

