export function quadraticVoting(votes: Record<string, number>): [Record<string, number>, number] {
  // Calculates quadratic votes for each agent based on the square root of their votes.
  // :param: (votes): A dictionary representing the number of votes for each user.
  // :returns: A tuple containing a dictionary of quadratic votes for each user and the sum of quadratic votes.

  const quadraticVotesDict: Record<string, number> = {};

  for (const userId in votes) {
    if (userId in votes) {
      const vote = votes[userId];

      if (vote === undefined) {
        throw new Error(`Vote for user ${userId} is undefined.`);
      }

      const quadraticVotesUser = Math.sqrt(vote);
      quadraticVotesDict[userId] = quadraticVotesUser;
    }
  }

  const sumQuadraticVotes = Object.values(quadraticVotesDict).reduce(
    (acc, value) => acc + value,
    0,
  );

  return [quadraticVotesDict, sumQuadraticVotes];
}

/*
// Example usage:
const votes: Record<string, number> = {
  "user1": 4,
  "user2": 9,
  "user3": 16,
};

const [result, sum] = quadraticVoting(votes);

console.log('Quadratic Votes:', result);
console.log('Sum of Quadratic Votes:', sum);
*/
