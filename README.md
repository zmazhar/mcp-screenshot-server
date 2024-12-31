# Screenshot MCP Server

An MCP server that provides screenshot capabilities using Puppeteer. This server allows capturing screenshots of web pages with configurable options.

## Features

- Capture screenshots of any web page or local GUI
- Configurable viewport dimensions
- Full page screenshot support
- Custom output paths
- Automatic directory creation
- Timestamp-based unique filenames

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Build the server:
```bash
npm run build
```

## Configuration

Add the server to your MCP settings configuration file (usually located at `~/Library/Application Support/Code - Insiders/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["/path/to/screenshot-server/build/index.js"],
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

## Usage

The server provides a `take_screenshot` tool with the following options:

```typescript
{
  url: string;          // Required: URL to capture (http://, https://, or file:///)
  width?: number;       // Optional: Viewport width in pixels (1-3840)
  height?: number;      // Optional: Viewport height in pixels (1-2160)
  fullPage?: boolean;   // Optional: Capture full scrollable page
  outputPath?: string;  // Optional: Custom output path
}
```

Screenshots are saved to a `Screenshots` directory by default, with support for custom output paths.

### Example Usage

```typescript
use_mcp_tool({
  server_name: "screenshot",
  tool_name: "take_screenshot",
  arguments: {
    url: "https://example.com",
    width: 1280,
    height: 720,
    fullPage: true
  }
})
```

## Testing

After configuring the server in your MCP settings:

1. Restart VSCode to ensure it picks up the MCP server changes
2. Use the `use_mcp_tool` command as shown in the example above
3. Check the `Screenshots` directory for the captured image

## Error Handling

The server includes comprehensive error handling for:
- Invalid URLs
- Network issues
- File system errors
- Invalid parameters

Error messages are returned in a structured format with descriptive text.
