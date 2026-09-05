/**
 * Inngest serve handler
 * Handles webhook delivery from Inngest cloud
 */

import { serve } from 'inngest/next';
import { inngest } from '../../../lib/jobs/inngestClient';
import { analysisJobFunction } from '../../../lib/jobs/analysisJob';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analysisJobFunction],
});
