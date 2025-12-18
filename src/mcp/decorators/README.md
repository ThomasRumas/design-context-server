# MCP Tool Decorator

The `@McpTool()` decorator allows you to easily expose NestJS service methods as MCP (Model Context Protocol) tools.

## Usage

### Basic Example

```typescript
import { Injectable } from '@nestjs/common';
import { McpTool } from '../mcp/decorators';
import * as z from 'zod/v4';

@Injectable()
export class MyService {
  @McpTool({
    name: 'my_tool',
    title: 'My Tool',
    description: 'A description of what this tool does',
    inputSchema: z.object({
      param1: z.string().describe('First parameter'),
      param2: z.number().describe('Second parameter'),
    }),
  })
  myMethod(args: { param1: string; param2: number }) {
    // Your service method implementation
    return {
      result: `Processed ${args.param1} with ${args.param2}`,
    };
  }
}
```

### Decorator Options

- **name** (required): Unique identifier for the MCP tool
- **title** (optional): Human-readable title for the tool
- **description** (optional): Description of what the tool does
- **inputSchema** (optional): Zod schema for input validation
- **paramMap** (optional): Maps MCP input schema property names to method parameter names

### How It Works

1. **Add the decorator** to any service method you want to expose as an MCP tool
2. **Automatic Discovery**: The `McpService` automatically discovers all decorated methods at application startup
3. **Automatic Registration**: Each decorated method is registered with the MCP Server
4. **Result Formatting**: Return values are automatically formatted to match MCP's `CallToolResult` format

### Method Signature

The decorator uses a **wrapper pattern** that automatically transforms MCP arguments to your method's natural parameters.

**Single Parameter:**
```typescript
@McpTool({
  name: 'get_user',
  inputSchema: z.object({
    id: z.number(),
  }),
})
getUserById(id: number): User {
  // Clean, simple signature!
}
```

**Multiple Parameters:**
```typescript
@McpTool({
  name: 'create_user',
  inputSchema: z.object({
    name: z.string(),
    email: z.string(),
  }),
})
createUser(args: { name: string; email: string }): User {
  // Multiple params as object
}
```

**No Parameters:**
```typescript
@McpTool({
  name: 'list_users',
  inputSchema: z.object({}),
})
getAllUsers(): User[] {
  // No parameters needed
}
```

### Return Values

Your method can return:

1. **MCP Format** (already formatted):
   ```typescript
   return {
     content: [
       { type: 'text', text: 'Result text' }
     ]
   };
   ```

2. **Any other value** (will be automatically formatted):
   ```typescript
   return { data: 'value' }; // Automatically converted to MCP format
   ```

## Example: Registry Service

```typescript
import { Injectable } from '@nestjs/common';
import { McpTool } from '../mcp/decorators';
import * as z from 'zod/v4';

@Injectable()
export class RegistryService {
  @McpTool({
    name: 'list_registries',
    title: 'List Design System Registries',
    description: 'List all available design system registries',
    inputSchema: z.object({}),
  })
  getAllRegistries(): Registry[] {
    return this.registries;
  }

  @McpTool({
    name: 'get_registry',
    title: 'Get Registry Details',
    description: 'Get detailed information about a specific registry',
    inputSchema: z.object({
      name: z.string().describe('Name of the registry'),
    }),
  })
  getRegistryByName(name: string): Registry | undefined {
    // Clean signature - wrapper handles MCP object transformation
    return this.registries.find((registry) => registry.name === name);
  }

  @McpTool({
    name: 'get_component',
    inputSchema: z.object({
      registryName: z.string(),
      componentName: z.string(),
    }),
  })
  getComponent(args: { registryName: string; componentName: string }) {
    // Multiple parameters stay as object
    return this.findComponent(args.registryName, args.componentName);
  }
}
```

## Benefits

- **Declarative**: Use decorators to mark methods as MCP tools
- **Type-Safe**: Full TypeScript support with Zod schemas
- **Automatic**: No manual registration needed in McpService
- **Clean**: Keeps tool definitions close to implementation
- **Flexible**: Works with any NestJS service across the application
