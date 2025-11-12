import axios from "axios";
import  authToken  from './auth.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch account balance for a given account number (last 4 digits) and mobile number
 * @param {string} accountNo - Last 4 digits of the account number
 * @param {string} mobileNumber - User's mobile number (e.g., 92300XXXXXXX)
 * @returns {Promise<object>} - Formatted balance inquiry response
 */
export async function getBalanceInquiry(accountNo, mobileNumber) {
  const token = await authToken()
  const endpoint = process.env.BALANCE_INQUIRY_URL;

  const requestBody = {
    AccountNo: accountNo,
    MobileNumber: mobileNumber,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data?.BalanceInquiryResponse;

      if (!data) throw new Error("Invalid response from MCB Balance Inquiry API");

      // Check if API returned success
      if (data.ResponseCode !== "000000") {
        return {
          raw: data,
          error: data.ResponseMessage || "Request failed",
        };
      }

      // Format response according to template
      const formattedMessage = `
Dear Customer, your current balance for A/C${data.AccountNo.slice(-4)} is PKR ${data.AccountAvailableBalance}.
Download and use MCB Live to check your account balance anytime and from anywhere!
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
        throw new Error(`Max retries reached: Failed to fetch Balance Inquiry`);
      }
    }
  }
}
