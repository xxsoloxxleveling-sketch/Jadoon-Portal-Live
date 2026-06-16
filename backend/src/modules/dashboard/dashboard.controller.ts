import { Request, Response } from 'express';
import prisma from '../../config/database';
import logger from '../../utils/logger';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    // Base date parsing or default to today
    const targetDateStr = date ? (date as string) : new Date().toISOString().split('T')[0];
    const targetDate = new Date(targetDateStr);
    
    // 1. Total Students
    const totalStudents = await prisma.student.count();

    // 2. Today's Attendance
    const attendanceRecords = await prisma.attendance.findMany({
      where: { date: targetDate }
    });
    
    let presentCount = 0;
    attendanceRecords.forEach(record => {
      if (record.status === 'PRESENT') {
        presentCount++;
      }
    });
    const todaysPercentage = attendanceRecords.length === 0 ? 0 : Math.round((presentCount / attendanceRecords.length) * 100);

    // 3. Fee Collection (Current Month)
    const currentMonth = targetDate.getMonth() + 1;
    const currentYear = targetDate.getFullYear();
    const feeChallans = await prisma.feeChallan.findMany({
      where: { month: currentMonth, year: currentYear }
    });
    
    let totalDue = 0;
    let totalPaid = 0;
    feeChallans.forEach(challan => {
      totalDue += challan.amount_due;
      totalPaid += challan.amount_paid;
    });
    const feeCollection = totalDue === 0 ? 100 : Math.round((totalPaid / totalDue) * 100);

    // 4. Active Staff
    const activeStaff = await prisma.teacher.count();

    // 5. Attendance Trend (Last 7 Days)
    const attendanceTrend = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      
      const records = await prisma.attendance.findMany({
        where: { date: d }
      });
      
      let pCount = 0;
      records.forEach(r => {
        if (r.status === 'PRESENT') pCount++;
      });
      
      const pct = records.length === 0 ? (i === 0 ? todaysPercentage : 0) : Math.round((pCount / records.length) * 100);
      
      attendanceTrend.push({
        name: i === 0 ? 'Today' : days[d.getDay()],
        attendance: pct
      });
    }

    // 6. Recent Activities
    const rawActivities = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    const recentActivities = rawActivities.map((activity) => {
      let type = 'system';
      if (activity.entity === 'FeeChallan' || activity.action.includes('FEE')) type = 'fee';
      if (activity.entity === 'Attendance' || activity.action.includes('ATTENDANCE')) type = 'attendance';
      
      const seconds = Math.floor((new Date().getTime() - new Date(activity.timestamp).getTime()) / 1000);
      let timeStr = `${seconds} sec ago`;
      if (seconds > 60) timeStr = `${Math.floor(seconds/60)} mins ago`;
      if (seconds > 3600) timeStr = `${Math.floor(seconds/3600)} hours ago`;
      if (seconds > 86400) timeStr = `${Math.floor(seconds/86400)} days ago`;

      return {
        id: activity.id,
        user: activity.role === 'SUPER_ADMIN' ? 'Admin' : activity.performed_by.substring(0, 8),
        action: activity.action.replace(/_/g, ' ').toLowerCase() + (activity.details ? ` - ${activity.details.substring(0,20)}...` : ''),
        time: timeStr,
        type: type
      };
    });

    // --- NEW FUNCTIONAL STATS ---

    // 7. Cash Flow
    const salaries = await prisma.salaryRecord.findMany({
      where: { month: currentMonth, year: currentYear }
    });
    let totalSalariesPaid = 0;
    salaries.forEach(s => totalSalariesPaid += s.net_amount);
    const cashFlow = { income: totalPaid, expenses: totalSalariesPaid };

    // 8. Defaulter Alerts
    const unpaidChallans = await prisma.feeChallan.findMany({
      where: { status: 'PENDING' }
    });
    let totalOutstanding = 0;
    unpaidChallans.forEach(c => totalOutstanding += c.amount_due);
    const defaultersCount = unpaidChallans.length;
    const defaulters = { count: defaultersCount, amount: totalOutstanding };

    // 9. Demographics Breakdown
    const studentsByGender = await prisma.student.groupBy({
      by: ['gender'],
      _count: { gender: true }
    });
    const genderDemographics = studentsByGender.map(g => ({
      name: g.gender || 'Unknown',
      value: g._count.gender
    }));

    // 10. Low Attendance (>=3 absences in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAbsences = await prisma.attendance.groupBy({
      by: ['student_id'],
      where: { status: 'ABSENT', date: { gte: thirtyDaysAgo } },
      _count: { student_id: true },
      having: { student_id: { _count: { gte: 3 } } }
    });
    
    // Convert to list of objects with count
    const lowAttendanceStudentIds = recentAbsences.map(a => a.student_id);
    const lowAttData = await prisma.student.findMany({
      where: { id: { in: lowAttendanceStudentIds } },
      select: { id: true, first_name: true, last_name: true, admission_number: true }
    });
    
    const lowAttendance = lowAttData.map(student => {
      const absCount = recentAbsences.find(a => a.student_id === student.id)?._count.student_id || 0;
      return {
        name: `${student.first_name} ${student.last_name}`,
        admission_number: student.admission_number,
        absences: absCount
      };
    });

    // 11. Top Performers
    const recentEvals = await prisma.performanceEvaluation.findMany({
      orderBy: { score: 'desc' },
      take: 5,
      include: { teacher: true, student: true, employee: true }
    });
    const topPerformers = recentEvals.map(e => ({
      id: e.id,
      name: e.teacher ? `${e.teacher.first_name} ${e.teacher.last_name}` : 
            e.student ? `${e.student.first_name} ${e.student.last_name}` :
            e.employee ? `${e.employee.first_name} ${e.employee.last_name}` : 'Unknown',
      type: e.teacher ? 'Teacher' : e.student ? 'Student' : e.employee ? 'Employee' : 'Unknown',
      score: e.score
    }));

    res.json({
      totalStudents,
      todaysPercentage,
      feeCollection,
      activeStaff,
      attendanceTrend,
      recentActivities,
      cashFlow,
      defaulters,
      genderDemographics,
      lowAttendance,
      topPerformers
    });

  } catch (error) {
    logger.error({ error }, 'Dashboard Stats Error');
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
