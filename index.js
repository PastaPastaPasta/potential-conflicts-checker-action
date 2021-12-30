const { inspect } = require('util');
const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const signale = require('signale');

const pullRequests = require('./lib/pull-requests');
const leaveComment = require('./lib/comment');

const commentTpl = `This Pull Request may conflict if the Pull Requests below are merged first.\n\n`;

async function run() {
  try {
    if (context.eventName !== 'pull_request' && context.eventName !== 'pull_request_target') {
      throw new Error(`This action only work with pull_request and pull_request_target event not  ${context.eventName}`);
    }

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const ghToken = core.getInput('ghToken');
    const octokit = new GitHub(ghToken, {});

    const conflictInfo = await pullRequests({ octokit });
    signale.debug(inspect(conflictInfo, {depth:3}));

    if (conflictInfo.conflictPrs.length > 0) {
      // leave comment on current PR
      const body = commentTpl +
        conflictInfo.conflictPrs.map(c =>
          `#${c.number}\nconflictable files: ${c.conflicts.map(f => `\`${f}\``).join(',')}`
        ).join('\n');
      // await leaveComment({
      //   octokit,
      //   pull_number: conflictInfo.pull_number,
      //   body,
      // });

      result = "";

      // leave comments on target PR
      const promises = conflictInfo.conflictPrs.map(c => {
        result += conflictInfo.pull_number + " ";
        const body = commentTpl +
          `#${conflictInfo.pull_number}\nconflictable files: ${c.conflicts.map(f => `\`${f}\``).join(',')}`;

        // return leaveComment({
        //   octokit,
        //   pull_number: c.number,
        //   body,
        // });
      });

      await Promise.all(promises);

      core.warning(result);
      core.exportVariable('test', 'hello_world');
      core.exportVariable('conflicts', result);
      core.warning("Potential conflicts detected!");
      // core.setFailed("Potential conflicts detected!");
    }
  }
  catch (error) {
    signale.fatal(error);
    core.setFailed(error.message);
  }
}

run()
