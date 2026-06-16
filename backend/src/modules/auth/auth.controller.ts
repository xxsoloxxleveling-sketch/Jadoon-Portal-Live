import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';

export const login = async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('FATAL: JWT_SECRET is not defined in the environment.');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      jwtSecret, 
      { expiresIn: '8h' }
    );

    return res.json({ token, role: user.role });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response): Promise<any> => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true, studentProfile: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  let name = user.email.split('@')[0];
  if (user.studentProfile) name = `${user.studentProfile.first_name} ${user.studentProfile.last_name}`;
  if (user.teacherProfile) name = `Teacher ${user.teacherProfile.employee_id}`;
  if (user.role === 'SUPER_ADMIN') name = 'System Administrator';

  res.json({ name, role: user.role, email: user.email });
};

export const createAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: 'ADMIN' // Strictly creating normal admins
      }
    });

    res.status(201).json({ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to provision Admin account' });
  }
};
