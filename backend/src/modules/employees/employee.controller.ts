import { Request, Response } from 'express';
import prisma from '../../config/database';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        salary_records: { orderBy: { payment_date: 'desc' } },
        evaluations: { orderBy: { evaluation_date: 'desc' } },
        documents: true
      }
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { employee_id, first_name, last_name, designation, department, dob, address, phone, hire_date } = req.body;
    const employee = await prisma.employee.create({
      data: {
        employee_id: employee_id || `EMP-${Date.now()}`,
        first_name, last_name, designation, department, address, phone,
        dob: dob ? new Date(dob) : null,
        hire_date: hire_date ? new Date(hire_date) : null
      }
    });
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create employee: ' + error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { first_name, last_name, designation, department, dob, address, phone, hire_date } = req.body;
    
    const updateData: any = { first_name, last_name, designation, department, address, phone };
    if (dob) updateData.dob = new Date(dob);
    if (hire_date) updateData.hire_date = new Date(hire_date);

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.salaryRecord.deleteMany({ where: { employee_id: id } });
    await prisma.performanceEvaluation.deleteMany({ where: { employee_id: id } });
    await prisma.document.deleteMany({ where: { employee_id: id } });
    await prisma.employee.delete({ where: { id } });
    res.json({ message: 'Employee deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

export const createSalaryRecord = async (req: Request, res: Response) => {
  try {
    const { employee_id, teacher_id, month, year, base_amount, allowances, deductions } = req.body;
    const net = Number(base_amount) + Number(allowances || 0) - Number(deductions || 0);
    const salary = await prisma.salaryRecord.create({
      data: {
        employee_id: employee_id || null,
        teacher_id: teacher_id || null,
        month: Number(month),
        year: Number(year),
        base_amount: Number(base_amount),
        allowances: Number(allowances || 0),
        deductions: Number(deductions || 0),
        net_amount: net,
        payment_date: new Date(),
        status: 'PAID'
      }
    });
    res.status(201).json(salary);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create salary record' });
  }
};

export const createPerformanceEvaluation = async (req: Request, res: Response) => {
  try {
    const { employee_id, teacher_id, student_id, score, remarks, evaluator_name } = req.body;
    const evaluation = await prisma.performanceEvaluation.create({
      data: {
        employee_id: employee_id || null,
        teacher_id: teacher_id || null,
        student_id: student_id || null,
        score: Number(score),
        remarks,
        evaluator_name
      }
    });
    res.status(201).json(evaluation);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
};
