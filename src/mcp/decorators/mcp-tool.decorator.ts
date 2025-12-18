import 'reflect-metadata';
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js';

export const MCP_TOOL_METADATA = 'mcp:tool';

export interface McpToolMetadata {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: AnySchema;
  methodName: string;
  paramMap?: Record<string, string>;
}

export interface McpToolOptions {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: AnySchema;
  /**
   * Maps MCP input schema property names to method parameter names.
   * Example: { filepath: 'filePath', userid: 'userId' }
   * If not provided, property names are used as-is.
   */
  paramMap?: Record<string, string>;
}

export function McpTool(options: McpToolOptions): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existingTools: McpToolMetadata[] =
      Reflect.getMetadata(MCP_TOOL_METADATA, target.constructor) || [];

    const toolMetadata: McpToolMetadata = {
      name: options.name,
      title: options.title,
      description: options.description,
      inputSchema: options.inputSchema,
      methodName: propertyKey as string,
      paramMap: options.paramMap,
    };

    existingTools.push(toolMetadata);
    Reflect.defineMetadata(MCP_TOOL_METADATA, existingTools, target.constructor);

    return descriptor;
  };
}
