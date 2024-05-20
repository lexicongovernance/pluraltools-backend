/**
 * Mechanism to allocate funding.
 *
 * @param funding The total amount of funding available.
 * @param maxFunding The maximum amount of funding that can be allocated to any single project.
 * @param fundingRequest A dictionary where keys are option IDs and values are funding requests (as strings).
 * @param pluralityScores A dictionary where keys are option IDs and values are plurality scores (as strings).
 * @returns An object containing the allocated funding for each project and the remaining funding.
 */
export function allocateFunding(
  funding: number,
  maxFunding: number,
  fundingRequest: { [key: string]: string },
  pluralityScores: { [key: string]: string },
): { allocated_funding: { [key: string]: number }; remaining_funding: number } {
  // Convert funding_request and plurality_scores to integer/float for processing
  const fundingRequestConverted: { [key: string]: number } = {};
  for (const key in fundingRequest) {
    fundingRequestConverted[key] = parseInt(fundingRequest[key]!, 10);
  }

  const pluralityScoresConverted: { [key: string]: number } = {};
  for (const key in pluralityScores) {
    pluralityScoresConverted[key] = parseFloat(pluralityScores[key]!);
  }

  // Check and update funding requests that exceed maxFunding
  for (const projectId in fundingRequestConverted) {
    if (fundingRequestConverted[projectId]! > maxFunding) {
      fundingRequestConverted[projectId] = 0;
    }
  }

  // Sort projects by plurality scores in descending order
  const sortedProjects: [string, number][] = Object.entries(pluralityScoresConverted).sort(
    (a, b) => b[1] - a[1],
  );

  // Allocate funding based on sorted plurality scores
  const allocatedFunding: { [key: string]: number } = {};
  for (const projectId in fundingRequestConverted) {
    allocatedFunding[projectId] = 0;
  }

  for (const [projectId] of sortedProjects) {
    const requestAmount = fundingRequestConverted[projectId];
    if (requestAmount !== undefined) {
      if (funding <= 0) {
        break;
      }
      if (requestAmount <= funding) {
        allocatedFunding[projectId] = requestAmount;
        funding -= requestAmount;
      } else {
        allocatedFunding[projectId] = 0;
      }
    }
  }

  // Return both the allocated funding and remaining funding
  return {
    allocated_funding: allocatedFunding,
    remaining_funding: funding,
  };
}

// Example usage:
/*
const funding = 15000;
const maxFunding = 10000;
const fundingRequest = { "ID1": "10000", "ID2": "8500", "ID3": "2500" };
const pluralityScores = { "ID1": "5.5", "ID2": "6", "ID3": "8" };

const result = allocateFunding(funding, maxFunding, fundingRequest, pluralityScores);

console.log(result);
*/
