## Getting started

After following the steps in the [installation guide](./installation.md), you can start using the tool in action by following these steps:

1. Run seed data to populate the database with initial data:

```bash
pnpm seed
```

This command will create an event with cycles and dummy questions.

## How to use the tool

1. Login to the app by navigating to `http://localhost:3000` in your browser.
2. Register for an event
3. Accept the registration by running `pnpm db:studio` and updating the registration status to `APPROVED`.

You can now start using the tool to create and answer questions, view the results, and more!

## FAQ

### How do I create a new event?

1. Create a new row in the `events` table in the database. A event can have many cycles, each cycle represents a round of questions.
2. Create group categories in the `group_categories` table in the database. A group category can have many groups. At least one group category must be created with the boolean `required` set to `true`.
3. Create multiple new rows in the `groups` table in the database associated to the group category created in the previous step. A group can have many users.
4. Create a new row in the `cycles` table in the database. Make sure to set correctly the start_at and end_at time. A cycle can have many questions.
5. Create a new row in the `questions` table in the database. A question can have many options.
6. Create a new row in the `options` table in the database. An option belongs to a question.
