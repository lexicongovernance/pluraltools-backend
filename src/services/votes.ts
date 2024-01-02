import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { insertVotesSchema } from '../types';
import { votes } from '../db/votes';
import { eq } from 'drizzle-orm';

export function saveVote(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    req.body.userId = userId;
    const body = insertVotesSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }
    // save the votes
    const newVote = await dbPool
      .insert(votes)
      .values({
        userId: body.data.userId,
        numOfVotes: body.data.numOfVotes,
        optionId: body.data.optionId,
      })
      .returning();

    // Read num_of_votes for the specific option_id
    const voteList = await dbPool
      .select({ numOfVotes: votes.numOfVotes })
      .from(votes)
      .where(eq(db.votes.optionId, body.data.optionId))
      .execute();

    // Extract the list of numOfVotes from the result
    const numOfVotesList = voteList.map((vote) => vote.numOfVotes);

    // Sum the numOfVotesList (to be replaced by quadratic voting module)
    const totalVotes = numOfVotesList.reduce((acc, votes) => acc + votes, 0);

    // Update the options table with the new vote count
    await dbPool
      .update(db.options)
      .set({
        voteCount: totalVotes,
        updatedAt: new Date(),
      })
      .where(eq(db.options.id, body.data.optionId))
      .execute();

    // Return new vote object and list of numOfVotes for the optionId
    return res.json({ data: newVote[0], numOfVotesList });
  };
}
