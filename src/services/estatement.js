import axios from 'axios';
import  authToken  from './auth.js';
import { getErrorMessage } from '../utils/errorCodes.js';
import generateHeaders from '../utils/helper.js';
import { api } from '../utils/axios-client.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Subscribe or unsubscribe E-Statement for a user
 * @param {string} accountNo Last 4 digits of account
 * @param {string} mobileNumber User mobile number
 * @param {string} frequency Frequency of E-Statement: YEARLY, MONTHLY, WEEKLY
 * @param {string} subscriptionStatus YES for subscribe, NO for unsubscribe
 * @param {string} physicalStmt Y or N
 * @returns {object} Formatted E-Statement response
 */
async function requestEStatement(accountNo, mobileNumber, frequency, subscriptionStatus, physicalStmt) {
  const token = await authToken();
  const eoceanHeaders = generateHeaders();
  
  const endpoint = process.env.ESTATEMENT_URL;

  const requestBody = {
    AccountNo: accountNo,
    MobileNumber: mobileNumber,
    Frequency: frequency,
    SubscriptionStatus: subscriptionStatus,
    PhysicalStmt: physicalStmt,
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

      const data = response.data?.EStatementResponse;

      if (!data) {
        throw new Error('Invalid response from EOCEAN API');
      }
      console.log(data.ResponseCode,'data.ResponseCode');
      
      const message = getErrorMessage(data.ResponseCode);

      if (data.ResponseCode !== '000125') {
        return { raw: data, message: message };
      }

      // Format response according to template
      const formattedMessage = `
Dear Customer, your E-Statement for Account No. *${data.AccountNo}* has been sent to your registered email address. Stay updated on all transactions! Helpline: 042111000622
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
        throw new Error('Max retries reached: Failed to request E-Statement');
      }
    }
  }
}

export default requestEStatement;
async function test() {
  try {
    const result = await requestEStatement('3652', '923012240575', 'YEARLY', 'YES', 'N');
    console.log('Raw:', result.raw);
    console.log('Message:', result.message);
  } catch (err) {
    console.error(err.message);
  }
}
