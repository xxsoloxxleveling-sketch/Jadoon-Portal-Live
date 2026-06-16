import { Request, Response } from 'express';
import prisma from '../../config/database';

export const getNotifications = async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.json(notifications);
};

export const markAsRead = async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });

  res.json({ success: true });
};
