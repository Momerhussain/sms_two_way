import { Router } from 'express';
import fetchAccountInfo from '../services/accountInfo.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getBalanceInquiry } from '../services/balanceInquiry.js';
import { getSubscriptionStatus } from '../services/subscriptionStatus.js';
import logger from '../utils/logger.js';
import smsQueue from '../config/smsQueue.js';
import getZakatStatus from '../services/zakatStatus.js';
import requestEStatement from '../services/estatement.js';
import { getHelpAssistance } from '../services/helper.js';
import getMiniStatement from '../services/ministatement.js';
/**
 * Incoming SMS endpoint
 */
// const router = express.Router();
export const userRouter2 = Router();

const SMS_API_URL = 'http://192.168.10.39:8080/sms/v3/send';
const SMS_API_KEY = '1eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhhbXphXzEiLCJpYXQiOjE3NTgwOTcwMjd9.BPKR3uOTusbui45ex-wrWxkj6FOe5DC-Dc01Cv2y6WU';

/**
 * Incoming SMS endpoint
 */
userRouter2.post('/', 
  asyncHandler(async (req, res) => {
     logger.info(`Request body---------------------:${JSON.stringify(req.body)}`);
  // console.log(req.body,'req');
  // return
  
  try {
    const { receiver, sender, messagedata } = req.body;
    if (!receiver || !sender || !messagedata) {
      logger.warn('Missing required fields in request');
      return res.status(400).json({ error: 'Missing required fields: receiver, from, messagedata' });
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
        break;
      }

        // 🆕 Subscribe to SMS Alerts
      case 'SUB': {
        logger.info(`Processing SUB command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getSubscriptionStatus(accountNo, sender, 'Y');
        resultMessage = result.message;
        break;
      }

      // 🆕 Unsubscribe from SMS Alerts
      case 'UNSUB': {
        logger.info(`Processing UNSUB command for ${sender}`);
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getSubscriptionStatus(accountNo, sender, 'N');
        resultMessage = result.message;
        break;
      }


      default:
        logger.warn(`Unknown command received: ${command}`);
        return res.status(400).json({ error: 'Unknown command in content' });
    }

    // Prepare payload for external SMS API
    const smsPayload = {
      from: '8888',
      to: `+${sender}`,  // ensure country code
      text: resultMessage,
      messageId:uuidv4()
    };
    console.log(smsPayload,'smsPayload');
    logger.info(`Sending SMS: ${JSON.stringify(smsPayload)}`);
    // Send to external SMS API
    let response = await axios.post(SMS_API_URL, smsPayload, {
      headers: { 'x-api-key': SMS_API_KEY }
    });

    logger.info(`SMS sent successfully to ${sender}, messageId=${response?.data?.messageId}`);
    
    // Return success response
    return res.send({ statusCode: response?.data?.statusCode,status:response?.data?.status , messageId:response?.data?.messageId,sentTo: sender, command, message: resultMessage });
    // return res.json({ status: 'success', sentTo: from, command, message: resultMessage });
  } catch (err) {
    console.error('Error processing incoming SMS:', err.message);
    logger.error(`Error processing command: ${err.message}`)
    let response=err?.response?.data;
    // return res.status(500).json({ error: err.message });
    return res.send({statusCode:response?.statusCode,status:response?.status});
  }
})
);


// userRouter2.post('/', asyncHandler(async (req, res) => {
//   try {
//     console.log(req.body,'req.body');
    
//     const { receiver, sender, messagedata } = req.body;
//     if (!receiver || !sender || !messagedata) {
//       logger.warn('Missing required fields in request');
//       return res.status(400).json({ error: 'Missing required fields: to, originator, messagedata' });
//     }

//     // Enqueue the job and respond immediately
//     const job = await smsQueue.add({ receiver, sender, messagedata }, { removeOnComplete: true, removeOnFail: true });
//     logger.info(`Enqueued SMS job id=${job.id} sender=${sender} content=${messagedata}`);

//     return res.status(202).json({ status: 'queued', jobId: job.id });
//   } catch (err) {
//     logger.error(`Error enqueuing SMS job: ${err.message}`);
//     return res.status(500).json({ error: 'Failed to enqueue SMS job' });
//   }
// }));

// userRouter2.get('/', asyncHandler(async (req, res) => {
//   try {
//     const { recipient, originator, messagedata } = req.query;
//     if (!recipient || !originator || !messagedata) {
//       logger.warn('Missing required fields in request');
//       return res.status(400).json({ error: 'Missing required fields: to, from, content' });
//     }

//     // Enqueue the job and respond immediately
//     const job = await smsQueue.add({ recipient, originator, messagedata }, { removeOnComplete: true, removeOnFail: true });
//     logger.info(`Enqueued SMS job id=${job.id} originator=${originator} content=${messagedata}`);

//     return res.status(202).json({ status: 'queued', jobId: job.id });
//   } catch (err) {
//     logger.error(`Error enqueuing SMS job: ${err.message}`);
//     return res.status(500).json({ error: 'Failed to enqueue SMS job' });
//   }
// }));

userRouter2.get('/', 
  asyncHandler(async (req, res) => {
      logger.info(`Request body---------------------:${JSON.stringify(req.body)}`);

  // return
  
  try {
    const { receiver, sender, messagedata } = req.body;
    if (!receiver || !sender || !messagedata) {
      return res.status(400).json({ error: 'Missing required fields: to, from, messagedata' });
    }

    const parts = messagedata.trim().split(/\s+/);
    const command = parts[0].toUpperCase();

    let resultMessage;

    switch (command) {
      case 'ACC': {
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await fetchAccountInfo(accountNo, sender);
        resultMessage = result.message; // Assuming your service returns a message field
        break;
      }

      case 'ZS': {
        const accountNo = parts[1];
        if (!accountNo) throw new Error('Missing account number');
        const result = await getZakatStatus(accountNo, from);
        resultMessage = result.message;
        break;
      }

      case 'ES': {
        const [ , accountNo, frequency, subscriptionStatus, physicalStmt ] = parts;
        if (!accountNo || !frequency || !subscriptionStatus || !physicalStmt) {
          throw new Error('Invalid EStatement request format');
        }
        const result = await requestEStatement(accountNo, from, frequency, subscriptionStatus, physicalStmt);
        resultMessage = result.message;
        break;
      }

      case 'HELP': {
        const result = await getHelpAssistance();
        resultMessage = result.message;
        break;
      }

      // case 'MS': {
      //   const accountNo = parts[1];
      //   if (!accountNo) throw new Error('Missing account number');
      //   const result = await getMiniStatement(accountNo, from);
      //   resultMessage = result.message;
      //   break;
      // }

      default:
        return res.status(400).json({ error: 'Unknown command in content' });
    }

    // Prepare payload for external SMS API
    const smsPayload = {
      from: '8888',
      to: `+${sender}`,  // ensure country code
      text: resultMessage
    };

    // Send to external SMS API
    await axios.post(SMS_API_URL, smsPayload, {
      headers: { 'x-api-key': SMS_API_KEY }
    });

    // Return success response
    return res.json({ status: 'success', sentTo: sender, command, message: resultMessage });
  } catch (err) {
    console.error('Error processing incoming SMS:', err.message);
    return res.status(500).json({ error: err.message });
  }
})
);


// export default router;
