import  authToken  from './auth.js';
import { api } from "../utils/axios-client.js";
import generateHeaders from "../utils/helper.js";
import { getErrorMessage } from "../utils/errorCodes.js";
import logger from "../utils/logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handle subscription/unsubscription request
 * @param {string} accountNo - Last 4 digits of account number
 * @param {string} mobileNumber - Mobile number (e.g. 92300XXXXXXX)
 * @param {'Y'|'N'} subscriptionStatus - 'Y' for subscribe, 'N' for unsubscribe
 * @returns {Promise<object>} Formatted subscription status response
 */
export async function getSubscriptionStatus(accountNo, mobileNumber, subscriptionStatus) {
  const token = await authToken();
  const eoceanHeaders = generateHeaders();
  
  const endpoint = process.env.SUBSCRIPTION_STATUS_URL;

  const requestBody = {
    AccountNo: accountNo,
    MobileNumber: mobileNumber,
    SubscriptionStatus: `${subscriptionStatus}`,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await api.post(endpoint, requestBody, {
        headers: {
          ...eoceanHeaders,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data?.SubscriptionStatusResponse;
      if (!data) throw new Error("Invalid response from MCB Subscription API");
      
      const message = getErrorMessage(data.ResponseCode);

      // If not success, handle error messages
      if (data.ResponseCode !== "000000") {
        if(!message){
        logger.warn(
          `[SubscriptionStatus] No Error code found response for ${mobileNumber} Account: ${accountNo} - Code: ${data.ResponseCode}, Message: ${message}`
        );
        return { raw: null,message:null};
      }
        // const message = getErrorMessage2(data.ResponseCode, data.AccountNo) || getErrorMessage(data.ResponseCode) || 'Unknown error occurred';
        return { raw: data, message: message };
      }

      // Success message handling
      const formattedMessage =
  subscriptionStatus === "Y"
    ? `Dear Customer, SMS OTC Alerts are now active on A/C*${data.AccountNo} at PKR ${data.Fee}+tax/month. To unsubscribe, send UNSUB (space) <last 4 digits of A/C#> to 6222. T&Cs apply.`
    : `Dear Customer, you have unsubscribed from SMS OTC Alerts for A/C ${data.AccountNo}. To re-subscribe, send SUB (space) <last 4 digits of A/C#> to 6222. Helpline: 042111000622`;

      // const formattedMessage =
      //   subscriptionStatus === "Y"
      //     ? `Dear Customer, SMS Alerts are now active on A/C${data.AccountNo}. at PKR ${data.Fee}+tax/month. To unsubscribe, send UNSUB (space) <last 4 digits of A/C#> to 6222. T&Cs apply`
      //     : `Dear Customer, you have unsubscribed from SMS Alerts for A/C${data.AccountNo}. To re-subscribe, send SUB (space) <last 4 digits of A/C#> to 6222 anytime`;

      return {
        raw: data,
        message: formattedMessage?.trim(),
      };
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.response?.data || error.message);

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      } else {
        throw new Error(`Max retries reached: Failed to fetch Subscription Status`);
      }
    }
  }
}

/**
 * Maps response codes to customer-friendly messages
 */
function getErrorMessage2(code) {
  switch (code) {
    case "000136":
      return `Dear Customer, we couldn’t verify your details due to a mismatch in our records. Please visit your branch or call our helpline at 042111000622 for assistance`;
    case "000138":
      return `Dear Customer, your mobile number is not updated in our records. Please visit your branch or call our helpline at 042111000622 to update it`;
    case "000139":
      return `Dear Customer, your account type is not eligible for SMS Alerts. For details, please visit your branch or call our helpline at 042111000622`;
    case "000140":
      return `Dear Customer, your account balance is insufficient for this service. Please ensure your account has adequate funds and try again. Helpline: 042111000622`;
    case "000142":
      return `Dear Customer, you are already subscribed to this service. To unsubscribe, send UNSUB (space) <last 4 digits of A/C#> to 6222. Helpline: 042111000622`;
    case "000143":
      return `Dear Customer, you are not subscribed to this service. To subscribe, send SUB (space) <last 4 digits of A/C#> to 6222. Helpline: 042111000622`;
    default:
      return null;
  }
}
