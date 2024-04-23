import {
  generateRegistrationFieldData,
  generateRegistrationFieldOptionsData,
  generateQuestionOptionsData,
  generateGroupCategoryData,
  generateGroupData,
  generateUserData,
  generateUsersToGroupsData,
  generateQuestionsToGroupCategoriesData,
} from './db/seed-data-generators';

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
