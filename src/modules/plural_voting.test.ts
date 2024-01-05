import { PluralVoting } from './plural_voting';

// Define instance outside the tests
const groups: Record<string, string[]> = {
  group0: ['user0', 'user1'],
  group1: ['user1', 'user2', 'user3'],
  group2: ['user0', 'user2'],
};

const contributions: Record<string, number> = {
  user0: 1,
  user1: 2,
  user2: 3,
  user3: 4,
};

const pluralVoting = new PluralVoting(groups, contributions);

// Test create group memberships
describe('createGroupMemberships', () => {
  test('creates group memberships correctly', () => {
    const result = pluralVoting.createGroupMemberships(groups);
    expect(result).toEqual({
      user0: ['group0', 'group2'],
      user1: ['group0', 'group1'],
      user2: ['group1', 'group2'],
      user3: ['group1'],
    });
  });
});

// test common group
describe('commonGroup', () => {
  test('should return true if participants share a common group', () => {
    const groupMemberships: Record<string, string[]> = {
      user0: ['group0', 'group2'],
      user1: ['group0', 'group1'],
      user2: ['group1', 'group2'],
      user3: ['group1'],
    };

    const result = pluralVoting.commonGroup('user0', 'user1', groupMemberships);
    expect(result).toBe(true);
  });

  test('should return false if participants do not share a common group', () => {
    const groupMemberships: Record<string, string[]> = {
      user0: ['group0', 'group2'],
      user1: ['group0', 'group1'],
      user2: ['group1', 'group2'],
      user3: ['group1'],
    };

    const result = pluralVoting.commonGroup('user0', 'user3', groupMemberships);
    expect(result).toBe(false);
  });
});

// test vote attenuation
describe('K function', () => {
  test('should not attenuate votes of agent if agent is not in group and does not have any relations with members of the group', () => {
    const agent = 'user0';
    const otherGroup = ['user1'];
    const groupMemberships = { user0: ['group0'], user1: ['group1', 'group2'] };
    const contributions = { user0: 4, user1: 9 };

    const result = pluralVoting.K(agent, otherGroup, groupMemberships, contributions);
    expect(result).toEqual(4);
  });

  test('should attenuate votes of agent if agent has a shared group membership with another member of the group even if agent is not in the group', () => {
    const agent = 'user0';
    const otherGroup = ['user1'];
    const groupMemberships = { user0: ['group0', 'group1'], user1: ['group1', 'group2'] };
    const contributions = { user0: 4, user1: 9 };

    const result = pluralVoting.K(agent, otherGroup, groupMemberships, contributions);
    expect(result).toEqual(2);
  });

  test('should attenuate votes of agent solely because agent is in the other group himself', () => {
    // theoretical test case, because if agent is in group h the agent
    // automatically shares a group (i.e. group h) with all its members
    const agent = 'user0';
    const otherGroup = ['user0', 'user1'];
    const groupMemberships = { user0: ['group0'], user1: ['group1', 'group2'] };
    const contributions = { user0: 4, user1: 9 };

    const result = pluralVoting.K(agent, otherGroup, groupMemberships, contributions);
    expect(result).toEqual(2);
  });

  test('should attenuate votes of agent if both conditions above that lead to attenuation are satisfied', () => {
    const agent = 'user0';
    const otherGroup = ['user0', 'user1'];
    const groupMemberships = { user0: ['group0', 'group1'], user1: ['group1', 'group2'] };
    const contributions = { user0: 4, user1: 9 };

    const result = pluralVoting.K(agent, otherGroup, groupMemberships, contributions);
    expect(result).toEqual(2);
  });
});

// Test connection oriented cluster match
describe('clusterMatch', () => {
  test('calculates plurality score according to connection oriented cluster match', () => {
    const groups: Record<string, string[]> = { group0: ['user0'], group1: ['user1'] };
    const contributions: Record<string, number> = { user0: 4, user1: 4 };

    // Expected result
    const expectedScore = 4;

    const result = pluralVoting.clusterMatch(groups, contributions);
    expect(result).toEqual(expectedScore);
  });

  test('noting but prints result', () => {
    const score = pluralVoting.pluralScoreCalculation();
    console.log('Plurality Score:', score);
    expect(true).toBe(true);
  });
});
