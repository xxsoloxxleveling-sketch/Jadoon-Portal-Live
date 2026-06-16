import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.count();
  const teachers = await prisma.teacher.count();
  const users = await prisma.user.count();
  const classes = await prisma.class.count();
  console.log(`Students: ${students}, Teachers: ${teachers}, Users: ${users}, Classes: ${classes}`);
  
  const allUsers = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log('Remaining users:', JSON.stringify(allUsers, null, 2));
  await prisma.$disconnect();
}

main();
