// utils/headers.js
import { randomBytes } from 'crypto';

export default function generateHeaders() {
  const referenceNo = randomBytes(8).toString('hex');
  const transmissionDatetime = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14); // yyyyMMddHHmmss

  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    // Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    Username: Buffer.from('EOcean' || '').toString('base64'),
    Userpassword: Buffer.from('EOcean123' || '').toString('base64'),
    Channelid: 'EOcean',
    Ip: '192.168.253.14',
    Referenceno: referenceNo,
    Transmissiondatetime: transmissionDatetime,
  };
}
