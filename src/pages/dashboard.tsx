import ChartBlock from '@/components/custom/ChartBlock';
import ContributorTable from '@/components/custom/ContributorTable';
import Loader from '@/components/custom/Loader';
import MetricCard from '@/components/custom/MetricCard';
import { useUserStore } from '@/store/useUserStore';
import localApi from '@/utils/axiosInstance';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Contributor {
  login: string;
  prsCreated: number;
  prsReviewed: number;
  avgCodingTime: number;
  avgPickupTime: number;
  avgReviewTime: number;
  commits: number;
}

interface MetricsData {
  openPrsAge: number;
  pushFrequency: number;
  reopenedCount: number;
  codingTime: number;
  pickupTime: number;
  reviewTime: number;
  commitActivity: {
    labels: string[];
    values: number[];
  };
  contributors: Contributor[];
}

export default function Dashboard() {
  const { email } = useUserStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('repository');
  const [selectedRepo, setSelectedRepo] = useState(process.env.NEXT_PUBLIC_REPO_NAME || '');

  const repos = [process.env.NEXT_PUBLIC_REPO_NAME];

  useEffect(() => {
    if (!email) {
      router.replace('/');
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await localApi.get(`/api/metrics?repo=${selectedRepo}`);
        console.log(response);
        setMetrics(response.data);
      } catch (error: unknown) {
        console.error(error);

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          if (status === 404) {
            Swal.fire({
              icon: 'error',
              title: 'Fetch Error',
              text: 'Repository not found. Please check repo name'
            });
            return;
          }
        }

        Swal.fire({
          icon: 'error',
          title: 'Fetch Error',
          text: 'Something went wrong fetching metrics'
        });
        setMetrics({
          openPrsAge: 0,
          pushFrequency: 0,
          reopenedCount: 0,
          codingTime: 0,
          pickupTime: 0,
          reviewTime: 0,
          commitActivity: {
            labels: [],
            values: []
          },
          contributors: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [email, router, selectedRepo]);

  if (loading) return <Loader />;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Developer Metrics Dashboard</h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <div className="mb-4 sm:mb-0 sm:mr-6">
          <label htmlFor="repo-select" className="mr-2 font-medium">
            Repository:
          </label>
          <select
            id="repo-select"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="p-2 rounded border"
          >
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex">
          <button
            className={`mr-4 px-4 py-2 rounded ${activeView === 'repository' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveView('repository')}
          >
            Repository Overview
          </button>
          <button
            className={`px-4 py-2 rounded ${activeView === 'contributors' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveView('contributors')}
          >
            Contributor Metrics
          </button>
        </div>
      </div>

      {activeView === 'repository' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <MetricCard
              title="Average Age of Open PRs (days)"
              description="measures how long, on average, open PRs have been waiting"
              value={metrics?.openPrsAge?.toFixed(2) ?? 0}
            />
            <MetricCard
              title="Average Weekly Commit Frequency"
              description="shows the average number of commits per week"
              value={metrics?.pushFrequency?.toFixed(2) ?? 0}
            />
            <MetricCard
              title="Total Reopened Issues/PRs"
              description="count of how many issues or PRs have been reopened"
              value={metrics?.reopenedCount ?? 0}
            />
            <MetricCard
              title="Average Coding Time per PR (hrs)"
              description="measures the average time spent coding per PR"
              value={metrics?.codingTime?.toFixed(2) ?? 0}
            />
            <MetricCard
              title="Average PR Pickup Time (hrs)"
              description="measures how long it takes, on average, for a PR to receive its first review after creation"
              value={metrics?.pickupTime?.toFixed(2) ?? 0}
            />
            <MetricCard
              title="Average PR Review Time (hrs)"
              description="measures how long it takes, on average, for a PR to be merged after the first review"
              value={metrics?.reviewTime?.toFixed(2) ?? 0}
            />
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Weekly Commit Activity</h2>
            <ChartBlock
              labels={metrics?.commitActivity?.labels ?? []}
              data={metrics?.commitActivity?.values ?? []}
            />
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Contributor Metrics</h2>
          {metrics?.contributors && metrics.contributors.length > 0 ? (
            <ContributorTable contributors={metrics.contributors} />
          ) : (
            <p className="text-gray-500">No contributor data available for this repository.</p>
          )}
        </div>
      )}
    </div>
  );
}
