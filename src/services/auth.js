import axios from 'axios';
import qs from 'qs';
import { redisClient, connectRedis } from '../config/redisClient.js';

const TOKEN_CACHE_KEY = 'eocean_auth_token';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndCacheToken() {
  const { TOKEN_URL, CLIENT_ID, CLIENT_SECRET, SCOPE } = process.env;

  const requestBody = qs.stringify({
    grant_type: 'client_credentials',
    scope: SCOPE,
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(TOKEN_URL, requestBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
        },
      });

      const { access_token, expires_in } = response.data;

      await redisClient.setEx(TOKEN_CACHE_KEY, expires_in || 3600, access_token);

      console.log(`🔐 New EOCEAN token generated and cached in Redis (attempt ${attempt})`);

      return access_token;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed to fetch token:`, error.response?.data || error.message);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
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
