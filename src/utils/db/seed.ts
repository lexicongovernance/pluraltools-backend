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
} from './seed-data-generators';

async function seed(dbPool: PostgresJsDatabase<typeof db>) {
  const events = await createEvent(dbPool, generateEventData(5));
  const cycles = await createCycle(dbPool, generateCycleData(2, events[1]!.id));

  return {
    events,
    cycles,
  }  

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
      .returning();
  }
}

async function createRegistrationFields(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationFieldData: RegistrationFieldData[],
) {
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

async function createForumQuestions(
  dbPool: PostgresJsDatabase<typeof db>,
  forumQuestionData: ForumQuestionData[],
) {
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

async function createQuestionOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  questionOptionData: QuestionOptionData[],
) {
  if (questionOptionData.length === 0) {
    throw new Error('Question Option data is empty.');
  }

  for (const questionOption of questionOptionData) {
    if (!questionOption.questionId) {
      throw new Error('Question ID is not defined for the question option.');
    }

    await dbPool
      .insert(db.questionOptions)
      .values({
        questionId: questionOption.questionId,
        optionTitle: questionOption.optionTitle,
        accepted: questionOption.accepted,
      })
      .execute();
  }
}

async function createGroupCategories(
  dbPool: PostgresJsDatabase<typeof db>,
  groupCategoriesData: GroupCategoryData[],
) {
  if (groupCategoriesData.length === 0) {
    throw new Error('Group Categories data is empty.');
  }

  for (const data of groupCategoriesData) {
    if (!data.eventId) {
      throw new Error('Event ID is not defined for the group category.');
    }

    await dbPool
      .insert(db.groupCategories)
      .values({
        name: data.name,
        eventId: data.eventId,
        userCanCreate: data.userCanCreate,
        userCanView: data.userCanView,
      })
      .execute();
  }
}

async function createGroups(dbPool: PostgresJsDatabase<typeof db>, groupData: GroupData[]) {
  if (groupData.length === 0) {
    throw new Error('Group Data is empty.');
  }

  for (const group of groupData) {
    if (!group.groupCategoryId) {
      throw new Error('Group Category ID is not defined for the group.');
    }

    await dbPool
      .insert(db.groups)
      .values({
        name: group.name,
        groupCategoryId: group.groupCategoryId,
      })
      .execute();
  }
}

async function createUsers(dbPool: PostgresJsDatabase<typeof db>, userData: UserData[]) {
  for (const user of userData) {
    await dbPool
      .insert(db.users)
      .values({
        username: user.username,
        email: user.email,
        telegram: user.telegram,
      })
      .execute();
  }
}

async function createUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  usersToGroupsData: UsersToGroupsData[],
) {
  if (usersToGroupsData.length === 0) {
    throw new Error('Group Data is empty.');
  }

  for (const group of usersToGroupsData) {
    if (!group.groupId) {
      throw new Error('Group ID is not defined for the users to groups relationship.');
    }

    await dbPool
      .insert(db.usersToGroups)
      .values({
        userId: group.userId,
        groupId: group.groupId,
        groupCategoryId: group.groupCategoryId,
      })
      .execute();
  }
}

async function createQuestionsToGroupCategories(
  dbPool: PostgresJsDatabase<typeof db>,
  questionsToGroupCategoriesData: QuestionsToGroupCategoriesData[],
) {
  if (questionsToGroupCategoriesData.length === 0) {
    throw new Error('Questions to Group Categories Data is empty.');
  }

  for (const groupCategories of questionsToGroupCategoriesData) {
    if (!groupCategories.questionId) {
      throw new Error('Question ID is not defined for the group Category.');
    }

    await dbPool
      .insert(db.questionsToGroupCategories)
      .values({
        questionId: groupCategories.questionId,
        groupCategoryId: groupCategories.groupCategoryId,
      })
      .execute();
  }
}

export { seed, cleanup };