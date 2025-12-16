import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RegistryModule } from './registry/registry.module';
import { McpModule } from './mcp/mcp.module';
import * as RegistriesConfig from '../config/registries.json';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        () => ({
          registries: RegistriesConfig?.registries,
        }),
      ],
    }),
    RegistryModule,
    McpModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
