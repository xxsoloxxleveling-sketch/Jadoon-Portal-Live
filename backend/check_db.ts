import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const students = await prisma.student.findMany();
  console.log('STUDENTS IN DB:', students.length);
  console.dir(students, { depth: null });
  process.exit(0);
}
run();
