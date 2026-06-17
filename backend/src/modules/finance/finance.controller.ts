import { Request, Response } from 'express';
import prisma from '../../config/database';
import PDFDocument from 'pdfkit';
import { decrypt } from '../../utils/encryption';
import { numberToWords } from '../../utils/numberToWords';
import { logoBase64 } from './logoData';
import logger from '../../utils/logger';

export const generateBulkChallans = async (req: Request, res: Response) => {
  const { month, year, student_fees } = req.body;

  if (!student_fees || !Array.isArray(student_fees)) {
    return res.status(400).json({ error: 'student_fees array is required' });
  }

  // Generate customized challans for each individual student
  const challansData = student_fees.map((s: any) => ({
    student_id: s.student_id,
    month: Number(month),
    year: Number(year),
    amount_due: Number(s.amount_due),
    amount_paid: Number(s.amount_paid) || 0,
    due_date: new Date(s.due_date),
    custom_fields: s.custom_fields || []
  }));

  const result = await prisma.feeChallan.createMany({
    data: challansData
  });

  res.status(201).json({ message: `Successfully generated ${result.count} customized fee challans.` });
};

export const generateIndividualChallan = async (req: Request, res: Response): Promise<any> => {
  const { student_id, month, year, amount_due, amount_paid, due_date, custom_fields } = req.body;
  const challan = await prisma.feeChallan.create({
    data: {
      student_id, month, year, amount_due, amount_paid: Number(amount_paid) || 0, due_date: new Date(due_date),
      custom_fields: custom_fields || []
    } as any
  });
  res.status(201).json({ message: 'Individual challan generated successfully.', challan });
};

export const getStudentChallans = async (req: Request, res: Response): Promise<any> => {
  const student_id = req.params.student_id as string;
  const challans = await prisma.feeChallan.findMany({
    where: { student_id },
    orderBy: { due_date: 'desc' },
    include: { student: true }
  });
  res.json(challans);
};

export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const challan_id = req.params.id as string;
    const challan = await prisma.feeChallan.update({
      where: { id: challan_id },
      data: {
        status: 'PAID',
        amount_paid: { set: 0 } // Amount paid can be equal to amount due or custom, but we just set it as PAID
      }
    });
    // Set actual amount_paid to amount_due for accuracy
    await prisma.feeChallan.update({
      where: { id: challan_id },
      data: { amount_paid: challan.amount_due }
    });
    res.json({ message: 'Fee marked as conditionally paid.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
};

export const deleteChallan = async (req: Request, res: Response) => {
  try {
    const challan_id = req.params.id as string;
    await prisma.feeChallan.delete({ where: { id: challan_id } });
    res.json({ message: 'Challan deleted permanently.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete challan' });
  }
};

// Simulated Local Payment Rails (e.g. KuickPay, JazzCash Webhook Receiver)
export const paymentWebhook = async (req: Request, res: Response) => {
  const { challan_id, transaction_status, amount_received } = req.body;

  if (transaction_status === 'SUCCESS') {
    await prisma.feeChallan.update({
      where: { id: challan_id },
      data: {
        status: 'PAID',
        amount_paid: amount_received
      }
    });
    return res.json({ message: 'Payment Reconciled Automatically. Student balance settled.' });
  }

  return res.status(400).json({ error: 'Payment failed validation.' });
};

// Generates a fully customized PDF on-the-fly preventing massive server storage bloat
export const downloadChallanPDF = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const challan = await prisma.feeChallan.findUnique({
    where: { id },
    include: { student: { include: { class: true } } }
  }) as any;

  if (!challan) return res.status(404).json({ error: 'Challan not found' });

  // A4 Portrait is 595.28 x 841.89 points
  const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 0 });
  const fileName = `${challan.student.first_name}_${challan.student.last_name}_${challan.month}_${challan.year}.pdf`;
  res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-type', 'application/pdf');
  doc.pipe(res);

  const guardName = decrypt(challan.student.guardian_name);

    const drawSlice = (yOffset: number, copyType: string) => {
      const marginX = 30;
      const sliceWidth = 595.28 - (marginX * 2);
      const startY = yOffset + 15;
  
      // Header Section
      try {
        if (logoBase64) {
          const logoBuffer = Buffer.from(logoBase64, 'base64');
          doc.image(logoBuffer, marginX, startY, { width: 50 }); // Prominent Logo
        }
      } catch(e) {
        logger.error({ error: e }, "Logo Error");
      }
  
      doc.fontSize(14).font('Helvetica-Bold')
         .text('JADOON PUBLIC SCHOOL & COLLEGE', marginX + 65, startY + 5, { width: sliceWidth - 65, align: 'left' });
      
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569')
         .text('FAYSAL BANK', marginX + 65, startY + 22, { width: sliceWidth - 65, align: 'left' });
         
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F172A')
         .text('Sumama Khan / A/C: 3126701000006213', marginX + 65, startY + 35, { width: sliceWidth - 65, align: 'left' });

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
         .text(copyType, marginX + 65, startY + 46, { width: sliceWidth - 65, align: 'left' });
         
      // Challan ID Box (Right aligned)
      doc.roundedRect(marginX + sliceWidth - 140, startY + 5, 140, 30, 4).lineWidth(1).stroke('#CBD5E1');
      doc.fontSize(8).font('Helvetica').fillColor('#64748B').text('CHALLAN NO', marginX + sliceWidth - 140, startY + 10, { width: 140, align: 'center' });
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A').text(challan.id.slice(-10).toUpperCase(), marginX + sliceWidth - 140, startY + 20, { width: 140, align: 'center', characterSpacing: 1 });

      let curY = startY + 70;
      
      // Student Details Section (2 columns)
      doc.roundedRect(marginX, curY, sliceWidth, 45, 4).fillColor('#F8FAFC').fill();
      doc.strokeColor('#E2E8F0').lineWidth(1).roundedRect(marginX, curY, sliceWidth, 45, 4).stroke();
      
      const col1X = marginX + 10;
      const col2X = marginX + (sliceWidth / 2) + 10;
      
      doc.fillColor('#0F172A');
      doc.fontSize(9).font('Helvetica-Bold').text('Name:', col1X, curY + 8);
      doc.fontSize(9).font('Helvetica').text(challan.student.first_name + ' ' + challan.student.last_name, col1X + 45, curY + 8);
      
      doc.font('Helvetica-Bold').text('F. Name:', col1X, curY + 25);
      doc.font('Helvetica').text(guardName, col1X + 45, curY + 25);
      
      doc.font('Helvetica-Bold').text('Reg No:', col2X, curY + 8);
      doc.font('Helvetica').text(challan.student.admission_number, col2X + 45, curY + 8);
      
      doc.font('Helvetica-Bold').text('Class:', col2X + 110, curY + 8);
      doc.font('Helvetica').text(challan.student.class?.name || 'N/A', col2X + 145, curY + 8);
      
      doc.font('Helvetica-Bold').text('Issue Date:', col2X, curY + 25);
      doc.font('Helvetica').text(new Date().toLocaleDateString('en-GB'), col2X + 60, curY + 25);
      
      doc.font('Helvetica-Bold').text('Due Date:', col2X + 130, curY + 25);
      doc.font('Helvetica').fillColor('#E11D48').text(new Date(challan.due_date).toLocaleDateString('en-GB'), col2X + 180, curY + 25);
      
      curY += 55;
      
      // Fee Details Table Header
      doc.fillColor('#0F172A');
      doc.roundedRect(marginX, curY, sliceWidth, 20, 4).fillColor('#E2E8F0').fill();
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('Sr. No.', marginX + 10, curY + 6);
      doc.text('Fee Head', marginX + 60, curY + 6);
      doc.text('Amount (Rs)', marginX + sliceWidth - 80, curY + 6, {width: 70, align: 'right'});
      
      curY += 20;
      
      // Fee Details Table Body
      let rowCount = 1;
      let totalOtherCustom = 0;
      const cf = challan.custom_fields || [];
      
      const drawTableRow = (desc: string, amount: number) => {
        doc.fontSize(9).font('Helvetica').fillColor('#334155');
        doc.text(rowCount.toString(), marginX + 15, curY + 5);
        doc.text(desc, marginX + 60, curY + 5);
        doc.text(amount.toString(), marginX + sliceWidth - 80, curY + 5, {width: 70, align: 'right'});
        doc.strokeColor('#F1F5F9').moveTo(marginX, curY + 18).lineTo(marginX + sliceWidth, curY + 18).stroke();
        curY += 18;
        rowCount++;
      };

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthStr = `${months[challan.month - 1]} ${challan.year}`;
      drawTableRow(`Monthly Tuition Fee (${monthStr})`, challan.amount_due);
      
      const findAmount = (name: string) => Number(cf.find((f: any) => f.name.toLowerCase() === name.toLowerCase() || f.name.toLowerCase() === name.toLowerCase().replace('.', ''))?.amount) || 0;
      const fineVal = findAmount('fine');
      const discountVal = findAmount('discount');
      const prevBalVal = findAmount('prev. bal');
      const structuralNames = ['fine', 'discount', 'prev. bal', 'prev bal'];
      const otherCustomFields = cf.filter((f: any) => !structuralNames.includes(f.name.toLowerCase()));

      otherCustomFields.forEach((field: any) => {
        drawTableRow(field.name, Number(field.amount));
        totalOtherCustom += Number(field.amount);
      });
      
      // Draw outer border for table body
      const tableHeight = (rowCount - 1) * 18;
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(marginX, curY - tableHeight, sliceWidth, tableHeight).stroke();
      
      // Totals Box
      const grossTotal = challan.amount_due + totalOtherCustom;
      const netBal = grossTotal + fineVal + prevBalVal - discountVal - challan.amount_paid;
      
      curY += 2;
      doc.roundedRect(marginX, curY, sliceWidth, 36, 4).fillColor('#F8FAFC').fill();
      doc.strokeColor('#E2E8F0').roundedRect(marginX, curY, sliceWidth, 36, 4).stroke();
      
      const statW = sliceWidth / 5;
      const drawStat = (label: string, val: number, x: number, isTotal: boolean = false) => {
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(label, x, curY + 6, {width: statW, align: 'center'});
        doc.fontSize(10).font('Helvetica-Bold').fillColor(isTotal ? '#0F172A' : '#334155').text(val.toString(), x, curY + 18, {width: statW, align: 'center'});
      };
      
      drawStat('Fine', fineVal, marginX);
      drawStat('Discount', discountVal, marginX + statW);
      drawStat('Prev Bal', prevBalVal, marginX + statW * 2);
      drawStat('Gross Total', grossTotal, marginX + statW * 3);
      drawStat('Net Payable', netBal, marginX + statW * 4, true);
      
      for(let i=1; i<5; i++) {
        doc.strokeColor('#E2E8F0').moveTo(marginX + (statW * i), curY + 5).lineTo(marginX + (statW * i), curY + 31).stroke();
      }

      curY += 42;
      
      // Footer and Instructions
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F172A').text('Amount In Words:', marginX, curY, { continued: true });
      doc.font('Helvetica').text(`  ${numberToWords(netBal).toUpperCase()} RUPEES ONLY`);
      
      curY += 15;
      doc.fontSize(7).font('Helvetica').fillColor('#64748B');
      doc.text('1. Fine of Rs 50/day after due date. 2. Dues non-refundable. 3. Pay online in any Faysal Bank branch.', marginX, curY);
      
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F172A').text('Cashier Signature:', marginX + sliceWidth - 160, curY - 10);
      doc.moveTo(marginX + sliceWidth - 70, curY).lineTo(marginX + sliceWidth, curY).strokeColor('#94A3B8').stroke();
      
      // Divider Line between slices
      if (yOffset < 500) {
        doc.strokeColor('#CBD5E1').moveTo(0, yOffset + 280.63).lineTo(595.28, yOffset + 280.63).dash(4, { space: 4 }).stroke();
        doc.undash();
      }
    };

    const sliceHeight = 841.89 / 3;
    drawSlice(0, 'Bank Copy');
    drawSlice(sliceHeight, 'School Copy');
    drawSlice(sliceHeight * 2, 'Student Copy');

  doc.end();
};
