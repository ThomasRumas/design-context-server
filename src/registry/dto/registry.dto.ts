import { Component } from './component.dto';

export interface Registry {
  name: string;
  installCommand: string;
  description: string;
  useCases: string[];
  components?: Component[];
}

export interface RegistryConfiguration {
  name: string;
  installCommand: string;
  description: string;
  useCases: string[];
  components: ComponentConfiguration;
}

export interface ComponentConfiguration {
  basePath: string;
  componentDir: string;
  componentSubDirs: string[];
  componentFileExtensions: string[];
  storiesDir: string;
  storiesSubDirs: string[];
  storiesFileExtensions: string[];
}
