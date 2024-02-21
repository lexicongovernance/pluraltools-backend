## Database Description

This database encompasses various tables designed to manage user registrations, event details, forum questions, user attributes, group associations, and voting records. Each table serves a specific purpose in facilitating interactions within the system, providing comprehensive support for event management and user engagement.

### Table: federated_credentials

Stores federated login credentials associated with user accounts.

| Field     | Type         | Description                                           |
| --------- | ------------ | ----------------------------------------------------- |
| id        | UUID         | Primary key, randomly generated ID.                   |
| userId    | UUID         | Foreign key referencing the corresponding user.       |
| provider  | VARCHAR(256) | Provider of the federated credentials (e.g., Zupass). |
| subject   | VARCHAR(256) | Subject identifier for the federated credentials.     |
| createdAt | TIMESTAMP    | Timestamp indicating when the record was created.     |
| updatedAt | TIMESTAMP    | Timestamp indicating the last update to the record.   |

**Indexes:**

- `provider_subject_idx`: Unique index on `provider` and `subject`.

---

### Table: events

Stores information about events organized within the system.

| Field                   | Type      | Description                                               |
| ----------------------- | --------- | --------------------------------------------------------- |
| id                      | UUID      | Primary key, randomly generated ID.                       |
| name                    | VARCHAR   | Name of the event.                                        |
| description             | VARCHAR   | Description of the event.                                 |
| registrationDescription | VARCHAR   | Description for event registration.                       |
| imageUrl                | VARCHAR   | URL for the event image.                                  |
| eventDisplayRank        | INTEGER   | Rank of the event for display purposes.                   |
| createdAt               | TIMESTAMP | Timestamp indicating when the event was created.          |
| updatedAt               | TIMESTAMP | Timestamp indicating the last update to the event record. |

**Relations:**

- `registrations`: One-to-many relation with `registrations`.
- `registrationFields`: One-to-many relation with `registrationFields`.
- `cycles`: One-to-many relation with `cycles`.

---

### Table: cycles

Stores information about cycles of activity within events.

| Field     | Type        | Description                                               |
| --------- | ----------- | --------------------------------------------------------- |
| id        | UUID        | Primary key, randomly generated ID.                       |
| eventId   | UUID        | Foreign key referencing the associated event.             |
| startAt   | TIMESTAMP   | Timestamp indicating the start of the cycle.              |
| endAt     | TIMESTAMP   | Timestamp indicating the end of the cycle.                |
| status    | VARCHAR(20) | Status of the cycle (OPEN, CLOSED, UPCOMING).             |
| createdAt | TIMESTAMP   | Timestamp indicating when the cycle was created.          |
| updatedAt | TIMESTAMP   | Timestamp indicating the last update to the cycle record. |

**Relations:**

- `forumQuestions`: One-to-many relation with `forumQuestions`.
- `event`: One-to-one relation with `events`.

---

### Table: forum_questions

Stores questions posted within specific cycles.

| Field            | Type         | Description                                                  |
| ---------------- | ------------ | ------------------------------------------------------------ |
| id               | UUID         | Primary key, randomly generated ID.                          |
| cycleId          | UUID         | Foreign key referencing the associated cycle.                |
| questionTitle    | VARCHAR(256) | Title of the forum question.                                 |
| questionSubTitle | VARCHAR(256) | Subtitle of the forum question.                              |
| createdAt        | TIMESTAMP    | Timestamp indicating when the question was created.          |
| updatedAt        | TIMESTAMP    | Timestamp indicating the last update to the question record. |

**Relations:**

- `cycle`: One-to-one relation with `cycles`.
- `questionOptions`: One-to-many relation with `questionOptions`.

---

### Table: groups

Stores information about groups within the system.

| Field       | Type         | Description                                               |
| ----------- | ------------ | --------------------------------------------------------- |
| id          | UUID         | Primary key, randomly generated ID.                       |
| name        | VARCHAR(256) | Name of the group.                                        |
| description | VARCHAR(256) | Description of the group.                                 |
| createdAt   | TIMESTAMP    | Timestamp indicating when the group was created.          |
| updatedAt   | TIMESTAMP    | Timestamp indicating the last update to the group record. |

**Relations:**

- `usersToGroups`: One-to-many relation with `usersToGroups`.

---

### Table: question_options

Stores options for forum questions.

| Field              | Type         | Description                                                |
| ------------------ | ------------ | ---------------------------------------------------------- |
| id                 | UUID         | Primary key, randomly generated ID.                        |
| registrationDataId | UUID         | Foreign key referencing the associated registration data.  |
| questionId         | UUID         | Foreign key referencing the associated forum question.     |
| optionTitle        | VARCHAR(256) | Title of the question option.                              |
| optionSubTitle     | VARCHAR(256) | Subtitle of the question option.                           |
| accepted           | BOOLEAN      | Flag indicating if the option is accepted.                 |
| voteCount          | NUMERIC      | Number of votes for the option.                            |
| createdAt          | TIMESTAMP    | Timestamp indicating when the option was created.          |
| updatedAt          | TIMESTAMP    | Timestamp indicating the last update to the option record. |

**Relations:**

- `forumQuestion`: One-to-one relation with `forumQuestions`.
- `registrationData`: One-to-one relation with `registrationData`.
- `votes`: One-to-many relation with `votes`.

---

### Table: registration_data

Stores data collected during event registrations.

| Field               | Type      | Description                                                    |
| ------------------- | --------- | -------------------------------------------------------------- |
| id                  | UUID      | Primary key, randomly generated ID.                            |
| registrationId      | UUID      | Foreign key referencing the associated registration.           |
| registrationFieldId | UUID      | Foreign key referencing the associated registration field.     |
| value               | VARCHAR   | Value of the registration data.                                |
| createdAt           | TIMESTAMP | Timestamp indicating when the registration data was created.   |
| updatedAt           | TIMESTAMP | Timestamp indicating the last update to the registration data. |

**Relations:**

- `registration`: One-to-one relation with `registrations`.
- `registrationField`: One-to-one relation with `registrationFields`.

### Table: registration_field_options

Stores options for registration fields.

| Field               | Type         | Description                                                |
| ------------------- | ------------ | ---------------------------------------------------------- |
| id                  | UUID         | Primary key, randomly generated ID.                        |
| registrationFieldId | UUID         | Foreign key referencing the associated registration field. |
| value               | VARCHAR(256) | Value of the registration field option.                    |
| createdAt           | TIMESTAMP    | Timestamp indicating when the option was created.          |
| updatedAt           | TIMESTAMP    | Timestamp indicating the last update to the option record. |

**Relations:**

- `registrationField`: One-to-one relation with `registrationFields`.

---

### Table: registration_fields

Stores fields for event registrations.

| Field            | Type      | Description                                                  |
| ---------------- | --------- | ------------------------------------------------------------ |
| id               | UUID      | Primary key, randomly generated ID.                          |
| eventId          | UUID      | Foreign key referencing the associated event.                |
| name             | VARCHAR   | Name of the registration field.                              |
| description      | VARCHAR   | Description of the registration field.                       |
| type             | VARCHAR   | Type of the registration field (TEXT, NUMBER, SELECT, etc.). |
| required         | BOOLEAN   | Indicates if the field is required.                          |
| questionId       | UUID      | Foreign key referencing the associated forum question.       |
| fieldDisplayRank | INTEGER   | Rank of the field for display purposes.                      |
| characterLimit   | INTEGER   | Character limit for text fields.                             |
| createdAt        | TIMESTAMP | Timestamp indicating when the field was created.             |
| updatedAt        | TIMESTAMP | Timestamp indicating the last update to the field record.    |

**Relations:**

- `event`: One-to-one relation with `events`.
- `forumQuestion`: One-to-one relation with `forumQuestions`.
- `registrationFieldOptions`: One-to-many relation with `registrationFieldOptions`.
- `registrationData`: One-to-many relation with `registrationData`.

---

### Table: registrations

Stores registrations for events.

| Field     | Type      | Description                                                      |
| --------- | --------- | ---------------------------------------------------------------- |
| id        | UUID      | Primary key, randomly generated ID.                              |
| userId    | UUID      | Foreign key referencing the associated user.                     |
| eventId   | UUID      | Foreign key referencing the associated event.                    |
| status    | VARCHAR   | Status of the registration (DRAFT, APPROVED, etc.).              |
| createdAt | TIMESTAMP | Timestamp indicating when the registration was created.          |
| updatedAt | TIMESTAMP | Timestamp indicating the last update to the registration record. |

**Relations:**

- `user`: One-to-one relation with `users`.
- `event`: One-to-one relation with `events`.
- `registrationData`: One-to-many relation with `registrationData`.

---

### Table: user_attributes

Stores custom attributes for users.

| Field          | Type      | Description                                                   |
| -------------- | --------- | ------------------------------------------------------------- |
| id             | UUID      | Primary key, randomly generated ID.                           |
| userId         | UUID      | Foreign key referencing the associated user.                  |
| attributeKey   | VARCHAR   | Key of the user attribute.                                    |
| attributeValue | VARCHAR   | Value of the user attribute.                                  |
| createdAt      | TIMESTAMP | Timestamp indicating when the attribute was created.          |
| updatedAt      | TIMESTAMP | Timestamp indicating the last update to the attribute record. |

**Relations:**

- `user`: One-to-one relation with `users`.

---

### Table: users

Stores user information.

| Field             | Type      | Description                                              |
| ----------------- | --------- | -------------------------------------------------------- |
| id                | UUID      | Primary key, randomly generated ID.                      |
| username          | VARCHAR   | Username of the user.                                    |
| name              | VARCHAR   | Name of the user.                                        |
| email             | VARCHAR   | Email address of the user.                               |
| emailNotification | BOOLEAN   | Indicates if the user receives email notifications.      |
| createdAt         | TIMESTAMP | Timestamp indicating when the user was created.          |
| updatedAt         | TIMESTAMP | Timestamp indicating the last update to the user record. |

**Relations:**

- `registrations`: One-to-many relation with `registrations`.
- `votes`: One-to-many relation with `votes`.
- `usersToGroups`: One-to-many relation with `usersToGroups`.
- `userAttributes`: One-to-many relation with `userAttributes`.
- `federatedCredential`: One-to-one relation with `federatedCredentials`.

---

### Table: users_to_groups

Associates users with groups.

| Field     | Type      | Description                                                     |
| --------- | --------- | --------------------------------------------------------------- |
| id        | UUID      | Primary key, randomly generated ID.                             |
| userId    | UUID      | Foreign key referencing the associated user.                    |
| groupId   | UUID      | Foreign key referencing the associated group.                   |
| createdAt | TIMESTAMP | Timestamp indicating when the association was created.          |
| updatedAt | TIMESTAMP | Timestamp indicating the last update to the association record. |

**Relations:**

- `group`: One-to-one relation with `groups`.
- `user`: One-to-one relation with `users`.

---

### Table: votes

Stores votes cast by users.

| Field      | Type      | Description                                              |
| ---------- | --------- | -------------------------------------------------------- |
| id         | UUID      | Primary key, randomly generated ID.                      |
| userId     | UUID      | Foreign key referencing the associated user.             |
| optionId   | UUID      | Foreign key referencing the associated question option.  |
| questionId | UUID      | Foreign key referencing the associated forum question.   |
| numOfVotes | INTEGER   | Number of votes cast.                                    |
| createdAt  | TIMESTAMP | Timestamp indicating when the vote was cast.             |
| updatedAt  | TIMESTAMP | Timestamp indicating the last update to the vote record. |

**Relations:**

- `user`: One-to-one relation with `users`.
- `questionOptions`: One-to-one relation with `questionOptions`.
- `forumQuestion`: One-to-one relation with `forumQuestions`.
