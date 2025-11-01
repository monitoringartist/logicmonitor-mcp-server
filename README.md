# LogicMonitor MCP Server

Model Context Protocol (MCP) server for LogicMonitor - enables AI assistants like Claude to interact with your LogicMonitor infrastructure.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)

## Features

- **69+ MCP Tools** for comprehensive LogicMonitor operations
- **Multiple Transport Modes**: STDIO, SSE, and HTTP
- **Read-Only Mode**: Safe monitoring without modification capabilities
- **Flexible Configuration**: CLI flags, environment variables, or `.env` file
- **Debug Logging**: JSON or human-readable formats with detailed request/response logging
- **Tool Filtering**: Enable specific tools or disable search functionality
- **Rate Limiting**: Automatic retry with exponential backoff
- **Batch Operations**: Process multiple resources efficiently

## Quick Start

### Prerequisites

- Node.js >= 18
- LogicMonitor account with API access
- LogicMonitor API Bearer Token

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/logicmonitor-mcp-server.git
cd logicmonitor-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Choose one of three methods to configure (listed in order of precedence):

#### Option 1: Environment Variables (Recommended)

```bash
export LM_COMPANY=mycompany
export LM_BEARER_TOKEN=your-bearer-token-here
npm start
```

#### Option 2: `.env` File

```bash
# Copy the example file
cp env.example .env

# Edit .env with your credentials
nano .env

# Run the server
npm start
```

#### Option 3: CLI Flags

```bash
npm start -- --lm-company mycompany --lm-bearer-token "your-token"
```

## CLI Reference

### Transport Options

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `-t, --transport <type>` | `MCP_TRANSPORT` | `stdio` | Transport type: `stdio`, `sse`, or `streamable-http` |
| `--address <host:port>` | `MCP_ADDRESS` | `localhost:3000` | Server address for SSE/HTTP transports |
| `--base-path <path>` | `MCP_BASE_PATH` | - | Base path for the server |
| `--endpoint-path <path>` | `MCP_ENDPOINT_PATH` | `/mcp` | Endpoint path for streamable-http |

### Debug and Logging

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `--debug` | `MCP_DEBUG=true` | `false` | Enable debug mode with detailed logging |
| `--log-format <format>` | `MCP_LOG_FORMAT` | `human` | Log format: `json` or `human` |
| `--log-level <level>` | `MCP_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, or `error` |

### Tool Configuration

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `--enabled-tools <list>` | `MCP_ENABLED_TOOLS` | all | Comma-separated list of enabled tools |
| `--read-only` | `MCP_READ_ONLY` | `true` | Enable only read-only tools (safer). Set `MCP_READ_ONLY=false` to enable write operations |
| `--disable-search` | `MCP_DISABLE_SEARCH=true` | `false` | Disable search tools |

### LogicMonitor API (Required)

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--lm-company <name>` | `LM_COMPANY` | Your LogicMonitor company/account name (subdomain). Example: if your portal is `mycompany.logicmonitor.com`, use `mycompany` |
| `--lm-bearer-token <token>` | `LM_BEARER_TOKEN` | LogicMonitor API Bearer Token. Generate at: Settings > Users & Roles > API Tokens |

## Usage Examples

### Claude Desktop (STDIO)

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "logicmonitor": {
      "command": "node",
      "args": [
        "/path/to/logicmonitor-mcp-server/build/servers/stdio-server.js"
      ],
      "env": {
        "LM_COMPANY": "mycompany",
        "LM_BEARER_TOKEN": "your-bearer-token"
      }
    }
  }
}
```

### SSE Transport (Remote Access)

```bash
# Start SSE server with debug logging
npm start -- --transport sse --address localhost:3000 --debug

# Or using environment variables
export MCP_TRANSPORT=sse
export MCP_ADDRESS=localhost:3000
export MCP_DEBUG=true
npm start
```

### Read-Only Mode (Default - Safe Monitoring)

By default, the server runs in read-only mode for safety:

```bash
# Read-only mode (default)
npm start

# Explicitly enable write operations
npm start -- # with MCP_READ_ONLY=false in .env

# Or via environment
export MCP_READ_ONLY=false
npm start
```

### Custom Tool Selection

```bash
# Enable specific tools only
npm start -- --enabled-tools "list_devices,get_device,list_alerts,get_alert"

# Disable search functionality
npm start -- --disable-search
```

### JSON Logging for Production

```bash
npm start -- --log-format json --log-level warn
```

### Complete Example

```bash
npm start -- \
  --lm-company mycompany \
  --lm-bearer-token "your-token" \
  --transport sse \
  --address 0.0.0.0:8080 \
  --read-only \
  --log-format json \
  --log-level info
```

## Available Tools

The server provides 69+ tools for comprehensive LogicMonitor operations:

### Device Management
- `list_devices`, `get_device`, `search_devices`
- `list_device_groups`, `get_device_group`
- `list_device_datasources`, `get_device_datasource`
- `list_device_instances`, `get_device_instance_data`
- `list_device_properties`

### Alert Management
- `list_alerts`, `get_alert`, `search_alerts`
- `list_alert_rules`, `get_alert_rule`

### Monitoring Resources
- `list_datasources`, `get_datasource`
- `list_eventsources`, `get_eventsource`
- `list_configsources`, `get_configsource`

### Dashboards & Reporting
- `list_dashboards`, `get_dashboard`
- `list_dashboard_groups`, `get_dashboard_group`
- `list_reports`, `get_report`
- `list_report_groups`, `get_report_group`

### Infrastructure
- `list_collectors`, `get_collector`
- `list_collector_groups`, `get_collector_group`
- `list_collector_versions`
- `list_netscans`, `get_netscan`

### Website Monitoring
- `list_websites`, `get_website`
- `list_website_groups`, `get_website_group`
- `list_website_checkpoints`

### Services & Business Logic
- `list_services`, `get_service`
- `list_service_groups`, `get_service_group`

### Configuration Management
- `list_escalation_chains`, `get_escalation_chain`
- `list_recipients`, `get_recipient`
- `list_recipient_groups`, `get_recipient_group`
- `list_integrations`, `get_integration`

### Administration
- `list_users`, `get_user`
- `list_roles`, `get_role`
- `list_access_groups`, `get_access_group`
- `list_api_tokens`

### Maintenance
- `list_sdts`, `get_sdt`
- `list_opsnotes`, `get_opsnote`

### Audit & Monitoring
- `list_audit_logs`, `get_audit_log`, `search_audit_logs`
- `get_topology`

For detailed tool descriptions and parameters, see the [API documentation](src/README.md).

## Development

### Project Structure

```
src/
├── api/                      # LogicMonitor API integration
│   ├── client.ts             # HTTP client for LM REST API
│   ├── handlers.ts           # MCP tool request handlers
│   └── tools.ts              # MCP tool definitions
├── servers/                  # MCP server implementations
│   ├── stdio-server.ts       # STDIO transport (main)
│   ├── http-server.ts        # HTTP/SSE with OAuth
│   └── multi-transport-server.ts  # Advanced server
└── utils/                    # Shared utilities
    ├── core/                 # Core infrastructure
    │   ├── cli-config.ts     # CLI configuration parser
    │   ├── lm-error.ts       # Error handling
    │   └── rate-limiter.ts   # Rate limiting
    └── helpers/              # Helper utilities
        ├── batch-processor.ts  # Batch operations
        └── filters.ts        # Filter formatting
```

### Scripts

```bash
# Development
npm run dev          # Watch mode with auto-rebuild
npm run build        # Build TypeScript to JavaScript
npm run lint         # Run ESLint

# Running servers
npm start            # STDIO server (default)
npm run start:http   # HTTP/SSE server with OAuth
npm run start:multi  # Multi-transport server

# Testing
npm test             # Run tests
npm run inspect      # Run with MCP inspector
```

### Adding New Tools

1. Add API method to `src/api/client.ts`
2. Add tool handler to `src/api/handlers.ts`
3. Add tool definition to `src/api/tools.ts`
4. Rebuild and test

See [src/README.md](src/README.md) for detailed development guidelines.

## Environment Variables Reference

See [env.example](env.example) for a complete list of configuration options.

### Essential Variables

```bash
# Required
LM_COMPANY=mycompany
LM_BEARER_TOKEN=your-bearer-token

# Transport (optional)
MCP_TRANSPORT=stdio
MCP_ADDRESS=localhost:3000

# Security (optional)
MCP_READ_ONLY=false
MCP_DISABLE_SEARCH=false

# Logging (optional)
MCP_DEBUG=false
MCP_LOG_FORMAT=human
MCP_LOG_LEVEL=info
```

## Security Considerations

### Read-Only Mode

For production monitoring, enable read-only mode to prevent accidental modifications:

```bash
npm start -- --read-only
```

### API Token Security

- Never commit tokens to version control
- Use environment variables or `.env` files (add `.env` to `.gitignore`)
- Rotate tokens regularly
- Use tokens with minimal required permissions

### Network Security

- For remote access (SSE/HTTP), use HTTPS in production
- Configure firewall rules to restrict access
- Use OAuth authentication for web-based access
- Consider VPN or bastion hosts for sensitive environments

## Troubleshooting

### "LogicMonitor credentials are required"

Ensure you've set `LM_COMPANY` and `LM_BEARER_TOKEN`:

```bash
export LM_COMPANY=mycompany
export LM_BEARER_TOKEN=your-token
```

Or use CLI flags:

```bash
npm start -- --lm-company mycompany --lm-bearer-token "your-token"
```

### Rate Limiting

The server automatically handles rate limits with exponential backoff. If you encounter persistent rate limiting:

1. Reduce concurrent requests
2. Enable `--debug` to see rate limit details
3. Contact LogicMonitor support to increase your rate limits

### Connection Issues

```bash
# Test with debug logging
npm start -- --debug --log-level debug

# Verify credentials
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_COMPANY.logicmonitor.com/santaba/rest/device/devices?size=1
```

### Tool Not Found

Enable specific tools:

```bash
npm start -- --enabled-tools "list_devices,get_device"
```

Or check if read-only mode is excluding write operations:

```bash
# Show all tools (including write operations)
npm start  # without --read-only
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run build`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Issue Tracker](https://github.com/yourusername/logicmonitor-mcp-server/issues)

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [LogicMonitor API Documentation](https://www.logicmonitor.com/support/rest-api-developers-guide)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---
