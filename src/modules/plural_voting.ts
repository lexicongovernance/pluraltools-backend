class PluralVoting {
  // Class that contains the functions to calculate a plural score for each project proposal.
  // :param: groups (dict): a dictionary of groups as keys where the values are arrays of group members (users).
  // :param: contributions (dict): the keys identify users and the values denote the votes for a given project proposal.
  // :returns: plurality score
  public groups: Record<string, string[]>;
  public contributions: Record<string, number>;

  constructor(groups: Record<string, string[]>, contributions: Record<string, number>) {
    this.groups = groups;
    this.contributions = contributions;
  }

  public createGroupMemberships(groups: Record<string, string[]>): Record<string, string[]> {
    // Define group memberships for each participant.
    // :param: groups (dict): a dictionary of groups as keys where the values are arrays of group members (users).
    // :returns (dict): returns a dict of group memberships (value) for each user (key).
    const memberships: Record<string, string[]> = {};

    for (const [groupName, members] of Object.entries(groups)) {
      for (const member of members) {
        memberships[member] = [...(memberships[member] || []), groupName];
      }
    }

    return memberships;
  }

  public commonGroup(
    agent1: string,
    agent2: string,
    groupMemberships: Record<string, string[]>,
  ): boolean {
    // Define an identifier indicating whether two participants share the same group.
    // :param: agent1: agent1 denotes a participant not equal to a participant called agent2.
    // :param: agent2: agent2 denotes a participant not equal to a participant called agent1.
    // :returns (bool): returns true if two participants share groups memberships according to the definition and false otherwise.

    const memberships_agent1 = groupMemberships[agent1];
    const memberships_agent2 = groupMemberships[agent2];

    if (memberships_agent1 && memberships_agent2) {
      return memberships_agent1.some((group) => memberships_agent2.includes(group));
    }

    throw new Error(`Group memberships for agent ${agent1} or ${agent2} are undefined.`);
  }

  public K(
    agent: string,
    otherGroup: string[],
    groupMemberships: Record<string, string[]>,
    contributions: Record<string, number>,
  ): number {
    // Define the weighting function that attenuates the votes of an agent given different group memberships.
    // :param: agent: denotes a participant.
    // :param: otherGroup: denotes a group.
    // :returns: attenuated number of votes for a given project.

    const contributions_agent = contributions[agent];

    if (contributions_agent !== undefined) {
      if (
        otherGroup.includes(agent) ||
        otherGroup.some((otherAgent) => this.commonGroup(agent, otherAgent, groupMemberships))
      ) {
        return Math.sqrt(contributions_agent);
      }
      return contributions_agent;
    }

    throw new Error(`Contributions for agent ${agent} are undefined.`);
  }

  /*
  public clusterMatch(groups: number[][], contributions: number[]): number {
    // Calculates the plurality score according to connection-oriented cluster match.
    // :param: groups (list of lists): a list denotes the group and contains its members.
    // :param: contributions (list): number of participant's votes for a given project proposal.
    // :returns: plurality score

    const groupMemberships: number[][] = this.createGroupMemberships(groups);

    if (groupMemberships === undefined) {
      throw new Error('Group memberships are undefined.');
    }

    let result = 0;

    // Calculate the first term of connection-oriented cluster match
    for (let g of groups) {
      for (let i of g) {
        const contributionsI = contributions[i];
        const membershipsI = groupMemberships[i];

        if (contributionsI === undefined || membershipsI === undefined) {
          throw new Error(`Contributions or group memberships for agent ${i} are undefined.`);
        }

        result += contributionsI / membershipsI.length;
      }
    }

    // Calculate the interaction term of connection-oriented cluster match
    for (let g of groups) {
      for (let h of groups) {
        if (g === h) continue; // Only skip if the groups are the same group instance (but not if they contain the same content)

        let term1 = 0;
        for (let i of g) {
          const contributionsI = contributions[i];
          const membershipsI = groupMemberships[i];

          if (contributionsI === undefined || membershipsI === undefined) {
            throw new Error(`Contributions or group memberships for agent ${i} are undefined.`);
          }

          term1 += this.K(i, h, groupMemberships, contributions) / membershipsI.length;
        }
        term1 = Math.sqrt(term1);

        let term2 = 0;
        for (let j of h) {
          const contributionsJ = contributions[j];
          const membershipsJ = groupMemberships[j];

          if (contributionsJ === undefined || membershipsJ === undefined) {
            throw new Error(`Contributions or group memberships for agent ${j} are undefined.`);
          }

          term2 += this.K(j, g, groupMemberships, contributions) / membershipsJ.length;
        }
        term2 = Math.sqrt(term2);

        result += term1 * term2;
      }
    }

    return Math.sqrt(result);
  }

  public pluralScoreCalculation(groups: number[][], contributions: number[]): void {
    const result: number = this.clusterMatch(groups, contributions);
    console.log('Plurality Score', result);
  }
  */
}

// Export functions
export { PluralVoting };

// Example usage
/*
const groups: number[][] = [[0, 1], [1, 2, 3], [0, 2]];
const contributions: number[] = [1, 2, 3, 4];

const pluralityScore = new PluralVoting(groups, contributions);
pluralityScore.pluralScoreCalculation(groups, contributions);

const groups: Record<string, string[]> = {
      group0: [user0, user1],
      group1: [user1, user2, user3],
      group2: [user0, user2],
    };

const contributions: Record<string, number> = {
      user0: 1,
      user1: 2,
      user2: 3,
      user3: 4,
    };

const pluralityScore = new PluralVoting(groups, contributions);
pluralityScore.pluralScoreCalculation(groups, contributions);
*/
