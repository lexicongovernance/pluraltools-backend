# Release

## Branches

- main: has the latest stable code
- develop: has the next features
- next: has the next breaking change

## Angular Commit Message Convention

The Angular Commit Message Convention is a set of rules for structuring git commit messages. It's used by the Angular team and is the default convention for `semantic-release`.

## format

Each commit message consists of a **header**, a **body**, and a **footer**. The header is mandatory and must conform to the following format:

```
<type>(<scope>): <subject>
```

### type

The type must be one of the following:

- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `docs`: Documentation-only changes
- `feat`: A new feature
- `fix`: A bug fix
- `perf`: A code change that improves performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `test`: Adding missing tests or correcting existing tests

## example

Here's an example of an Angular commit message:

```
feat(user-service): add new method to fetch user data

This commit adds a new method to the UserService that allows fetching user data by ID. This is useful for scenarios where only the user ID is known.

Closes #123
BREAKING CHANGE: The old method getUser has been removed. Use getUserById instead.
```

This commit message includes a `type` of `feat`, a `scope` of `user-service`, and a `subject` describing the change. The `body` provides more detail about the change, and the `footer` includes a `Closes` keyword to reference a related GitHub issue and a `BREAKING CHANGE` note.

## developer guide

1. `git add` and stage the changes that are required
2. `pn commit` and fill out the prompts
