import { Controller, Post, Req, Res } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post('')
  async postMcpEndpoint(
    @Req() request: IncomingMessage & { auth?: any; body?: any },
    @Res() response: ServerResponse<IncomingMessage>,
  ) {
    await this.mcpService.transport.handleRequest(
      request,
      response,
      request.body,
    );
  }
}
