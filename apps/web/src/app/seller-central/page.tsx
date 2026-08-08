'use client';

import { useState, useEffect } from 'react';

interface SellerCentralAccount {
  id: string;
  accountName: string;
  marketplace: string;
  status: 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED';
  lastSyncAt: string | null;
  createdAt: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export default function SellerCentralPage() {
  const [accounts, setAccounts] = useState<SellerCentralAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/seller-central/connect');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(accountId: string) {
    setSyncing(accountId);
    setSyncResult(null);

    try {
      const res = await fetch('/api/seller-central/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, daysBack: 30 }),
      });

      const result = await res.json();
      setSyncResult(result);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncResult({ success: false, synced: 0, failed: 0, errors: ['Sync failed'] });
    } finally {
      setSyncing(null);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'DISCONNECTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seller Central Integration</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showAddForm && (
        <AddAccountForm
          onAdded={() => {
            setShowAddForm(false);
            fetchAccounts();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {syncResult && (
        <div className={`mb-6 p-4 rounded ${syncResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className="font-semibold mb-2">
            {syncResult.success ? 'Sync Complete' : 'Sync Failed'}
          </h3>
          <p>Synced: {syncResult.synced} | Failed: {syncResult.failed}</p>
          {syncResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600">
              {syncResult.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-4">
        {accounts.length === 0 ? (
          <p className="text-gray-500">No Seller Central accounts connected.</p>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{account.accountName}</h3>
                <p className="text-sm text-gray-500">
                  {account.marketplace} • Created {new Date(account.createdAt).toLocaleDateString()}
                </p>
                {account.lastSyncAt && (
                  <p className="text-xs text-gray-400">
                    Last sync: {new Date(account.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(account.status)}`}>
                  {account.status}
                </span>
                <button
                  onClick={() => handleSync(account.id)}
                  disabled={syncing === account.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {syncing === account.id ? 'Syncing...' : 'Sync Orders'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AddAccountForm({ onAdded, onCancel }: { onAdded: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    accountName: '',
    marketplace: 'US',
    lwaClientId: '',
    lwaClientSecret: '',
    lwaRefreshToken: '',
    spApiRoleArn: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/seller-central/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add account');
      }

      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-6 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold mb-4">Add Seller Central Account</h2>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Account Name</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Marketplace</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.marketplace}
            onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="JP">Japan</option>
            <option value="AU">Australia</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">LWA Client ID</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={formData.lwaClientId}
            onChange={(e) => setFormData({ ...formData, lwaClientId: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">LWA Client Secret</label>
          <input
            type="password"
            required
            className="w-full p-2 border rounded"
            value={formData.lwaClientSecret}
            onChange={(e) => setFormData({ ...formData, lwaClientSecret: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">LWA Refresh Token</label>
          <input
            type="password"
            required
            className="w-full p-2 border rounded"
            value={formData.lwaRefreshToken}
            onChange={(e) => setFormData({ ...formData, lwaRefreshToken: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from Amazon Seller Central → Apps → Manage Your Apps
          </p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">SP-API IAM Role ARN (Optional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.spApiRoleArn}
            onChange={(e) => setFormData({ ...formData, spApiRoleArn: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? 'Adding...' : 'Add Account'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
