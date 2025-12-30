import axios from 'axios';
import authToken from './auth.js';
import { getErrorMessage } from '../utils/errorCodes.js';
import generateHeaders from '../utils/helper.js';
import { api } from '../utils/axios-client.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch mini statement for user
 * @param {string} accountNo Last 4 digits of account
 * @param {string} mobileNumber User mobile number
 * @returns {object} Formatted mini statement
 */
async function getMiniStatement(accountNo, mobileNumber) {
  const token = await authToken();
  const eoceanHeaders = generateHeaders();
  const endpoint = process.env.MINISTATEMENT_URL;

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

      const data = response.data?.MiniStatementResponse;

      if (!data) {
        throw new Error('Invalid response from EOCEAN API');
      }

      const message = getErrorMessage(data.ResponseCode);

      if (data.ResponseCode !== '000000') {
        if (!message) {
          logger.warn(
            `[Ministatement] No Error code found response for ${mobileNumber} Account: ${accountNo} - Code: ${data.ResponseCode}, Message: ${message}`
          );

          return {
            raw: null,
            message: null,
          };
        }

        return {
          raw: data,
          error: message,
        };
      }

      //       let formattedMessage =
      //   `Dear Customer, your Mini Statement:\n` +
      //   `Closing Balance: PKR ${data.ClosingBalance}\n`;

      // if (Array.isArray(data.Transaction)) {
      //   data.Transaction.forEach((tx) => {
      //     const sign = tx.Sign === 'C' ? 'CREDIT' : 'DEBIT';

      //     formattedMessage +=
      //       `${tx.TransactionDate} ` +
      //       `${tx.TransactionDescription} ` +
      //       `${sign} ` +
      //       `PKR ${tx.TransactionAmount}\n`;
      //   });
      // }

      let formattedMessage = 'Dear Customer, your Mini Statement:\n';

      if (Array.isArray(data.Transaction)) {
        data.Transaction.forEach((tx) => {
          const drCr = tx.Sign === 'C' ? 'CR' : 'DR';

          formattedMessage +=
            `${tx.TransactionDate} ` +
            `${tx.TransactionDescription.trim()} ` +
            `PKR ${Number(tx.TransactionAmount).toLocaleString('en-PK', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${drCr}\n`;
        });
      }


      return {
        raw: data,
        message: formattedMessage.trim(),
      };
    } catch (error) {
      console.error(
        `❌ Attempt ${attempt} failed:`,
        error.response?.data || error.message
      );

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      } else {
        throw new Error(
          'Max retries reached: Failed to fetch Mini Statement'
        );
      }
    }
  }
}

export default getMiniStatement;

// Test function
async function test() {
  try {
    const result = await getMiniStatement('8319', '923007476638');
    console.log('Raw:', result.raw);
    console.log('Message:', result.message);
  } catch (err) {
    console.error(err.message);
  }
}
