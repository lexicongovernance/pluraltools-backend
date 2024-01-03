import { quadraticVoting } from './quadratic_voting';

describe('quadraticVoting', () => {
  test('calculates quadratic votes for each agent and sum of quadratic votes', () => {
    const votes: Record<string, number> = {
      user1: 4,
      user2: 9,
      user3: 16,
    };

    // Expected result
    const expectedQuadraticVotesDict: Record<string, number> = {
      user1: 2, // sqrt(4) = 2
      user2: 3, // sqrt(9) = 3
      user3: 4, // sqrt(16) = 4
    };

    const expectedSumQuadraticVotes = 2 + 3 + 4;

    const [resultQuadraticVotesDict, resultSumQuadraticVotes] = quadraticVoting(votes);

    // Verify that the result is as expected
    expect(resultQuadraticVotesDict).toEqual(expectedQuadraticVotesDict);
    expect(resultSumQuadraticVotes).toEqual(expectedSumQuadraticVotes);
  });

  test('', () => {
    // Example usage:
    const votes: Record<string, number> = {
      user1: 4,
      user2: 9,
      user3: 16,
    };
    const [result, sum] = quadraticVoting(votes);

    console.log('Quadratic Votes:', result);
    console.log('Sum of Quadratic Votes:', sum);
    expect(true).toBe(true);
  });
});
