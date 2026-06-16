import { PrismaClient } from '@prisma/client';
import { decrypt } from './src/utils/encryption';

const prisma = new PrismaClient();

async function run() {
  const students = await prisma.student.findMany({
    where: {},
    take: 100
  });
  
  const decryptedStudents = students.map((s: any) => ({
    ...s,
    guardian_name: decrypt(s.guardian_name),
    guardian_phone: decrypt(s.guardian_phone)
  }));
  
  console.log("Returned Array:", decryptedStudents);
  
}
run().finally(() => prisma.$disconnect());
