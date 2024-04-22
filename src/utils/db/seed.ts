import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import {EventData, CycleData, RegistrationFieldData, RegistrationFieldOptionData, ForumQuestionData} from './seed-data-generators';

async function seed(dbPool: PostgresJsDatabase<typeof db>, seedData: SeedData) {
  const {
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
    registrationFieldOptions,
  } = seedData;

  await createEvent(dbPool, events);
  await createCycle(dbPool, cycles);
  await createRegistrationFields(dbPool, registrationFields);
  await createRegistrationFieldOptions(dbPool, registrationFieldOptions);
  await createForumQuestions(dbPool, forumQuestions);
  await createQuestionOptions(dbPool, questionOptions);
  await createGroupCategories(dbPool, groupCategories);
  await createGroups(dbPool, groups);
  await createUsers(dbPool, users);
  await createUsersToGroups(dbPool, usersToGroups);
  await createQuestionsToGroupCategories(dbPool, questionsToGroupCategories);
}

async function cleanup(dbPool: PostgresJsDatabase<typeof db>) {
  await dbPool.delete(db.userAttributes);
  await dbPool.delete(db.votes);
  await dbPool.delete(db.federatedCredentials);
  await dbPool.delete(db.questionOptions);
  await dbPool.delete(db.registrationData);
  await dbPool.delete(db.registrationFieldOptions);
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

interface SeedData {
  events: EventData[];
  cycles: CycleData[];
  registrationFields: RegistrationFieldData[];
  registrationFieldOptions: RegistrationFieldOptionData[];
  forumQuestions: ForumQuestionData[];
  questionOptions: QuestionOptionData[];
  groupCategories: GroupCategoryData[];
  groups: GroupData[];
  users: UserData[];
  usersToGroups: UsersToGroupsData[];
  questionsToGroupCategories: QuestionsToGroupCategoriesData[];
}

async function createEvent(dbPool: PostgresJsDatabase<typeof db>, eventData: EventData[]) {
  for (const eventName of eventData) {
    await dbPool
      .insert(db.events)
      .values({
        name: eventName.name,
      })
      .execute();
  }
}

async function createCycle(dbPool: PostgresJsDatabase<typeof db>, cycleData: CycleData[]) {
  if (cycleData.length === 0) {
    throw new Error('Cycle data is empty.');
  }

  for (const cycle of cycleData) {
    if (!cycle.eventId) {
      throw new Error('Event ID is not defined.');
    }

    await dbPool
      .insert(db.cycles)
      .values({
        startAt: cycle.startAt,
        endAt: cycle.endAt,
        status: cycle.status,
        eventId: cycle.eventId,
      })
      .execute();
  }
}

async function createRegistrationFields(dbPool: PostgresJsDatabase<typeof db>, registrationFieldData: RegistrationFieldData[]) {
  if (registrationFieldData.length === 0) {
    throw new Error('Registration field data is empty.');
  }

  for (const field of registrationFieldData) {
    if (!field.eventId) {
      throw new Error('Event ID is not defined for a registration field.');
    }

    await dbPool
      .insert(db.registrationFields)
      .values({
        name: field.name,
        type: field.type,
        required: field.required,
        forUser: field.forUser,
        forGroup: field.forGroup,
        eventId: field.eventId,
      })
      .execute();
  }
}

async function createRegistrationFieldOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationFieldOptionsData: RegistrationFieldOptionData[],
) {
  if (registrationFieldOptionsData.length === 0) {
    throw new Error('Registration Field Options data is empty.');
  }

  for (const optionData of registrationFieldOptionsData) {
    if (!optionData.registrationFieldId) {
      throw new Error('Registration Field id is not defined for a registration option.');
    }
    await dbPool
      .insert(db.registrationFieldOptions)
      .values({
        registrationFieldId: optionData.registrationFieldId,
        value: optionData.value,
      })
      .execute();
  }
}
async function createForumQuestions(dbPool: PostgresJsDatabase<typeof db>, forumQuestionData: ForumQuestionData[]) {
  if (forumQuestionData.length === 0) {
    throw new Error('Forum Question data is empty.');
  }

  for (const questionData of forumQuestionData) {
    if (!questionData.cycleId) {
      throw new Error('Cycle ID is not defined for the forum question.');
    }

    await dbPool
      .insert(db.forumQuestions)
      .values({
        cycleId: questionData.cycleId,
        questionTitle: questionData.questionTitle,
      })
      .execute();
  }
}

export { seed, cleanup };


/*
async function seed(dbPool: PostgresJsDatabase<typeof db>) {
  const events = await createEvent(dbPool);
  const cycles = await createCycle(dbPool, events[0]?.id);
  const registrationFields = await createRegistrationFields(dbPool, events[0]?.id);
  const registrationFieldOptions = await createRegistrationFieldOptions(
    dbPool,
    registrationFields[3]?.id,
  );
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
    registrationFieldOptions,
  };
}

async function cleanup(dbPool: PostgresJsDatabase<typeof db>) {
  await dbPool.delete(db.userAttributes);
  await dbPool.delete(db.votes);
  await dbPool.delete(db.federatedCredentials);
  await dbPool.delete(db.questionOptions);
  await dbPool.delete(db.registrationData);
  await dbPool.delete(db.registrationFieldOptions);
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

*/


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
