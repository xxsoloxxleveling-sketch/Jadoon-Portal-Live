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

import PDFDocument from 'pdfkit';
import { logoBase64 } from './logoData';

export const getSalarySlipPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salary = await prisma.salaryRecord.findUnique({
      where: { id: String(id) },
      include: {
        teacher: true,
        employee: true
      }
    });

    if (!salary) return res.status(404).json({ error: 'Salary record not found.' });

    const person = salary.teacher || salary.employee;
    const role = salary.teacher ? 'Teacher' : 'Employee';
    const employeeId = person?.employee_id || 'N/A';
    const name = `${person?.first_name || ''} ${person?.last_name || ''}`.trim();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename=Salary_Slip_${employeeId}_${salary.month}_${salary.year}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    if (logoBase64) {
      try {
        const logoBuffer = Buffer.from(logoBase64, 'base64');
        doc.image(logoBuffer, 50, 40, { width: 60 });
      } catch(e) {}
    }

    doc.fontSize(22).font('Helvetica-Bold').text('JADOON PUBLIC SCHOOL & COLLEGE', 120, 50, { align: 'left' });
    doc.fontSize(14).font('Helvetica').text('Salary Slip', 120, 75, { align: 'left' });
    
    doc.moveTo(50, 110).lineTo(545, 110).lineWidth(2).stroke();
    doc.moveDown(2);

    let curY = 130;

    const drawRow = (label1: string, val1: string, label2: string, val2: string, y: number) => {
      doc.fontSize(10).font('Helvetica-Bold').text(label1, 50, y);
      doc.font('Helvetica').text(val1, 150, y);
      if (label2) {
        doc.font('Helvetica-Bold').text(label2, 320, y);
        doc.font('Helvetica').text(val2, 420, y);
      }
    };

    doc.fontSize(14).font('Helvetica-Bold').text('Employee Information', 50, curY);
    curY += 25;
    drawRow('Full Name:', name, 'Employee ID:', employeeId, curY);
    curY += 20;
    drawRow('Role:', role, 'Designation:', person?.designation || 'N/A', curY);
    curY += 20;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    drawRow('Salary Month:', `${months[salary.month - 1]} ${salary.year}`, 'Status:', salary.status, curY);

    curY += 40;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(1).stroke();
    curY += 20;
    
    doc.fontSize(14).font('Helvetica-Bold').text('Salary Details', 50, curY);
    curY += 25;
    
    drawRow('Base Amount:', `Rs. ${salary.base_amount.toLocaleString()}`, '', '', curY);
    curY += 20;
    drawRow('Allowances/Bonus:', `+ Rs. ${salary.allowances.toLocaleString()}`, '', '', curY);
    curY += 20;
    drawRow('Deductions:', `- Rs. ${salary.deductions.toLocaleString()}`, '', '', curY);
    
    curY += 30;
    doc.moveTo(50, curY).lineTo(250, curY).lineWidth(1).stroke();
    curY += 15;
    
    doc.fontSize(12).font('Helvetica-Bold').text('Net Payable:', 50, curY);
    doc.fontSize(12).font('Helvetica-Bold').text(`Rs. ${salary.net_amount.toLocaleString()}`, 150, curY);

    curY += 80;
    doc.fontSize(10).font('Helvetica').text('Note: This is a computer generated document and does not require a physical signature.', 50, curY, { align: 'center', width: 495 });

    doc.end();
  } catch (err: any) {
    console.error('Error generating salary slip:', err);
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
};
