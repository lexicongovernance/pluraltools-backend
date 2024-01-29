import { z } from 'zod';

export const CycleStatus = z.enum(['OPEN', 'CLOSED', 'UPCOMING']);

export type CycleStatusType = z.infer<typeof CycleStatus>;
