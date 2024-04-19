import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import { randCompanyName, randCountry, randMovie, randUser } from '@ngneat/falso';

async function seed(dbPool: PostgresJsDatabase<typeof db>) {
  const events = await createEvent(dbPool);
  const cycles = await createCycle(dbPool, events[0]?.id);
  const registrationFields = await createRegistrationFields(dbPool, events[0]?.id);
  const forumQuestions = await createForumQuestions(dbPool, cycles[0]?.id);
  const questionOptions = await createQuestionOptions(dbPool, forumQuestions[0]?.id);
  const groupCategories = await createGroupCategories(dbPool, events[0]?.id);
  const groups = await createGroups(
    dbPool,
    groupCategories[0]?.id,
    groupCategories[1]?.id,
    groupCategories[2]?.id,
    groupCategories[3]?.id,
  );
  const users = await createUsers(dbPool);
  const usersToGroups = await createUsersToGroups(
    dbPool,
    users.map((u) => u.id!),
    groups.map((g) => g.id!),
    groupCategories[0]!.id,
    groupCategories[1]!.id,
  );
  const questionsToGroupCategories = await createQuestionsToGroupCategories(
    dbPool,
    forumQuestions[0]!.id,
    groupCategories[0]?.id,
    groupCategories[1]?.id,
  );

  return {
    events,
    cycles,
    forumQuestions,
    questionOptions,
    groupCategories,
    groups,
    users,
    usersToGroups,
    registrationFields,
    questionsToGroupCategories,
  };
}

async function cleanup(dbPool: PostgresJsDatabase<typeof db>) {
  await dbPool.delete(db.userAttributes);
  await dbPool.delete(db.votes);
  await dbPool.delete(db.federatedCredentials);
  await dbPool.delete(db.questionOptions);
  await dbPool.delete(db.registrationData);
  await dbPool.delete(db.registrationFields);
  await dbPool.delete(db.registrations);
  await dbPool.delete(db.usersToGroups);
  await dbPool.delete(db.users);
  await dbPool.delete(db.groups);
  await dbPool.delete(db.questionsToGroupCategories);
  await dbPool.delete(db.groupCategories);
  await dbPool.delete(db.forumQuestions);
  await dbPool.delete(db.cycles);
  await dbPool.delete(db.events);
}

async function createEvent(dbPool: PostgresJsDatabase<typeof db>) {
  return dbPool
    .insert(db.events)
    .values({
      name: randCountry(),
    })
    .returning();
}

async function createRegistrationFields(dbPool: PostgresJsDatabase<typeof db>, eventId?: string) {
  if (eventId === undefined) {
    throw new Error('Event ID is undefined.');
  }

  return dbPool
    .insert(db.registrationFields)
    .values([
      {
        name: 'proposal title',
        type: 'TEXT',
        required: true,
        eventId,
        questionOptionType: 'TITLE',
        forUser: false,
        forGroup: true,
      },
      {
        name: 'proposal description',
        type: 'TEXT',
        required: true,
        eventId,
        questionOptionType: 'SUBTITLE',
        forUser: true,
        forGroup: false,
      },
      {
        name: 'other field',
        type: 'TEXT',
        required: false,
        eventId,
      },
    ])
    .returning();
}

async function createCycle(dbPool: PostgresJsDatabase<typeof db>, eventId?: string) {
  if (eventId === undefined) {
    throw new Error('Event ID is undefined.');
  }

  const endInADay = new Date();
  endInADay.setDate(endInADay.getDate() + 1);
  return dbPool
    .insert(db.cycles)
    .values({
      startAt: new Date(),
      endAt: endInADay,
      status: 'OPEN',
      eventId,
    })
    .returning();
}

async function createForumQuestions(dbPool: PostgresJsDatabase<typeof db>, cycleId?: string) {
  if (cycleId === undefined) {
    throw new Error('Cycle ID is undefined.');
  }

  return dbPool
    .insert(db.forumQuestions)
    .values([
      {
        cycleId,
        questionTitle: "What's your favorite movie?",
      },
      {
        cycleId,
        questionTitle: 'What is your favorit fruit?',
      },
    ])
    .returning();
}

async function createQuestionOptions(dbPool: PostgresJsDatabase<typeof db>, questionId?: string) {
  if (questionId === undefined) {
    throw new Error('Question ID is undefined.');
  }

  return dbPool
    .insert(db.questionOptions)
    .values([
      {
        questionId,
        optionTitle: randMovie(),
        accepted: true,
      },
      { questionId, optionTitle: randMovie(), accepted: true },
    ])
    .returning();
}

async function createGroupCategories(dbPool: PostgresJsDatabase<typeof db>, eventId?: string) {
  if (eventId === undefined) {
    throw new Error('Event ID is undefined.');
  }

  return dbPool
    .insert(db.groupCategories)
    .values([
      {
        name: 'affiliation',
        eventId: eventId,
        userCanView: true,
      },
      {
        name: 'category A',
        eventId: eventId,
        userCanView: true,
      },
      {
        name: 'category B',
        eventId: eventId,
        userCanView: true,
      },
      {
        name: 'secrets',
        eventId: eventId,
        userCanCreate: true,
      },
    ])
    .returning();
}

async function createGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  baselineCategory?: string,
  categoryOne?: string,
  categoryTwo?: string,
  secretCategory?: string,
) {
  return dbPool
    .insert(db.groups)
    .values([
      {
        name: randCompanyName(),
        groupCategoryId: baselineCategory,
      },
      {
        name: randCompanyName(),
        groupCategoryId: categoryOne,
      },
      {
        name: randCompanyName(),
        groupCategoryId: categoryOne,
      },
      {
        name: randCompanyName(),
        groupCategoryId: categoryTwo,
      },
      {
        name: randCompanyName(),
        groupCategoryId: secretCategory,
      },
    ])
    .returning();
}

async function createUsers(dbPool: PostgresJsDatabase<typeof db>) {
  const fakeUsers = [randUser(), randUser(), randUser()];
  return dbPool
    .insert(db.users)
    .values(fakeUsers.map((fUser) => ({ email: fUser.email, username: fUser.username })))
    .returning();
}

async function createUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userIds: string[],
  groupIds: string[],
  baselineGroupCategory: string | undefined,
  otherGroupCategory: string | undefined,
) {
  // assign users to groups
  const usersToGroups = userIds.map((userId, index) => ({
    userId,
    groupId: index < 2 ? groupIds[1]! : groupIds[2]!,
    groupCategoryId: otherGroupCategory,
  }));

  // Add baseline group for each user (i.e. each user must be assigned to at least one group at all times)
  userIds.forEach((userId) => {
    usersToGroups.push({
      userId,
      groupId: groupIds[0]!,
      groupCategoryId: baselineGroupCategory,
    });
  });

  return dbPool.insert(db.usersToGroups).values(usersToGroups).returning();
}

async function createQuestionsToGroupCategories(
  dbPool: PostgresJsDatabase<typeof db>,
  questionId: string,
  groupCategoryIdOne?: string,
  groupCategoryIdTwo?: string,
) {
  return dbPool
    .insert(db.questionsToGroupCategories)
    .values([
      {
        questionId: questionId,
        groupCategoryId: groupCategoryIdOne,
      },
      {
        questionId: questionId,
        groupCategoryId: groupCategoryIdTwo,
      },
    ])
    .returning();
}

export { seed, cleanup };
