export function availableHearts(
  numProposals: number,
  baseNumerator: number,
  baseDenominator: number,
  maxRatio: number,
): number | null {
  // Calculates number of hearts that a participant has available. The underlying assumption of the calculation is
  // that a participant must assign at least one heart to each available proposal.
  // :param: numProposals: number of proposals (options) that can be votes on.
  // :param: baseNumberator: specifies the minimum amounts of hearts a participant must allocate to a given proposal to satisfy the max ratio.
  // :param: baseDenominator: specifies the minimum amount of hearts a participant must have available to satisfy the max ratio.
  // :param: maxRatio: specifies the preference ratio a participant should be able to express over two project options.
  // :returns: number of a available heart for each participant given a number of proposals.

  const maxVotes = baseNumerator + (numProposals - 2) * baseNumerator;
  const minHearts = baseDenominator + (numProposals - 2) * baseDenominator;

  try {
    if (maxVotes / minHearts !== maxRatio) {
      throw new Error('baseNumerator/baseDenominator does not equal the specified max ratio');
    }
    return minHearts;
  } catch (error) {
    console.error((error as any).message);
    return null;
  }
}
