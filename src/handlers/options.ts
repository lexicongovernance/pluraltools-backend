import { eq, getTableColumns } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as db from '../db';
import { getOptionUsers, getOptionComments } from '../services/comments';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { insertOptionsSchema } from '../types';
import { validateQuestionFields } from '../services/questions';
import { isUserIsPartOfGroup } from '../services/groups';
import { getUserOption, saveOption, updateOption } from '../services/options';

export function getOptionHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({ error: 'Missing optionId' });
    }

    const { voteScore, ...rest } = getTableColumns(db.options);

    const rows = await dbPool
      .select({
        ...rest,
      })
      .from(db.options)
      .where(eq(db.options.id, optionId));

    if (!rows.length) {
      return res.status(404).json({ error: 'Option not found' });
    }

    return res.json({ data: rows[0] });
  };
}

/**
 * Retrieves comments related to a specific question option from the database and associates them with corresponding user information.
 * @param { NodePgDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves with the retrieved comments, each associated with user information if available.
 */
export function getOptionCommentsHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const optionId = req.params.optionId ?? '';

    try {
      const commentsWithUserNames = await getOptionComments(dbPool, { optionId });

      return res.json({ data: commentsWithUserNames });
    } catch (error) {
      console.error('Error getting comments: ', error);
      return res.sendStatus(500);
    }
  };
}

/**
 * Retrieves author and co-author data for a given question option created as a secret group.
 *
 * @param { NodePgDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the author data.
 */
export function getOptionUsersHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const optionId = req.params.optionId;

      // Check if optionId is provided
      if (!optionId) {
        return res.status(400).json({ error: 'Missing optionId parameter' });
      }

      // Execute queries
      const responseData = await getOptionUsers(optionId, dbPool);

      // Send response
      return res.status(200).json({ data: responseData });
    } catch (error) {
      console.error('Error in getOptionUsers:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function saveOptionHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    const body = insertOptionsSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    const brokenRules = await validateQuestionFields({
      dbPool,
      option: body.data,
    });

    if (brokenRules.length > 0) {
      return res.status(400).json({ errors: brokenRules });
    }

    const canRegisterGroup = await isUserIsPartOfGroup({
      dbPool,
      userId,
      groupId: body.data.groupId,
    });

    if (!canRegisterGroup) {
      return res.status(400).json({ errors: ['Can not register for this group'] });
    }

    try {
      const out = await saveOption(dbPool, body.data);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}

export function updateOptionHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const optionId = req.params.optionId;

    if (!optionId) {
      return res.status(400).json({ errors: ['registrationId is required'] });
    }

    const userId = req.session.userId;
    const body = insertOptionsSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    const brokenRules = await validateQuestionFields({
      dbPool,
      option: body.data,
    });

    if (brokenRules.length > 0) {
      return res.status(400).json({ errors: brokenRules });
    }

    const existingOption = await getUserOption({
      dbPool,
      optionId,
      userId,
    });

    if (!existingOption) {
      return res.status(400).json({ errors: ['Cannot update this registration'] });
    }

    try {
      const out = await updateOption({
        data: body.data,
        option: existingOption,
        dbPool,
      });
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}
