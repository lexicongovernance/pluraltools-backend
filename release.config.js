/**
 * @type {import('semantic-release').GlobalConfig}
 */
// eslint-disable-next-line no-undef
module.exports = {
  branches: ['main', { name: 'develop', channel: 'next', prerelease: true }, 'next'],
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
    [
      '@semantic-release/github',
      {
        assets: ['package.json'],
        releaseNotes: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
  tagFormat: 'v${version}',
};
