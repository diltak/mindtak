'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  Crown, 
  Building,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function TestHierarchyPage() {
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [testType, setTestType] = useState('all');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHierarchy = async () => {
    if (!userId.trim() || !companyId.trim()) {
      alert('Please enter both User ID and Company ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/hierarchy/test?userId=${userId}&companyId=${companyId}&testType=${testType}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to test hierarchy system' });
    } finally {
      setLoading(false);
    }
  };

  const testAccess = async () => {
    if (!userId.trim() || !targetUserId.trim()) {
      alert('Please enter both User ID and Target User ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/hierarchy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId, companyId })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to test access permissions' });
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!result) return null;

    if (result.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 mt-2">{result.error}</p>
        </div>
      );
    }

    if (result.canAccess !== undefined) {
      // Access test result
      return (
        <div className={`border rounded-lg p-4 ${
          result.canAccess 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center space-x-2 ${
            result.canAccess ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.canAccess ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">Access Test Result</span>
          </div>
          <p className={`mt-2 ${
            result.canAccess ? 'text-green-600' : 'text-red-600'
          }`}>
            {result.message}
          </p>
        </div>
      );
    }

    // Hierarchy test results
    return (
      <div className="space-y-6">
        {result.results?.directReports && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Direct Reports ({result.results.directReports.count})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.results.directReports.employees.length > 0 ? (
                <div className="space-y-2">
                  {result.results.directReports.employees.map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{emp.name}</h4>
                        <p className="text-sm text-gray-600">{emp.position} - {emp.department}</p>
                      </div>
                      <Badge variant="outline">{emp.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No direct reports found</p>
              )}
            </CardContent>
          </Card>
        )}

        {result.results?.teamStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Team Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {result.results.teamStats.team_size}
                  </div>
                  <div className="text-sm text-blue-600">Team Size</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {result.results.teamStats.avg_team_wellness}/10
                  </div>
                  <div className="text-sm text-green-600">Avg Wellness</div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {result.results.teamStats.high_risk_team_members}
                  </div>
                  <div className="text-sm text-red-600">High Risk</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {result.results.teamStats.recent_reports_count}
                  </div>
                  <div className="text-sm text-purple-600">Recent Reports</div>
                </div>
              </div>
              
              {result.results.teamStats.team_departments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Departments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.results.teamStats.team_departments.map((dept: string) => (
                      <Badge key={dept} variant="secondary">
                        <Building className="h-3 w-3 mr-1" />
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {result.results?.permissions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Manager Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.results.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      value ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result.results?.hierarchyAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Hierarchy Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.results.hierarchyAnalytics.team_wellness_comparison.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Team Wellness Comparison:</h4>
                    <div className="space-y-2">
                      {result.results.hierarchyAnalytics.team_wellness_comparison.map((team: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{team.team_name}</span>
                            <span className="text-sm text-gray-600 ml-2">({team.team_size} members)</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{team.avg_wellness}/10</div>
                            <div className="text-xs text-red-600">{team.high_risk_count} high risk</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hierarchy System Test</h1>
        <p className="text-gray-600">Test the organizational hierarchy features and permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">User ID (Manager)</label>
                <Input
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company ID</label>
                <Input
                  placeholder="Enter company ID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Type</label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    <SelectItem value="directReports">Direct Reports</SelectItem>
                    <SelectItem value="hierarchy">Team Hierarchy</SelectItem>
                    <SelectItem value="teamStats">Team Statistics</SelectItem>
                    <SelectItem value="permissions">Permissions</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={testHierarchy} disabled={loading} className="w-full">
                {loading ? 'Testing...' : 'Test Hierarchy System'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Permission Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target User ID</label>
                <Input
                  placeholder="Enter target user ID to test access"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                />
              </div>

              <Button onClick={testAccess} disabled={loading} className="w-full" variant="outline">
                {loading ? 'Testing...' : 'Test Access Permissions'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {renderResults()}
                  
                  <details className="mt-6">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700">
                      Raw JSON Response
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Run a test to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}