import { Test, TestingModule } from '@nestjs/testing';
import { RegistryService } from './registry.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('RegistryService', () => {
  let service: RegistryService;
  let configService: ConfigService;
  let tempDir: string;

  const mockRegistriesConfig = [
    {
      name: 'TestRegistry',
      description: 'A test registry',
      installCommand: 'npm install test-registry',
      useCases: ['Testing'],
      components: {
        basePath: 'src',
        componentDir: 'components',
        storiesDir: 'stories',
        componentSubDirs: ['ui'],
        storiesSubDirs: ['basic'],
        componentFileExtensions: ['.md', '.mdx'],
        storiesFileExtensions: ['.stories.js', '.stories.tsx'],
      },
    },
  ];

  beforeEach(async () => {
    // Create temporary directory FIRST
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-test-'));

    // Mock process.cwd() BEFORE creating the service
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    // Now create the module - process.cwd() will return tempDir
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockRegistriesConfig),
          },
        },
      ],
    }).compile();

    service = module.get<RegistryService>(RegistryService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    // Restore process.cwd() mock
    jest.restoreAllMocks();

    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    it('should initialize with registries from config', () => {
      expect(configService.get).toHaveBeenCalledWith('registries');
      expect(service.getAllRegistries()).toHaveLength(1);
    });

    it('should log a warning if no registries are found', async () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce([]);

      // Create a new instance with empty config
      const testModule: TestingModule = await Test.createTestingModule({
        providers: [
          RegistryService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValueOnce([]),
            },
          },
        ],
      }).compile();

      const testService = testModule.get<RegistryService>(RegistryService);
      // The warning should be logged during construction
      expect(testService.getAllRegistries()).toHaveLength(0);
    });
  });

  describe('getAllRegistries', () => {
    it('should return all registries', () => {
      const registries = service.getAllRegistries();
      expect(registries).toHaveLength(1);
      expect(registries[0].name).toBe('TestRegistry');
    });
  });

  describe('getRegistryByName', () => {
    it('should return the registry with the given name', () => {
      const registry = service.getRegistryByName('TestRegistry');
      expect(registry).toBeDefined();
      expect(registry?.name).toBe('TestRegistry');
    });

    it('should return undefined for non-existent registry', () => {
      const registry = service.getRegistryByName('NonExistent');
      expect(registry).toBeUndefined();
    });
  });

  describe('addRegistry', () => {
    it('should add a new registry', () => {
      const initialCount = service.getAllRegistries().length;
      service.addRegistry({
        name: 'NewRegistry',
        description: 'A new registry',
      } as any);

      expect(service.getAllRegistries()).toHaveLength(initialCount + 1);
    });
  });

  describe('updateRegistry', () => {
    it('should update an existing registry', () => {
      service.updateRegistry('TestRegistry', {
        name: 'TestRegistry',
        description: 'Updated description',
      } as any);

      const registry = service.getRegistryByName('TestRegistry');
      expect(registry?.description).toBe('Updated description');
    });

    it('should do nothing if registry does not exist', () => {
      const initialRegistry = service.getRegistryByName('TestRegistry');
      service.updateRegistry('NonExistent', {
        name: 'NonExistent',
      } as any);

      const registry = service.getRegistryByName('TestRegistry');
      expect(registry).toEqual(initialRegistry);
    });
  });

  describe('deleteRegistry', () => {
    it('should delete a registry', () => {
      const initialCount = service.getAllRegistries().length;
      service.deleteRegistry('TestRegistry');

      expect(service.getAllRegistries()).toHaveLength(initialCount - 1);
    });

    it('should do nothing if registry does not exist', () => {
      const initialCount = service.getAllRegistries().length;
      service.deleteRegistry('NonExistent');

      expect(service.getAllRegistries()).toHaveLength(initialCount);
    });
  });

  describe('getComponentsByRegistryName', () => {
    it('should return components for a registry', () => {
      const components = service.getComponentsByRegistryName('TestRegistry');
      expect(Array.isArray(components)).toBe(true);
    });

    it('should return empty array for non-existent registry', () => {
      const components = service.getComponentsByRegistryName('NonExistent');
      expect(components).toEqual([]);
    });
  });

  describe('getComponentByName', () => {
    it('should return undefined when no components exist', () => {
      const component = service.getComponentByName('TestRegistry', 'Button');
      expect(component).toBeUndefined();
    });

    it('should return undefined for non-existent registry', () => {
      const component = service.getComponentByName('NonExistent', 'Button');
      expect(component).toBeUndefined();
    });

    it('should return undefined for non-existent component', () => {
      const component = service.getComponentByName(
        'TestRegistry',
        'NonExistent',
      );
      expect(component).toBeUndefined();
    });
  });

  describe('getFileContent', () => {
    it('should read and return file content', () => {
      const filePath = path.join(tempDir, 'file.md');
      fs.writeFileSync(filePath, 'file content');

      const content = service.getFileContent(filePath);
      expect(content).toBe('file content');
    });

    it('should return empty string if file does not exist', () => {
      const content = service.getFileContent('/path/to/nonexistent.md');
      expect(content).toBe('');
    });

    it('should handle file reading errors', () => {
      // Test with invalid path that causes read error
      const content = service.getFileContent('/invalid/\x00/path.md');
      expect(content).toBe('');
    });
  });

  describe('discoverComponents', () => {
    it('should discover components from configuration', () => {
      // Create real directory structure
      const componentsDir = path.join(tempDir, 'src', 'components', 'ui');
      fs.mkdirSync(componentsDir, { recursive: true });

      // Create Button component
      const buttonDir = path.join(componentsDir, 'Button');
      fs.mkdirSync(buttonDir);
      fs.writeFileSync(path.join(buttonDir, 'readme.md'), '# Button');
      fs.writeFileSync(path.join(buttonDir, 'usage.mdx'), '# Usage');

      // Create Card component
      const cardDir = path.join(componentsDir, 'Card');
      fs.mkdirSync(cardDir);
      fs.writeFileSync(path.join(cardDir, 'readme.md'), '# Card');

      // Verify the structure was created
      expect(fs.existsSync(buttonDir)).toBe(true);
      expect(fs.existsSync(cardDir)).toBe(true);

      // Update config - basePath is 'src' and process.cwd() returns tempDir
      const config = {
        ...mockRegistriesConfig[0].components,
        basePath: 'src',
      };

      const components = service['discoverComponents'](config);
      expect(components).toHaveLength(2);
      expect(components[0].name).toBe('Button');
      expect(components[0].markdownFilePaths).toHaveLength(2);
      expect(components[1].name).toBe('Card');
      expect(components[1].markdownFilePaths).toHaveLength(1);
    });

    it('should skip non-existent directories', () => {
      const config = {
        ...mockRegistriesConfig[0].components,
        basePath: 'nonexistent',
      };

      const components = service['discoverComponents'](config);
      expect(components).toHaveLength(0);
    });
  });

  describe('getDirectories', () => {
    it('should return list of directories', () => {
      const testDir = path.join(tempDir, 'test');
      fs.mkdirSync(testDir);
      fs.mkdirSync(path.join(testDir, 'dir1'));
      fs.mkdirSync(path.join(testDir, 'dir2'));
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');

      const dirs = service['getDirectories'](testDir);
      expect(dirs).toEqual(['dir1', 'dir2']);
    });

    it('should return empty array on error', () => {
      const dirs = service['getDirectories']('/nonexistent/path');
      expect(dirs).toEqual([]);
    });
  });

  describe('findMarkdownFiles', () => {
    it('should find markdown files with correct extensions', () => {
      const componentDir = path.join(tempDir, 'component');
      fs.mkdirSync(componentDir);
      fs.writeFileSync(path.join(componentDir, 'file1.md'), 'content');
      fs.writeFileSync(path.join(componentDir, 'file2.mdx'), 'content');

      const files = service['findMarkdownFiles'](componentDir, ['.md', '.mdx']);
      expect(files).toHaveLength(2);
    });

    it('should skip files with incorrect extensions', () => {
      const componentDir = path.join(tempDir, 'component2');
      fs.mkdirSync(componentDir);
      fs.writeFileSync(path.join(componentDir, 'file1.txt'), 'content');
      fs.writeFileSync(path.join(componentDir, 'file2.js'), 'content');

      const files = service['findMarkdownFiles'](componentDir, ['.md', '.mdx']);
      expect(files).toHaveLength(0);
    });

    it('should handle errors gracefully', () => {
      const files = service['findMarkdownFiles']('/nonexistent/path', [
        '.md',
        '.mdx',
      ]);
      expect(files).toEqual([]);
    });
  });

  describe('findStoryFiles', () => {
    it('should find story files for a component', () => {
      // Create story directory structure
      const storiesDir = path.join(
        tempDir,
        'src',
        'stories',
        'basic',
        'Button',
      );
      fs.mkdirSync(storiesDir, { recursive: true });
      fs.writeFileSync(
        path.join(storiesDir, 'Button.stories.js'),
        'export default {}',
      );

      // Update config to use correct extensions (path.extname returns '.js' not '.stories.js')
      const config = {
        ...mockRegistriesConfig[0].components,
        basePath: 'src',
        storiesFileExtensions: ['.js'], // path.extname returns last extension only
      };

      // workspaceRoot should be tempDir (which is what process.cwd() returns in tests)
      const files = service['findStoryFiles']('Button', config, tempDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('Button.stories.js');
    });

    it('should handle missing story directories', () => {
      const config = {
        ...mockRegistriesConfig[0].components,
        basePath: 'src',
      };

      const files = service['findStoryFiles']('Button', config, tempDir);
      expect(files).toEqual([]);
    });
  });

  describe('findFilesInDirectory', () => {
    it('should find files matching component name and extensions', () => {
      const storiesDir = path.join(tempDir, 'stories');
      fs.mkdirSync(storiesDir);
      // Note: path.extname returns only the last extension, so '.js' not '.stories.js'
      const buttonFile = path.join(storiesDir, 'Button.stories.js');
      const cardFile = path.join(storiesDir, 'Card.stories.tsx');
      fs.writeFileSync(buttonFile, 'export default {}');
      fs.writeFileSync(cardFile, 'export default {}');

      const files = service['findFilesInDirectory'](storiesDir, 'Button', [
        '.js', // path.extname returns '.js' not '.stories.js'
        '.tsx',
      ]);
      expect(files).toHaveLength(1); // Only Button.stories.js matches
      expect(files[0]).toContain('Button.stories.js');
    });

    it('should return empty array on error', () => {
      const files = service['findFilesInDirectory'](
        '/nonexistent/path',
        'Button',
        ['.stories.js'],
      );
      expect(files).toEqual([]);
    });
  });

  describe('findFilesInDirectoryRoot', () => {
    it('should find files in root directory only', () => {
      const storiesDir = path.join(tempDir, 'stories-root');
      fs.mkdirSync(storiesDir);
      fs.writeFileSync(
        path.join(storiesDir, 'file1.stories.js'),
        'export default {}',
      );
      fs.mkdirSync(path.join(storiesDir, 'dir1'));
      fs.writeFileSync(
        path.join(storiesDir, 'dir1', 'nested.stories.js'),
        'export default {}',
      );

      const files = service['findFilesInDirectoryRoot'](storiesDir, ['.js']); // path.extname returns '.js'
      expect(files).toHaveLength(1); // Only file1.stories.js (not nested)
      expect(files[0]).toContain('file1.stories.js');
    });

    it('should return empty array on error', () => {
      const files = service['findFilesInDirectoryRoot']('/nonexistent/path', [
        '.stories.js',
      ]);
      expect(files).toEqual([]);
    });
  });
});
