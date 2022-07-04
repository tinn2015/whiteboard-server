import { Controller, Get, Header, Res } from '@nestjs/common';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('content-type', 'text/html')
  getHello(@Res() res: any) {
    const file = fs.createReadStream(
      path.resolve(__dirname, '../white-board/index.html'),
    );
    file.pipe(res);
  }
}
