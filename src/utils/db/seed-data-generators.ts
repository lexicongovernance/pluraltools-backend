import { randCompanyName, randCountry, randUser } from '@ngneat/falso';
import {
  Cycle,
  Event,
  ForumQuestion,
  RegistrationField,
  RegistrationFieldOption,
  QuestionOption,
  GroupCategory,
  Group,
  User,
  UsersToGroups,
  QuestionsToGroupCategories,
} from '../../db';

// Define types
export type CycleData = Pick<Cycle, 'eventId' | 'startAt' | 'endAt' | 'status'>;
export type EventData = Pick<Event, 'name'>;
export type RegistrationFieldData = Pick<
  RegistrationField,
  'name' | 'eventId' | 'type' | 'required' | 'forUser' | 'forGroup'
>;
export type RegistrationFieldOptionData = Pick<
  RegistrationFieldOption,
  'registrationFieldId' | 'value'
>;
export type ForumQuestionData = Pick<ForumQuestion, 'cycleId' | 'questionTitle'>;
export type QuestionOptionData = Pick<QuestionOption, 'questionId' | 'optionTitle' | 'accepted'>;
export type GroupCategoryData = Pick<
  GroupCategory,
  'name' | 'eventId' | 'userCanCreate' | 'userCanView' | 'userCanLeave'
>;
export type GroupData = Pick<Group, 'name' | 'groupCategoryId'>;
export type UserData = Pick<User, 'username' | 'email' | 'firstName' | 'lastName'>;
export type UsersToGroupsData = Pick<UsersToGroups, 'userId' | 'groupId' | 'groupCategoryId'>;
export type QuestionsToGroupCategoriesData = Pick<
  QuestionsToGroupCategories,
  'questionId' | 'groupCategoryId'
>;

export function generateEventData(numEvents: number): EventData[] {
  const events: EventData[] = [];
  for (let i = 0; i < numEvents; i++) {
    events.push({ name: randCountry() });
  }
  return events;
}

export function generateCycleData(numCycles: number, eventId: string): CycleData[] {
  const cycles: CycleData[] = [];
  const today = new Date();

  for (let i = 0; i < numCycles; i++) {
    const startAt = new Date(today);
    const endAt = new Date(startAt);
    endAt.setDate(startAt.getDate() + 1);

    cycles.push({
      startAt,
      endAt,
      status: 'OPEN',
      eventId,
    });
  }

  return cycles;
}

export function generateRegistrationFieldData(
  eventId: string,
  fields: Partial<RegistrationFieldData>[] = [],
): RegistrationFieldData[] {
  return fields.map((field) => ({
    name: field.name || 'Untitled Field',
    type: field.type || 'TEXT',
    required: field.required !== undefined ? field.required : false,
    eventId,
    forUser: field.forUser !== undefined ? field.forUser : false,
    forGroup: field.forGroup !== undefined ? field.forGroup : false,
  }));
}

export function generateRegistrationFieldOptionsData(
  registrationFieldId: string,
  options: string[],
): RegistrationFieldOptionData[] {
  return options.map((option) => ({
    registrationFieldId,
    value: option,
  }));
}

export function generateForumQuestionData(
  cycleId: string,
  questionTitles: string[],
): ForumQuestionData[] {
  return questionTitles.map((questionTitle) => ({
    cycleId,
    questionTitle,
  }));
}

export function generateQuestionOptionsData(
  questionId: string,
  optionTitles: string[],
  status: boolean[],
): QuestionOptionData[] {
  const questionOptionsData: QuestionOptionData[] = [];

  for (let i = 0; i < optionTitles.length; i++) {
    const optionData: QuestionOptionData = {
      questionId,
      optionTitle: optionTitles[i]!,
      accepted: status[i]!,
    };
    questionOptionsData.push(optionData);
  }

  return questionOptionsData;
}

export function generateGroupCategoryData(
  eventId: string,
  categories: Partial<GroupCategoryData>[] = [],
): GroupCategoryData[] {
  return categories.map((category) => ({
    name: category.name || 'Untitled Category',
    eventId,
    userCanView: category.userCanView !== undefined ? category.userCanView : true,
    userCanCreate: category.userCanCreate !== undefined ? category.userCanCreate : false,
    userCanLeave: category.userCanLeave !== undefined ? category.userCanLeave : true,
  }));
}

export function generateGroupData(
  categoryIds: string[],
  numGroupsPerCategory: number[],
): GroupData[] {
  const groupData: GroupData[] = [];

  categoryIds.forEach((categoryId, index) => {
    const numGroups = numGroupsPerCategory[index]!;
    for (let i = 0; i < numGroups; i++) {
      const data: GroupData = {
        name: randCompanyName(),
        groupCategoryId: categoryId,
      };
      groupData.push(data);
    }
  });

  return groupData;
}

export function generateUserData(numUsers: number): UserData[] {
  const users: UserData[] = [];
  for (let i = 0; i < numUsers; i++) {
    users.push({
      username: randUser().username,
      email: randUser().email,
      firstName: randUser().firstName,
      lastName: randUser().lastName,
    });
  }
  return users;
}

export function generateUsersToGroupsData(
  userIds: string[],
  groupIds: string[],
  categoryIds: string[],
): UsersToGroupsData[] {
  const usersToGroupsData: UsersToGroupsData[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const Data: UsersToGroupsData = {
      userId: userIds[i]!,
      groupId: groupIds[i]!,
      groupCategoryId: categoryIds[i]!,
    };
    usersToGroupsData.push(Data);
  }

  return usersToGroupsData;
}

export function generateQuestionsToGroupCategoriesData(
  questionIds: string[],
  categoryIds: string[],
): QuestionsToGroupCategoriesData[] {
  const questionsToCategoriesData: QuestionsToGroupCategoriesData[] = [];

  for (let i = 0; i < categoryIds.length; i++) {
    const Data: QuestionsToGroupCategoriesData = {
      questionId: questionIds[i]!,
      groupCategoryId: categoryIds[i]!,
    };
    questionsToCategoriesData.push(Data);
  }

  return questionsToCategoriesData;
}
