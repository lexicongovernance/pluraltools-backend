/**
 * Class that contains the functions to calculate a plural score for each project proposal.
 * :param: groups: A dictionary of groups where the values are arrays of group members (users).
 * :param: contributions: A dictionary representing the number of votes for each user.
 */
export class PluralVoting {
  public groups: Record<string, string[]>;
  public contributions: Record<string, number>;

  /**
   * Constructs a new PluralVoting instance.
   * @param groups A dictionary of groups where the values are arrays of group members (users).
   * @param contributions A dictionary representing the number of votes for each user.
   */
  constructor(groups: Record<string, string[]>, contributions: Record<string, number>) {
    this.groups = groups;
    this.contributions = contributions;
  }

  /**
   * Defines group memberships for each participant.
   * @param groups A dictionary of groups where the values are arrays of group members (users).
   * @returns A dictionary of group memberships for each user.
   */
  public createGroupMemberships(groups: Record<string, string[]>): Record<string, string[]> {
    const memberships: Record<string, string[]> = {};

    for (const [groupName, members] of Object.entries(groups)) {
      for (const member of members) {
        memberships[member] = [...(memberships[member] || []), groupName];
      }
    }

    return memberships;
  }

  /**
   * Defines an identifier indicating whether two participants share the same group.
   * @param agent1 The first participant.
   * @param agent2 The second participant.
   * @param groupMemberships A dictionary of group memberships for each user.
   * @returns True if two participants share group memberships, false otherwise.
   * @throws {Error} If group memberships for the specified agents are undefined.
   */
  public commonGroup(
    agent1: string,
    agent2: string,
    groupMemberships: Record<string, string[]>,
  ): boolean {
    const memberships_agent1 = groupMemberships[agent1];
    const memberships_agent2 = groupMemberships[agent2];

    if (memberships_agent1 && memberships_agent2) {
      return memberships_agent1.some((group) => memberships_agent2.includes(group));
    }

    throw new Error(`Group memberships for agent ${agent1} or ${agent2} are undefined.`);
  }

  /**
   * Defines the weighting function that attenuates the votes of an agent given different group memberships.
   * @param agent The participant.
   * @param otherGroup The group.
   * @param groupMemberships A dictionary of group memberships for each user.
   * @param contributions A dictionary representing the number of votes for each user.
   * @returns The attenuated number of votes for a given project.
   * @throws {Error} If contributions for the specified agent are undefined.
   */
  public K(
    agent: string,
    otherGroup: string[],
    groupMemberships: Record<string, string[]>,
    contributions: Record<string, number>,
  ): number {
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

  /**
   * Checks whether two arrays have the same content.
   * @param arr1 The first array.
   * @param arr2 The second array.
   * @returns True if the arrays have the same content, false otherwise.
   */
  public arraysEqual(arr1: string[], arr2: string[]): boolean {
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();
    return (
      sortedArr1.length === sortedArr2.length &&
      sortedArr1.every((value, index) => value === sortedArr2[index])
    );
  }

  /**
   * Removes duplicate groups from the input array of groups.
   * @param inputGroups An array of groups (can contain duplicates).
   * @returns An object representing unique groups.
   */
  public removeDuplicateGroups(inputGroups: Record<string, string[]>): Record<string, string[]> {
    const uniqueGroups: Record<string, string[]> = {};

    Object.entries(inputGroups).forEach(([groupName, users]) => {
      // Sort the user arrays to ensure order doesn't matter
      const sortedUsers = users.slice().sort();

      // Check if the sorted array is not already in uniqueGroups
      if (
        !Object.values(uniqueGroups).some(
          (existingGroup) =>
            JSON.stringify(existingGroup.slice().sort()) === JSON.stringify(sortedUsers),
        )
      ) {
        uniqueGroups[groupName] = sortedUsers;
      }
    });

    return uniqueGroups;
  }

  /**
   * Calculates the plurality score according to connection-oriented cluster match.
   * @param groups A dictionary of groups where the values are arrays of group members (users).
   * @param contributions A dictionary representing the number of votes for each user.
   * @returns The plurality score.
   * @throws {Error} If group memberships are undefined for any agent or contributions are undefined.
   */
  public clusterMatch(
    groups: Record<string, string[]>,
    contributions: Record<string, number>,
  ): number {
    const uniqueGroups = this.removeDuplicateGroups(groups);
    const groupMemberships: Record<string, string[]> = this.createGroupMemberships(uniqueGroups);

    if (groupMemberships === undefined) {
      throw new Error('Group memberships are undefined.');
    }

    let result = 0;

    // Calculate the first term of connection-oriented cluster match
    for (const [, members] of Object.entries(uniqueGroups)) {
      for (const agent of members) {
        const contributionsI = contributions[agent];
        const membershipsI = groupMemberships[agent];

        if (contributionsI === undefined || membershipsI === undefined) {
          throw new Error(`Contributions or group memberships for agent ${agent} are undefined.`);
        }

        result += contributionsI / membershipsI.length;
      }
    }

    // Calculate the interaction term of connection-oriented cluster match
    for (const [group1Index, group1] of Object.entries(uniqueGroups)) {
      for (const [group2Index, group2] of Object.entries(uniqueGroups)) {
        if (group1Index === group2Index) continue; // skip groups if they have the same index

        let term1 = 0;
        for (const agent of group1) {
          const contributionsI = contributions[agent];
          const membershipsI = groupMemberships[agent];

          if (contributionsI === undefined || membershipsI === undefined) {
            throw new Error(`Contributions or group memberships for agent ${agent} are undefined.`);
          }

          term1 += this.K(agent, group2, groupMemberships, contributions) / membershipsI.length;
        }
        term1 = Math.sqrt(term1);

        let term2 = 0;
        for (const otherAgent of group2) {
          const contributionsJ = contributions[otherAgent];
          const membershipsJ = groupMemberships[otherAgent];

          if (contributionsJ === undefined || membershipsJ === undefined) {
            throw new Error(
              `Contributions or group memberships for agent ${otherAgent} are undefined.`,
            );
          }

          term2 +=
            this.K(otherAgent, group1, groupMemberships, contributions) / membershipsJ.length;
        }
        term2 = Math.sqrt(term2);

        result += term1 * term2;
      }
    }

    return Math.sqrt(result);
  }

  /**
   * Calculates the plurality score.
   * @returns The plurality score.
   */
  public pluralScoreCalculation(): number {
    const result: number = this.clusterMatch(this.groups, this.contributions);

    return result;
  }
}

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
