/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main', 'next', '+([0-9])?(.{+([0-9]),x}).x'],
  repositoryUrl: 'https://github.com/lexicongovernance/forum-backend',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
  ],
};
