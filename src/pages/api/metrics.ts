import githubApi from '@/utils/githubApi';
import { StatusCodes } from 'http-status-codes';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { repo = process.env.NEXT_PUBLIC_REPO_NAME } = req.query;
  const repoOwner = process.env.NEXT_PUBLIC_REPO_OWNER;

  try {
    const [openPRsRes, commitActivityRes, eventsRes] = await Promise.all([
      githubApi.get(`/repos/${repoOwner}/${repo}/pulls?state=open`),
      githubApi.get(`/repos/${repoOwner}/${repo}/stats/commit_activity`),
      githubApi.get(`/repos/${repoOwner}/${repo}/issues/events`)
    ]);

    const openPRs = openPRsRes.data;
    const commitActivity =
      commitActivityRes.status === StatusCodes.ACCEPTED ? [] : commitActivityRes.data;
    const issueEvents = eventsRes.data;

    const openPrsAge = openPRs.length
      ? openPRs.reduce((sum: number, pr: { created_at: string }) => {
          const createdAt = new Date(pr.created_at).getTime();
          const now = new Date().getTime();
          return sum + (now - createdAt) / (1000 * 60 * 60 * 24);
        }, 0) / openPRs.length
      : 0;

    const pushFrequency =
      Array.isArray(commitActivity) && commitActivity.length > 0
        ? commitActivity.reduce((sum: number, week: { total: number }) => sum + week.total, 0) /
          commitActivity.length
        : 0;

    const reopenedCount = issueEvents.filter(
      (event: { event: string }) => event.event === 'reopened'
    ).length;

    const commitActivityData = {
      labels: [] as string[],
      values: [] as number[]
    };

    if (Array.isArray(commitActivity) && commitActivity.length > 0) {
      const recentWeeks = commitActivity.slice(-10);

      recentWeeks.forEach((week: { week: number; total: number }) => {
        const date = new Date(week.week * 1000);
        commitActivityData.labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
        commitActivityData.values.push(week.total);
      });
    }

    const closedPRsRes = await githubApi.get(
      `/repos/${repoOwner}/${repo}/pulls?state=closed&per_page=10`
    );

    const closedPRs = closedPRsRes.data;

    const codingTimes: number[] = [];
    const pickupTimes: number[] = [];
    const reviewTimes: number[] = [];

    const contributors: Record<
      string,
      {
        prsCreated: number;
        prsReviewed: number;
        codingTime: number[];
        pickupTime: number[];
        reviewTime: number[];
        commits: number;
      }
    > = {};

    for (const pr of closedPRs) {
      try {
        const prDetailsRes = await githubApi.get(`/repos/${repoOwner}/${repo}/pulls/${pr.number}`);
        const reviewsRes = await githubApi.get(
          `/repos/${repoOwner}/${repo}/pulls/${pr.number}/reviews`
        );

        const prDetails = prDetailsRes.data;
        const reviews = reviewsRes.data;

        const author = pr.user?.login;
        if (author) {
          if (!contributors[author]) {
            contributors[author] = {
              prsCreated: 0,
              prsReviewed: 0,
              codingTime: [],
              pickupTime: [],
              reviewTime: [],
              commits: 0
            };
          }
          contributors[author].prsCreated++;
        }

        for (const review of reviews) {
          const reviewer = review.user?.login;
          if (reviewer && reviewer !== author) {
            if (!contributors[reviewer]) {
              contributors[reviewer] = {
                prsCreated: 0,
                prsReviewed: 0,
                codingTime: [],
                pickupTime: [],
                reviewTime: [],
                commits: 0
              };
            }
            contributors[reviewer].prsReviewed++;
          }
        }

        const firstReview = reviews.length > 0 ? new Date(reviews[0].submitted_at).getTime() : null;
        const createdAt = new Date(prDetails.created_at).getTime();
        const mergedAt = prDetails.merged_at ? new Date(prDetails.merged_at).getTime() : null;

        if (createdAt && prDetails.head?.repo?.pushed_at) {
          const lastCommitTime = new Date(prDetails.head.repo.pushed_at).getTime();
          if (lastCommitTime > createdAt) {
            const codingTimeHours = (lastCommitTime - createdAt) / (1000 * 60 * 60);
            codingTimes.push(codingTimeHours);

            if (author) {
              contributors[author].codingTime.push(codingTimeHours);
            }
          } else {
            console.log(`Skipping PR ${pr.number} with unusual time sequence`);
          }
        }

        if (createdAt && firstReview) {
          const pickupTimeHours = (firstReview - createdAt) / (1000 * 60 * 60);
          if (pickupTimeHours > 0) {
            pickupTimes.push(pickupTimeHours);

            if (author) {
              contributors[author].pickupTime.push(pickupTimeHours);
            }
          }
        }

        if (firstReview && mergedAt) {
          const reviewTimeHours = (mergedAt - firstReview) / (1000 * 60 * 60);
          if (reviewTimeHours > 0) {
            reviewTimes.push(reviewTimeHours);

            const firstReviewer = reviews.length > 0 ? reviews[0].user?.login : null;
            if (firstReviewer && contributors[firstReviewer]) {
              contributors[firstReviewer].reviewTime.push(reviewTimeHours);
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch review for PR ${pr.number}`, err);
      }
    }

    try {
      const statsRes = await githubApi.get(`/repos/${repoOwner}/${repo}/stats/contributors`);
      const stats = statsRes.data;

      if (Array.isArray(stats)) {
        for (const stat of stats) {
          const login = stat.author?.login;
          if (login) {
            if (!contributors[login]) {
              contributors[login] = {
                prsCreated: 0,
                prsReviewed: 0,
                codingTime: [],
                pickupTime: [],
                reviewTime: [],
                commits: 0
              };
            }
            contributors[login].commits += stat.total;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch contributor stats', err);
    }

    const average = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const contributorMetrics = Object.entries(contributors).map(([login, data]) => ({
      login,
      prsCreated: data.prsCreated,
      prsReviewed: data.prsReviewed,
      avgCodingTime: average(data.codingTime),
      avgPickupTime: average(data.pickupTime),
      avgReviewTime: average(data.reviewTime),
      commits: data.commits
    }));

    res.status(StatusCodes.OK).json({
      openPrsAge,
      pushFrequency,
      reopenedCount,
      codingTime: average(codingTimes),
      pickupTime: average(pickupTimes),
      reviewTime: average(reviewTimes),
      commitActivity: commitActivityData,
      contributors: contributorMetrics
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: `Error fetching metrics`
    });
  }
}

export default handler;
