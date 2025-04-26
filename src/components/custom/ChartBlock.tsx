import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ChartBlockProps {
  labels: string[];
  data: number[];
}

export default function ChartBlock({ labels, data }: ChartBlockProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Commits',
        data,
        fill: false,
        backgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Weekly Commit Activity'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Commits'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Week'
        }
      }
    }
  };

  return (
    <div>
      {labels.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <p className="text-center text-gray-500 py-10">No commit data available</p>
      )}
    </div>
  );
}
