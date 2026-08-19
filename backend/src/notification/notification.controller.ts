import { Controller, Get, Put, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Request() req: any, @Query('unread') unread?: string) {
    return this.notificationService.findAll(req.user.id, unread === 'true');
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Put('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Get('unread-count')
  countUnread(@Request() req: any) {
    return this.notificationService.countUnread(req.user.id);
  }
}
