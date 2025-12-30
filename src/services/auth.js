import qs from 'qs';
import { redisClient, connectRedis } from '../config/redisClient.js';
import logger from '../utils/logger.js';
import generateHeaders from '../utils/helper.js';
import { api } from '../utils/axios-client.js';
const TOKEN_CACHE_KEY = 'eocean_auth_token';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch token from MCB OAuth2 endpoint and cache in Redis
 */
export async function fetchAndCacheToken() {

  const requestBody = qs.stringify({
    client_id:process.env.CLIENT_ID,
    client_secret:process.env.CLIENT_SECRET,
    client_credentials:process.env.CLIENT_CREDENTIAL,
    scope:process.env.SCOPE,
    grant_type:process.env.GRANT_TYPE
  });

  const headers = generateHeaders();
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await api.post(process.env.TOKEN_URL, requestBody,{headers});

      const { access_token, expires_in } = response.data;
      
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
