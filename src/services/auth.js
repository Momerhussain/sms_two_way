import axios from 'axios';
import qs from 'qs';
import { redisClient, connectRedis } from '../config/redisClient.js';
import { randomBytes } from 'crypto';
import logger from '../utils/logger.js';
import { generateHeaders } from '../utils/helper.js';

const TOKEN_CACHE_KEY = 'eocean_auth_token';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// async function fetchAndCacheToken() {
//   const { TOKEN_URL, CLIENT_ID, CLIENT_SECRET, SCOPE } = process.env;

//   const requestBody = qs.stringify({
//     grant_type: 'client_credentials',
//     scope: SCOPE,
//   });

//   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
//     try {
//       const response = await axios.post(TOKEN_URL, requestBody, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
//         },
//       });

//       const { access_token, expires_in } = response.data;

//       await redisClient.setEx(TOKEN_CACHE_KEY, expires_in || 3600, access_token);

//       console.log(`🔐 New EOCEAN token generated and cached in Redis (attempt ${attempt})`);

//       return access_token;
//     } catch (error) {
//       console.error(`❌ Attempt ${attempt} failed to fetch token:`, error.response?.data || error.message);
//       if (attempt < MAX_RETRIES) {
//         console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
//         await delay(RETRY_DELAY_MS);
//       } else {
//         throw new Error('Max retries reached: Token generation failed');
//       }
//     }
//   }
// }


/**
 * Generate unique reference number and timestamp
 */
function generateReference() {
  const referenceNo = randomBytes(8).toString('hex'); // Unique ref per request
  const transmissionDatetime = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14); // yyyyMMddHHmmss
  return { referenceNo, transmissionDatetime };
}

/**
 * Fetch token from MCB OAuth2 endpoint and cache in Redis
 */
export async function fetchAndCacheToken() {
  const {
    TOKEN_URL = 'https://api-int.uatex13.com.pk:9443/mcb/uat/auth/token',
    CLIENT_ID = '4f0151bf6297f70a40449d5c6e251150',
    CLIENT_SECRET = '1c4b452838410827e3865b4d776f533b',
    SCOPE = 'EOcean',
    USERNAME='EOcean',
    PASSWORD='EOcean123',
    CHANNEL_ID = 'EOcean',
    SYSTEM_IP = '192.168.253.14', // Replace with your system IP or env var
    GRANT_TYPE='client_credentials',
    CLIENT_CREDIENTIAL='EOcean123'
  } = process.env;

  // const { referenceNo, transmissionDatetime } = generateReference();

  const requestBody = qs.stringify({
    client_id:CLIENT_ID,
    client_secret:CLIENT_SECRET,
    client_credentials:CLIENT_CREDIENTIAL,
    scope:SCOPE,
    grant_type:GRANT_TYPE
  });

  // const headers = {
  //   'Content-Type': 'application/x-www-form-urlencoded',
  //   Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
  //   Username: Buffer.from(USERNAME || '').toString('base64'),
  //   Userpassword: Buffer.from(PASSWORD || '').toString('base64'),
  //   Channelid: CHANNEL_ID,
  //   Ip: SYSTEM_IP,
  //   Referenceno: referenceNo,
  //   Transmissiondatetime: transmissionDatetime,
  // };

    const headers = generateHeaders({
    CLIENT_ID,
    CLIENT_SECRET,
    USERNAME,
    PASSWORD,
    CHANNEL_ID,
    SYSTEM_IP,
  });



  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(TOKEN_URL, requestBody, { headers });

      const { access_token, expires_in } = response;
      console.log(response,'response');
      
      await redisClient.setEx(TOKEN_CACHE_KEY, expires_in || 3600, access_token);

      logger.info(`🔐 New EOCEAN token generated and cached in Redis (attempt ${attempt})`);
      return access_token;
    } catch (error) {
      logger.error(
        `❌ Attempt ${attempt} failed to fetch token: ${
          error.response?.data?.error_description || error.message
        }`
      );
      if (attempt < MAX_RETRIES) {
        logger.info(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      } else {
        throw new Error('Max retries reached: Token generation failed');
      }
    }
  }
}

async function authToken() {
  try {
    await connectRedis();

    let token = await redisClient.get(TOKEN_CACHE_KEY);

    if (token) {
      return token;
    }

    token = await fetchAndCacheToken();

    return token;
  } catch (error) {
    console.error('Error getting token from Redis or EOCEAN:', error.message);
    throw new Error('Token retrieval failed');
  }
}

export default authToken
