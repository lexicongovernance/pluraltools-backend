# Release Process

## Overview

Our release process is automated through GitHub Actions and involves the following steps:

1. **Testing**: All tests are run to ensure the codebase is stable.
2. **Version Bumping**: The version of the application is automatically bumped based on the labels added to the merged pull request.
3. **Deployment**: The application is deployed to the production environment.

## Detailed Steps

### 1. Testing

Whenever a pull request is opened or updated, our test workflow is triggered. This workflow runs all unit tests and integration tests to ensure the stability of the codebase.

### 2. Version Bumping

When a pull request is merged, a version bump is triggered based on the labels added to the pull request. The labels that can be used are:

- `major`: This will trigger a major version bump (e.g., 1.0.0 to 2.0.0).
- `minor`: This will trigger a minor version bump (e.g., 1.0.0 to 1.1.0).
- `patch`: This will trigger a patch version bump (e.g., 1.0.0 to 1.0.1).

If none of these labels are present, no version bump will occur.

The version bump is performed by a script that updates the version in the `package.json` file and commits the change to the repository.

### 3. Deployment

After the version bump, the application is automatically deployed to the production environment.

## Important Notes

- The version bump and deployment only occur when a pull request is merged. If a pull request is closed without being merged, these steps will not run.
- The version bump is skipped if the pull request does not have a `major`, `minor`, or `patch` label.
- The commit created by the version bump script includes `[skip ci]` in the commit message to prevent triggering a new workflow run.

## Conclusion

This automated release process ensures that our application is always tested, versioned, and deployed in a consistent manner. It reduces the risk of human error and ensures that our production environment is always up-to-date with the latest stable version of our application.
