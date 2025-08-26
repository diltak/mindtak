'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Download,
  Loader2,
  Target,
  Clock,
  UserCheck,
  Building,
  ArrowRight,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardStats, MentalHealthReport, User } from '@/types/index';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withAuth } from '@/components/auth/with-auth';

function EmployerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<MentalHealthReport[]>([]);
  const [employees, setEmployees] = useState<Array<{
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    department?: string;
    position?: string;
    status?: string;
    company_id?: string;
    role?: string;
    [key: string]: any;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!userLoading && user && user.company_id) {
        initializeDashboard();
    }
  }, [user, userLoading]);

  const initializeDashboard = async () => {
    if (!user?.company_id) {
      toast.error('Company information not found.');
      return;
    }

    try {
      setLoading(true);
      await Promise.all([
        loadEmployees(),
        loadDashboardStats(),
        loadRecentReports()
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!user?.company_id) return;

    try {
      const employeesQuery = query(
        collection(db, 'users'),
        where('company_id', '==', user.company_id),
        where('role', '==', 'employee')
      );

      const unsubscribe = onSnapshot(employeesQuery, (snapshot) => {
        const employeesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{
          id: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          department?: string;
          position?: string;
          status?: string;
          [key: string]: any;
        }>;
        setEmployees(employeesData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDashboardStats = async () => {
    if (!user?.company_id) return;

    try {
      // Get all company users (employees, managers, etc.)
      const allUsersQuery = query(
        collection(db, 'users'),
        where('company_id', '==', user.company_id)
      );
      const allUsersSnapshot = await getDocs(allUsersQuery);
      const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      
      // Filter employees
      const employees = allUsers.filter(u => u.role === 'employee');
      const managers = allUsers.filter(u => u.role === 'manager');
      const totalEmployees = employees.length;

      // Get active sessions count
      const activeSessionsQuery = query(
        collection(db, 'chat_sessions'),
        where('company_id', '==', user.company_id),
        where('status', '==', 'active')
      );
      const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
      const activeSessions = activeSessionsSnapshot.size;

      // Get all reports for comprehensive analysis
      const reportsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const allReports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MentalHealthReport[];

      // Filter reports by date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentReports = allReports.filter(report => 
        new Date(report.created_at) >= thirtyDaysAgo
      );
      const weeklyReports = allReports.filter(report => 
        new Date(report.created_at) >= sevenDaysAgo
      );

      const completedReports = recentReports.length;

      // Calculate comprehensive wellness metrics
      let totalWellnessScore = 0;
      let totalMoodScore = 0;
      let totalStressScore = 0;
      let totalEnergyScore = 0;
      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let lowRiskCount = 0;

      recentReports.forEach(report => {
        totalWellnessScore += report.overall_wellness || 0;
        totalMoodScore += report.mood_rating || 0;
        totalStressScore += report.stress_level || 0;
        totalEnergyScore += report.energy_level || 0;

        switch (report.risk_level) {
          case 'high':
            highRiskCount++;
            break;
          case 'medium':
            mediumRiskCount++;
            break;
          case 'low':
            lowRiskCount++;
            break;
        }
      });

      const averageWellnessScore = completedReports > 0 ? totalWellnessScore / completedReports : 0;
      const averageMoodScore = completedReports > 0 ? totalMoodScore / completedReports : 0;
      const averageStressScore = completedReports > 0 ? totalStressScore / completedReports : 0;
      const averageEnergyScore = completedReports > 0 ? totalEnergyScore / completedReports : 0;

      // Calculate trend (compare last 7 days vs previous 7 days)
      const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const previousWeekReports = allReports.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= previousWeekStart && reportDate < sevenDaysAgo;
      });

      const currentWeekAvg = weeklyReports.length > 0 
        ? weeklyReports.reduce((sum, r) => sum + (r.overall_wellness || 0), 0) / weeklyReports.length 
        : 0;
      const previousWeekAvg = previousWeekReports.length > 0 
        ? previousWeekReports.reduce((sum, r) => sum + (r.overall_wellness || 0), 0) / previousWeekReports.length 
        : 0;

      let wellnessTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (currentWeekAvg > previousWeekAvg + 0.5) {
        wellnessTrend = 'improving';
      } else if (currentWeekAvg < previousWeekAvg - 0.5) {
        wellnessTrend = 'declining';
      }

      // Calculate department breakdown
      const departmentStats: { [key: string]: { employeeCount: number; reportCount: number; avgWellness: number; highRisk: number } } = {};
      employees.forEach(employee => {
        const dept = employee.department || 'Unassigned';
        if (!departmentStats[dept]) {
          departmentStats[dept] = {
            employeeCount: 0,
            reportCount: 0,
            avgWellness: 0,
            highRisk: 0
          };
        }
        departmentStats[dept].employeeCount++;

        const employeeReports = recentReports.filter(r => r.employee_id === employee.id);
        departmentStats[dept].reportCount += employeeReports.length;
        
        if (employeeReports.length > 0) {
          const deptWellness = employeeReports.reduce((sum, r) => sum + (r.overall_wellness || 0), 0) / employeeReports.length;
          departmentStats[dept].avgWellness = deptWellness;
          departmentStats[dept].highRisk += employeeReports.filter(r => r.risk_level === 'high').length;
        }
      });

      setStats({
        total_employees: totalEmployees,
        total_managers: managers.length,
        active_sessions: activeSessions,
        completed_reports: completedReports,
        average_wellness_score: Math.round(averageWellnessScore * 10) / 10,
        average_mood_score: Math.round(averageMoodScore * 10) / 10,
        average_stress_score: Math.round(averageStressScore * 10) / 10,
        average_energy_score: Math.round(averageEnergyScore * 10) / 10,
        high_risk_employees: highRiskCount,
        medium_risk_employees: mediumRiskCount,
        low_risk_employees: lowRiskCount,
        wellness_trend: wellnessTrend,
        department_stats: departmentStats,
        weekly_reports: weeklyReports.length,
        participation_rate: totalEmployees > 0 ? Math.round((recentReports.length / totalEmployees) * 100) : 0,
        last_updated: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const loadRecentReports = async () => {
    if (!user?.company_id) return;

    try {
      const reportsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id)
      );

      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const reportsData: MentalHealthReport[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<MentalHealthReport, 'id'>
        }));

        // Sort by created_at in JavaScript and limit to 5
        const sortedReports = reportsData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setRecentReports(sortedReports);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading recent reports:', error);
      setRecentReports([]);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportReports = async () => {
    if (!user?.company_id) return;

    try {
      toast.info('Preparing report export...');

      const response = await fetch('/api/employer/export-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: user.company_id,
          time_range: timeRange
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export reports');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellness-reports-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Reports exported successfully!');
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast.error('Failed to export reports.');
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor your team's wellness and mental health insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={exportReports} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Team</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_managers || 0} managers, {stats?.total_employees || 0} employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.participation_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.completed_reports || 0} reports this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Wellness</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{stats?.average_wellness_score || 0}/10</div>
                {stats?.wellness_trend && getTrendIcon(stats.wellness_trend)}
              </div>
              <p className="text-xs text-muted-foreground">
                Team wellness score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.high_risk_employees || 0}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.average_mood_score || 0}/10</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((stats?.average_mood_score || 0) / 10) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Stress</CardTitle>
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.average_stress_score || 0}/10</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((stats?.average_stress_score || 0) / 10) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Energy</CardTitle>
              <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.average_energy_score || 0}/10</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((stats?.average_energy_score || 0) / 10) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* High Risk Alert */}
        {stats && stats.high_risk_employees > 0 && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-900">
                <AlertTriangle className="h-5 w-5 mr-2" />
                High Risk Employees Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">
                {stats.high_risk_employees} employee{stats.high_risk_employees > 1 ? 's' : ''}
                {stats.high_risk_employees > 1 ? ' have' : ' has'} been flagged as high risk.
                Consider reaching out for additional support.
              </p>
              <Button
                className="mt-3"
                variant="destructive"
                size="sm"
                onClick={() => router.push('/employer/reports?filter=high-risk')}
              >
                View High Risk Reports
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Reports */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Wellness Reports</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/employer/reports')}
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentReports.length > 0 ? (
                  <div className="space-y-4">
                    {recentReports.map((report) => {
                      const employee = employees.find(emp => emp.id === report.employee_id);
                      return (
                        <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {employee?.department || 'No Department'} • {formatDate(report.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">Wellness: {report.overall_wellness}/10</p>
                              <Badge variant={getRiskBadgeColor(report.risk_level)} className="text-xs">
                                {report.risk_level} risk
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No wellness reports yet</p>
                    <p className="text-sm text-gray-500">Reports will appear here as employees complete wellness sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/employer/employees/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Employee
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/employer/analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/employer/employees')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Employees
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={exportReports}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
              </CardContent>
            </Card>

            {/* Team Overview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Team Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Team Members</span>
                    <span className="font-medium">{(stats?.total_employees || 0) + (stats?.total_managers || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="font-medium">{stats?.active_sessions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reports This Month</span>
                    <span className="font-medium">{stats?.completed_reports || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Participation Rate</span>
                    <span className="font-medium">{stats?.participation_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <Badge variant={stats?.high_risk_employees ? 'destructive' : 'default'}>
                      {stats?.high_risk_employees || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Breakdown */}
            {stats?.department_stats && Object.keys(stats.department_stats).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Department Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.department_stats).map(([dept, deptStats]) => (
                      <div key={dept} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">{dept}</h4>
                          <Badge variant="outline">{deptStats.employeeCount} employees</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Wellness:</span>
                            <span className="font-medium">{Math.round(deptStats.avgWellness * 10) / 10}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reports:</span>
                            <span className="font-medium">{deptStats.reportCount}</span>
                          </div>
                        </div>
                        {deptStats.avgWellness > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(deptStats.avgWellness / 10) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EmployerDashboardPage, ['employer', 'admin', 'hr']);
