import { Controller, Get, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Get(':group')
  getGroup(@Param('group') group: string) {
    return this.settingsService.getGroup(group);
  }

  @Put()
  update(@Body() body: Record<string, any>, @Req() req: any) {
    return this.settingsService.update(body, req.user.id, req.ip);
  }
}
