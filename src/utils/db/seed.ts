import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import {
  EventData,
  CycleData,
  RegistrationFieldData,
  RegistrationFieldOptionData,
  ForumQuestionData,
  QuestionOptionData,
  GroupCategoryData,
  GroupData,
  UserData,
  UsersToGroupsData,
  QuestionsToGroupCategoriesData,
  generateEventData,
  generateCycleData,
  generateRegistrationFieldData,
  generateRegistrationFieldOptionsData,
  generateForumQuestionData,
  generateQuestionOptionsData,
  generateGroupCategoryData,
  generateGroupData,
  generateUserData,
  generateUsersToGroupsData,
  generateQuestionsToGroupCategoriesData,
} from './seed-data-generators';

async function seed(dbPool: PostgresJsDatabase<typeof db>) {
  const events = await createEvent(dbPool, generateEventData(1));
  const cycles = await createCycle(dbPool, generateCycleData(1, events[0]!.id));
  const registrationFieldsData = [
    { name: 'proposal title', type: 'TEXT', required: true, forGroup: true },
    { name: 'proposal description', type: 'TEXT', required: true, forUser: true },
    { name: 'other field', type: 'TEXT', required: false },
    { name: 'select field', type: 'SELECT', required: false, forUser: true },
  ];
  const registrationFields = await createRegistrationFields(
    dbPool,
    generateRegistrationFieldData(events[0]!.id, registrationFieldsData),
  );
  const registrationFieldOptions = await createRegistrationFieldOptions(
    dbPool,
    generateRegistrationFieldOptionsData(registrationFields[3]!.id, ['Option A', 'Option B']),
  );
  const forumQuestions = await createForumQuestions(
    dbPool,
    generateForumQuestionData(cycles[0]!.id, ['Question One', 'Question Two']),
  );
  const questionOptions = await createQuestionOptions(
    dbPool,
    generateQuestionOptionsData(forumQuestions[0]!.id, ['Option A', 'Option B'], [true, true]),
  );

  const groupCategoriesData = [
    { name: 'affiliation', userCanView: true },
    { name: 'category A', userCanView: true },
    { name: 'category B', userCanView: true },
    { name: 'secrets', userCanCreate: true },
  ];

  const groupCategories = await createGroupCategories(
    dbPool,
    generateGroupCategoryData(events[0]!.id, groupCategoriesData),
  );

  const categoryIdsData = [
    groupCategories[0]!.id,
    groupCategories[1]!.id,
    groupCategories[2]!.id,
    groupCategories[3]!.id,
  ];
  const numOfGroupsData = [1, 2, 1, 1];

  const groups = await createGroups(dbPool, generateGroupData(categoryIdsData, numOfGroupsData));

  const users = await createUsers(dbPool, generateUserData(3));

  // Specify users to groups relationships
  const userData = [
    users[0]!.id,
    users[1]!.id,
    users[2]!.id,
    users[0]!.id,
    users[1]!.id,
    users[2]!.id,
  ];
  const groupData = [
    groups[0]!.id,
    groups[0]!.id,
    groups[0]!.id,
    groups[1]!.id,
    groups[1]!.id,
    groups[2]!.id,
  ];
  const categoryData = [
    groupCategories[0]!.id,
    groupCategories[0]!.id,
    groupCategories[0]!.id,
    groupCategories[1]!.id,
    groupCategories[1]!.id,
    groupCategories[1]!.id,
  ];

  const usersToGroups = await createUsersToGroups(
    dbPool,
    generateUsersToGroupsData(userData, groupData, categoryData),
  );

  const questionsToGroupCategories = await createQuestionsToGroupCategories(
    dbPool,
    generateQuestionsToGroupCategoriesData([forumQuestions[0]!.id], [groupCategories[0]!.id]),
  );

  return {
    events,
    cycles,
    registrationFields,
    registrationFieldOptions,
    forumQuestions,
    questionOptions,
    groupCategories,
    groups,
    users,
    usersToGroups,
    questionsToGroupCategories,
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

async function createEvent(dbPool: PostgresJsDatabase<typeof db>, eventData: EventData[]) {
  const events = [];
  for (const eventName of eventData) {
    const result = await dbPool
      .insert(db.events)
      .values({
        name: eventName.name,
      })
      .returning();
    events.push(result[0]);
  }
  return events;
}

async function createCycle(dbPool: PostgresJsDatabase<typeof db>, cycleData: CycleData[]) {
  if (cycleData.length === 0) {
    throw new Error('Cycle data is empty.');
  }

  const cycles = [];
  for (const cycle of cycleData) {
    if (!cycle.eventId) {
      throw new Error('Event ID is not defined.');
    }

    const result = await dbPool
      .insert(db.cycles)
      .values({
        startAt: cycle.startAt,
        endAt: cycle.endAt,
        status: cycle.status,
        eventId: cycle.eventId,
      })
      .returning();

    cycles.push(result[0]);
  }

  return cycles;
}

async function createRegistrationFields(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationFieldData: RegistrationFieldData[],
) {
  if (registrationFieldData.length === 0) {
    throw new Error('Registration field data is empty.');
  }

  const registrationFields = [];
  for (const field of registrationFieldData) {
    if (!field.eventId) {
      throw new Error('Event ID is not defined for a registration field.');
    }

    const result = await dbPool
      .insert(db.registrationFields)
      .values({
        name: field.name,
        type: field.type,
        required: field.required,
        forUser: field.forUser,
        forGroup: field.forGroup,
        eventId: field.eventId,
      })
      .returning();

    registrationFields.push(result[0]);
  }

  return registrationFields;
}

async function createRegistrationFieldOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationFieldOptionsData: RegistrationFieldOptionData[],
) {
  if (registrationFieldOptionsData.length === 0) {
    throw new Error('Registration Field Options data is empty.');
  }

  const registrationFieldOptions = [];
  for (const optionData of registrationFieldOptionsData) {
    if (!optionData.registrationFieldId) {
      throw new Error('Registration Field id is not defined for a registration option.');
    }

    const result = await dbPool
      .insert(db.registrationFieldOptions)
      .values({
        registrationFieldId: optionData.registrationFieldId,
        value: optionData.value,
      })
      .returning();

    registrationFieldOptions.push(result[0]);
  }

  return registrationFieldOptions;
}

async function createForumQuestions(
  dbPool: PostgresJsDatabase<typeof db>,
  forumQuestionData: ForumQuestionData[],
) {
  if (forumQuestionData.length === 0) {
    throw new Error('Forum Question data is empty.');
  }

  const forumQuestions = [];
  for (const questionData of forumQuestionData) {
    if (!questionData.cycleId) {
      throw new Error('Cycle ID is not defined for the forum question.');
    }

    const result = await dbPool
      .insert(db.forumQuestions)
      .values({
        cycleId: questionData.cycleId,
        questionTitle: questionData.questionTitle,
      })
      .returning();

    forumQuestions.push(result[0]);
  }

  return forumQuestions;
}

async function createQuestionOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  questionOptionData: QuestionOptionData[],
) {
  if (questionOptionData.length === 0) {
    throw new Error('Question Option data is empty.');
  }

  const questionOptions = [];
  for (const questionOption of questionOptionData) {
    if (!questionOption.questionId) {
      throw new Error('Question ID is not defined for the question option.');
    }

    const result = await dbPool
      .insert(db.questionOptions)
      .values({
        questionId: questionOption.questionId,
        optionTitle: questionOption.optionTitle,
        accepted: questionOption.accepted,
      })
      .returning();

    questionOptions.push(result[0]);
  }

  return questionOptions;
}

async function createGroupCategories(
  dbPool: PostgresJsDatabase<typeof db>,
  groupCategoriesData: GroupCategoryData[],
) {
  if (groupCategoriesData.length === 0) {
    throw new Error('Group Categories data is empty.');
  }

  const groupCategories = [];
  for (const data of groupCategoriesData) {
    if (!data.eventId) {
      throw new Error('Event ID is not defined for the group category.');
    }

    const result = await dbPool
      .insert(db.groupCategories)
      .values({
        name: data.name,
        eventId: data.eventId,
        userCanCreate: data.userCanCreate,
        userCanView: data.userCanView,
      })
      .returning();

    groupCategories.push(result[0]);
  }

  return groupCategories;
}

async function createGroups(dbPool: PostgresJsDatabase<typeof db>, groupData: GroupData[]) {
  if (groupData.length === 0) {
    throw new Error('Group Data is empty.');
  }

  const groups = [];
  for (const group of groupData) {
    if (!group.groupCategoryId) {
      throw new Error('Group Category ID is not defined for the group.');
    }

    const result = await dbPool
      .insert(db.groups)
      .values({
        name: group.name,
        groupCategoryId: group.groupCategoryId,
      })
      .returning();

    groups.push(result[0]);
  }

  return groups;
}

async function createUsers(dbPool: PostgresJsDatabase<typeof db>, userData: UserData[]) {
  const users = [];
  for (const user of userData) {
    const result = await dbPool
      .insert(db.users)
      .values({
        username: user.username,
        email: user.email,
        telegram: user.telegram,
      })
      .returning();

    users.push(result[0]);
  }

  return users;
}

async function createUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  usersToGroupsData: UsersToGroupsData[],
) {
  if (usersToGroupsData.length === 0) {
    throw new Error('Users to Groups Data is empty.');
  }

  const usersToGroups = [];
  for (const group of usersToGroupsData) {
    if (!group.groupId) {
      throw new Error('Group ID is not defined for the users to groups relationship.');
    }

    const result = await dbPool
      .insert(db.usersToGroups)
      .values({
        userId: group.userId,
        groupId: group.groupId,
        groupCategoryId: group.groupCategoryId,
      })
      .returning();

    usersToGroups.push(result[0]);
  }

  return usersToGroups;
}

async function createQuestionsToGroupCategories(
  dbPool: PostgresJsDatabase<typeof db>,
  questionsToGroupCategoriesData: QuestionsToGroupCategoriesData[],
) {
  if (questionsToGroupCategoriesData.length === 0) {
    throw new Error('Questions to Group Categories Data is empty.');
  }

  const questionsToGroupCategories = [];
  for (const groupCategories of questionsToGroupCategoriesData) {
    if (!groupCategories.questionId) {
      throw new Error('Question ID is not defined for the group Category.');
    }

    const result = await dbPool
      .insert(db.questionsToGroupCategories)
      .values({
        questionId: groupCategories.questionId,
        groupCategoryId: groupCategories.groupCategoryId,
      })
      .returning();

    questionsToGroupCategories.push(result[0]);
  }

  return questionsToGroupCategories;
}

export { seed, cleanup };
