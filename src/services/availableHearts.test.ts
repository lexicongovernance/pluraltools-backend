import { availableHearts } from './availableHearts';

// Test availableHearts function
describe('availableHearts function', () => {
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
    expect(result).toBeNull();
  });
});
