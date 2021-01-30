import { Get, Controller, HttpCode, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { HealthCheckService } from './health.check.service';
import { PATH_METADATA } from '@nestjs/common/constants';
import { STATUS_MONITOR_OPTIONS_PROVIDER } from './status.monitor.constants';
import { StatusMonitorConfiguration } from './config/status.monitor.configuration';
import { StatusMonitoringService } from './status.monitoring.service';
const Handlebars = require('handlebars');

@Controller()
export class StatusMonitorController {
  data;
  render;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    @Inject(STATUS_MONITOR_OPTIONS_PROVIDER) config: StatusMonitorConfiguration,
    private readonly statusMonitoringService :StatusMonitoringService
  ) {
    const bodyClasses = Object.keys(config.chartVisibility)
      .reduce((accumulator, key) => {
        if (config.chartVisibility[key] === false) {
          accumulator.push(`hide-${key}`);
        }
        return accumulator;
      }, [])
      .join(' ');

    this.data = {
      title: config.title,
      port: config.port,
      socketPath: config.socketPath,
      path: config.path,
      bodyClasses: bodyClasses,
      script: fs.readFileSync(
        path.join(__dirname, '../src/public/javascripts/app.js'),
      ),
      style: fs.readFileSync(
        path.join(__dirname, '../src/public/stylesheets/', 'default.css'),
      ),
    };

    const htmlTmpl = fs
      .readFileSync(path.join(__dirname, '../src/public/index.html'))
      .toString();

    this.render = Handlebars.compile(htmlTmpl, { strict: true });
  }

  public static forRoot(rootPath: string = 'monitor') {
    Reflect.defineMetadata(PATH_METADATA, rootPath, StatusMonitorController);
    return StatusMonitorController;
  }

  @Get()
  @HttpCode(200)
  async root() {
    const healthData = await this.healthCheckService.checkAllEndpoints();
    this.data.healthCheckResults = healthData;
    return this.render(this.data);
  }

  @Get('/data')
  @HttpCode(200)
  async getData(){
    return this.statusMonitoringService.getData();
  }
}
