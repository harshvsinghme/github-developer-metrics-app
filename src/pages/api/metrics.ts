import githubApi from '@/utils/githubApi';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [openPRsRes, commitActivityRes, eventsRes] = await Promise.all([
      githubApi.get(
        `/repos/${process.env.NEXT_PUBLIC_REPO_OWNER}/${process.env.NEXT_PUBLIC_REPO_NAME}/pulls?state=open`
      ),
      githubApi.get(
        `/repos/${process.env.NEXT_PUBLIC_REPO_OWNER}/${process.env.NEXT_PUBLIC_REPO_NAME}/stats/commit_activity`
      ),
      githubApi.get(
        `/repos/${process.env.NEXT_PUBLIC_REPO_OWNER}/${process.env.NEXT_PUBLIC_REPO_NAME}/issues/events`
      )
    ]);

    const openPRs = openPRsRes.data;
    const commitActivity = commitActivityRes.status === 202 ? [] : commitActivityRes.data;
    const issueEvents = eventsRes.data;

    // open PR Age
    const openPrsAge = openPRs.length
      ? openPRs.reduce((sum: number, pr: { created_at: Date }) => {
          const createdAt = new Date(pr.created_at).getTime();
          const now = new Date().getTime();
          return sum + (now - createdAt) / (1000 * 60 * 60 * 24); // in days
        }, 0) / openPRs.length
      : 0;

    // Push Frequency
    const pushFrequency =
      Array.isArray(commitActivity) && commitActivity.length > 0
        ? commitActivity.reduce((sum: number, week: { total: number }) => sum + week.total, 0) /
          commitActivity.length
        : 0;

    // Reopened PRs
    const reopenedCount = issueEvents.filter(
      (event: { event: string }) => event.event === 'reopened'
    ).length;

    // Now Coding Time, Pickup Time, Review Time
    const closedPRsRes = await githubApi.get(
      `/repos/${process.env.NEXT_PUBLIC_REPO_OWNER}/${process.env.NEXT_PUBLIC_REPO_NAME}/pulls?state=closed&per_page=10`
    );
    console.log(closedPRsRes.data);
    const closedPRs = closedPRsRes.data;

    const codingTimes: number[] = [];
    const pickupTimes: number[] = [];
    const reviewTimes: number[] = [];

    for (const pr of closedPRs) {
      try {
        const prDetailsRes = await githubApi.get(
          `/repos/${process.env.NEXT_PUBLIC_REPO_OWNER}/${process.env.NEXT_PUBLIC_REPO_NAME}/pulls/${pr.number}`
        );
        const reviewsRes = await githubApi.get(
          `/repos/${process.env.NEXT_PUBLIC_REPO_OWNER}/${process.env.NEXT_PUBLIC_REPO_NAME}/pulls/${pr.number}/reviews`
        );

        const prDetails = prDetailsRes.data;
        const reviews = reviewsRes.data;

        const firstReview = reviews.length > 0 ? new Date(reviews[0].submitted_at).getTime() : null;
        const createdAt = new Date(prDetails.created_at).getTime();
        const mergedAt = prDetails.merged_at ? new Date(prDetails.merged_at).getTime() : null;

        if (createdAt && prDetails.head?.repo?.pushed_at) {
          const lastCommitTime = new Date(prDetails.head.repo.pushed_at).getTime();
          if (lastCommitTime > createdAt) {
            const codingTimeHours = (lastCommitTime - createdAt) / (1000 * 60 * 60);
            codingTimes.push(codingTimeHours);
          } else {
            console.log(`Skipping PR ${pr.number} with unusual time sequence`);
          }
        }

        if (createdAt && firstReview) {
          const pickupTimeHours = (firstReview - createdAt) / (1000 * 60 * 60);
          pickupTimes.push(Math.abs(pickupTimeHours));
        }

        if (firstReview && mergedAt) {
          const reviewTimeHours = (mergedAt - firstReview) / (1000 * 60 * 60);
          reviewTimes.push(Math.abs(reviewTimeHours));
        }
      } catch (err) {
        console.error(`Failed to fetch review for PR ${pr.number}`, err);
      }
    }

    const average = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    res.status(200).json({
      openPrsAge,
      pushFrequency,
      reopenedCount,
      codingTime: average(codingTimes),
      pickupTime: average(pickupTimes),
      reviewTime: average(reviewTimes)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
}

export default handler;
