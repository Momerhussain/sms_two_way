import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import smsQueue from '../config/smsQueue.js';
import fetchAccountInfo from '../services/accountInfo.js';
import getZakatStatus from '../services/zakatStatus.js';
import requestEStatement from '../services/estatement.js';
import { getHelpAssistance } from '../services/helper.js';
import getMiniStatement from '../services/ministatement.js';
import { getBalanceInquiry } from '../services/balanceInquiry.js';
import { getSubscriptionStatus } from '../services/subscriptionStatus.js';

smsQueue.process(async (job) => {
    console.log('SMS Worker started');
  const { to, from, content } = job.data;
  logger.info(`Processing SMS job id=${job.id} from=${from} content=${content}`);

  const parts = content.trim().split(/\s+/);
  const command = parts[0].toUpperCase();

  let resultMessage;

  try {
    switch (command) {
      case 'ACC': {
        const accountNo = parts[1];
        const result = await fetchAccountInfo(accountNo, from);
        resultMessage = result.message;
        break;
      }
      case 'ZS': {
        const accountNo = parts[1];
        const result = await getZakatStatus(accountNo, from);
        resultMessage = result.message;
        break;
      }
      case 'ES': {
        const [ , accountNo, frequency, subscriptionStatus, physicalStmt ] = parts;
        const result = await requestEStatement(accountNo, from, frequency, subscriptionStatus, physicalStmt);
        resultMessage = result.message;
        break;
      }
      case 'HELP': {
        const result = await getHelpAssistance();
        resultMessage = result.message;
        break;
      }
      case 'MS': {
        const accountNo = parts[1];
        const result = await getMiniStatement(accountNo, from);
        resultMessage = result.message;
        break;
      }
      case 'BAL': {
        const accountNo = parts[1];
        const result = await getBalanceInquiry(accountNo, from);
        resultMessage = result.message;
        break;
      }
      case 'SUB': {
        const accountNo = parts[1];
        const result = await getSubscriptionStatus(accountNo, from, 'Y');
        resultMessage = result.message;
        break;
      }
      case 'UNSUB': {
        const accountNo = parts[1];
        const result = await getSubscriptionStatus(accountNo, from, 'N');
        resultMessage = result.message;
        break;
      }
      default:
        resultMessage = 'Unknown command';
    }

    // Send SMS via external API
    const smsPayload = {
      from: '8888',
      to: `+${from}`,
      text: resultMessage,
      messageId: uuidv4(),
    };

    const response = await axios.post(process.env.SMS_API_URL, smsPayload, {
      headers: { 'x-api-key': process.env.SMS_API_KEY },
    });

    logger.info(`SMS sent successfully to ${from}, job id=${job.id}, messageId=${response?.data?.messageId}`);
    return Promise.resolve();
  } catch (err) {
    logger.error(`Error processing SMS job id=${job.id}: ${err.message}`);
    return Promise.reject(err);
  }
});
