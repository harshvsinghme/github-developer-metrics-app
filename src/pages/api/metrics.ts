import { fetchCommitActivity, fetchIssueEvents, fetchOpenPRs } from '@/lib/github';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const openPRs = await fetchOpenPRs();
    const commitActivity = await fetchCommitActivity();
    const issueEvents = await fetchIssueEvents();

    const openPrsAge = openPRs.length
      ? openPRs.reduce((sum: number, pr: { created_at: Date }) => {
          const createdAt = new Date(pr.created_at).getTime();
          const now = new Date().getTime();
          return sum + (now - createdAt) / (1000 * 60 * 60 * 24); // days
        }, 0) / openPRs.length
      : 0;

    const pushFrequency =
      commitActivity.reduce(
        (sum: number, week: { days: number[]; total: number; week: number }) => sum + week.total,
        0
      ) / commitActivity.length;

    const reopenedCount = issueEvents.filter(
      (e: { event: string }) => e.event === 'reopened'
    ).length;

    res.status(200).json({
      openPrsAge,
      pushFrequency,
      reopenedCount,
      codingTime: Math.random() * 5 + 1, // Simulated
      pickupTime: Math.random() * 24,
      reviewTime: Math.random() * 5
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
}
