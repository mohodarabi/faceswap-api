import { Controller, Get, Header } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class DocsController {
  @Get('openapi.yaml')
  @Header('Content-Type', 'application/x-yaml; charset=utf-8')
  openApi() {
    return readFileSync(join(process.cwd(), 'docs', 'openapi.yaml'), 'utf8');
  }

  @Get('docs')
  @Header('Content-Type', 'text/html; charset=utf-8')
  docs() {
    return readFileSync(join(process.cwd(), 'docs', 'swagger.html'), 'utf8');
  }
}
