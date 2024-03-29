#!/bin/bash

# Expect the PR labels as the first argument
LABELS=$1

if [ -z "$LABELS" ]; then
  echo "Error: No labels provided"
  exit 0
fi

# Determine version bump type
VERSION_BUMP=""
if [[ $LABELS == *"major"* ]]; then
  VERSION_BUMP="major"
elif [[ $LABELS == *"minor"* ]]; then
  VERSION_BUMP="minor"
elif [[ $LABELS == *"patch"* ]]; then
  VERSION_BUMP="patch"
fi

# If no valid label is found, exit the script
if [ -z "$VERSION_BUMP" ]; then
  echo "No valid label found. Exiting."
  exit 0
fi

# Bump version using npm
pnpm version $VERSION_BUMP --no-git-tag-version
