import Queue from 'bull';
import Redis from 'ioredis';

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

const smsQueue = new Queue('smsQueue', {
  redis: redisOptions,
});

export default smsQueue;
