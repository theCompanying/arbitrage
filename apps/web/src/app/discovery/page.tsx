import Link from 'next/link';

export default function DiscoveryPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Product Discovery</h1>
      <p className="text-gray-600 mb-8">
        Automated product discovery helps you find profitable arbitrage opportunities
        by scanning AliExpress and scoring products based on your criteria.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/discovery/rules"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Discovery Rules</h2>
          <p className="text-gray-600">
            Create and manage automated scanning rules. Set criteria for margin,
            BSR, reviews, and keywords to find winning products.
          </p>
          <div className="mt-4 text-blue-600">Manage Rules →</div>
        </Link>

        <Link
          href="/discovery/results"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Discovery Results</h2>
          <p className="text-gray-600">
            Review discovered products, compare opportunities, and import
            promising candidates to your product pipeline.
          </p>
          <div className="mt-4 text-blue-600">View Results →</div>
        </Link>
      </div>

      <div className="mt-8 border rounded-lg p-6 bg-gray-50">
        <h3 className="font-semibold mb-2">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Create a discovery rule with your criteria (margin, BSR, reviews, etc.)</li>
          <li>Run a manual scan or let it run automatically on your schedule</li>
          <li>Review discovered products and their opportunity scores</li>
          <li>Import promising products to your research pipeline</li>
          <li>Track which rules find the best opportunities</li>
        </ol>
      </div>
    </div>
  );
}
