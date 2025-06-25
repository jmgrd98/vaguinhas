import { randomBytes } from 'crypto';

export default function generateConfirmationToken() {
  return randomBytes(32).toString('hex');
}