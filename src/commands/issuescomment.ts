import * as core from '@actions/core'
import * as utils from '../utils'
import CommandContext from './context'

/**
 * Get a list of issues from the current issue and post a comment
 *
 * @param {CommandContext} context context for this command execution
 * @param {args} list of arguments
 */
export default async function issuescomment(
  {owner, repo, issueNumber, issueBody, basepath}: CommandContext,
  ...args: string[]
): Promise<void> {
  const message: string = args.length > 1 ? args.join(' ') : args[0]

  // a little debuging info
  core.debug(message)
  core.debug(basepath)
  core.debug(`/issuescomment working with ${message}`)
  core.debug(`issue body -> ${issueBody}`)
  const gitURLs: string[] = utils.parseExtraArgs(issueBody, 'issuescomment')
  const filterNWO: string[] = []
  for (const url of gitURLs) {
    // get list of nwo's to filter on
    const nwo: utils.NWO = utils.getNWO(url)
    filterNWO.push(`${nwo.owner}/${nwo.name}`)
  }
  // eslint-disable-next-line @typescript-eslint/camelcase
  const linkedIssues: string[] = await utils.getLinkedIssues({owner, repo, issue_number: issueNumber}, {nwo: filterNWO})
  core.debug(`LinkedIssues -> ${linkedIssues}`)

  // for each issue we need to create a comment
  for (const url of new Set(linkedIssues)) {
    const nwo: utils.NWO = utils.getNWO(url)
    const refIssueNumber = utils.getIssueNumberFromURL(url)
    try {
      if (refIssueNumber === -1) {
        core.warning(`skipping issue comment for ${nwo.owner}/${nwo.name}/${refIssueNumber}`)
        continue
      }
      // we need an admin client vs normal client because the normal client only has rights to the current issue
      const adminclient = utils.getAdminClient()
      await adminclient.issues.createComment({
        owner: nwo.owner,
        repo: nwo.name,
        // eslint-disable-next-line @typescript-eslint/camelcase
        issue_number: refIssueNumber,
        body: message
      })
    } catch (error) {
      core.warning(`Unable to create comment-> ${nwo.owner}/${nwo.name}/${refIssueNumber}`)
      core.error(error)
    }
  }
}
