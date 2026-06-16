import { Request, Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { sendSMS } from '../../utils/sms';
import { decrypt } from '../../utils/encryption';

interface AttendanceRecord {
  student_id: string;
  status: string;
}

export const batchMarkAttendance = async (req: AuthRequest, res: Response) => {
  const { class_id, date, records } = req.body;
  const teacherId = req.user!.id;

  await processAttendanceTransaction(records, date, class_id, teacherId);
  await logAttendanceAudit(class_id, teacherId, req.user!.role, records.length, date);
  
  const absenteesCount = await triggerAbsenceNotifications(records, date);
  
  res.json({ message: `Attendance securely processed. ${absenteesCount} SMS alerts fired.` });
};

export const getDailySummary = async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = new Date(date as string);

  const summary = await prisma.attendance.groupBy({
    by: ['status'],
    where: { date: targetDate },
    _count: { student_id: true }
  });

  res.json(summary);
};

export const getClassGrid = async (req: Request, res: Response) => {
  const classId = req.params.class_id as string;
  const students = await fetchClassStudents(classId);
  const grid = buildDefaultPresenceGrid(students);
  res.json({ class_id: classId, grid });
};

// --- CLEAN CODE EXTRACTED HELPERS ---

async function processAttendanceTransaction(records: AttendanceRecord[], date: string, classId: string, teacherId: string) {
  const targetDate = new Date(date);
  const transaction = records.map((record) => 
    prisma.attendance.upsert({
      where: {
        student_id_date: { student_id: record.student_id, date: targetDate }
      },
      update: { status: record.status, marked_by: teacherId },
      create: { date: targetDate, status: record.status, student_id: record.student_id, class_id: classId, marked_by: teacherId }
    })
  );
  await prisma.$transaction(transaction);
}

async function logAttendanceAudit(classId: string, teacherId: string, role: string, recordCount: number, date: string) {
  await prisma.auditLog.create({
    data: {
      action: 'BATCH_MARKED_ATTENDANCE',
      entity: 'Attendance',
      entity_id: classId,
      role: role,
      performed_by: teacherId,
      details: `Teacher marked ${recordCount} attendance records for ${date}`
    }
  });
}

async function triggerAbsenceNotifications(records: AttendanceRecord[], targetDate: string): Promise<number> {
  const absentees = records.filter((r) => r.status === 'ABSENT');
  if (absentees.length === 0) return 0;

  const absentStudents = await prisma.student.findMany({
    where: { id: { in: absentees.map((a) => a.student_id) } },
    select: { first_name: true, last_name: true, guardian_phone: true }
  });

  absentStudents.forEach(async (student) => {
    if (student.guardian_phone) {
      const decyptedPhone = decrypt(student.guardian_phone);
      await sendSMS(
        decyptedPhone, 
        `Jadoon Public School Alert: Your child ${student.first_name} ${student.last_name} has been marked ABSENT on ${targetDate}.`
      );
    }
  });

  return absentees.length;
}

async function fetchClassStudents(classId: string) {
  return await prisma.student.findMany({
    where: { current_grade_id: classId },
    select: { id: true, admission_number: true, first_name: true, last_name: true }
  });
}

function buildDefaultPresenceGrid(students: any[]) {
  return students.map((s) => ({
    student_id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    admission_number: s.admission_number,
    status: 'PRESENT'
  }));
}
