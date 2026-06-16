import { Request, Response } from 'express';
import prisma from '../../config/database';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to prevent payload bloating
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to access encrypted Audit Engine' });
  }
};
