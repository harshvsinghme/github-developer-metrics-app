interface ContributorTableProps {
  contributors: {
    login: string;
    prsCreated: number;
    prsReviewed: number;
    avgCodingTime: number;
    avgPickupTime: number;
    avgReviewTime: number;
    commits: number;
  }[];
}

export default function ContributorTable({ contributors }: ContributorTableProps) {
  const sortedContributors = [...contributors].sort((a, b) => b.commits - a.commits);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contributor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commits
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PRs Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PRs Reviewed
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg. Coding Time (hrs)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg. Pickup Time (hrs)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg. Review Time (hrs)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedContributors.map((contributor) => (
            <tr key={contributor.login}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{contributor.login}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contributor.commits}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contributor.prsCreated}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contributor.prsReviewed}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contributor.avgCodingTime ? contributor.avgCodingTime.toFixed(2) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contributor.avgPickupTime ? contributor.avgPickupTime.toFixed(2) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contributor.avgReviewTime ? contributor.avgReviewTime.toFixed(2) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
