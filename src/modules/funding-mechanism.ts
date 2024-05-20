/**
 * Mechanism to allocate funding.
 *
 * @param funding The total amount of funding available.
 * @param maxFunding The maximum amount of funding that can be allocated to any single project.
 * @param optionData An array of objects containing option data including id, voteScore, and fundingRequest.
 * @returns An object containing the allocated funding for each project and the remaining funding.
 */
export function allocateFunding(
  funding: number,
  maxFunding: number,
  optionData: { id: string; voteScore: string; fundingRequest: string | null }[],
): { allocated_funding: { [key: string]: number }; remaining_funding: number } {
  // Convert fundingRequest to integer for processing
  const fundingRequestConverted: { [key: string]: number } = {};
  optionData.forEach((option) => {
    if (option.fundingRequest !== null) {
      fundingRequestConverted[option.id] = parseInt(option.fundingRequest, 10);
    } else {
      fundingRequestConverted[option.id] = 0;
    }
  });

  // Convert voteScore to float for processing
  const pluralityScoresConverted: { [key: string]: number } = {};
  optionData.forEach((option) => {
    pluralityScoresConverted[option.id] = parseFloat(option.voteScore);
  });

  // Check and update funding requests that exceed maxFunding
  for (const optionId in fundingRequestConverted) {
    if (fundingRequestConverted[optionId]! > maxFunding) {
      fundingRequestConverted[optionId] = 0;
    }
  }

  // Sort projects by plurality scores in descending order
  const sortedProjects: [string, number][] = Object.entries(pluralityScoresConverted).sort(
    (a, b) => b[1] - a[1],
  );

  // Allocate funding based on sorted plurality scores
  const allocatedFunding: { [key: string]: number } = {};
  for (const optionId in fundingRequestConverted) {
    allocatedFunding[optionId] = 0;
  }

  for (const [optionId] of sortedProjects) {
    const requestAmount = fundingRequestConverted[optionId];
    if (requestAmount !== undefined) {
      if (funding <= 0) {
        break;
      }
      if (requestAmount <= funding) {
        allocatedFunding[optionId] = requestAmount;
        funding -= requestAmount;
      } else {
        allocatedFunding[optionId] = 0;
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

const getOptionData = [
  {
    id: "ID1",
    voteScore: "5.5",
    fundingRequest: "10000",
  },
  {
    id: "ID2",
    voteScore: "6",
    fundingRequest: "8500",
  },
  {
    id: "ID3",
    voteScore: "8",
    fundingRequest: "2500",
  },
];

const result = allocateFunding(funding, maxFunding, getOptionData);

console.log(result);
*/
