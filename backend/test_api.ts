import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- RUNNING JADOON PORTAL API & BOUNDARY TESTS ---');
  
  // 1. We will simulate API requests via local fetch or direct controller invocation.
  // Since the server is running on localhost:8000, we'll hit it directly via fetch.
  try {
    console.log('\n[1] Testing Admin Login...');
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jadoonportal.edu.pk', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error('Admin login failed to return token');
    console.log('✅ Admin login successful. Token received.');

    console.log('\n[2] Testing RBAC Boundary (Teacher token accessing financial data)...');
    // First get a teacher token. The seed created teacher1@jadoonportal.edu.pk with teacher1pass
    const teacherRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher1@jadoonportal.edu.pk', password: 'teacher1pass' })
    });
    const teacherData = await teacherRes.json();
    
    // We will simulate a boundary test by trying to access a restricted attendance or financial route 
    // that requires SUPER_ADMIN or ADMIN. In our code, GET /api/attendance/daily-summary requires ADMIN.
    const bounceRes = await fetch('http://localhost:8000/api/attendance/daily-summary?date=2026-03-25', {
      headers: { 'Authorization': `Bearer ${teacherData.token}` }
    });
    
    if (bounceRes.status !== 403) {
      throw new Error(`Boundary Test Failed: Expected 403 Forbidden, got ${bounceRes.status}`);
    }
    console.log('✅ Boundary Access Blocked! Teacher correctly received 403 Forbidden.');

    console.log('\n[3] Testing JWT Authentication on Valid Admin Request...');
    const adminReq = await fetch('http://localhost:8000/api/attendance/daily-summary?date=2026-03-25', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    if (adminReq.status !== 200) {
      throw new Error(`Admin Request Failed: Expected 200, got ${adminReq.status}`);
    }
    const adminData = await adminReq.json();
    console.log('✅ Admin request successful. Response:', JSON.stringify(adminData).substring(0, 50) + '...');
    
    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
