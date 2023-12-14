function quadraticVoting(votes: number[]): [Record<number, number>, number] {
    // Calculates quadratic votes for each agent based on the square root of their votes.
    // :param: (votes): An array representing the number of votes for each agent.
    // :returns: A tuple containing a dictionary of quadratic votes for each agent and the sum of quadratic votes.
    const quadraticVotesDict: Record<number, number> = {};
  
    for (let agentI = 0; agentI < votes.length; agentI++) {
      const quadraticVotesAgentI = Math.sqrt(votes[agentI] ?? 0);
      quadraticVotesDict[agentI] = quadraticVotesAgentI;
    }
  
    const sumQuadraticVotes = Object.values(quadraticVotesDict).reduce(
      (acc, value) => acc + value,
      0
    );
  
    return [quadraticVotesDict, sumQuadraticVotes];
  }
  
  // Example usage:
  const votes: number[] = [4, 9, 16];
  const [result, sum] = quadraticVoting(votes);
  
  console.log('Quadratic Votes:', result);
  console.log('Sum of Quadratic Votes:', sum);
  