import { api } from "../utils/axios-client.js";
import { getErrorMessage } from "../utils/errorCodes.js";
import generateHeaders from "../utils/helper.js";
import logger from "../utils/logger.js";
import authToken from "./auth.js";
const MAX_RETRIES = 3; 
const RETRY_DELAY_MS = 1000; // 1 second delay between retries const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function getZakatStatus(accountNo, mobileNumber) {
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

      const { ResponseCode, AccountNo, ResponseMessage } = data;
      const zakatStatus = extractZakatStatus(ResponseMessage);
      
      // -------- TEMPLATE HANDLING --------
      if (ResponseCode === '000122') {
        // Current Account – Not Required
        const formattedMessage =
          `Dear Customer, your zakat status is “${zakatStatus}” ` +
          `for your Current Account ending with ${AccountNo}. ` +
          `Helpline: 042111000622.`;

        return { raw: data, message: formattedMessage };
      }

      if (ResponseCode === '000128') {
        // Savings Account – Exempt / Not Exempt
        const formattedMessage =
          `Dear Customer, your current Zakat status for your Savings Account ` +
          `ending with ${AccountNo} is “${zakatStatus}”. ` +
          `Helpline: 042111000622.`;

        return { raw: data, message: formattedMessage };
      }

      const message=getErrorMessage(ResponseCode)
      if(!message){
      logger.warn(
          `[Zakatstatus] No Error code found response for ${mobileNumber} Account: ${accountNo} - Code: ${ResponseCode}, Message: ${message}`
        );
        return { raw: null,message:null};
      }
      // -------- DEFAULT HANDLING --------
      return {
        raw: data,
        message: getErrorMessage(ResponseCode)
      };

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.response?.data || error.message);

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      } else {
        throw new Error('Max retries reached: Failed to fetch Zakat Status');
      }
    }
  }
}

function extractZakatStatus(responseMessage = '') {
  const message = responseMessage.toLowerCase();

  if (message.includes('exempted') || message.includes('exempt')) return 'Exempt';
  if (message.includes('not exempt') || message.includes('not exempted')) return 'Not Exempt';
  if (message.includes('not required')) return 'Not Required';
  if (message.includes('required')) return 'Required';

  return 'Unknown';
}
