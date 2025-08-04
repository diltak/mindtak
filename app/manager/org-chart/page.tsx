'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import { OrgChart } from '@/components/hierarchy/org-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building, 
  Crown, 
  Shield,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { getTeamHierarchy, getManagerPermissions } from '@/lib/hierarchy-service';
import type { User, HierarchyNode } from '@/types/index';
import { toast } from 'sonner';

export default function OrgChartPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWellnessIndicators, setShowWellnessIndicators] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // For demo mode, allow access without strict authentication
    if (!userLoading) {
      if (!user) {
        // Create demo user for org chart access
        const demoUser = {
          id: 'demo-manager-1',
          role: 'manager' as const,
          company_id: 'demo-company',
          hierarchy_level: 3,
          can_view_team_reports: true
        };
      }
      fetchOrgChart();
    }
  }, [user, userLoading, router]);

  const fetchOrgChart = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // For managers, show their team hierarchy
      // For HR/Admin, show company-wide hierarchy (would need additional logic)
      const teamHierarchy = await getTeamHierarchy(user.id, 4);
      setHierarchy(teamHierarchy);
      
    } catch (error) {
      console.error('Error fetching org chart:', error);
      toast.error('Failed to load organization chart');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    // Could open a modal or navigate to user profile
    toast.info(`Selected: ${selectedUser.first_name} ${selectedUser.last_name}`);
  };

  const exportOrgChart = () => {
    // Implementation for exporting org chart
    toast.info('Exporting organization chart...');
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user || undefined} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const permissions = getManagerPermissions(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Chart</h1>
            <p className="text-gray-600 mt-2">
              View your team structure and reporting relationships
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button variant="outline" onClick={fetchOrgChart}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportOrgChart}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>View Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="wellness-indicators"
                  checked={showWellnessIndicators}
                  onCheckedChange={setShowWellnessIndicators}
                />
                <label htmlFor="wellness-indicators" className="text-sm font-medium">
                  Show Wellness Indicators
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="compact-view"
                  checked={compactView}
                  onCheckedChange={setCompactView}
                />
                <label htmlFor="compact-view" className="text-sm font-medium">
                  Compact View
                </label>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span>Executive</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>HR</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Manager</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4 text-gray-600" />
                  <span>Employee</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {hierarchy.reduce((total, node) => {
                      const countNodes = (n: HierarchyNode): number => {
                        return 1 + n.children.reduce((sum, child) => sum + countNodes(child), 0);
                      };
                      return total + countNodes(node);
                    }, 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {hierarchy.filter(node => 
                      node.user.role === 'manager' || node.user.role === 'admin'
                    ).length}
                  </div>
                  <p className="text-sm text-gray-600">Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {[...new Set(hierarchy.map(node => node.user.department).filter(Boolean))].length}
                  </div>
                  <p className="text-sm text-gray-600">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.max(...hierarchy.map(node => {
                      const getDepth = (n: HierarchyNode): number => {
                        return n.children.length > 0 
                          ? 1 + Math.max(...n.children.map(getDepth))
                          : 1;
                      };
                      return getDepth(node);
                    }), 0)}
                  </div>
                  <p className="text-sm text-gray-600">Hierarchy Levels</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Chart */}
        <Card>
          <CardContent className="p-6">
            <OrgChart
              hierarchy={hierarchy}
              onUserSelect={handleUserSelect}
              showWellnessIndicators={showWellnessIndicators}
              compactView={compactView}
            />
          </CardContent>
        </Card>

        {/* Selected User Info */}
        {selectedUser && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Selected Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-gray-600">{selectedUser.position}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{selectedUser.role}</Badge>
                    {selectedUser.department && (
                      <Badge variant="secondary">{selectedUser.department}</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {permissions.can_view_team_reports && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/manager/team-member/${selectedUser.id}`)}
                    >
                      View Reports
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Access Level Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Your Access Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Permissions:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• View direct reports: {permissions.can_view_direct_reports ? '✅' : '❌'}</li>
                  <li>• View team reports: {permissions.can_view_team_reports ? '✅' : '❌'}</li>
                  <li>• View subordinate teams: {permissions.can_view_subordinate_teams ? '✅' : '❌'}</li>
                  <li>• Access analytics: {permissions.can_access_analytics ? '✅' : '❌'}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Hierarchy Info:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Your level: {user.hierarchy_level || 'Not set'}</li>
                  <li>• Access depth: {permissions.hierarchy_access_level} levels</li>
                  <li>• Department head: {user.is_department_head ? 'Yes' : 'No'}</li>
                  <li>• Skip-level access: {user.skip_level_access ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}