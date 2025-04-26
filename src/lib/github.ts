import githubApi from '@/utils/githubApi';

const owner = process.env.NEXT_PUBLIC_REPO_OWNER!;
const repo = process.env.NEXT_PUBLIC_REPO_NAME!;

export async function fetchOpenPRs() {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}/pulls?state=open`);
  return data;
}

export async function fetchCommitActivity() {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}/stats/commit_activity`);
  return data;
}

export async function fetchIssueEvents() {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}/issues/events`);
  return data;
}
