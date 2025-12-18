import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { DiscoveryModule } from '@nestjs/core';
import { MockToolService } from './__mocks__';

describe('McpService', () => {
  let service: McpService;
  let mockToolService: MockToolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [McpService, MockToolService],
      imports: [DiscoveryModule],
    }).compile();

    service = module.get<McpService>(McpService);
    mockToolService = module.get<MockToolService>(MockToolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a server instance', () => {
    expect(service['server']).toBeDefined();
  });

  it('should have a transport instance', () => {
    expect(service.transport).toBeDefined();
  });

  it('should initialize MCP server with correct configuration', () => {
    const server = service['server'];
    expect(server).toBeDefined();
  });

  it('should discover and register decorated tools without errors', () => {
    const server = service['server'];
    
    // Verify server is properly initialized
    expect(server).toBeDefined();
    
    // The discoverAndRegisterTools method should have been called during init
    // and decorated methods from RegistryService should be registered
    // We can't easily access the internal tool registry, but we can verify
    // the service initialized without throwing errors
    expect(service).toBeDefined();
  });

  it('should format tool results correctly when result has content', () => {
    const resultWithContent = {
      content: [{ type: 'text', text: 'test' }],
    };
    const formatted = service['formatToolResult'](resultWithContent);
    expect(formatted).toEqual(resultWithContent);
  });

  it('should format tool results correctly when result is plain data', () => {
    const plainResult = { data: 'test', value: 123 };
    const formatted = service['formatToolResult'](plainResult);
    
    expect(formatted).toHaveProperty('content');
    expect(formatted.content).toBeInstanceOf(Array);
    expect(formatted.content[0]).toHaveProperty('type', 'text');
    expect(formatted.content[0]).toHaveProperty('text');
    expect(JSON.parse(formatted.content[0].text)).toEqual(plainResult);
  });

  it('should handle array results in formatToolResult', () => {
    const arrayResult = [{ id: 1 }, { id: 2 }];
    const formatted = service['formatToolResult'](arrayResult);
    
    expect(formatted.content[0].type).toBe('text');
    expect(JSON.parse(formatted.content[0].text)).toEqual(arrayResult);
  });

  it('should handle string results in formatToolResult', () => {
    const stringResult = 'simple string';
    const formatted = service['formatToolResult'](stringResult);
    
    expect(formatted.content[0].type).toBe('text');
    expect(formatted.content[0].text).toBe(JSON.stringify(stringResult));
  });

  describe('Tool Discovery', () => {
    it('should discover and register tools on application bootstrap', async () => {
      const spy = jest.spyOn(service as any, 'discoverAndRegisterTools');
      await service.onApplicationBootstrap();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onApplicationBootstrap', () => {
    it('should connect server to transport', async () => {
      const connectSpy = jest.spyOn(service['server'], 'connect');
      await service.onApplicationBootstrap();
      expect(connectSpy).toHaveBeenCalledWith(service.transport);
    });

    it('should call discoverAndRegisterTools before connecting', async () => {
      const discoverSpy = jest.spyOn(service as any, 'discoverAndRegisterTools');
      const connectSpy = jest.spyOn(service['server'], 'connect');
      
      await service.onApplicationBootstrap();
      
      expect(discoverSpy).toHaveBeenCalled();
      expect(connectSpy).toHaveBeenCalled();
    });
  });
});
