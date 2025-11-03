# LogicMonitor MCP Server

Model Context Protocol (MCP) server for LogicMonitor - enables AI assistants like Claude to interact with your LogicMonitor infrastructure.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)

## Features

- **125 MCP Tools** for comprehensive LogicMonitor operations (73 read-only, 52 write)
- **Multiple Transport Modes**: STDIO, SSE, and HTTP
- **Read-Only Mode**: Safe monitoring without modification capabilities
- **Flexible Configuration**: CLI flags, environment variables, or `.env` file
- **Debug Logging**: JSON or human-readable formats with detailed request/response logging
- **Tool Filtering**: Enable specific tools or disable search functionality
- **Rate Limiting**: Automatic retry with exponential backoff
- **Batch Operations**: Process multiple resources efficiently
- **Smart Batching**: Adaptive concurrency that automatically adjusts to API rate limits

## Quick Start

### Prerequisites

- Node.js >= 18 (or Docker)
- LogicMonitor account with API access
- LogicMonitor API Bearer Token

### Installation

#### Option A: Node.js

```bash
# Clone the repository
git clone https://github.com/yourusername/logicmonitor-mcp-server.git
cd logicmonitor-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

#### Option B: Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/logicmonitor-mcp-server.git
cd logicmonitor-mcp-server

# Build Docker image
docker build -t logicmonitor-mcp-server .

# Or use Docker Compose
cp env.example .env
# Edit .env with your credentials
docker-compose up -d logicmonitor-mcp-http
```

See [DOCKER.md](DOCKER.md) for detailed Docker deployment guide.

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

### TLS Configuration (streamable-http transport only)

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `--server.tls-cert-file <path>` | `MCP_TLS_CERT_FILE` | - | Path to TLS certificate file for HTTPS. Server uses HTTPS if both cert and key are configured |
| `--server.tls-key-file <path>` | `MCP_TLS_KEY_FILE` | - | Path to TLS private key file for HTTPS. Both cert and key required for HTTPS |

**Note:** By default (when TLS is not configured), the server listens on HTTP protocol. When both certificate and key files are provided, the server automatically switches to HTTPS protocol only.

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

### MCP Server Authentication (Optional - for SSE/HTTP transports only)

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `--mcp-bearer-token <token>` | `MCP_BEARER_TOKEN` | - | Static bearer token for authenticating clients connecting to the MCP server. Used as an alternative or supplement to OAuth for remote access via SSE/HTTP transports. Not required for STDIO transport. |

**Note:** This is for authenticating **to** the MCP server, not for LogicMonitor API access. Use this for simple authentication, or see [env.example](env.example) for advanced OAuth/OIDC configuration options.

## Usage Examples

### Claude Desktop (STDIO - Recommended)

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

**Health Check Endpoints:** When using SSE or streamable HTTP transports, health check endpoints are available:

#### Simple Health Check (`/healthz`)
```bash
# Quick health check
curl http://localhost:3000/healthz
# Response: 200 OK with body "ok"
```

#### Detailed Health Check (`/health`)
```bash
# Detailed health information
curl http://localhost:3000/health
```

Response includes:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576,
    "arrayBuffers": 262144
  },
  "connections": {
    "mcp": 5,
    "http": 3
  },
  "timestamp": "2025-11-02T12:00:00.000Z",
  "transport": {
    "mode": "both",
    "http": true,
    "sse": true
  }
}
```

These endpoints can be used by:
- Load balancers (use `/healthz` for simple checks)
- Monitoring systems (use `/health` for detailed metrics)
- Orchestration platforms (Docker, Kubernetes)
- CI/CD health checks
- APM and observability tools

Note: Health check endpoints are not available with STDIO transport.

### HTTPS/TLS Configuration (Secure Transport)

To enable HTTPS for the SSE or streamable HTTP transport, provide both certificate and key files:

```bash
# Using environment variables (recommended)
export MCP_TLS_CERT_FILE=/path/to/cert.pem
export MCP_TLS_KEY_FILE=/path/to/key.pem
export MCP_TRANSPORT=sse
npm start

# Using CLI flags
npm start -- --transport sse \
  --server.tls-cert-file /path/to/cert.pem \
  --server.tls-key-file /path/to/key.pem

# Access via HTTPS
curl https://localhost:3000/healthz
```

**Behavior:**
- **TLS Not Configured** (default): Server uses HTTP protocol
- **TLS Configured** (both cert and key files provided): Server uses HTTPS protocol only
- **Partial TLS Config** (only cert OR only key): Server uses HTTP protocol (both required)

**Generate Self-Signed Certificate for Testing:**

```bash
# Generate self-signed certificate (for development/testing only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost"

# Start server with TLS
npm start -- --transport sse \
  --server.tls-cert-file ./cert.pem \
  --server.tls-key-file ./key.pem
```

**Production Recommendations:**
- Use certificates from a trusted Certificate Authority (Let's Encrypt, commercial CAs)
- Consider using a reverse proxy (nginx, Caddy) for TLS termination
- Rotate certificates before expiry
- Use strong TLS protocols (TLS 1.2+)

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
npm start -- --enabled-tools "list_resources,get_resource,list_alerts,get_alert"

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

The server provides 125 tools for comprehensive LogicMonitor operations. Tools are categorized by functionality and marked as **read-only** (safe) or **write** (modifies data).

### Resource/Device Management

**Read-Only:**
- `list_resources` - List all monitored resources/devices with filtering
- `get_resource` - Get detailed device information by ID
- `search_resources` - Search devices by name or description
- `generate_resource_link` - Generate direct link to device in LM UI

**Write Operations:**
- `create_resource` - Add new device(s) to monitoring (supports batch)
- `update_resource` - Modify existing device(s) (supports batch)
- `delete_resource` - Remove device(s) from monitoring (supports batch)

### Resource/Device Groups

**Read-Only:**
- `list_resource_groups` - List all device groups/folders
- `get_resource_group` - Get device group details by ID

**Write Operations:**
- `create_resource_group` - Create new device group
- `update_resource_group` - Modify device group
- `delete_resource_group` - Delete device group

### Alert Management

**Read-Only:**
- `list_alerts` - List active alerts with filtering
- `get_alert` - Get detailed alert information
- `search_alerts` - Search alerts by criteria
- `generate_alert_link` - Generate direct link to alert in LM UI
- `list_alert_rules` - List alert routing rules
- `get_alert_rule` - Get alert rule details

**Write Operations:**
- `acknowledge_alert` - Acknowledge alert (stops escalation)
- `add_alert_note` - Add note to alert for documentation
- `create_alert_rule` - Create new alert routing rule
- `update_alert_rule` - Modify alert rule
- `delete_alert_rule` - Delete alert rule

### DataSources & Monitoring

**Read-Only:**
- `list_datasources` - List all available datasources
- `get_datasource` - Get datasource details
- `list_resource_datasources` - List datasources applied to device
- `get_resource_datasource` - Get device datasource details
- `list_resource_instances` - List datasource instances (disks, interfaces, etc.)
- `get_resource_instance_data` - Get time-series metrics data
- `list_eventsources` - List all eventsources
- `get_eventsource` - Get eventsource details
- `list_configsources` - List configuration sources
- `get_configsource` - Get configsource details

**Write Operations:**
- `update_resource_datasource` - Modify device datasource configuration

### Dashboards & Reporting

**Read-Only:**
- `list_dashboards` - List all dashboards
- `get_dashboard` - Get dashboard details
- `generate_dashboard_link` - Generate direct link to dashboard in LM UI
- `list_dashboard_groups` - List dashboard groups
- `get_dashboard_group` - Get dashboard group details
- `list_reports` - List all reports
- `get_report` - Get report details
- `list_report_groups` - List report groups
- `get_report_group` - Get report group details

**Write Operations:**
- `create_dashboard` - Create new dashboard
- `update_dashboard` - Modify dashboard
- `delete_dashboard` - Delete dashboard
- `create_report_group` - Create report group
- `update_report_group` - Modify report group
- `delete_report_group` - Delete report group

### Collectors & Infrastructure

**Read-Only:**
- `list_collectors` - List monitoring collectors (agents)
- `get_collector` - Get collector details
- `list_collector_groups` - List collector groups
- `get_collector_group` - Get collector group details
- `list_collector_versions` - List available collector versions
- `list_netscans` - List network discovery scans
- `get_netscan` - Get netscan details
- `get_topology` - Get network topology information

**Write Operations:**
- `create_netscan` - Create network discovery scan
- `update_netscan` - Modify netscan
- `delete_netscan` - Delete netscan

### Website Monitoring

**Read-Only:**
- `list_websites` - List website monitors
- `get_website` - Get website monitor details
- `generate_website_link` - Generate direct link to website in LM UI
- `list_website_groups` - List website groups
- `get_website_group` - Get website group details
- `list_website_checkpoints` - List available monitoring checkpoints

**Write Operations:**
- `create_website` - Create new website monitor
- `update_website` - Modify website monitor
- `delete_website` - Delete website monitor

### Services (Business Logic)

**Read-Only:**
- `list_services` - List business services
- `get_service` - Get service details
- `list_service_groups` - List service groups
- `get_service_group` - Get service group details

**Write Operations:**
- `create_service` - Create new business service
- `update_service` - Modify service
- `delete_service` - Delete service
- `create_service_group` - Create service group
- `update_service_group` - Modify service group
- `delete_service_group` - Delete service group

### Alert Configuration

**Read-Only:**
- `list_escalation_chains` - List alert escalation chains
- `get_escalation_chain` - Get escalation chain details
- `list_recipients` - List alert recipients
- `get_recipient` - Get recipient details
- `list_recipient_groups` - List recipient groups
- `get_recipient_group` - Get recipient group details

**Write Operations:**
- `create_escalation_chain` - Create escalation chain
- `update_escalation_chain` - Modify escalation chain
- `delete_escalation_chain` - Delete escalation chain
- `create_recipient` - Create alert recipient
- `update_recipient` - Modify recipient
- `delete_recipient` - Delete recipient
- `create_recipient_group` - Create recipient group
- `update_recipient_group` - Modify recipient group
- `delete_recipient_group` - Delete recipient group

### Integrations

**Read-Only:**
- `list_integrations` - List third-party integrations
- `get_integration` - Get integration details

**Write Operations:**
- `create_integration` - Create new integration
- `update_integration` - Modify integration
- `delete_integration` - Delete integration

### Administration & Security

**Read-Only:**
- `list_users` - List users/admins
- `get_user` - Get user details
- `list_roles` - List user roles
- `get_role` - Get role details
- `list_access_groups` - List access groups
- `get_access_group` - Get access group details
- `list_api_tokens` - List API tokens for user

**Write Operations:**
- `create_access_group` - Create access group
- `update_access_group` - Modify access group
- `delete_access_group` - Delete access group

### Properties & Configuration

**Read-Only:**
- `list_resource_properties` - List custom properties for device
- `list_resource_group_properties` - List properties for device group

**Write Operations:**
- `update_resource_property` - Update device property value
- `update_resource_group_property` - Update device group property value

### Scheduled Down Time (SDT)

**Read-Only:**
- `list_sdts` - List scheduled down times
- `get_sdt` - Get SDT details

**Write Operations:**
- `create_resource_sdt` - Create scheduled down time
- `delete_sdt` - Delete scheduled down time

### Operational Notes

**Read-Only:**
- `list_opsnotes` - List operational notes
- `get_opsnote` - Get opsnote details

**Write Operations:**
- `create_opsnote` - Create operational note
- `update_opsnote` - Modify opsnote
- `delete_opsnote` - Delete opsnote

### Audit & Compliance

**Read-Only:**
- `list_audit_logs` - List audit trail logs
- `get_audit_log` - Get audit log entry details
- `search_audit_logs` - Search audit logs by user/action

### Summary

- **73 read-only tools** - Safe for production monitoring
- **52 write tools** - Require caution (disabled by default with `--read-only`)
- **125 total tools**

For detailed tool descriptions and parameters, see the [API documentation](src/README.md).

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
npm start -- --enabled-tools "list_resources,get_resource"
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

## Support

- 🐛 [Issue Tracker](https://github.com/yourusername/logicmonitor-mcp-server/issues)

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [LogicMonitor API Documentation](https://www.logicmonitor.com/support/rest-api-developers-guide)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---
