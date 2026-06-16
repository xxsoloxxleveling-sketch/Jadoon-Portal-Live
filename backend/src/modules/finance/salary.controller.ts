import { Request, Response } from 'express';
import prisma from '../../config/database';

export const createSalaryRecord = async (req: Request, res: Response) => {
  try {
    const { month, year, base_amount, allowances = 0, deductions = 0, teacher_id, employee_id, status = 'PENDING' } = req.body;

    if (!teacher_id && !employee_id) {
      return res.status(400).json({ error: 'Either teacher_id or employee_id is required' });
    }

    const net_amount = base_amount + allowances - deductions;

    const record = await prisma.salaryRecord.create({
      data: {
        month,
        year,
        base_amount,
        allowances,
        deductions,
        net_amount,
        status,
        teacher_id: teacher_id || null,
        employee_id: employee_id || null
      },
      include: {
        teacher: true,
        employee: true
      }
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating salary record:', error);
    res.status(500).json({ error: 'Failed to create salary record' });
  }
};

export const getSalaryRecords = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    const query: any = {};
    if (month) query.month = parseInt(month as string);
    if (year) query.year = parseInt(year as string);

    const records = await prisma.salaryRecord.findMany({
      where: query,
      include: {
        teacher: true,
        employee: true
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching salary records:', error);
    res.status(500).json({ error: 'Failed to fetch salary records' });
  }
};

export const updateSalaryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, payment_date } = req.body;

    const record = await prisma.salaryRecord.update({
      where: { id: String(id) },
      data: {
        status,
        payment_date: payment_date ? new Date(payment_date) : undefined
      },
      include: {
        teacher: true,
        employee: true
      }
    });

    res.json(record);
  } catch (error) {
    console.error('Error updating salary status:', error);
    res.status(500).json({ error: 'Failed to update salary status' });
  }
};
