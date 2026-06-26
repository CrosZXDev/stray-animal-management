import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockNotificationService: Partial<NotificationService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNotificationService = {
      getAll: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
      getUnread: vi.fn().mockResolvedValue([]),
      getUnreadCount: vi.fn().mockResolvedValue(3),
      markAsRead: vi.fn().mockResolvedValue({ count: 1 }),
      markAllAsRead: vi.fn().mockResolvedValue({ count: 5 }),
    };

    controller = new NotificationController(
      mockNotificationService as NotificationService,
    );
  });

  describe('GET /api/v1/notifications', () => {
    it('should return paginated notifications', async () => {
      const mockItems = [
        { id: '1', userId: 'user-1', title: 'Test', body: 'body', read: false, priority: 'MEDIUM', createdAt: new Date() },
      ];
      (mockNotificationService.getAll as any).mockResolvedValue({
        items: mockItems,
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.getNotifications(
        { user: { id: 'user-1' } },
        '1',
        '20',
        undefined,
      );

      expect(result).toEqual({ items: mockItems, total: 1, page: 1, limit: 20 });
      expect(mockNotificationService.getAll).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should return unread only when unreadOnly=true', async () => {
      const mockItems = [
        { id: '1', userId: 'user-1', title: 'Unread', body: 'body', read: false, priority: 'MEDIUM', createdAt: new Date() },
      ];
      (mockNotificationService.getUnread as any).mockResolvedValue(mockItems);

      const result = await controller.getNotifications(
        { user: { id: 'user-1' } },
        undefined,
        undefined,
        'true',
      );

      expect(result).toEqual({ items: mockItems, total: 1 });
      expect(mockNotificationService.getUnread).toHaveBeenCalledWith('user-1');
    });

    it('should use default pagination when no params provided', async () => {
      await controller.getNotifications({ user: { id: 'user-1' } }, undefined, undefined, undefined);

      expect(mockNotificationService.getAll).toHaveBeenCalledWith('user-1', 1, 20);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const result = await controller.getUnreadCount({ user: { id: 'user-1' } });

      expect(result).toEqual({ count: 3 });
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const result = await controller.markAsRead({ user: { id: 'user-1' } }, 'notif-123');

      expect(result).toEqual({ success: true });
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-123', 'user-1');
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const result = await controller.markAllAsRead({ user: { id: 'user-1' } });

      expect(result).toEqual({ success: true });
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });
});
