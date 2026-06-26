import { Controller, Get, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

/**
 * Controller for in-app notification endpoints.
 * GET /api/v1/notifications — list user's notifications (paginated)
 * GET /api/v1/notifications/unread-count — get unread notification count
 * GET /api/v1/notifications/preferences — get user's notification preferences
 * PATCH /api/v1/notifications/preferences — update notification preferences
 * PATCH /api/v1/notifications/:id/read — mark notification as read
 * PATCH /api/v1/notifications/read-all — mark all as read
 */
@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Filter to unread only' })
  @ApiResponse({ status: 200, description: 'Paginated notification list' })
  async getNotifications(
    @Req() req: { user?: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId = req.user?.id || '';

    if (unreadOnly === 'true') {
      const items = await this.notificationService.getUnread(userId);
      return { items, total: items.length };
    }

    return this.notificationService.getAll(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@Req() req: { user?: { id: string } }) {
    const userId = req.user?.id || '';
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'User notification preferences' })
  async getPreferences(@Req() req: { user?: { id: string } }) {
    const userId = req.user?.id || '';
    return this.notificationService.getPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Updated notification preferences' })
  async updatePreferences(
    @Req() req: { user?: { id: string } },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const userId = req.user?.id || '';
    return this.notificationService.updatePreferences(userId, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Req() req: { user?: { id: string } },
    @Param('id') id: string,
  ) {
    const userId = req.user?.id || '';
    await this.notificationService.markAsRead(id, userId);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: { user?: { id: string } }) {
    const userId = req.user?.id || '';
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }
}
