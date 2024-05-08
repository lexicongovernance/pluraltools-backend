import { availableHearts } from './forum-questions';

// Test availableHearts function
describe('service: forumQuestions', () => {
  test('calculates available hearts correctly', () => {
    const numProposals = 2;
    const baseNumerator = 4;
    const baseDenominator = 5;
    const maxRatio = 0.8;

    const result = availableHearts(numProposals, baseNumerator, baseDenominator, maxRatio);
    expect(result).toEqual(5);
  });

  test('error if max ratio was not calculated correctly', () => {
    const numProposals = 2;
    const baseNumerator = 4;
    const baseDenominator = 5;
    const maxRatio = 0.9;

    const result = availableHearts(numProposals, baseNumerator, baseDenominator, maxRatio);
    expect(result).toEqual(0);
  });

  test('returns custom hearts if customHearts is set', () => {
    const numProposals = 2;
    const baseNumerator = 4;
    const baseDenominator = 5;
    const maxRatio = 0.8;
    const customHearts = 10;

    const result = availableHearts(
      numProposals,
      baseNumerator,
      baseDenominator,
      maxRatio,
      customHearts,
    );
    expect(result).toEqual(customHearts);
  });

  test('executes the function if customHearts is not set', () => {
    const numProposals = 2;
    const baseNumerator = 4;
    const baseDenominator = 5;
    const maxRatio = 0.8;

    const result = availableHearts(numProposals, baseNumerator, baseDenominator, maxRatio);
    expect(result).toEqual(5);
  });

  test('executes the function if customHearts is set to less than 2', () => {
    const numProposals = 2;
    const baseNumerator = 4;
    const baseDenominator = 5;
    const maxRatio = 0.8;
    const customHearts = 1;

    const result = availableHearts(
      numProposals,
      baseNumerator,
      baseDenominator,
      maxRatio,
      customHearts,
    );
    expect(result).toEqual(5);
  });

  test('that function returns 0 in case the number of proposals are less than 2', () => {
    const numProposals = 1;
    const baseNumerator = 4;
    const baseDenominator = 5;
    const maxRatio = 0.8;

    const result = availableHearts(numProposals, baseNumerator, baseDenominator, maxRatio);
    expect(result).toEqual(0);
  });
});
