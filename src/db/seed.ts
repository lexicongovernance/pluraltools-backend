import {
  randBasketballTeam,
  randBook,
  randCity,
  randDog,
  randEmail,
  randFirstName,
  randJobTitle,
  randLastName,
  randUserName,
  randUuid,
} from '@ngneat/falso';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { fieldsSchema, insertOptionsSchema } from '../types';
import * as schema from './schema';

// Define the data types for the seed function
const insertCycleSchema = createInsertSchema(schema.cycles);
const insertEventSchema = createInsertSchema(schema.events, {
  fields: fieldsSchema,
});
const insertGroupCategoriesSchema = createInsertSchema(schema.groupCategories);
const insertGroupsSchema = createInsertSchema(schema.groups);
const insertQuestionsSchema = createInsertSchema(schema.questions, {
  fields: fieldsSchema,
});
const insertQuestionsToGroupCategoriesSchema = createInsertSchema(
  schema.questionsToGroupCategories,
);
const insertUsersSchema = createInsertSchema(schema.users);
const insertUsersToGroupsSchema = createInsertSchema(schema.usersToGroups);

async function seed(dbPool: NodePgDatabase<typeof schema>) {
  const events = await createEvent(dbPool, [
    {
      name: randCity(),
      fields: [
        {
          id: randUuid(),
          name: 'submit project',
          type: 'TEXT',
          position: 0,
          validation: {
            required: true,
          },
        },
      ],
    },
  ]);
  const cycles = await createCycle(dbPool, [
    {
      startAt: new Date(),
      // end in 5 mins
      endAt: new Date(Date.now() + 300000),
      status: 'OPEN',
      eventId: events[0]!.id,
    },
  ]);

  const forumQuestions = await createQuestions(dbPool, [
    {
      cycleId: cycles[0]!.id,
      title: 'What do you think about this event?',
      voteModel: 'COCM',
    },
    {
      cycleId: cycles[0]!.id,
      title: 'How do you feel about this event?',
      voteModel: 'QV',
    },
  ]);
  const questionOptions = await createQuestionOptions(dbPool, [
    {
      questionId: forumQuestions[0]!.id,
      title: 'Great',
      show: true,
    },
    {
      questionId: forumQuestions[0]!.id,
      title: 'Good',
      show: true,
    },
    {
      questionId: forumQuestions[0]!.id,
      title: 'Bad',
      show: true,
    },
  ]);

  const groupCategories = await createGroupCategories(dbPool, [
    { eventId: events[0]!.id, name: 'affiliation', userCanView: true, required: true },
    { eventId: events[0]!.id, name: 'public', userCanView: true, userCanCreate: false },
    { eventId: events[0]!.id, name: 'secrets', userCanCreate: true, userCanView: false },
    {
      eventId: events[0]!.id,
      name: 'tension',
      userCanCreate: true,
      userCanView: true,
      required: false,
    },
  ]);

  const groups = await createGroups(dbPool, [
    // 5 groups in first category
    {
      name: randBasketballTeam(),
      groupCategoryId: groupCategories[0]!.id,
    },
    {
      name: randBasketballTeam(),
      groupCategoryId: groupCategories[0]!.id,
    },
    {
      name: randBasketballTeam(),
      groupCategoryId: groupCategories[0]!.id,
    },
    {
      name: randBasketballTeam(),
      groupCategoryId: groupCategories[0]!.id,
    },
    {
      name: randBasketballTeam(),
      groupCategoryId: groupCategories[0]!.id,
    },
    // 4 groups in second category
    {
      name: randBook().title,
      groupCategoryId: groupCategories[1]!.id,
    },
    {
      name: randBook().title,
      groupCategoryId: groupCategories[1]!.id,
    },
    {
      name: randBook().title,
      groupCategoryId: groupCategories[1]!.id,
    },
    {
      name: randBook().title,
      groupCategoryId: groupCategories[1]!.id,
    },
    // 3 groups in third category
    {
      name: randJobTitle(),
      groupCategoryId: groupCategories[2]!.id,
    },
    {
      name: randJobTitle(),
      groupCategoryId: groupCategories[2]!.id,
    },
    {
      name: randJobTitle(),
      groupCategoryId: groupCategories[2]!.id,
    },
    // 3 groups in fourth category
    {
      name: randDog(),
      groupCategoryId: groupCategories[3]!.id,
    },
    {
      name: randDog(),
      groupCategoryId: groupCategories[3]!.id,
    },
    {
      name: randDog(),
      groupCategoryId: groupCategories[3]!.id,
    },
  ]);

  const users = await createUsers(dbPool, [
    // 3 random users
    {
      email: randEmail(),
      username: randUserName(),
      firstName: randFirstName(),
      lastName: randLastName(),
    },
    {
      email: randEmail(),
      username: randUserName(),
      firstName: randFirstName(),
      lastName: randLastName(),
    },
    {
      email: randEmail(),
      username: randUserName(),
      firstName: randFirstName(),
      lastName: randLastName(),
    },
  ]);

  const usersToGroups = await createUsersToGroups(
    dbPool,
    // user1 => [group1, group2]
    // user2 => [group1, group2]
    // user3 => [group1, group3]
    [
      // user1
      {
        userId: users[0]!.id,
        groupId: groups[0]!.id,
        groupCategoryId: groups[0]!.groupCategoryId,
      },
      {
        userId: users[0]!.id,
        groupId: groups[1]!.id,
        groupCategoryId: groups[1]!.groupCategoryId,
      },
      // user2
      {
        userId: users[1]!.id,
        groupId: groups[0]!.id,
        groupCategoryId: groups[0]!.groupCategoryId,
      },
      {
        userId: users[1]!.id,
        groupId: groups[1]!.id,
        groupCategoryId: groups[1]!.groupCategoryId,
      },
      // user3
      {
        userId: users[2]!.id,
        groupId: groups[0]!.id,
        groupCategoryId: groups[0]!.groupCategoryId,
      },
      {
        userId: users[2]!.id,
        groupId: groups[2]!.id,
        groupCategoryId: groups[2]!.groupCategoryId,
      },
    ],
  );

  const questionsToGroupCategories = await createQuestionsToGroupCategories(dbPool, [
    {
      questionId: forumQuestions[0]!.id,
      groupCategoryId: groupCategories[0]!.id,
    },
  ]);

  return {
    events,
    cycles,
    forumQuestions,
    questionOptions,
    groupCategories,
    groups,
    users,
    usersToGroups,
    questionsToGroupCategories,
  };
}

async function cleanup(dbPool: NodePgDatabase<typeof schema>) {
  await dbPool.delete(schema.userAttributes);
  await dbPool.delete(schema.votes);
  await dbPool.delete(schema.federatedCredentials);
  await dbPool.delete(schema.options);
  await dbPool.delete(schema.registrationData);
  await dbPool.delete(schema.registrationFieldOptions);
  await dbPool.delete(schema.registrationFields);
  await dbPool.delete(schema.registrations);
  await dbPool.delete(schema.usersToGroups);
  await dbPool.delete(schema.users);
  await dbPool.delete(schema.groups);
  await dbPool.delete(schema.questionsToGroupCategories);
  await dbPool.delete(schema.groupCategories);
  await dbPool.delete(schema.questions);
  await dbPool.delete(schema.cycles);
  await dbPool.delete(schema.events);
}

async function createEvent(
  dbPool: NodePgDatabase<typeof schema>,
  eventData: z.infer<typeof insertEventSchema>[],
) {
  const events = [];
  for (const event of eventData) {
    const result = await dbPool
      .insert(schema.events)
      .values({
        name: event.name,
        fields: event.fields,
      })
      .returning();
    events.push(result[0]);
  }
  return events;
}

async function createCycle(
  dbPool: NodePgDatabase<typeof schema>,
  cycleData: z.infer<typeof insertCycleSchema>[],
) {
  if (cycleData.length === 0) {
    throw new Error('Cycle data is empty.');
  }

  const cycles = [];
  for (const cycle of cycleData) {
    if (!cycle.eventId) {
      throw new Error('Event ID is not defined.');
    }

    const result = await dbPool
      .insert(schema.cycles)
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

async function createQuestions(
  dbPool: NodePgDatabase<typeof schema>,
  questionData: z.infer<typeof insertQuestionsSchema>[],
) {
  if (questionData.length === 0) {
    throw new Error('Forum Question data is empty.');
  }

  const questions = [];
  for (const question of questionData) {
    const result = await dbPool
      .insert(schema.questions)
      .values({
        cycleId: question.cycleId,
        title: question.title,
        voteModel: question.voteModel,
      })
      .returning();

    questions.push(result[0]);
  }

  return questions;
}

async function createQuestionOptions(
  dbPool: NodePgDatabase<typeof schema>,
  optionData: z.infer<typeof insertOptionsSchema>[],
) {
  if (optionData.length === 0) {
    throw new Error('Question Option data is empty.');
  }

  const options = [];
  for (const option of optionData) {
    if (!option.questionId) {
      throw new Error('Question ID is not defined for the question option.');
    }

    const result = await dbPool
      .insert(schema.options)
      .values({
        questionId: option.questionId,
        title: option.title,
        show: option.show,
      })
      .returning();

    options.push(result[0]);
  }

  return options;
}

async function createGroupCategories(
  dbPool: NodePgDatabase<typeof schema>,
  groupCategoriesData: z.infer<typeof insertGroupCategoriesSchema>[],
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
      .insert(schema.groupCategories)
      .values({
        name: data.name,
        eventId: data.eventId,
        userCanCreate: data.userCanCreate,
        userCanView: data.userCanView,
        required: data.required,
      })
      .returning();

    groupCategories.push(result[0]);
  }

  return groupCategories;
}

async function createGroups(
  dbPool: NodePgDatabase<typeof schema>,
  groupData: z.infer<typeof insertGroupsSchema>[],
) {
  if (groupData.length === 0) {
    throw new Error('Group Data is empty.');
  }

  const groups = [];
  for (const group of groupData) {
    if (!group.groupCategoryId) {
      throw new Error('Group Category ID is not defined for the group.');
    }

    const result = await dbPool
      .insert(schema.groups)
      .values({
        name: group.name,
        groupCategoryId: group.groupCategoryId,
      })
      .returning();

    groups.push(result[0]);
  }

  return groups;
}

async function createUsers(
  dbPool: NodePgDatabase<typeof schema>,
  userData: z.infer<typeof insertUsersSchema>[],
) {
  const users = [];
  for (const user of userData) {
    const result = await dbPool
      .insert(schema.users)
      .values({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .returning();

    users.push(result[0]);
  }

  return users;
}

async function createUsersToGroups(
  dbPool: NodePgDatabase<typeof schema>,
  usersToGroupsData: z.infer<typeof insertUsersToGroupsSchema>[],
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
      .insert(schema.usersToGroups)
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
  dbPool: NodePgDatabase<typeof schema>,
  questionsToGroupCategoriesData: z.infer<typeof insertQuestionsToGroupCategoriesSchema>[],
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
      .insert(schema.questionsToGroupCategories)
      .values({
        questionId: groupCategories.questionId,
        groupCategoryId: groupCategories.groupCategoryId,
      })
      .returning();

    questionsToGroupCategories.push(result[0]);
  }

  return questionsToGroupCategories;
}

export { cleanup, seed };
