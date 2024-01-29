import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import { randCompanyName, randCountry, randMovie, randUser } from '@ngneat/falso';

async function seed(dbPool: PostgresJsDatabase<typeof db>) {
  const events = await createEvent(dbPool);
  const cycles = await createCycle(dbPool, events[0]?.id);
  const registrationFields = await createRegistrationFields(dbPool, events[0]?.id);
  const forumQuestions = await createForumQuestions(dbPool, cycles[0]?.id);
  const questionOptions = await createQuestionOptions(dbPool, forumQuestions[0]?.id);
  const groups = await createGroups(dbPool);
  const users = await createUsers(dbPool);
  const usersToGroups = await createUsersToGroups(
    dbPool,
    users.map((u) => u.id!),
    groups.map((g) => g.id!),
  );

  return {
    events,
    cycles,
    forumQuestions,
    questionOptions,
    groups,
    users,
    usersToGroups,
    registrationFields,
  };
}

async function cleanup(dbPool: PostgresJsDatabase<typeof db>) {
  await dbPool.delete(db.votes);
  await dbPool.delete(db.federatedCredentials);
  await dbPool.delete(db.registrationData);
  await dbPool.delete(db.registrationFields);
  await dbPool.delete(db.registrations);
  await dbPool.delete(db.usersToGroups);
  await dbPool.delete(db.users);
  await dbPool.delete(db.groups);
  await dbPool.delete(db.questionOptions);
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
    .values({
      name: 'proposal title',
      type: 'TEXT',
      required: true,
      eventId,
    })
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
    .values({
      cycleId,
      title: "What's your favorite movie?",
    })
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
        text: randMovie(),
      },
      { questionId, text: randMovie() },
    ])
    .returning();
}

async function createGroups(dbPool: PostgresJsDatabase<typeof db>) {
  return dbPool
    .insert(db.groups)
    .values({
      name: randCompanyName(),
    })
    .returning();
}

async function createUsers(dbPool: PostgresJsDatabase<typeof db>) {
  const fakeUsers = [randUser(), randUser()];
  return dbPool
    .insert(db.users)
    .values(fakeUsers.map((fUser) => ({ email: fUser.email, username: fUser.username })))
    .returning();
}

async function createUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userIds: string[],
  groupIds: string[],
) {
  // assign users to random groups
  const usersToGroups = userIds.map((userId) => ({
    userId,
    groupId: groupIds[Math.floor(Math.random() * groupIds.length)]!,
  }));
  return dbPool.insert(db.usersToGroups).values(usersToGroups).returning();
}

export { seed, cleanup };
