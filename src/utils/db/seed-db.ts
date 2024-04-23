import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import { seed, cleanup } from './seed';
import {
  generateEventData,
  generateRegistrationFieldData,
  generateRegistrationFieldOptionsData,
  generateQuestionOptionsData,
  generateGroupCategoryData,
  generateGroupData,
  generateUserData,
  generateUsersToGroupsData,
  generateQuestionsToGroupCategoriesData,
  generateCycleData,
} from './seed-data-generators';


async function defaultSeed(dbPool: PostgresJsDatabase<typeof db>) {
  const eventsData = generateEventData(1);
  const events = createEvents(dbPool, eventsData)
  const cycl = generateCycleData(1, events[0]?.id); // Example: Generate 3 cycles for event_id
  const registrationFields = generateRegistrationFieldData('event_id', [{}, {}, {}]); // Example: Generate registration fields for event_id
  const registrationFieldOptions = generateRegistrationFieldOptionsData('registration_field_id', ['Option 1', 'Option 2']); // Example: Generate registration field options
  const forumQuestions = generateForumQuestionData('cycle_id', ['Question 1', 'Question 2']); // Example: Generate forum questions
  const questionOptions = generateQuestionOptionsData('question_id', ['Option A', 'Option B'], [true, false]); // Example: Generate question options
  const groupCategories = generateGroupCategoryData('event_id', [{}, {}]); // Example: Generate group categories for event_id
  const groupData = generateGroupData(['category_id1', 'category_id2'], [2, 3]); // Example: Generate groups for categories
  const users = generateUserData(5); // Example: Generate 5 users
  const usersToGroups = generateUsersToGroupsData(['user_id1', 'user_id2'], ['group_id1', 'group_id2'], ['category_id1', 'category_id2']); // Example: Generate users to groups data
  const questionsToGroupCategories = generateQuestionsToGroupCategoriesData(['question_id1', 'question_id2'], ['category_id1', 'category_id2']); // Example: Generate questions to group categories data

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

const customFields = [
  { name: 'proposal title', type: 'TEXT', required: true, forGroup: true },
  { name: 'proposal description', type: 'TEXT', required: true, forUser: true },
  { name: 'other field', type: 'TEXT', required: false },
  { name: 'select field', type: 'SELECT', required: false, forUser: true },
];

const generatedFields = generateRegistrationFieldData('eventId', customFields);

const options = ['Option A', 'Option B'];
const registrationFieldOptions = generateRegistrationFieldOptionsData(
  'registrationFieldId',
  options,
);

const optionTitles = ['question One', 'question Two'];
const status = [true, true];

const generatedQuestionOptions = await generateQuestionOptionsData(
  'questionId',
  optionTitles,
  status,
);

const groupCategories = [
  { name: 'affiliation', userCanView: true },
  { name: 'category A', userCanView: true },
  { name: 'category B', userCanView: true },
  { name: 'secrets', userCanCreate: true },
];

const generatedCategories = generateGroupCategoryData('eventId', groupCategories);

const categoryIds = ['', '', '', ''];
const numOfGroups = [1, 2, 1, 1];

const generateGroups = generateGroupData(categoryIds, numOfGroups);

const generateUsers = generateUserData(3);

const users = [''];
const groups = [''];
const categories = [''];

const genrateUsersToGroups = generateUsersToGroupsData(users, groups, categories);

const questionIds = [''];
const categIds = [''];
const generateQuestionsToGroupCategories = generateQuestionsToGroupCategoriesData(
  questionIds,
  categIds,
);


function createEvents(dbPool: PostgresJsDatabase<typeof db>, eventsData: import("./seed-data-generators").EventData[]) {
  throw new Error('Function not implemented.');
}
/*
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
*/
/*
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
*/
