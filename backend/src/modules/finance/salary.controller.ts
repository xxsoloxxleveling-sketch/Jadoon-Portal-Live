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

export const getSalaryStatementPdf = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params; // type = 'teacher' | 'employee'
    
    let person: any = null;
    let records = [];

    if (type === 'teacher') {
      person = await prisma.teacher.findUnique({ where: { id } });
      records = await prisma.salaryRecord.findMany({ where: { teacher_id: id }, orderBy: [{ year: 'asc' }, { month: 'asc' }] });
    } else if (type === 'employee') {
      person = await prisma.employee.findUnique({ where: { id } });
      records = await prisma.salaryRecord.findMany({ where: { employee_id: id }, orderBy: [{ year: 'asc' }, { month: 'asc' }] });
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    if (!person) return res.status(404).json({ error: 'Person not found' });

    const employeeId = person.employee_id || 'N/A';
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename=Salary_Statement_${employeeId}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    if (logoBase64) {
      try {
        const logoBuffer = Buffer.from(logoBase64, 'base64');
        doc.image(logoBuffer, 50, 40, { width: 60 });
      } catch(e) {}
    }

    doc.fontSize(22).font('Helvetica-Bold').text('JADOON PUBLIC SCHOOL & COLLEGE', 120, 50, { align: 'left' });
    doc.fontSize(14).font('Helvetica').text('Salary Statement', 120, 75, { align: 'left' });
    
    doc.moveTo(50, 110).lineTo(545, 110).lineWidth(2).stroke();
    doc.moveDown(2);

    let curY = 130;
    doc.fontSize(12).font('Helvetica-Bold').text('Employee Details:', 50, curY);
    curY += 20;
    doc.fontSize(10).font('Helvetica').text(`Name: ${name}`, 50, curY);
    doc.text(`Employee ID: ${employeeId}`, 300, curY);
    curY += 15;
    doc.text(`Role: ${type === 'teacher' ? 'Teacher' : 'Employee'}`, 50, curY);
    doc.text(`Designation: ${person.designation || 'N/A'}`, 300, curY);
    
    curY += 30;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(1).stroke();
    curY += 10;

    // Table Header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Month/Year', 50, curY);
    doc.text('Base', 150, curY);
    doc.text('Allowances', 220, curY);
    doc.text('Deductions', 310, curY);
    doc.text('Net Pay', 400, curY);
    doc.text('Status', 480, curY);
    
    curY += 15;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(0.5).stroke();
    curY += 10;

    doc.font('Helvetica');
    let totalBase = 0, totalNet = 0;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    records.forEach(r => {
      if (curY > 750) {
        doc.addPage();
        curY = 50;
      }
      doc.text(`${months[r.month - 1]} ${r.year}`, 50, curY);
      doc.text(`Rs.${r.base_amount}`, 150, curY);
      doc.text(`Rs.${r.allowances}`, 220, curY);
      doc.text(`Rs.${r.deductions}`, 310, curY);
      doc.text(`Rs.${r.net_amount}`, 400, curY);
      doc.text(r.status, 480, curY);
      
      totalBase += r.base_amount;
      totalNet += r.net_amount;
      curY += 20;
    });

    curY += 10;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(1).stroke();
    curY += 15;

    doc.font('Helvetica-Bold');
    doc.text('Totals:', 50, curY);
    doc.text(`Rs.${totalBase}`, 150, curY);
    doc.text(`Rs.${totalNet}`, 400, curY);

    curY += 60;
    if (curY > 750) {
      doc.addPage();
      curY = 50;
    }
    doc.fontSize(10).font('Helvetica').text('Note: This is a computer generated document and does not require a physical signature.', 50, curY, { align: 'center', width: 495 });

    doc.end();
  } catch (err: any) {
    console.error('Error generating salary statement:', err);
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
};
