/**
 * Inngest Client Instance
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'verifyai',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
