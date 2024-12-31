#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

interface ScreenshotOptions {
  url: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  outputPath?: string;
}

class ScreenshotServer {
  private server: Server;
  private outputDir: string;

  constructor() {
    this.server = new Server(
      {
        name: 'screenshot-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {
            take_screenshot: {
              name: 'take_screenshot',
              description: 'Capture a screenshot of any web page or local GUI',
              inputSchema: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'URL to capture (can be http://, https://, or file:///)',
                  },
                  width: {
                    type: 'number',
                    description: 'Viewport width in pixels',
                    minimum: 1,
                    maximum: 3840,
                  },
                  height: {
                    type: 'number',
                    description: 'Viewport height in pixels',
                    minimum: 1,
                    maximum: 2160,
                  },
                  fullPage: {
                    type: 'boolean',
                    description: 'Capture full scrollable page',
                  },
                  outputPath: {
                    type: 'string',
                    description: 'Custom output path (optional)',
                  },
                },
                required: ['url'],
              },
            },
          },
        },
      }
    );

    // Create Screenshots directory in current working directory
    this.outputDir = './Screenshots';
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'take_screenshot',
          description: 'Capture a screenshot of any web page or local GUI',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to capture (can be http://, https://, or file:///)',
              },
              width: {
                type: 'number',
                description: 'Viewport width in pixels',
                minimum: 1,
                maximum: 3840,
              },
              height: {
                type: 'number',
                description: 'Viewport height in pixels',
                minimum: 1,
                maximum: 2160,
              },
              fullPage: {
                type: 'boolean',
                description: 'Capture full scrollable page',
              },
              outputPath: {
                type: 'string',
                description: 'Custom output path (optional)',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'take_screenshot') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const options = request.params.arguments as unknown as ScreenshotOptions;
      if (!options?.url) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'URL is required'
        );
      }
      
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        
        // Set viewport if dimensions provided
        if (options.width && options.height) {
          await page.setViewport({
            width: options.width,
            height: options.height,
          });
        }

        // Navigate to URL
        await page.goto(options.url, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot-${timestamp}.png`;
        
        // If outputPath is provided, ensure it's relative to current working directory
        const outputPath = options.outputPath 
          ? path.join(process.cwd(), options.outputPath)
          : path.join(this.outputDir, filename);

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Take screenshot
        await page.screenshot({
          path: outputPath,
          fullPage: options.fullPage || false,
        });

        await browser.close();

        // Return path relative to current working directory
        const relativePath = path.relative(process.cwd(), outputPath);
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to: ${relativePath}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Screenshot MCP server running on stdio');
  }
}

const server = new ScreenshotServer();
server.run().catch(console.error);
