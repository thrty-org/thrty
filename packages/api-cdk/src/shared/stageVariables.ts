import { createHash } from 'crypto';
import { HttpMethod } from '@thrty/api';

export const createHashedKey = (method: HttpMethod, path: string, key: string) =>
  createHash('sha1').update(`${key}${method.toLowerCase()}_${path}`, 'utf8').digest('hex');
