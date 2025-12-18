import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  MCP_TOOL_METADATA,
  type McpToolMetadata,
} from './decorators/mcp-tool.decorator';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private server: McpServer;
  public transport: StreamableHTTPServerTransport;

  constructor(
    private discoveryService: DiscoveryService,
  ) {
    this.initializeMcpServer();
    this.transport = this.createTransport();
  }

  async onApplicationBootstrap() {
    // Discover and register tools after all providers are initialized
    this.discoverAndRegisterTools();
    
    await this.server.connect(this.transport);
    this.logger.log('MCP Service has been initialized.');
  }

  private initializeMcpServer(): void {
    this.server = new McpServer(
      {
        name: 'design-system-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          logging: {},
        },
      },
    );
  }

  private discoverAndRegisterTools(): void {
    const providers: InstanceWrapper[] = this.discoveryService.getProviders();
    let toolCount = 0;

    this.logger.log('Starting MCP tool discovery...');

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance === 'string') {
        continue;
      }

      const prototype = Object.getPrototypeOf(instance);
      const toolMetadata: McpToolMetadata[] =
        Reflect.getMetadata(MCP_TOOL_METADATA, prototype.constructor) || [];

      if (toolMetadata.length > 0) {
        this.logger.log(
          `Found ${toolMetadata.length} tool(s) in ${wrapper.name || 'unknown'}`,
        );
      }

      for (const tool of toolMetadata) {
        const methodRef = instance[tool.methodName];
        if (typeof methodRef === 'function') {
          this.logger.log(
            `  → Registering tool: ${tool.name} (${tool.methodName})`,
          );

          this.server.registerTool(
            tool.name,
            {
              title: tool.title,
              description: tool.description,
              inputSchema: tool.inputSchema,
            },
            async (args: any) => {
              try {
                // Transform MCP args to method args using paramMap
                const methodArgs = this.transformArgs(args, tool);
                const result = await methodRef.call(instance, methodArgs);
                return this.formatToolResult(result);
              } catch (error) {
                this.logger.error(
                  `Error executing tool ${tool.name}: ${error}`,
                );
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                  ],
                };
              }
            },
          );
          toolCount++;
        }
      }
    }

    this.logger.log(
      `MCP tool discovery complete. Registered ${toolCount} tool(s) total.`,
    );
  }

  private transformArgs(args: any, tool: McpToolMetadata): any {
    // If no args or empty args object, return undefined for methods with no params
    if (!args || (typeof args === 'object' && Object.keys(args).length === 0)) {
      return undefined;
    }

    // If paramMap is not provided, check if we need to extract single value
    if (!tool.paramMap) {
      // If args is an object with a single property, extract its value
      if (typeof args === 'object' && !Array.isArray(args)) {
        const keys = Object.keys(args);
        if (keys.length === 1) {
          return args[keys[0]];
        }
        // Multiple properties without paramMap, return the object as-is
        return args;
      }
      return args;
    }

    // Apply paramMap transformation
    const transformedArgs: any = {};
    for (const [mcpParam, methodParam] of Object.entries(tool.paramMap)) {
      if (mcpParam in args) {
        transformedArgs[methodParam] = args[mcpParam];
      }
    }

    // If only one parameter after mapping, return the value directly
    const keys = Object.keys(transformedArgs);
    if (keys.length === 1) {
      return transformedArgs[keys[0]];
    }

    // Multiple parameters, return as object
    return transformedArgs;
  }

  private formatToolResult(result: any): any {
    if (result && typeof result === 'object' && 'content' in result) {
      return result;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  createTransport(): StreamableHTTPServerTransport {
    return new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
  }
}
