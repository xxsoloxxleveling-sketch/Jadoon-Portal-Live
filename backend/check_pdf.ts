import { downloadChallanPDF } from './src/modules/finance/finance.controller';
import fs from 'fs';
import prisma from './src/config/database';

async function run() {
  const challan = await prisma.feeChallan.findFirst();
  if(!challan) {
    console.log("No challans in DB to test");
    process.exit(0);
  }

  const req = { params: { id: challan.id } } as any;
  const res: any = fs.createWriteStream('test_challan_output.pdf');
  res.setHeader = (k: any, v: any) => console.log(`Header: ${k} = ${v}`);
  res.status = (code: number) => {
    console.log(`Status: ${code}`);
    return { json: (d: any) => console.log(d) };
  };

  console.log("Generating PDF for challan:", challan.id);
  
  try {
     await downloadChallanPDF(req, res);
     console.log("Execution complete. Check test_challan_output.pdf");
  } catch(e) {
     console.error("FAILED PDF GENERATION:", e);
  }
}
run();
