import { Request, Response } from 'express';
import prisma from '../../config/database';

export const generateReportCard = async (req: Request, res: Response): Promise<any> => {
  const { student_id, exam_id } = req.body;

  if (!student_id || !exam_id) {
    return res.status(400).json({ error: 'student_id and exam_id are required' });
  }

  const student = await prisma.student.findUnique({
    where: { id: student_id },
    include: { class: true }
  });

  if (!student) return res.status(404).json({ error: 'Student not found' });

  const results = await prisma.examResult.findMany({
    where: { student_id, exam_id },
    include: { subject: true }
  });

  if (results.length === 0) {
    return res.status(404).json({ error: 'No exam results found for this student and exam' });
  }

  let totalObtained = 0;
  let totalMax = 0;
  
  const subjectsReport = results.map(r => {
    totalObtained += r.marks_obtained;
    totalMax += r.total_marks;
    return {
      subject: r.subject.name,
      obtained: r.marks_obtained,
      total: r.total_marks,
      percentage: ((r.marks_obtained / r.total_marks) * 100).toFixed(1) + '%'
    };
  });

  const overallPercentage = (totalObtained / totalMax) * 100;
  let grade = 'F';
  if (overallPercentage >= 90) grade = 'A+';
  else if (overallPercentage >= 80) grade = 'A';
  else if (overallPercentage >= 70) grade = 'B';
  else if (overallPercentage >= 60) grade = 'C';
  else if (overallPercentage >= 50) grade = 'D';

  const reportCard = {
    school: "Jadoon Public High School & College",
    student: `${student.first_name} ${student.last_name}`,
    admission_number: student.admission_number,
    class: student.class ? student.class.name : 'Unassigned',
    subjects: subjectsReport,
    summary: {
      total_obtained: totalObtained,
      total_max: totalMax,
      percentage: overallPercentage.toFixed(2) + '%',
      grade: grade,
      status: overallPercentage >= 50 ? 'Promoted' : 'Detained'
    }
  };

  return res.json({ message: 'Bespsoke Report Card Generated', reportCard });
};

export const getClasses = async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { name: 'asc' }
  });
  res.json(classes);
};

export const createClass = async (req: Request, res: Response): Promise<any> => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Class Name is absolutely required.' });
  }

  const newClass = await prisma.class.create({ 
    data: { name } 
  });
  
  res.json(newClass);
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalStudents = await prisma.student.count();
    const activeStaff = await prisma.teacher.count();
    
    const totalChallans = await prisma.feeChallan.count();
    const paidChallans = await prisma.feeChallan.count({ where: { status: 'PAID' } });
    const feeCollectionPct = totalChallans === 0 ? 0 : Math.round((paidChallans / totalChallans) * 100);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const presentRecords = await prisma.attendance.count({
      where: {
        date: { gte: startOfToday, lte: endOfToday },
        status: 'PRESENT'
      }
    });

    const todaysAttendancePct = totalStudents === 0 ? 0 : Math.round((presentRecords / totalStudents) * 100);

    res.json({
      totalStudents,
      activeStaff,
      feeCollectionPct,
      todaysAttendancePct
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
