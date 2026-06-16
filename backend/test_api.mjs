import jwt from 'jsonwebtoken';
import https from 'https';

const API = 'https://jadoon-portal-live-backend.vercel.app/api/students';
const token = jwt.sign({ id: 'dummy', role: 'SUPER_ADMIN' }, 'super_secret_jwt_key_here', { expiresIn: '1h' });

const req = https.request(API, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, '\nDATA:', data));
});
req.on('error', console.error);
req.end();
