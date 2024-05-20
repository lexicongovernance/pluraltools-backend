import { allocateFunding } from './funding-mechanism';

describe('test funding mechanism', () => {
  test('calculates the funding according to the mechanism', () => {
    const availableFunding = 100000;
    const maxFunding = 10000;
    const getOptionData = [
      {
        id: 'ID1',
        voteScore: '5.5',
        fundingRequest: '10000',
      },
      {
        id: 'ID2',
        voteScore: '6',
        fundingRequest: '8500',
      },
      {
        id: 'ID3',
        voteScore: '8',
        fundingRequest: '2500',
      },
    ];

    const expectedResult = {
      allocated_funding: { ID1: 10000, ID2: 8500, ID3: 2500 },
      remaining_funding: 79000,
    };

    const result = allocateFunding(availableFunding, maxFunding, getOptionData);
    expect(result).toEqual(expectedResult);
  });

  test('Does not allocate funding to the lowest plurality score if no funding is availabe anymore', () => {
    const availableFunding = 15000;
    const maxFunding = 10000;
    const getOptionData = [
      {
        id: 'ID1',
        voteScore: '5.5',
        fundingRequest: '10000',
      },
      {
        id: 'ID2',
        voteScore: '6',
        fundingRequest: '8500',
      },
      {
        id: 'ID3',
        voteScore: '8',
        fundingRequest: '2500',
      },
    ];

    const expectedResult = {
      allocated_funding: { ID1: 0, ID2: 8500, ID3: 2500 },
      remaining_funding: 4000,
    };

    const result = allocateFunding(availableFunding, maxFunding, getOptionData);
    expect(result).toEqual(expectedResult);
  });

  test('Excludes projects from funding who specify more than the maximum amount', () => {
    const availableFunding = 15000;
    const maxFunding = 10000;
    const getOptionData = [
      {
        id: 'ID1',
        voteScore: '5.5',
        fundingRequest: '10000',
      },
      {
        id: 'ID2',
        voteScore: '6',
        fundingRequest: '15000',
      },
      {
        id: 'ID3',
        voteScore: '8',
        fundingRequest: '2500',
      },
    ];

    const expectedResult = {
      allocated_funding: { ID1: 10000, ID2: 0, ID3: 2500 },
      remaining_funding: 2500,
    };

    const result = allocateFunding(availableFunding, maxFunding, getOptionData);
    expect(result).toEqual(expectedResult);
  });
});
