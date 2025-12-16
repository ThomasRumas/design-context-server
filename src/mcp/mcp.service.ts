import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';
import { RegistryService } from '../registry/registry.service';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private server: McpServer;
  public transport: StreamableHTTPServerTransport;

  constructor(private registryService: RegistryService) {
    this.initializeMcpServer();
    this.transport = this.createTransport();
  }

  async onApplicationBootstrap() {
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

    // Register MCP tools based on RegistryService methods
    this.registerRegistryTools();
    this.registerComponentTools();
  }

  private registerRegistryTools(): void {
    // List all registries
    this.server.registerTool(
      'list_registries',
      {
        title: 'List Design System Registries',
        description: 'List all available design system registries',
        inputSchema: z.object({}),
      },
      () => {
        const registries = this.registryService.getAllRegistries();
        return {
          content: [
            {
              type: 'text',
              text: `Available registries: ${registries.map((r) => r.name).join(', ')}`,
            },
          ],
        };
      },
    );

    // Get registry details
    this.server.registerTool(
      'get_registry',
      {
        title: 'Get Registry Details',
        description: 'Get detailed information about a specific registry',
        inputSchema: z.object({
          name: z.string().describe('Name of the registry'),
        }),
      },
      ({ name }) => {
        const registry = this.registryService.getRegistryByName(name);
        if (!registry) {
          return {
            content: [
              {
                type: 'text',
                text: `Registry '${name}' not found`,
              },
            ],
          };
        }

        const details = `
Name: ${registry.name}
Description: ${registry.description || 'N/A'}
Installation: ${registry.installCommand || 'N/A'}
Use Cases: ${registry.useCases?.join(', ') || 'N/A'}
Components: ${(registry.components || []).map((c) => c.name).join(', ') || 'N/A'}
`;

        return {
          content: [
            {
              type: 'text',
              text: details,
            },
          ],
        };
      },
    );
  }

  private registerComponentTools(): void {
    // List components in a registry
    this.server.registerTool(
      'list_components',
      {
        title: 'List Components in Registry',
        description: 'List all components available in a specific registry',
        inputSchema: z.object({
          registryName: z.string().describe('Name of the registry'),
        }),
      },
      ({ registryName }) => {
        const components =
          this.registryService.getComponentsByRegistryName(registryName);

        if (components.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No components found in registry '${registryName}'`,
              },
            ],
          };
        }

        const componentList = components
          .map(
            (c) =>
              `- ${c.name} (Markdown: ${c.markdownFilePaths?.length || 0}, Stories: ${c.storyFilePaths?.length || 0})`,
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Components in '${registryName}':\n${componentList}`,
            },
          ],
        };
      },
    );

    // Get component documentation
    this.server.registerTool(
      'get_component_docs',
      {
        title: 'Get Component Documentation',
        description: 'Get Markdown documentation for a specific component',
        inputSchema: z.object({
          registryName: z.string().describe('Name of the registry'),
          componentName: z.string().describe('Name of the component'),
        }),
      },
      ({ registryName, componentName }) => {
        const component = this.registryService.getComponentByName(
          registryName,
          componentName,
        );

        if (!component) {
          return {
            content: [
              {
                type: 'text',
                text: `Component '${componentName}' not found in registry '${registryName}'`,
              },
            ],
          };
        }

        // Return markdown file paths if available
        if (
          component.markdownFilePaths &&
          component.markdownFilePaths.length > 0
        ) {
          const markdownContent = component.markdownFilePaths.map((filePath) =>
            this.registryService.getFileContent(filePath),
          );
          return {
            content: [
              {
                type: 'text',
                text: `Documentation for ${componentName}:\n\n${markdownContent.join('\n---\n')}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `No documentation available for component '${componentName}'`,
            },
          ],
        };
      },
    );

    // Get component stories (code examples)
    this.server.registerTool(
      'get_component_stories',
      {
        title: 'Get Component Stories',
        description:
          'Get Storybook stories (code examples) for a specific component',
        inputSchema: z.object({
          registryName: z.string().describe('Name of the registry'),
          componentName: z.string().describe('Name of the component'),
        }),
      },
      ({ registryName, componentName }) => {
        const component = this.registryService.getComponentByName(
          registryName,
          componentName,
        );

        if (!component) {
          return {
            content: [
              {
                type: 'text',
                text: `Component '${componentName}' not found in registry '${registryName}'`,
              },
            ],
          };
        }

        // Return story file paths if available
        if (component.storyFilePaths && component.storyFilePaths.length > 0) {
          const storyContent = component.storyFilePaths.map((filePath) =>
            this.registryService.getFileContent(filePath),
          );

          return {
            content: [
              {
                type: 'text',
                text: `Storybook stories for ${componentName}:\n\n${storyContent.join('\n---\n')}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `No Storybook stories available for component '${componentName}'`,
            },
          ],
        };
      },
    );
  }

  createTransport(): StreamableHTTPServerTransport {
    return new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
  }
}
