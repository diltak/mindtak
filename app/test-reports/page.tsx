'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestReportsPage() {
  const [companyId, setCompanyId] = useState('');
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testReports = async () => {
    if (!companyId.trim()) {
      alert('Please enter a company ID');
      return;
    }

    setLoading(true);
    try {
      const url = `/api/reports/recent?companyId=${companyId}&days=7${userId ? `&userId=${userId}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to fetch reports' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Reports Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Input
              placeholder="Enter company ID (required)"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
            <Input
              placeholder="Enter user ID (optional - for personal history)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Button onClick={testReports} disabled={loading}>
              {loading ? 'Loading...' : 'Test Reports & Personal History'}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}