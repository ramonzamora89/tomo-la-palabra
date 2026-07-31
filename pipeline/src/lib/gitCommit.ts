import simpleGit from "simple-git";

/**
 * Commits and pushes the newly generated files. `branch` defaults to
 * whatever is currently checked out (main, in the GitHub Actions runner) —
 * pass an explicit test branch while verifying the publish stage by hand
 * (see plan's M9 milestone: push to a test branch before touching main).
 */
export async function commitAndPush(params: {
  repoRoot: string;
  files: string[];
  message: string;
  branch?: string;
}): Promise<void> {
  const { repoRoot, files, message, branch } = params;
  const git = simpleGit(repoRoot);

  const targetBranch = branch ?? (await git.revparse(["--abbrev-ref", "HEAD"]));

  const localBranches = await git.branchLocal();
  if (branch && !localBranches.all.includes(branch)) {
    await git.checkoutLocalBranch(branch);
  } else if (branch) {
    await git.checkout(branch);
  }

  await git.add(files);
  await git.commit(message);
  await git.push(["-u", "origin", targetBranch]);
}
