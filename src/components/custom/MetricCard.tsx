interface MetricCardProps {
  title: string;
  value: string | number;
}

export default function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold mt-4">{value}</p>
    </div>
  );
}
