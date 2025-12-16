import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { RegistryService } from '../registry/registry.service';
import { ConfigService } from '@nestjs/config';

describe('McpService', () => {
  let service: McpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, McpService, RegistryService],
      imports: [],
    }).compile();

    service = module.get<McpService>(McpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
