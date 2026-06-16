import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const studentsAll = await prisma.student.findMany();
  console.log("ALL STUDENTS:", studentsAll.length);
  
  const unassignedNull = await prisma.student.findMany({
    where: { current_grade_id: null }
  });
  console.log("WHERE current_grade_id = null:", unassignedNull.length);

  const unassignedIsSet = await prisma.student.findMany({
    where: { current_grade_id: { isSet: false } }
  });
  console.log("WHERE current_grade_id { isSet: false }:", unassignedIsSet.length);
}

check().finally(() => prisma.$disconnect());
