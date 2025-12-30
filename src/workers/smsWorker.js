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
    try {
    const { receiver, sender, messagedata } = job.data;
    if (!receiver || !sender || !messagedata) {
      logger.warn('Missing required fields in request');
      return;
    }

    logger.info(`Incoming request from ${sender}: ${messagedata}`);
    const parts = messagedata.trim().split(/\s+/);
    const command = parts[0].toUpperCase();

    let resultMessage;

    switch (command) {
      case 'ACC': {
        logger.info(`Processing ACC command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await fetchAccountInfo(accountNo, sender);
        resultMessage = result.message; // Assuming your service returns a message field
        // resultMessage = "ACC"; // Assuming your service returns a message field
        break;
      }

      case 'ZS': {
        logger.info(`Processing ZS command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getZakatStatus(accountNo, sender);
        resultMessage = result.message;
        // resultMessage = 'ZS';
        break;
      }

      case 'ES': {
        logger.info(`Processing ES command for ${sender}`);
        const [ , accountNo, frequency, subscriptionStatus, physicalStmt ] = parts;
        if (!accountNo || !frequency || !subscriptionStatus || !physicalStmt) {
          throw new Error('Invalid EStatement request format');
        }
        const result = await requestEStatement(accountNo, sender, frequency, subscriptionStatus, physicalStmt);
        resultMessage = result.message;
        // resultMessage = 'ES';
        break;
      }

      case 'HELP': {
        logger.info(`Processing HELP command for ${sender}`);
        const result = await getHelpAssistance();
        resultMessage = result.message;
        // resultMessage = 'HELP';
        break;
      }

      case 'MS': {
        logger.info(`Processing MS command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getMiniStatement(accountNo, sender);
        resultMessage = result.message;
        // resultMessage = 'MS';
        break;
      }

        // 🆕 Added Balance Inquiry Case
      case 'BAL': {
        logger.info(`Processing BAL command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getBalanceInquiry(accountNo, sender);
        resultMessage = result.message;
        // resultMessage = 'BAL';
        break;
      }

        // 🆕 Subscribe to SMS Alerts
      case 'SUB': {
        logger.info(`Processing SUB command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getSubscriptionStatus(accountNo, sender, 'Y');
        resultMessage = result.message;
        // resultMessage = 'SUB';
        break;
      }

      // 🆕 Unsubscribe from SMS Alerts
      case 'UNSUB': {
        logger.info(`Processing UNSUB command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getSubscriptionStatus(accountNo, sender, 'N');
        resultMessage = result.message;
        // resultMessage = 'UNSUB';
        break;
      }

      default:
        logger.warn(`Unknown command received: ${command}`);
        resultMessage = null;
    }

    if(!resultMessage){
      logger.info(`No result message sender:${sender} receiver:${receiver} messagedata:${messagedata} `);
      return null;
    }

    // Prepare payload for external SMS API
    const smsPayload = {
      from: process.env.SMS_API_SHORTCODE,
      to: `+${sender}`,  // ensure country code
      text: resultMessage,
      messageId:uuidv4()
    };
    logger.info(`Sending SMS: ${JSON.stringify(smsPayload)}`);
    // Send to external SMS API
    let response = await axios.post(process.env.SMS_API_URL, smsPayload, {
      headers: { 'x-api-key': process.env.SMS_API_KEY }
    });

    logger.info(`SMS sent successfully to ${sender}, messageId=${response?.data?.messageId}`);
    logger.info({ statusCode: response?.data?.statusCode,status:response?.data?.status , messageId:response?.data?.messageId,sentTo: sender, command, message: resultMessage })
    // Return success response
    return Promise.resolve();

  } catch (err) {
    logger.error(`Error processing SMS job id=${job.id}: ${err.message}`);
    let response=err?.response?.data;
    logger.error(`Errors`,{statusCode:response?.statusCode,status:response?.status});
    return Promise.reject(err);
  }

  // try {
  //   switch (command) {
  //     case 'ACC': {
  //       const accountNo = parts[1];
  //       const result = await fetchAccountInfo(accountNo, from);
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'ZS': {
  //       const accountNo = parts[1];
  //       const result = await getZakatStatus(accountNo, from);
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'ES': {
  //       const [ , accountNo, frequency, subscriptionStatus, physicalStmt ] = parts;
  //       const result = await requestEStatement(accountNo, from, frequency, subscriptionStatus, physicalStmt);
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'HELP': {
  //       const result = await getHelpAssistance();
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'MS': {
  //       const accountNo = parts[1];
  //       const result = await getMiniStatement(accountNo, from);
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'BAL': {
  //       const accountNo = parts[1];
  //       const result = await getBalanceInquiry(accountNo, from);
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'SUB': {
  //       const accountNo = parts[1];
  //       const result = await getSubscriptionStatus(accountNo, from, 'Y');
  //       resultMessage = result.message;
  //       break;
  //     }
  //     case 'UNSUB': {
  //       const accountNo = parts[1];
  //       const result = await getSubscriptionStatus(accountNo, from, 'N');
  //       resultMessage = result.message;
  //       break;
  //     }
  //     default:
  //       resultMessage = 'Unknown command';
  //   }

  //   // Send SMS via external API
  //   const smsPayload = {
  //     from: '8888',
  //     to: `+${from}`,
  //     text: resultMessage,
  //     messageId: uuidv4(),
  //   };

  //   const response = await axios.post(process.env.SMS_API_URL, smsPayload, {
  //     headers: { 'x-api-key': process.env.SMS_API_KEY },
  //   });

  //   logger.info(`SMS sent successfully to ${from}, job id=${job.id}, messageId=${response?.data?.messageId}`);
  //   return Promise.resolve();
  // } catch (err) {
  //   logger.error(`Error processing SMS job id=${job.id}: ${err.message}`);
  //   return Promise.reject(err);
  // }


});
