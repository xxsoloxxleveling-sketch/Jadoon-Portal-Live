import { Request, Response } from 'express';
import prisma from '../../config/database';
import PDFDocument from 'pdfkit';
import { encrypt, decrypt } from '../../utils/encryption';
import bcrypt from 'bcryptjs';
import { logoBase64 } from '../finance/logoData';

export const createStudent = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      email, password, first_name, last_name, 
      dob, gender, guardian_name, guardian_phone, address,
      is_orphan, is_needy, sibling_ids 
    } = req.body;
    
    let admission_number = req.body.admission_number;
    if (!admission_number || admission_number.trim() === '') {
      admission_number = `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    let userArgs: any = undefined;
    if (email && password) {
       const password_hash = await bcrypt.hash(password, 10);
       userArgs = {
         create: {
           email, password_hash, role: 'STUDENT'
         }
       };
    }
    
    const newStudent = await prisma.student.create({
      data: {
        admission_number, first_name, last_name,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        guardian_name: guardian_name ? encrypt(guardian_name) : null,
        guardian_phone: guardian_phone ? encrypt(guardian_phone) : null,
        address: address || null,
        is_orphan: is_orphan || false,
        is_needy: is_needy || false,
        sibling_ids: sibling_ids || [],
        user: userArgs
      }
    });
    
    res.status(201).json(newStudent);
  } catch (err: any) {
    if (err.code === 'P2002') {
      if (err.meta?.target?.includes('admission_number')) {
        return res.status(400).json({ error: 'Admission number already exists. Please use a unique admission number.' });
      }
      if (err.meta?.target?.includes('email')) {
        return res.status(400).json({ error: 'Email already exists. Please use a different email address.' });
      }
      return res.status(400).json({ error: 'A user with this unique information already exists.' });
    }
    res.status(500).json({ error: 'Failed to create student: ' + err.message });
  }
};

export const bulkEnroll = async (req: Request, res: Response) => {
  const students: any[] = req.body.students;

  const result = await prisma.student.createMany({
    data: students.map(s => ({
      admission_number: s.admission_number,
      first_name: s.first_name,
      last_name: s.last_name,
      dob: new Date(s.dob),
      gender: s.gender,
      guardian_name: encrypt(s.guardian_name),
      guardian_phone: encrypt(s.guardian_phone),
      address: s.address,
      current_grade_id: s.current_grade_id
    }))
  });

  res.status(201).json({ message: `Successfully enrolled ${result.count} students.` });
};

// Added GET method to fulfill Phase 1 API requirements and show decryption
export const getStudents = async (req: Request, res: Response): Promise<any> => {
  const { unassigned, class_id, is_orphan, is_needy } = req.query;
  let whereClause: any = {};
  if (unassigned === 'true') {
    whereClause.OR = [
      { current_grade_id: null },
      { current_grade_id: { isSet: false } }
    ];
  } else if (class_id) {
    whereClause.current_grade_id = class_id as string;
  }
  
  if (is_orphan === 'true') whereClause.is_orphan = true;
  if (is_needy === 'true') whereClause.is_needy = true;
  
  const students = await prisma.student.findMany({ 
    where: whereClause,
    take: 100 
  }); 
  const decryptedStudents = students.map((s: any) => ({
    ...s,
    guardian_name: decrypt(s.guardian_name),
    guardian_phone: decrypt(s.guardian_phone)
  }));
  res.json(decryptedStudents);
};

export const getStudentProfile = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      attendances: { orderBy: { date: 'desc' }, take: 30 },
      fee_challans: { orderBy: { due_date: 'desc' } }
    }
  });

  if (!student) return res.status(404).json({ error: 'Student not found.' });

  res.json({
    ...student,
    guardian_name: student.guardian_name ? decrypt(student.guardian_name) : null,
    guardian_phone: student.guardian_phone ? decrypt(student.guardian_phone) : null
  });
};

// --- PHASE 3: BULK PROMOTION LOGIC ---
export const promoteClass = async (req: Request, res: Response) => {
  const { current_class_id, next_class_id } = req.body;

  // Utilize a bulk update query for high performance promotion of a batch (e.g. 50+ students in a single query)
  const result = await prisma.student.updateMany({
    where: { current_grade_id: current_class_id },
    data: { current_grade_id: next_class_id }
  });

  res.json({ message: `Successfully promoted ${result.count} students to the next grade.` });
};

// --- PHASE 5: Drag & Drop Registration ---
export const enrollBatch = async (req: Request, res: Response) => {
  const class_id = req.params.id as string;
  const { student_ids } = req.body;

  const result = await prisma.student.updateMany({
    where: { id: { in: student_ids } },
    data: { current_grade_id: class_id }
  });

  res.json({ message: `Successfully shifted ${result.count} students into the target class via Drag & Drop.` });
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { first_name, last_name, dob, gender, guardian_name, guardian_phone, address, admission_number, is_orphan, is_needy, sibling_ids } = req.body;
    
    const updateData: any = { first_name, last_name, gender, address, admission_number };
    if (dob) updateData.dob = new Date(dob);
    if (typeof is_orphan === 'boolean') updateData.is_orphan = is_orphan;
    if (typeof is_needy === 'boolean') updateData.is_needy = is_needy;
    if (Array.isArray(sibling_ids)) updateData.sibling_ids = sibling_ids;
    if (guardian_name) updateData.guardian_name = encrypt(guardian_name);
    if (guardian_phone) updateData.guardian_phone = encrypt(guardian_phone);
    
    const updated = await prisma.student.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update student: ' + err.message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Also delete associated attendances, fee challans, etc. or just student if CASCADE is fine (Prisma needs explicit if no cascade)
    // Actually Prisma schema doesn't have onDelete Cascade, so let's delete relationships first manually or just user
    await prisma.examResult.deleteMany({ where: { student_id: id } });
    await prisma.feeChallan.deleteMany({ where: { student_id: id } });
    await prisma.attendance.deleteMany({ where: { student_id: id } });
    
    const student = await prisma.student.delete({ where: { id } });
    if (student.userId) {
      await prisma.user.delete({ where: { id: student.userId } });
    }
    
    res.json({ message: 'Student and related records deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete student: ' + err.message });
  }
};

export const getStudentProfilePdf = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        attendances: { orderBy: { date: 'desc' }, take: 10 },
        fee_challans: { orderBy: { due_date: 'desc' }, take: 5 }
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename=Student_Profile_${student.admission_number || student.first_name}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // Header Setup
    if (logoBase64) {
      try {
        const logoBuffer = Buffer.from(logoBase64, 'base64');
        doc.image(logoBuffer, 50, 40, { width: 60 });
      } catch(e) {}
    }

    doc.fontSize(22).font('Helvetica-Bold').text('JADOON PUBLIC SCHOOL & COLLEGE', 120, 50, { align: 'left' });
    doc.fontSize(14).font('Helvetica').text('Student Details Form', 120, 75, { align: 'left' });
    
    doc.moveTo(50, 110).lineTo(545, 110).lineWidth(2).stroke();
    doc.moveDown(2);

    let curY = 130;

    // Helper for rows
    const drawRow = (label1: string, val1: string, label2: string, val2: string, y: number) => {
      doc.fontSize(10).font('Helvetica-Bold').text(label1, 50, y);
      doc.font('Helvetica').text(val1, 150, y);
      if (label2) {
        doc.font('Helvetica-Bold').text(label2, 320, y);
        doc.font('Helvetica').text(val2, 420, y);
      }
    };

    doc.fontSize(14).font('Helvetica-Bold').text('Personal Information', 50, curY);
    curY += 25;
    drawRow('Full Name:', `${student.first_name} ${student.last_name}`, 'Admission No:', student.admission_number || 'N/A', curY);
    curY += 20;
    drawRow('Date of Birth:', student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A', 'Gender:', student.gender || 'N/A', curY);
    curY += 20;
    drawRow('Class:', student.class ? student.class.name : 'Unassigned', 'Blood Group:', student.blood_group || 'N/A', curY);
    curY += 20;
    drawRow('Orphan:', student.is_orphan ? 'Yes' : 'No', 'Needy/Zakat:', student.is_needy ? 'Yes' : 'No', curY);

    curY += 40;
    doc.fontSize(14).font('Helvetica-Bold').text('Guardian Information', 50, curY);
    curY += 25;
    drawRow('Guardian Name:', student.guardian_name ? decrypt(student.guardian_name) : 'N/A', 'Guardian Phone:', student.guardian_phone ? decrypt(student.guardian_phone) : 'N/A', curY);
    curY += 20;
    drawRow('Address:', student.address || 'N/A', '', '', curY);

    curY += 40;
    doc.moveTo(50, curY).lineTo(545, curY).lineWidth(1).stroke();
    curY += 20;
    
    doc.fontSize(14).font('Helvetica-Bold').text('Administrative Summary', 50, curY);
    curY += 25;
    
    // Recent Attendance
    doc.fontSize(12).font('Helvetica-Bold').text('Recent Attendance:', 50, curY);
    let attText = student.attendances.slice(0, 5).map(a => `${new Date(a.date).toLocaleDateString()} (${a.status})`).join(', ');
    if (!attText) attText = 'No records.';
    doc.fontSize(10).font('Helvetica').text(attText, 170, curY, { width: 375 });
    
    curY += 30;
    // Recent Fees
    doc.fontSize(12).font('Helvetica-Bold').text('Recent Fee Status:', 50, curY);
    let feeText = student.fee_challans.slice(0, 3).map(f => `${f.month}/${f.year}: Rs. ${f.amount_due} (${f.status})`).join(' | ');
    if (!feeText) feeText = 'No records.';
    doc.fontSize(10).font('Helvetica').text(feeText, 170, curY, { width: 375 });

    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
};
