import axios from 'axios';
import  authToken  from './auth.js';
import { getErrorMessage } from '../utils/errorCodes.js';
import logger from '../utils/logger.js';
import  generateHeaders  from '../utils/helper.js';
import { api } from '../utils/axios-client.js';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch account information from EOCEAN API with retry
 * @param {string} accountNo Last 4 digits of the account
 * @param {string} mobileNumber Mobile number in international format
 * @returns {object} Formatted account info
 */
async function fetchAccountInfo(accountNo, mobileNumber) {
  const token = await authToken();
  const endpoint = process.env.ACCOUNT_INFO_URL;
  const eoceanHeaders = generateHeaders();

  const requestBody = {
    AccountNo: accountNo,
    MobileNumber:mobileNumber,
  };
  
  logger.info(
    `📨 [AccountInfo] Request started for Mobile: ${mobileNumber}, Account: ${accountNo}`
  );
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.debug(`[AccountInfo] Attempt ${attempt}: Sending POST to ${endpoint}`);
      
      const response = await api.post(endpoint, requestBody, {
        headers: {
          ...eoceanHeaders,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = response?.data?.AccountInformationResponse;

        if (!data) {
        throw new Error('Invalid response from EOCEAN API');
      }
      logger.info(
        `[AccountInfo] Response received for ${mobileNumber}: Code=${data?.ResponseCode}`
      );

      const message = getErrorMessage(data?.ResponseCode);

      if (data.ResponseCode !== '000000') {
      logger.warn(
          `[AccountInfo] Non-success response for ${mobileNumber} - Code: ${data?.ResponseCode}, Message: ${message}`
        );
      if(!message){
      logger.warn(
          `[AccountInfo] No Error code found response for ${mobileNumber} Account: ${accountNo} - Code: ${data?.ResponseCode}, Message: ${message}`
        );
        return { raw: null,message:null};
      }
        return { raw: data,message:message};
      }

      // Format the response according to your template
      const formattedMessage = `
                                Dear Customer, Account Details:
                                ${data?.AccountTitle}
                                Account: ${data?.AccountNo}
                                IBAN: ${data?.IBAN}
                                Status: ${data?.AccountStatus}
                                Branch: ${data?.BranchName} - ${data?.BranchCode}
                                `;
      logger.info(
        `[AccountInfo] Successfully fetched account info for ${mobileNumber}`
      );
      return {
        raw: data,
        message: formattedMessage.trim(),
      };
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.response?.data || error.message);
      logger.error(
        `❌ [AccountInfo] Attempt ${attempt} failed for ${mobileNumber}: ${errMsg}`
      );
      if (attempt < MAX_RETRIES) {
        logger.warn(
          `[AccountInfo] Retrying in ${RETRY_DELAY_MS}ms... (${attempt}/${MAX_RETRIES})`
        );
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      } else {
        logger.error(
          `🚫 [AccountInfo] Max retries reached for ${mobileNumber}. Giving up.`
        );
        throw new Error(`Max retries reached: Failed to fetch account info`);
      }
    }
  }
}

export default fetchAccountInfo;


// async function test() {
//   try {
//     const result = await getAccountInfo('8319', '923007476638');
//     console.log('Raw:', result.raw);
//     console.log('Message:', result.message);
//   } catch (err) {
//     console.error(err.message);
//   }
// }