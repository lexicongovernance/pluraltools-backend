/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: ['main', 'develop', 'next'],
  repositoryUrl: 'https://github.com/lexicongovernance/forum-backend',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    '@semantic-release/github',
    '@semantic-release/git',
  ],
  tagFormat: 'v${version}',
};
