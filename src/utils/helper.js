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
    Username: Buffer.from(process.env.USER_NAME || '').toString('base64'),
    Userpassword: Buffer.from(process.env.USERPASSWORD || '').toString('base64'),
    Channelid: process.env.CHANNELID,
    Ip: process.env.IP,
    Referenceno: referenceNo,
    Transmissiondatetime: transmissionDatetime,
  };
}
