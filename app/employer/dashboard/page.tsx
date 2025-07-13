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
  Calendar,
  BarChart3,




  Download,
  Filter,
  Search,
  Loader2,
  Building,
  UserCheck,
  Clock,
  Target
} from 'lucide-react';

















import { toast } from 'sonner';
import type { DashboardStats, WellnessTrend, MentalHealthReport, Employee } from '@/types/index';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function EmployerDashboardPage() {
  const { user, loading: userLoading } = useUser();











  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<WellnessTrend[]>([]);
  const [recentReports, setRecentReports] = useState<MentalHealthReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    
    if (user && user.role !== 'employer') {
      toast.error('Access denied. Employer role required.');
      router.push('/auth/signin');
      return;
    }
    
    if (user && user.role === 'employer' && user.company_id) {
      initializeDashboard();
    }
  }, [user, userLoading, router]);



  const initializeDashboard = async () => {
    if (!user?.company_id) {
      toast.error('Company information not found.');
      return;
    }



    try {
      setLoading(true);
      
      // Load employees
      await loadEmployees();
      
      // Load dashboard stats
      await loadDashboardStats();
      
      // Load recent reports
      await loadRecentReports();
      
      // Load wellness trends
      await loadWellnessTrends();
      
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



        collection(db, 'employees'),
        where('company_id', '==', user.company_id),
        where('status', '==', 'active')
      );

      const unsubscribe = onSnapshot(employeesQuery, (snapshot) => {
        const employeesData: Employee[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Employee, 'id'>
        }));
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
      // Get total employees count
      const employeesQuery = query(
        collection(db, 'employees'),
        where('company_id', '==', user.company_id),
        where('status', '==', 'active')
      );
      const employeesSnapshot = await getDocs(employeesQuery);

      const totalEmployees = employeesSnapshot.size;


      // Get active sessions count
      const activeSessionsQuery = query(
        collection(db, 'chat_sessions'),
        where('company_id', '==', user.company_id),
        where('status', '==', 'active')
      );
      const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
      const activeSessions = activeSessionsSnapshot.size;









      // Get completed reports count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const reportsQuery = query(


        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id),
        where('created_at', '>=', thirtyDaysAgo.toISOString())
      );

      const reportsSnapshot = await getDocs(reportsQuery);

      const completedReports = reportsSnapshot.size;



      // Calculate average wellness score and high-risk employees
      let totalWellnessScore = 0;
      let highRiskCount = 0;
      
      reportsSnapshot.docs.forEach(doc => {
        const report = doc.data() as MentalHealthReport;
        const wellnessScore = (
          report.mood_rating + 
          (10 - report.stress_level) + 
          report.energy_level + 
          report.work_satisfaction + 
          report.work_life_balance + 
          (10 - report.anxiety_level) + 
          report.confidence_level + 
          report.sleep_quality
        ) / 8;
        
        totalWellnessScore += wellnessScore;
        
        if (report.risk_level === 'high') {
          highRiskCount++;
        }
      });






      const averageWellnessScore = completedReports > 0 ? totalWellnessScore / completedReports : 0;





      setStats({
        total_employees: totalEmployees,
        active_sessions: activeSessions,
        completed_reports: completedReports,
        average_wellness_score: Math.round(averageWellnessScore * 10) / 10,
        high_risk_employees: highRiskCount,
        wellness_trend: averageWellnessScore > 7 ? 'improving' : averageWellnessScore > 5 ? 'stable' : 'declining',
        last_updated: new Date().toISOString()
      });









    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };






  const loadRecentReports = async () => {
    if (!user?.company_id) return;

    try {
      const reportsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const reportsData: MentalHealthReport[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<MentalHealthReport, 'id'>
        }));
        setRecentReports(reportsData);
      });




      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading recent reports:', error);
    }
  };




  const loadWellnessTrends = async () => {
    if (!user?.company_id) return;






    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const trendsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id),
        where('created_at', '>=', startDate.toISOString()),
        orderBy('created_at', 'asc')
      );

      const trendsSnapshot = await getDocs(trendsQuery);
      
      // Group reports by date and calculate averages
      const trendsByDate: { [key: string]: { mood: number[], stress: number[], energy: number[], count: number } } = {};
      
      trendsSnapshot.docs.forEach(doc => {
        const report = doc.data() as MentalHealthReport;
        const date = new Date(report.created_at).toISOString().split('T')[0];
        











        if (!trendsByDate[date]) {
          trendsByDate[date] = { mood: [], stress: [], energy: [], count: 0 };
        }

        
        trendsByDate[date].mood.push(report.mood_rating);
        trendsByDate[date].stress.push(report.stress_level);
        trendsByDate[date].energy.push(report.energy_level);
        trendsByDate[date].count++;
      });













      const trendsData: WellnessTrend[] = Object.entries(trendsByDate).map(([date, data]) => ({
        date,
        average_mood: data.mood.reduce((a, b) => a + b, 0) / data.mood.length,
        average_stress: data.stress.reduce((a, b) => a + b, 0) / data.stress.length,
        average_energy: data.energy.reduce((a, b) => a + b, 0) / data.energy.length,
        total_reports: data.count
      }));

      setTrends(trendsData);
    } catch (error) {



      console.error('Error loading wellness trends:', error);
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


  if (!user || user.role !== 'employer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
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
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>







              <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card>


            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>







              <div className="text-2xl font-bold">{stats?.active_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ongoing wellness chats
              </p>
            </CardContent>
          </Card>

          <Card>


            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>







              <div className="text-2xl font-bold">{stats?.completed_reports || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wellness Trends Chart */}
          <Card>
            <CardHeader>



              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Wellness Trends
              </CardTitle>
            </CardHeader>
            <CardContent>












              {trends.length > 0 ? (
                <div className="space-y-4">
                  {trends.slice(-7).map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {new Date(trend.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Mood: {trend.average_mood.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Energy: {trend.average_energy.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Stress: {trend.average_stress.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (





                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No wellness data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Recent Reports */}
          <Card>
            <CardHeader>



              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Reports
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/employer/reports')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>

              {recentReports.length > 0 ? (
                <div className="space-y-4">






















                  {recentReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">





                          <UserCheck className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Employee #{report.employee_id.slice(-6)}</span>
                          <Badge variant={getRiskBadgeColor(report.risk_level)}>
                            {report.risk_level} risk
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(report.created_at)} • {report.session_type} session
                        </div>
                      </div>


                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {report.overall_wellness}/10
                        </div>
                        <div className="text-xs text-gray-500">wellness</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (





                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent reports available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Team Overview */}
        <Card className="mt-8">
          <CardHeader>
























            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Team Overview
              </div>













              <div className="flex items-center space-x-2">


                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>



            </CardTitle>
          </CardHeader>
          <CardContent>


































            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Employee</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Position</th>
                      <th className="text-left py-3 px-4">Last Report</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.slice(0, 10).map((employee) => {
                      const lastReport = recentReports.find(r => r.employee_id === employee.id);
                      return (
                        <tr key={employee.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {employee.employee_id.slice(-2)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">Employee #{employee.employee_id}</div>
                                <div className="text-sm text-gray-500">ID: {employee.id.slice(-8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{employee.department}</td>
                          <td className="py-3 px-4 text-sm">{employee.position}</td>
                          <td className="py-3 px-4 text-sm">
                            {lastReport ? (
                              <div>
                                <div>{formatDate(lastReport.created_at)}</div>
                                <Badge variant={getRiskBadgeColor(lastReport.risk_level)} className="mt-1">
                                  {lastReport.risk_level}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-400">No reports</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                              {employee.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/employer/employee/${employee.id}`)}
                              >
                                View Details
                              </Button>
                              {lastReport && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/employer/reports/${lastReport.id}`)}
                                >
                                  View Report
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {employees.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/employer/employees')}
                    >
                      View All {employees.length} Employees
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No employees found</p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push('/employer/employees/invite')}
                >
                  Invite Employees
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/employer/reports')}>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <BarChart3 className="h-5 w-5 mr-2" />
                View All Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Access detailed wellness reports and analytics for your team
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/employer/employees')}>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <Users className="h-5 w-5 mr-2" />
                Manage Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Add, remove, or update employee information and permissions
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/employer/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <Building className="h-5 w-5 mr-2" />
                Company Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Configure company preferences and wellness program settings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Last updated: {stats?.last_updated ? formatDate(stats.last_updated) : 'Never'}
          </p>
          <p className="mt-1">
            All employee data is anonymized and HIPAA compliant
          </p>
        </div>
      </div>
    </div>
  );
}