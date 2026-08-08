'use client';

import React, { useState, useEffect } from 'react';

interface DiscoveryRule {
  id: string;
  name: string;
  description?: string;
  minMargin?: number;
  maxBsr?: number;
  maxReviews?: number;
  minRating?: number;
  priceRange?: { min: number; max: number };
  categories: string[];
  keywords: string[];
  excludeKeywords: string[];
  enabled: boolean;
  scanFrequency: string;
  lastScanAt?: string;
  nextScanAt?: string;
  productsFound: number;
  productsImported: number;
  _count?: { results: number };
}

interface DiscoveryRuleForm {
  name: string;
  description: string;
  minMargin: string;
  maxBsr: string;
  maxReviews: string;
  minRating: string;
  categories: string;
  keywords: string;
  excludeKeywords: string;
  scanFrequency: string;
}

const initialForm: DiscoveryRuleForm = {
  name: '',
  description: '',
  minMargin: '',
  maxBsr: '',
  maxReviews: '',
  minRating: '',
  categories: '',
  keywords: '',
  excludeKeywords: '',
  scanFrequency: 'daily',
};

export default function DiscoveryRules() {
  const [rules, setRules] = useState<DiscoveryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DiscoveryRuleForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scanning, setScanning] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/discovery/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...form,
      minMargin: form.minMargin ? parseFloat(form.minMargin) : null,
      maxBsr: form.maxBsr ? parseInt(form.maxBsr) : null,
      maxReviews: form.maxReviews ? parseInt(form.maxReviews) : null,
      minRating: form.minRating ? parseFloat(form.minRating) : null,
      categories: form.categories.split(',').map(s => s.trim()).filter(Boolean),
      keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
      excludeKeywords: form.excludeKeywords.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const url = editingId 
        ? `/api/discovery/rules/${editingId}`
        : '/api/discovery/rules';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchRules();
        setForm(initialForm);
        setShowForm(false);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;

    try {
      const res = await fetch(`/api/discovery/rules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleEdit = (rule: DiscoveryRule) => {
    setForm({
      name: rule.name,
      description: rule.description || '',
      minMargin: rule.minMargin?.toString() || '',
      maxBsr: rule.maxBsr?.toString() || '',
      maxReviews: rule.maxReviews?.toString() || '',
      minRating: rule.minRating?.toString() || '',
      categories: rule.categories.join(', '),
      keywords: rule.keywords.join(', '),
      excludeKeywords: rule.excludeKeywords.join(', '),
      scanFrequency: rule.scanFrequency,
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleScan = async (ruleId: string) => {
    setScanning(ruleId);
    try {
      const res = await fetch('/api/discovery/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Scan complete! Found ${data.productsFound} products.`);
        await fetchRules();
      }
    } catch (error) {
      console.error('Error scanning:', error);
      alert('Scan failed');
    } finally {
      setScanning(null);
    }
  };

  const handleToggleEnabled = async (rule: DiscoveryRule) => {
    try {
      const res = await fetch(`/api/discovery/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });

      if (res.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Discovery Rules</h1>
        <button
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Rule
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Rule' : 'New Discovery Rule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., High Margin Home Products"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Margin (%)</label>
                  <input
                    type="number"
                    value={form.minMargin}
                    onChange={e => setForm({ ...form, minMargin: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max BSR</label>
                  <input
                    type="number"
                    value={form.maxBsr}
                    onChange={e => setForm({ ...form, maxBsr: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Reviews</label>
                  <input
                    type="number"
                    value={form.maxReviews}
                    onChange={e => setForm({ ...form, maxReviews: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.minRating}
                    onChange={e => setForm({ ...form, minRating: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="4.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categories (comma-separated)</label>
                <input
                  type="text"
                  value={form.categories}
                  onChange={e => setForm({ ...form, categories: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="home-garden, sports-entertainment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={form.keywords}
                  onChange={e => setForm({ ...form, keywords: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="LED, solar, wireless"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Exclude Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={form.excludeKeywords}
                  onChange={e => setForm({ ...form, excludeKeywords: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="battery, replacement, parts"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Scan Frequency</label>
                <select
                  value={form.scanFrequency}
                  onChange={e => setForm({ ...form, scanFrequency: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`border rounded-lg p-4 ${!rule.enabled ? 'bg-gray-50 opacity-75' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{rule.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rule.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
                {rule.description && (
                  <p className="text-gray-600 text-sm mt-1">{rule.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                  {rule.minMargin && (
                    <span>Margin ≥ {rule.minMargin}%</span>
                  )}
                  {rule.maxBsr && <span>BSR ≤ {rule.maxBsr}</span>}
                  {rule.maxReviews && <span>Reviews ≤ {rule.maxReviews}</span>}
                  {rule.minRating && <span>Rating ≥ {rule.minRating}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {rule.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-gray-500">
                  <div>Found: {rule.productsFound}</div>
                  <div>Imported: {rule.productsImported}</div>
                  <div>Results: {rule._count?.results || 0}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {rule.nextScanAt && (
                    <div>Next: {new Date(rule.nextScanAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => handleScan(rule.id)}
                disabled={scanning === rule.id || !rule.enabled}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {scanning === rule.id ? 'Scanning...' : 'Scan Now'}
              </button>
              <button
                onClick={() => handleToggleEnabled(rule)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                {rule.enabled ? 'Pause' : 'Enable'}
              </button>
              <button
                onClick={() => handleEdit(rule)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="px-3 py-1.5 text-sm border rounded hover:bg-red-50 text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No discovery rules yet. Create one to start finding products automatically.
          </div>
        )}
      </div>
    </div>
  );
}
