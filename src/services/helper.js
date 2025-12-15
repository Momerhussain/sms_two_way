import axios from 'axios';
import  authToken  from './auth.js';
import { getErrorMessage } from '../utils/errorCodes.js';
import { api } from '../utils/axios-client.js';
import generateHeaders from '../utils/helper.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch help assistance information
 * @returns {object} Formatted help response
 */
export async function getHelpAssistance() {
  const token = await authToken();
  const eoceanHeaders = generateHeaders();
  
  const endpoint = process.env.HELP_URL;

  const requestBody = {
    command: 'HELP',
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await api.post(endpoint, requestBody, {
        headers: {
          ...eoceanHeaders,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data?.HelpResponse;

      if (!data) {
        throw new Error('Invalid response from EOCEAN API');
      }

      const message = getErrorMessage(data.ResponseCode);

      if (data.ResponseCode !== '000000') {
        return { raw: data, message: message };
      }

      // Format response according to template
      const formattedMessage = `
Dear Customer, need help with SMS Banking or other services? Please call us at 042111000622 or you may also request assistance via Live Chat at mcblive.com
`;

      return {
        raw: data,
        message: formattedMessage.trim(),
      };
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.response?.data || error.message);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      } else {
        throw new Error('Max retries reached: Failed to fetch Help Assistance');
      }
    }
  }
}

async function test() {
  try {
    const result = await getHelpAssistance();
    console.log('Raw:', result.raw);
    console.log('Message:', result.message);
  } catch (err) {
    console.error(err.message);
  }
}
