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

  // A4 Landscape is 841.89 x 595.28 points
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const fileName = `${challan.student.first_name}_${challan.student.last_name}_${challan.month}_${challan.year}.pdf`;
  res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-type', 'application/pdf');
  doc.pipe(res);

  const guardName = decrypt(challan.student.guardian_name);

    const drawSlice = (xOffset: number, copyType: string) => {
      const pd = 15;
      const startX = xOffset + pd;
      const startY = 30; 
      const sliceWidth = 280 - (pd * 2);
  
      try {
        if (logoBase64) {
          const logoBuffer = Buffer.from(logoBase64, 'base64');
          doc.image(logoBuffer, startX + (sliceWidth/2) - 40, startY - 15, { width: 80 });
        }
      } catch(e) {
        logger.error({ error: e }, "Logo Error");
      }
  
      doc.fontSize(12).font('Helvetica-Bold')
         .text('JADOON PUBLIC SCHOOL & COLLEGE', startX, startY + 65, { width: sliceWidth, align: 'center' });
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('FAYSAL BANK', startX, startY + 80, { width: sliceWidth, align: 'center' });
  
      doc.fontSize(11).font('Helvetica-Bold')
         .text(copyType, startX, startY + 95, { width: sliceWidth, align: 'center' });
      
      doc.rect(startX, startY + 110, sliceWidth, 22).stroke();
      doc.fontSize(11).font('Helvetica-Bold').text(challan.id.slice(-10).toUpperCase(), startX, startY + 116, { width: sliceWidth, align: 'center', characterSpacing: 2 });

    let curY = startY + 140;
    doc.fontSize(9).font('Helvetica-Bold').text('Name', startX, curY);
    doc.fontSize(9).font('Helvetica').text(challan.student.first_name + ' ' + challan.student.last_name, startX + 50, curY);

    curY += 15;
    doc.font('Helvetica-Bold').text('F. Name', startX, curY);
    doc.font('Helvetica').text(guardName, startX + 50, curY);

    curY += 15;
    doc.font('Helvetica-Bold').text('Reg No', startX, curY);
    doc.font('Helvetica').text(challan.student.admission_number, startX + 45, curY);
    doc.font('Helvetica-Bold').text('GR No', startX + 115, curY);
    doc.font('Helvetica').text(`DS-${challan.student.class?.name || 'N/A'}`, startX + 155, curY);

    curY += 15;
    doc.font('Helvetica-Bold').text('Issue Date', startX, curY);
    doc.font('Helvetica').text(new Date().toLocaleDateString('en-GB'), startX + 55, curY);
    doc.font('Helvetica-Bold').text('Due Date', startX + 115, curY);
    doc.font('Helvetica').text(new Date(challan.due_date).toLocaleDateString('en-GB'), startX + 165, curY);

    curY += 15;
    doc.font('Helvetica-Bold').text('Class', startX, curY);
    doc.font('Helvetica').text(challan.student.class?.name || 'N/A', startX + 50, curY);

    curY += 15;
    doc.font('Helvetica-Bold').text('Duration', startX, curY);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    doc.font('Helvetica').text(`${months[challan.month - 1]} ${challan.year}`, startX + 50, curY);

    curY += 20;
    doc.rect(startX, curY, sliceWidth, 18).stroke();
    doc.font('Helvetica-Bold').text('Sr. No.', startX + 2, curY + 5);
    doc.text('Fee Head', startX + 35, curY + 5);
    doc.text('Amount', startX + sliceWidth - 45, curY + 5, {width: 40, align: 'right'});

    curY += 18;
    doc.rect(startX, curY, sliceWidth, 18).stroke();
    doc.font('Helvetica').text('1', startX + 5, curY + 5);
    doc.text('1 x Study Fee', startX + 35, curY + 5);
    doc.text(challan.amount_due.toString(), startX + sliceWidth - 45, curY + 5, {width: 40, align: 'right'});

    let rowCount = 2;
    let customY = curY;
    let totalOtherCustom = 0;
    const cf = challan.custom_fields || [];
    
    const findAmount = (name: string) => Number(cf.find((f: any) => f.name.toLowerCase() === name.toLowerCase() || f.name.toLowerCase() === name.toLowerCase().replace('.', ''))?.amount) || 0;
    const fineVal = findAmount('fine');
    const discountVal = findAmount('discount');
    const prevBalVal = findAmount('prev. bal');
    const structuralNames = ['fine', 'discount', 'prev. bal', 'prev bal'];
    
    const otherCustomFields = cf.filter((f: any) => !structuralNames.includes(f.name.toLowerCase()));

    otherCustomFields.forEach((field: any) => {
      customY += 18;
      doc.rect(startX, customY, sliceWidth, 18).stroke();
      doc.font('Helvetica').text(rowCount.toString(), startX + 5, customY + 5);
      doc.text(field.name, startX + 35, customY + 5);
      doc.text(field.amount.toString(), startX + sliceWidth - 45, customY + 5, {width: 40, align: 'right'});
      totalOtherCustom += Number(field.amount);
      rowCount++;
    });
    
    curY = customY;

    let rowY = curY - (18 * (rowCount - 1));
    curY += 18;
    doc.rect(startX, curY, sliceWidth, 18).stroke();
    doc.font('Helvetica-Bold').text('Gross Total', startX + sliceWidth - 105, curY + 5);
    
    const grossTotal = challan.amount_due + totalOtherCustom;
    doc.text(grossTotal.toString(), startX + sliceWidth - 45, curY + 5, {width: 40, align: 'right'});
    
    doc.moveTo(startX + Math.floor(sliceWidth) - 48, rowY + 18).lineTo(startX + Math.floor(sliceWidth) - 48, curY).stroke();
    doc.moveTo(startX + 25, rowY + 18).lineTo(startX + 25, curY).stroke();

    curY += 18;
    doc.rect(startX, curY, sliceWidth, 18).stroke();
    const colW = sliceWidth / 5;
    doc.fontSize(7).text('Fine', startX, curY + 5, {width: colW, align: 'center'});
    doc.text('Discount', startX + colW, curY + 5, {width: colW, align: 'center'});
    doc.text('Prev Bal', startX + colW*2, curY + 5, {width: colW, align: 'center'});
    doc.text('Paid', startX + colW*3, curY + 5, {width: colW, align: 'center'});
    doc.text('Net Bal', startX + colW*4, curY + 5, {width: colW, align: 'center'});

    const netBal = grossTotal + fineVal + prevBalVal - discountVal - challan.amount_paid;

    curY += 18;
    doc.rect(startX, curY, sliceWidth, 18).stroke();
    doc.font('Helvetica').text(fineVal.toString(), startX, curY + 5, {width: colW, align: 'center'});
    doc.text(discountVal.toString(), startX + colW, curY + 5, {width: colW, align: 'center'});
    doc.text(prevBalVal.toString(), startX + colW*2, curY + 5, {width: colW, align: 'center'});
    doc.text(challan.amount_paid.toString(), startX + colW*3, curY + 5, {width: colW, align: 'center'});
    doc.text(netBal.toString(), startX + colW*4, curY + 5, {width: colW, align: 'center'});

    for(let i=1; i<5; i++) {
        doc.moveTo(startX + (colW * i), curY - 18).lineTo(startX + (colW * i), curY + 18).stroke();
    }

    curY += 25;
    doc.fontSize(9).font('Helvetica-Bold').text('Amount In Words: ', startX, curY, { continued: true });
    doc.font('Helvetica').text(`${numberToWords(netBal)} ONLY`);

    curY += 30;
    doc.font('Helvetica').text('Bank Authorized Signature ________________________', startX, curY);
    curY += 15;
    doc.text('Mobile Number: ________________________', startX, curY);

    curY += 25;
    doc.font('Helvetica-Bold').text('Instruction for Parents/Students', startX, curY);
    doc.moveTo(startX, curY + 12).lineTo(startX + sliceWidth, curY + 12).stroke();
    curY += 16;
    doc.font('Helvetica').fontSize(8);
    doc.text('1. After 5th of this month a fine of Rs 50 will be charged per day.', startX, curY);
    doc.text('2. All dues once paid are not refundable except security.', startX, curY + 12);
    doc.text('3. Can be deposited free online in any branch of Faysal Bank.', startX, curY + 24);

    curY += 45;
    const disclaimer = `Account Office: 03269102422 | Helpline: 03051755551\nAccount: 3126701000006213 (Faysal Bank)\nTitle: Sumama Khan\nSchool Reg Id: 220285011882`;
    doc.fontSize(8).text(disclaimer, startX, curY, { width: sliceWidth, align: 'center' });

    if (xOffset < 560) {
        doc.moveTo(xOffset + 280.63, 15).lineTo(xOffset + 280.63, 580).dash(2, { space: 2 }).stroke();
        doc.undash();
    }
  };

  const sliceWidth = 841.89 / 3;
  drawSlice(0, 'Bank Copy');
  drawSlice(sliceWidth, 'School Copy');
  drawSlice(sliceWidth * 2, 'Student Copy');

  doc.end();
};
