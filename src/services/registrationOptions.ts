import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import type { Request, Response } from 'express';

export function getRegistrationOptions(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const out: { [categoryName: string]: db.RegistrationOption[] } = {};
    const registrationOptions = await dbPool.query.registrationOptions.findMany({});
    for (const registrationOption of registrationOptions) {
      out[registrationOption.category] = [
        ...(out[registrationOption.category] ?? []),
        registrationOption,
      ];
    }
    return res.json({ data: out });
  };
}
