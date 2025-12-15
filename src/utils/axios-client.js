// axios-client.js
import axios from 'axios';
import https from 'https';
import fs from 'fs';

// Load your internal/self-signed CA certificate
// const ca = fs.readFileSync('/path/to/your/ca.crt');

// Create reusable axios instance
export const api = axios.create({
  httpsAgent: new https.Agent({
    // ca,                 // trust your CA
    rejectUnauthorized: false,
  }),
//   headers: {
//     'Content-Type': 'application/json',
//   },
});
