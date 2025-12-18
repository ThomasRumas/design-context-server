const { Test } = require('@nestjs/testing');
const { McpService } = require('./dist/mcp/mcp.service');
const { RegistryService } = require('./dist/registry/registry.service');
const { ConfigService } = require('@nestjs/config');
const { DiscoveryModule } = require('@nestjs/core');

async function testDiscovery() {
  console.log('\n=== Testing MCP Tool Discovery ===\n');
  
  const module = await Test.createTestingModule({
    providers: [ConfigService, McpService, RegistryService],
    imports: [DiscoveryModule],
  }).compile();

  const mcpService = module.get(McpService);
  
  console.log('\nTriggering onApplicationBootstrap...\n');
  await mcpService.onApplicationBootstrap();
  
  console.log('\n=== Discovery Complete ===\n');
}

testDiscovery().catch(console.error);
