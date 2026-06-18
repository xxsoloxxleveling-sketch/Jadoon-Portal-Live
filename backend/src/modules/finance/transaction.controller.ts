import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import prisma from '../../config/database';
import PDFDocument from 'pdfkit';
import { logoBase64 } from './logoData';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    
    const query: any = {};
    if (type) query.type = String(type);
    if (status) query.status = String(status);

    const transactions = await prisma.transaction.findMany({
      where: query,
      include: { category: true, user: true },
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { title, amount, type, date, status, reference, description, category_id } = req.body;
    // req.user is set by authMiddleware
    const created_by = req.user?.id || null;

    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount: parseFloat(amount),
        type,
        date: date ? new Date(date) : undefined,
        status: status || 'COMPLETED',
        reference,
        description,
        category_id,
        created_by
      },
      include: { category: true, user: true }
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, amount, type, date, status, reference, description, category_id } = req.body;
    const transaction = await prisma.transaction.update({
      where: { id: String(id) },
      data: {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        type,
        date: date ? new Date(date) : undefined,
        status,
        reference,
        description,
        category_id
      },
      include: { category: true, user: true }
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: { id: String(id) } });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

export const getTransactionCategories = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const query: any = {};
    if (type) query.type = String(type);
    
    const categories = await prisma.transactionCategory.findMany({
      where: query,
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const createTransactionCategory = async (req: Request, res: Response) => {
  try {
    const { name, type, description } = req.body;
    const category = await prisma.transactionCategory.create({
      data: { name, type, description }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const deleteTransactionCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if category is used
    const inUse = await prisma.transaction.findFirst({ where: { category_id: String(id) } });
    if (inUse) return res.status(400).json({ error: 'Cannot delete category that is in use' });

    await prisma.transactionCategory.delete({ where: { id: String(id) } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const getTransactionInvoicePdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: String(id) },
      include: { category: true, user: true }
    });

    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename=Invoice_${transaction.id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    if (logoBase64) {
      try {
        const logoBuffer = Buffer.from(logoBase64, 'base64');
        doc.image(logoBuffer, 50, 40, { width: 60 });
      } catch(e) {}
    }

    doc.fontSize(22).font('Helvetica-Bold').text('JADOON PUBLIC SCHOOL & COLLEGE', 120, 50, { align: 'left' });
    doc.fontSize(14).font('Helvetica').text(transaction.type === 'INCOME' ? 'Income Receipt' : 'Expense Invoice', 120, 75, { align: 'left' });
    
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

    doc.fontSize(14).font('Helvetica-Bold').text('Transaction Details', 50, curY);
    curY += 25;
    drawRow('Title:', transaction.title, 'Date:', transaction.date.toLocaleDateString(), curY);
    curY += 20;
    const t = transaction as any;
    drawRow('Category:', t.category?.name || 'N/A', 'Status:', t.status, curY);
    curY += 20;
    drawRow('Reference:', t.reference || 'N/A', 'Created By:', t.user ? `${t.user.email}` : 'System', curY);
    
    if (t.description) {
      curY += 20;
      drawRow('Description:', t.description || '', '', '', curY);
    }

    curY += 40;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(1).stroke();
    curY += 20;
    
    doc.fontSize(14).font('Helvetica-Bold').text('Amount', 50, curY);
    doc.fontSize(14).font('Helvetica-Bold').text(`Rs. ${transaction.amount.toLocaleString()}`, 150, curY);

    curY += 80;
    doc.fontSize(10).font('Helvetica').text('Note: This is a computer generated document and does not require a physical signature.', 50, curY, { align: 'center', width: 495 });

    doc.end();
  } catch (err: any) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
};

export const getTransactionsExportPdf = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true, user: true },
      orderBy: { date: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename=Transactions_Sheet.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    if (logoBase64) {
      try {
        const logoBuffer = Buffer.from(logoBase64, 'base64');
        doc.image(logoBuffer, 50, 40, { width: 60 });
      } catch(e) {}
    }

    doc.fontSize(20).font('Helvetica-Bold').text('JADOON PUBLIC SCHOOL & COLLEGE', 120, 50, { align: 'left' });
    doc.fontSize(14).font('Helvetica').text('Income & Expense Sheet', 120, 75, { align: 'left' });
    
    doc.moveTo(50, 110).lineTo(545, 110).lineWidth(2).stroke();
    doc.moveDown(2);

    let curY = 130;
    
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
    const netBalance = totalIncome - totalExpense;

    doc.fontSize(12).font('Helvetica-Bold').text(`Total Income: Rs. ${totalIncome.toLocaleString()}`, 50, curY);
    doc.text(`Total Expense: Rs. ${totalExpense.toLocaleString()}`, 250, curY);
    doc.text(`Net Balance: Rs. ${netBalance.toLocaleString()}`, 400, curY);
    
    curY += 30;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(1).stroke();
    curY += 15;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', 50, curY);
    doc.text('Title', 120, curY);
    doc.text('Category', 250, curY);
    doc.text('Type', 360, curY);
    doc.text('Amount', 450, curY, { width: 95, align: 'right' });
    
    curY += 15;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(0.5).stroke();
    curY += 10;

    doc.font('Helvetica');
    transactions.forEach(t => {
      if (curY > 750) {
        doc.addPage();
        curY = 50;
      }
      doc.text(t.date.toLocaleDateString(), 50, curY);
      doc.text(t.title.substring(0, 20), 120, curY);
      const cat = (t as any).category;
      doc.text(cat ? cat.name.substring(0, 15) : 'Uncategorized', 250, curY);
      doc.text(t.type, 360, curY);
      doc.text(`Rs. ${t.amount.toLocaleString()}`, 450, curY, { width: 95, align: 'right' });
      curY += 15;
    });

    doc.end();
  } catch (error: any) {
    console.error('Error generating transactions pdf:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

