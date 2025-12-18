# MCP Mock Services

This folder contains mock services for testing the MCP Tool decorator system.

## Purpose

These mock services allow testing of the `@McpTool()` decorator without depending on external services or configurations. This is especially important when:

- Exposing the MCP module as a reusable library
- Running tests in isolated environments
- Testing the decorator system independently

## MockToolService

A simple mock service that demonstrates all features of the `@McpTool()` decorator:

### Tools Exposed

1. **list_mock_users** - Returns all mock users
2. **get_mock_user** - Get a user by ID
3. **create_mock_user** - Create a new user
4. **search_mock_users** - Search users by name
5. **get_mock_user_stats** - Get user statistics

### Features Demonstrated

- **Empty input schema** (`list_mock_users`, `get_mock_user_stats`)
- **Single parameter** (`get_mock_user`)
- **Multiple parameters** (`create_mock_user`)
- **String validation** (`search_mock_users`)
- **Complex return types** (objects, arrays, computed values)
- **Dual parameter support** (both direct calls and MCP object format)

### Usage in Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from '../mcp.service';
import { MockToolService } from './__mocks__';
import { DiscoveryModule } from '@nestjs/core';

const module: TestingModule = await Test.createTestingModule({
  providers: [McpService, MockToolService],
  imports: [DiscoveryModule],
}).compile();
```

## Creating Your Own Mock Service

To create a new mock service for testing:

1. Create a service class decorated with `@Injectable()`
2. Add methods decorated with `@McpTool()`
3. Implement dual parameter support:

```typescript
import { Injectable } from '@nestjs/common';
import { McpTool } from '../decorators';
import * as z from 'zod/v4';

@Injectable()
export class MyMockService {
  @McpTool({
    name: 'my_tool',
    title: 'My Tool',
    description: 'Tool description',
    inputSchema: z.object({
      param: z.string(),
    }),
  })
  myMethod(paramOrArgs: string | { param: string }) {
    const param = typeof paramOrArgs === 'string' ? paramOrArgs : paramOrArgs.param;
    // Implementation
  }
}
```

## Testing Guidelines

- Always reset service state in `beforeEach` when testing stateful services
- Test both direct calls and MCP object format for parameters
- Verify that non-decorated methods are NOT registered as tools
- Check metadata is properly attached to decorated methods

## Benefits

- **No external dependencies** - Tests run without database or config files
- **Predictable data** - Consistent test results
- **Fast execution** - No I/O operations
- **Reusable** - Can be imported by external applications
- **Comprehensive** - Demonstrates all decorator features
