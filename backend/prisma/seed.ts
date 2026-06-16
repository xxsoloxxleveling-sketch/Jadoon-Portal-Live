import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  const TOTAL_STUDENTS = 20;
  const TOTAL_TEACHERS = 10;
  const TOTAL_CLASSES = 0;

  // Clear all collections
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.feeChallan.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.teacherAttendance.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@jadoonportal.edu.pk',
      password_hash: hashedAdminPassword,
      role: 'SUPER_ADMIN',
    }
  });

  console.log(`Successfully seeded purely the Super Admin. Database is exactly blank for user interactions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
