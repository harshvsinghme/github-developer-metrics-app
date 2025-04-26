import ChartBlock from '@/components/custom/ChartBlock';
import Loader from '@/components/custom/Loader';
import MetricCard from '@/components/custom/MetricCard';
import { useUserStore } from '@/store/useUserStore';
import localApi from '@/utils/axiosInstance';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const { email } = useUserStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      router.replace('/');
      return;
    }

    const fetchMetrics = async () => {
      try {
        NProgress.start();
        const { data } = await localApi.get('/api/metrics');
        setMetrics(data);
      } catch {
        Swal.fire({
          icon: 'error',
          title: 'Fetch Error',
          text: 'Failed to load metrics. Try again later.'
        });
      } finally {
        NProgress.done();
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [email, router]);

  if (loading) return <Loader />;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Developer Metrics Dashboard</h1>
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
        <ChartBlock
          labels={metrics?.commitActivity?.labels ?? []}
          data={metrics?.commitActivity?.values ?? []}
        />
      </div>
    </div>
  );
}
