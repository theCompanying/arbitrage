'use client';

import React, { useState, useEffect } from 'react';

interface DiscoveryResult {
  id: string;
  title: string;
  url: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  bsr?: number;
  category?: string;
  estimatedMargin: number;
  estimatedProfit: number;
  score: number;
  status: string;
  discoveredAt: string;
  reviewedAt?: string;
  rule: { name: string };
  product?: { id: string; status: string };
}

interface Stats {
  totalResults: number;
  newResults: number;
  importedResults: number;
  rejectedResults: number;
}

export default function DiscoveryResults() {
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
    fetchStats();
  }, [filter, statusFilter]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/discovery/results?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/discovery/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAction = async (resultId: string, action: 'import' | 'reject') => {
    setProcessing(resultId);
    try {
      const res = await fetch('/api/discovery/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resultId }),
      });

      if (res.ok) {
        await fetchResults();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error processing result:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm('Delete this result?')) return;
    try {
      const res = await fetch(`/api/discovery/results?resultId=${resultId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchResults();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  const filteredResults = results.filter(r =>
    r.title.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'REVIEWING': return 'bg-yellow-100 text-yellow-800';
      case 'IMPORTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DUPLICATE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 font-bold';
    if (score >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Discovery Results</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{stats.totalResults}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-500">New</div>
            <div className="text-2xl font-bold text-blue-600">{stats.newResults}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-500">Imported</div>
            <div className="text-2xl font-bold text-green-600">{stats.importedResults}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-500">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedResults}</div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by title..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="IMPORTED">Imported</option>
          <option value="REJECTED">Rejected</option>
          <option value="DUPLICATE">Duplicate</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map(result => (
            <div
              key={result.id}
              className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{result.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                    {result.product && (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        Imported
                      </span>
                    )}
                  </div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {result.url}
                  </a>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span>Price: ${result.price}</span>
                    {result.rating && <span>Rating: {result.rating}⭐</span>}
                    {result.reviewCount && <span>Reviews: {result.reviewCount}</span>}
                    {result.bsr && <span>BSR: {result.bsr}</span>}
                    <span className="text-green-600">Margin: {result.estimatedMargin}%</span>
                    <span className="text-green-600">Profit: ${result.estimatedProfit}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Score: </span>
                    <span className={getScoreColor(result.score)}>{result.score}/100</span>
                    <span className="ml-4">Rule: {result.rule.name}</span>
                    <span className="ml-4">Discovered: {new Date(result.discoveredAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {result.status === 'NEW' && (
                    <>
                      <button
                        onClick={() => handleAction(result.id, 'import')}
                        disabled={processing === result.id}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing === result.id ? '...' : 'Import'}
                      </button>
                      <button
                        onClick={() => handleAction(result.id, 'reject')}
                        disabled={processing === result.id}
                        className="px-3 py-1.5 text-sm border rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No discovery results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
