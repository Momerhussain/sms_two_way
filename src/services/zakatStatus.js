import axios from 'axios';
import  authToken  from './auth.js';
import { getErrorMessage } from '../utils/errorCodes.js';
import generateHeaders from '../utils/helper.js';
import { api } from '../utils/axios-client.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch Zakat Status for a given account
 * @param {string} accountNo Last 4 digits of the account
 * @param {string} mobileNumber Mobile number of the user
 * @returns {object} Formatted Zakat status
 */
async function getZakatStatus(accountNo, mobileNumber) {
  const token = await authToken();
  const eoceanHeaders = generateHeaders();
  const endpoint = process.env.ZAKAT_STATUS_URL;

  const requestBody = {
    AccountNo: accountNo,
    MobileNumber: mobileNumber,
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

      const data = response.data?.ZakatStatusResponse;

      if (!data) {
        throw new Error('Invalid response from EOCEAN API');
      }

      const message = getErrorMessage(data.ResponseCode);

      if (data.ResponseCode !== '000122') {
        return { raw: data, message: message };
      }

      // Format response according to template
      const formattedMessage = `
Dear Customer, your current Zakat Status for (Acc. ending with ${data.AccountNo}) is "${data.ResponseMessage}". Helpline: 042111000622
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
        throw new Error(`Max retries reached: Failed to fetch Zakat Status`);
      }
    }
  }
}
export default getZakatStatus

async function test() {
  try {
    const result = await getZakatStatus('8319', '923012240575');
    console.log('Raw:', result.raw);
    console.log('Message:', result.message);
  } catch (err) {
    console.error(err.message);
  }
}
