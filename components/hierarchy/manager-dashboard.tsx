'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Eye,
  MessageSquare,
  BarChart3,
  Shield,
  ChevronRight
} from 'lucide-react';
import { getTeamStats, getDirectReports, getManagerPermissions } from '@/lib/hierarchy-service';
import { getDemoUser, getDemoTeamStats, demoUsers } from '@/lib/demo-data';
import type { User, TeamStats, ManagerPermissions } from '@/types/index';
import Link from 'next/link';

interface ManagerDashboardProps {
  manager: User;
  onViewTeamMember?: (employee: User) => void;
}

interface TeamMemberCardProps {
  employee: User;
  onView?: (employee: User) => void;
  canViewReports: boolean;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ employee, onView, canViewReports }) => {
  const getWellnessColor = (level: number) => {
    if (level >= 8) return 'text-green-600 bg-green-50';
    if (level >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-sm text-gray-600">{employee.position || 'Employee'}</p>
              {employee.department && (
                <Badge variant="outline" className="text-xs mt-1">
                  {employee.department}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Wellness indicator placeholder - would be populated with real data */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">7.2/10</div>
              <div className="text-xs text-gray-500">Wellness</div>
            </div>
            
            {canViewReports && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView?.(employee)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  manager, 
  onViewTeamMember 
}) => {
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [directReports, setDirectReports] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<ManagerPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setLoading(true);
        
        // Get manager permissions
        const managerPermissions = getManagerPermissions(manager);
        setPermissions(managerPermissions);
        
        // Try to get real data, fallback to demo data
        try {
          const stats = await getTeamStats(manager.id);
          setTeamStats(stats);
          
          const reports = await getDirectReports(manager.id);
          setDirectReports(reports);
        } catch (error) {
          console.log('Using demo data for manager dashboard');
          // Use demo data
          setTeamStats(getDemoTeamStats());
          setDirectReports(demoUsers.filter(u => u.manager_id === 'demo-manager-1'));
        }
        
      } catch (error) {
        console.error('Error fetching manager data:', error);
        // Fallback to demo data
        setTeamStats(getDemoTeamStats());
        setDirectReports(demoUsers.filter(u => u.manager_id === 'demo-manager-1'));
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [manager.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Manager Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {manager.first_name}'s Team Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your team's wellness and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800">
            {manager.role.toUpperCase()}
          </Badge>
          {manager.is_department_head && (
            <Badge className="bg-purple-100 text-purple-800">
              <Shield className="h-3 w-3 mr-1" />
              Dept Head
            </Badge>
          )}
        </div>
      </div>

      {/* Team Stats Cards */}
      {teamStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {teamStats.direct_reports}
                  </div>
                  <p className="text-sm text-gray-600">Direct Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {teamStats.avg_team_wellness}/10
                  </div>
                  <p className="text-sm text-gray-600">Team Wellness</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {teamStats.high_risk_team_members}
                  </div>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {teamStats.recent_reports_count}
                  </div>
                  <p className="text-sm text-gray-600">Recent Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissions?.can_view_team_reports && (
              <Link href="/manager/team-reports">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Team Reports
                </Button>
              </Link>
            )}
            
            {permissions?.can_access_analytics && (
              <Link href="/manager/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Team Analytics
                </Button>
              </Link>
            )}
            
            <Link href="/manager/org-chart">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Organization Chart
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Direct Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Direct Reports ({directReports.length})</span>
            </div>
            {permissions?.can_manage_team_members && (
              <Link href="/manager/manage-team">
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Manage Team
                </Button>
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {directReports.length > 0 ? (
            <div className="space-y-3">
              {directReports.map((employee) => (
                <TeamMemberCard
                  key={employee.id}
                  employee={employee}
                  onView={onViewTeamMember}
                  canViewReports={permissions?.can_view_team_reports || false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Direct Reports</h3>
              <p className="text-gray-600">
                You don't have any direct reports assigned yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Departments */}
      {teamStats && teamStats.team_departments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Team Departments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamStats.team_departments.map((dept) => (
                <Badge key={dept} variant="secondary" className="px-3 py-1">
                  {dept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Summary */}
      {permissions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Your Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  permissions.can_view_direct_reports ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>View Direct Reports</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  permissions.can_view_team_reports ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>View Team Reports</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  permissions.can_view_subordinate_teams ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>View Sub-teams</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  permissions.can_approve_leaves ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>Approve Leaves</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  permissions.can_manage_team_members ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>Manage Team</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  permissions.can_access_analytics ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>Access Analytics</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};