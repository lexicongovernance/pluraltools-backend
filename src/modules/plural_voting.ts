class PluralVoting {
    // Class that contains the functions to calculate a plural score for each project proposal.
    // :param: groups (list of lists): a list denotes the group and contains its members.
    // :param: contributions (list): number of participant's votes for a given project proposal.
    // :returns: plurality score
    public groups: number[][];
    public contributions: number[];

    constructor(groups: number[][], contributions: number[]) {
        this.groups = groups;
        this.contributions = contributions;
    }

    public createGroupMemberships(groups: number[][]): number[][] {
    // Define group memberships for each participant.
    // :param: groups (list of lists): a list denotes the group and contains its members.
    // :returns (list of lists): returns a list of group memberships for each participant.
    const memberships: number[][] = [];

    for (let i = 0; i < groups.length; i++) {
        const currentGroup = groups[i];
        if (Array.isArray(currentGroup)) {
            for (let j of currentGroup) {
                const currentMembership = memberships[j] as number[] | undefined;
                memberships[j] = [...(currentMembership || []), i];
            }
        }
    }

    return memberships;
    }

    public commonGroup(i: number, j: number, groupMemberships: number[][]): boolean {
    // Define an identifier indicating whether two participants share the same group or whether any
    // other member of the group of the second agent shares a group with the first agent.
    // :param: i: agent_i denotes a participant not equal to a participant called agent_j.
    // :param: j: agent_j denotes a participant not equal to a participant called agent_i.
    // :returns (bool): returns true if two participants share a common group and false otherwise.

    const membershipsI = groupMemberships[i];
    const membershipsJ = groupMemberships[j];

    if (membershipsI && membershipsJ) {
        return membershipsI.some((group) => membershipsJ.includes(group));
    }

    throw new Error(`Group memberships for agent ${i} or ${j} are undefined.`);
    }

    public K(i: number, group: number[], groupMemberships: number[][], contributions: number[]): number {
    // Define the weighting function that attenuates the votes of agent i given different group memberships.
    // :param: i: denotes a participant.
    // :param: group: group denotes the other group.
    // :returns: attenuated number of votes for a given project.

    const contributionsI = contributions[i];

    if (contributionsI !== undefined) {
        if (group.includes(i) || group.some((j) => this.commonGroup(i, j, groupMemberships))) {
        return Math.sqrt(contributionsI);
        }
        return contributionsI;
    }

    throw new Error(`Contributions for agent ${i} are undefined.`);
    }

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

    public analyze(groups: number[][], contributions: number[]): void {
        const result: number = this.clusterMatch(groups, contributions);
    
        console.log(groups);
        console.log(result);
    }
}

// Export functions
export { PluralVoting };
  
// Example usage
const exampleGroups: number[][] = [[0, 1], [1, 2, 3], [0, 2]];
const exampleContributions: number[] = [1, 2, 3, 4];

const groupAnalysis = new PluralVoting(exampleGroups, exampleContributions);
groupAnalysis.analyze(exampleGroups, exampleContributions);


