import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Component } from './dto/component.dto';
import type {
  Registry,
  RegistryConfiguration,
  ComponentConfiguration,
} from './dto/registry.dto';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class RegistryService {
  private registries: Registry[] = [];
  private readonly registriesConfig: RegistryConfiguration[];
  private readonly logger = new Logger(RegistryService.name);

  constructor(private configService: ConfigService) {
    this.registriesConfig =
      this.configService.get<RegistryConfiguration[]>('registries') || [];
    this.discoverAndRegisterComponents();
    if (this.registries.length === 0) {
      this.logger.warn('No registries found in configuration.');
    } else {
      this.logger.log(
        `Loaded ${this.registries.length} registries from configuration.`,
      );
    }
  }

  getAllRegistries(): Registry[] {
    return this.registries;
  }

  getRegistryByName(name: string): Registry | undefined {
    return this.registries.find((registry) => registry.name === name);
  }

  addRegistry(registry: Registry): void {
    this.registries.push(registry);
  }

  updateRegistry(name: string, updatedRegistry: Registry): void {
    const index = this.registries.findIndex(
      (registry) => registry.name === name,
    );
    if (index !== -1) {
      this.registries[index] = updatedRegistry;
    }
  }

  deleteRegistry(name: string): void {
    this.registries = this.registries.filter(
      (registry) => registry.name !== name,
    );
  }

  getComponentsByRegistryName(name: string): Component[] {
    const registry = this.getRegistryByName(name);
    if (!registry) {
      this.logger.warn(`Registry not found: ${name}`);
      return [];
    }
    return registry.components || [];
  }

  getComponentByName(
    registryName: string,
    componentName: string,
  ): Component | undefined {
    const registry = this.getRegistryByName(registryName);
    if (!registry) {
      this.logger.warn(`Registry not found: ${registryName}`);
      return undefined;
    }

    const component = registry.components?.find(
      (component) => component.name === componentName,
    );

    if (!component) {
      this.logger.warn(
        `Component not found: ${componentName} in registry: ${registryName}`,
      );
    }

    return component;
  }

  // Method to get the content of a file by its path
  getFileContent(filePath: string): string {
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found: ${filePath}`);
        return '';
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      this.logger.error(`Error reading file ${filePath}: ${error}`);
      return '';
    }
  }

  private discoverAndRegisterComponents(): void {
    this.logger.log('Starting component discovery...');

    for (const registryConfig of this.registriesConfig) {
      this.logger.log(
        `Discovering components for registry: ${registryConfig.name}`,
      );

      const registry: Registry = {
        name: registryConfig.name,
        installCommand: registryConfig.installCommand,
        description: registryConfig.description,
        useCases: registryConfig.useCases,
        components: [],
      };

      const components = this.discoverComponents(registryConfig.components);

      registry.components = components;
      this.addRegistry(registry);

      this.logger.log(
        `Discovered ${components.length} components for registry: ${registryConfig.name}`,
      );
    }

    this.logger.log(
      `Component discovery completed. Total registries: ${this.registries.length}`,
    );
  }

  private discoverComponents(config: ComponentConfiguration): Component[] {
    const components: Component[] = [];
    const workspaceRoot = process.cwd();

    // Discover components from each subdirectory
    for (const subDir of config.componentSubDirs) {
      const componentBasePath = path.join(
        workspaceRoot,
        config.basePath,
        config.componentDir,
        subDir,
      );

      if (!fs.existsSync(componentBasePath)) {
        this.logger.warn(
          `Component directory does not exist: ${componentBasePath}`,
        );
        continue;
      }

      // Get all component folders
      const componentFolders = this.getDirectories(componentBasePath);

      for (const componentFolder of componentFolders) {
        const componentName = componentFolder;
        const componentPath = path.join(componentBasePath, componentFolder);

        // Find markdown files
        const markdownFilePaths = this.findMarkdownFiles(
          componentPath,
          config.componentFileExtensions,
        );

        if (markdownFilePaths.length === 0) {
          this.logger.debug(
            `No markdown files found for component: ${componentName}`,
          );
          continue;
        }

        // Find story files
        const storyFilePaths = this.findStoryFiles(
          componentName,
          config,
          workspaceRoot,
        );

        const component: Component = {
          name: componentName,
          markdownFilePaths,
          storyFilePaths:
            storyFilePaths.length > 0 ? storyFilePaths : undefined,
        };

        components.push(component);
        this.logger.debug(
          `Registered component: ${componentName} with ${markdownFilePaths.length} markdown files and ${storyFilePaths.length} story files`,
        );
      }
    }

    return components;
  }

  private getDirectories(dirPath: string): string[] {
    try {
      return fs
        .readdirSync(dirPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    } catch (error) {
      this.logger.error(`Error reading directory ${dirPath}: ${error}`);
      return [];
    }
  }

  private findMarkdownFiles(
    componentPath: string,
    extensions: string[],
  ): string[] {
    const markdownFiles: string[] = [];

    try {
      const files = fs.readdirSync(componentPath);

      for (const file of files) {
        const filePath = path.join(componentPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            markdownFiles.push(filePath);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error finding markdown files in ${componentPath}: ${error}`,
      );
    }

    return markdownFiles;
  }

  private findStoryFiles(
    componentName: string,
    config: ComponentConfiguration,
    workspaceRoot: string,
  ): string[] {
    const storyFiles: string[] = [];

    // Search in story directories
    for (const storySubDir of config.storiesSubDirs) {
      const storyBasePath = path.join(
        workspaceRoot,
        config.basePath,
        config.storiesDir,
        storySubDir,
      );

      if (!fs.existsSync(storyBasePath)) {
        continue;
      }

      // Look for story files matching the component name
      const componentStoryPath = path.join(storyBasePath, componentName);

      if (
        fs.existsSync(componentStoryPath) &&
        fs.statSync(componentStoryPath).isDirectory()
      ) {
        // Component has its own story directory - only get files from root level
        const files = this.findFilesInDirectoryRoot(
          componentStoryPath,
          config.storiesFileExtensions,
        );
        storyFiles.push(...files);
      } else {
        // Look for story files directly in the base story path
        const files = this.findFilesInDirectory(
          storyBasePath,
          componentName,
          config.storiesFileExtensions,
        );
        storyFiles.push(...files);
      }
    }

    return storyFiles;
  }

  private findFilesInDirectory(
    dirPath: string,
    componentName: string,
    extensions: string[],
  ): string[] {
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          const fileName = path.basename(item, path.extname(item));
          const ext = path.extname(item);

          // Check if file name contains component name and has correct extension
          if (
            fileName.toLowerCase().includes(componentName.toLowerCase()) &&
            extensions.includes(ext)
          ) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error finding files in ${dirPath}: ${error}`);
    }

    return files;
  }

  private findFilesInDirectoryRoot(
    dirPath: string,
    extensions: string[],
  ): string[] {
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        // Only include files (not directories) from the root level
        if (item.isFile()) {
          if (extensions.some((ext) => item.name.includes(ext))) {
            const fullPath = path.join(dirPath, item.name);
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error finding files in ${dirPath}: ${error}`);
    }

    return files;
  }
}
