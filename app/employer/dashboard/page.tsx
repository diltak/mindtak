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

  // Enhanced state for comprehensive employee averages
  const [employeeAverages, setEmployeeAverages] = useState({
    overall_wellness: 0,
    mood_rating: 0,
    stress_level: 0,
    energy_level: 0,
    work_satisfaction: 0,
    work_life_balance: 0,
    anxiety_level: 0,
    confidence_level: 0,
    sleep_quality: 0,
    total_reports: 0,
    unique_employees: 0,
    department_breakdown: {} as { [key: string]: any }
  });

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

  // Update data when time range changes
  useEffect(() => {
    if (user && user.role === 'employer' && user.company_id) {
      loadWellnessTrends();
      loadEmployeeAverages();
    }
  }, [timeRange]);



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

      // Load comprehensive employee averages
      await loadEmployeeAverages();

    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }

  };

  // New function to calculate comprehensive employee averages
  const loadEmployeeAverages = async () => {
    if (!user?.company_id) return;

    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch all reports for company (without date filter to avoid composite index requirement)
      const reportsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id)
      );

      const reportsSnapshot = await getDocs(reportsQuery);
      const allReportsRaw: MentalHealthReport[] = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<MentalHealthReport, 'id'>
      }));

      // Filter by date in JavaScript
      const allReports = allReportsRaw.filter(report =>
        new Date(report.created_at) >= startDate
      );

      if (allReports.length === 0) {
        setEmployeeAverages({
          overall_wellness: 0,
          mood_rating: 0,
          stress_level: 0,
          energy_level: 0,
          work_satisfaction: 0,
          work_life_balance: 0,
          anxiety_level: 0,
          confidence_level: 0,
          sleep_quality: 0,
          total_reports: 0,
          unique_employees: 0,
          department_breakdown: {}
        });
        return;
      }

      // Calculate overall averages
      const totals = allReports.reduce((acc, report) => ({
        overall_wellness: acc.overall_wellness + report.overall_wellness,
        mood_rating: acc.mood_rating + report.mood_rating,
        stress_level: acc.stress_level + report.stress_level,
        energy_level: acc.energy_level + report.energy_level,
        work_satisfaction: acc.work_satisfaction + report.work_satisfaction,
        work_life_balance: acc.work_life_balance + report.work_life_balance,
        anxiety_level: acc.anxiety_level + report.anxiety_level,
        confidence_level: acc.confidence_level + report.confidence_level,
        sleep_quality: acc.sleep_quality + report.sleep_quality,
      }), {
        overall_wellness: 0,
        mood_rating: 0,
        stress_level: 0,
        energy_level: 0,
        work_satisfaction: 0,
        work_life_balance: 0,
        anxiety_level: 0,
        confidence_level: 0,
        sleep_quality: 0,
      });

      const reportCount = allReports.length;
      const uniqueEmployees = new Set(allReports.map(r => r.employee_id)).size;

      // Calculate department breakdown
      const departmentBreakdown: { [key: string]: any } = {};

      // Fetch employee data to get departments
      const employeesQuery = query(
        collection(db, 'users'),
        where('company_id', '==', user.company_id),
        where('role', '==', 'employee')
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{ id: string; department?: string;[key: string]: any }>;

      // Group reports by department
      allReports.forEach(report => {
        const employee = employeesData.find(emp => emp.id === report.employee_id);
        const department = employee?.department || 'Unassigned';

        if (!departmentBreakdown[department]) {
          departmentBreakdown[department] = {
            count: 0,
            employees: new Set(),
            totals: {
              overall_wellness: 0,
              mood_rating: 0,
              stress_level: 0,
              energy_level: 0,
              work_satisfaction: 0,
              work_life_balance: 0,
              anxiety_level: 0,
              confidence_level: 0,
              sleep_quality: 0,
            }
          };
        }

        departmentBreakdown[department].count++;
        departmentBreakdown[department].employees.add(report.employee_id);
        departmentBreakdown[department].totals.overall_wellness += report.overall_wellness;
        departmentBreakdown[department].totals.mood_rating += report.mood_rating;
        departmentBreakdown[department].totals.stress_level += report.stress_level;
        departmentBreakdown[department].totals.energy_level += report.energy_level;
        departmentBreakdown[department].totals.work_satisfaction += report.work_satisfaction;
        departmentBreakdown[department].totals.work_life_balance += report.work_life_balance;
        departmentBreakdown[department].totals.anxiety_level += report.anxiety_level;
        departmentBreakdown[department].totals.confidence_level += report.confidence_level;
        departmentBreakdown[department].totals.sleep_quality += report.sleep_quality;
      });

      // Calculate averages for each department
      Object.keys(departmentBreakdown).forEach(dept => {
        const deptData = departmentBreakdown[dept];
        const count = deptData.count;
        departmentBreakdown[dept].averages = {
          overall_wellness: Math.round((deptData.totals.overall_wellness / count) * 10) / 10,
          mood_rating: Math.round((deptData.totals.mood_rating / count) * 10) / 10,
          stress_level: Math.round((deptData.totals.stress_level / count) * 10) / 10,
          energy_level: Math.round((deptData.totals.energy_level / count) * 10) / 10,
          work_satisfaction: Math.round((deptData.totals.work_satisfaction / count) * 10) / 10,
          work_life_balance: Math.round((deptData.totals.work_life_balance / count) * 10) / 10,
          anxiety_level: Math.round((deptData.totals.anxiety_level / count) * 10) / 10,
          confidence_level: Math.round((deptData.totals.confidence_level / count) * 10) / 10,
          sleep_quality: Math.round((deptData.totals.sleep_quality / count) * 10) / 10,
        };
        departmentBreakdown[dept].employee_count = deptData.employees.size;
      });

      setEmployeeAverages({
        overall_wellness: Math.round((totals.overall_wellness / reportCount) * 10) / 10,
        mood_rating: Math.round((totals.mood_rating / reportCount) * 10) / 10,
        stress_level: Math.round((totals.stress_level / reportCount) * 10) / 10,
        energy_level: Math.round((totals.energy_level / reportCount) * 10) / 10,
        work_satisfaction: Math.round((totals.work_satisfaction / reportCount) * 10) / 10,
        work_life_balance: Math.round((totals.work_life_balance / reportCount) * 10) / 10,
        anxiety_level: Math.round((totals.anxiety_level / reportCount) * 10) / 10,
        confidence_level: Math.round((totals.confidence_level / reportCount) * 10) / 10,
        sleep_quality: Math.round((totals.sleep_quality / reportCount) * 10) / 10,
        total_reports: reportCount,
        unique_employees: uniqueEmployees,
        department_breakdown: departmentBreakdown
      });

    } catch (error) {
      console.error('Error loading employee averages:', error);
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
      // Get total employees count
      const employeesQuery = query(
        collection(db, 'users'),
        where('company_id', '==', user.company_id),
        where('role', '==', 'employee')
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
        where('company_id', '==', user.company_id)
      );

      const reportsSnapshot = await getDocs(reportsQuery);

      // Filter by date in JavaScript
      const recentReports = reportsSnapshot.docs.filter(doc => {
        const report = doc.data() as MentalHealthReport;
        return new Date(report.created_at) >= thirtyDaysAgo;
      });

      const completedReports = recentReports.length;

      // Calculate average wellness score and high-risk employees
      let totalWellnessScore = 0;
      let highRiskCount = 0;

      recentReports.forEach(doc => {
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
        where('company_id', '==', user.company_id)
        // Removed orderBy to avoid index requirements - will sort in JavaScript
      );

      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const reportsData: MentalHealthReport[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<MentalHealthReport, 'id'>
        }));

        // Sort by created_at in JavaScript and limit to 10
        const sortedReports = reportsData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        setRecentReports(sortedReports);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading recent reports:', error);
      // Set empty array on error
      setRecentReports([]);
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
        where('company_id', '==', user.company_id)
        // Removed date filter to avoid composite index requirement - will filter in JavaScript
      );

      const trendsSnapshot = await getDocs(trendsQuery);

      // Group reports by date and calculate averages
      const trendsByDate: { [key: string]: { mood: number[], stress: number[], energy: number[], count: number } } = {};

      trendsSnapshot.docs.forEach(doc => {
        const report = doc.data() as MentalHealthReport;
        const reportDate = new Date(report.created_at);

        // Filter by date range in JavaScript
        if (reportDate < startDate) {
          return;
        }

        const date = reportDate.toISOString().split('T')[0];

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

        {/* Comprehensive Employee Averages Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span>Team Wellness Averages ({timeRange})</span>
                </div>
                <div className="text-sm text-gray-600">
                  {employeeAverages.total_reports} reports from {employeeAverages.unique_employees} employees
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeeAverages.total_reports > 0 ? (
                <div className="space-y-6">
                  {/* Overall Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {employeeAverages.overall_wellness}/10
                      </div>
                      <div className="text-sm text-blue-600 font-medium">Overall Wellness</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(employeeAverages.overall_wellness / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {employeeAverages.mood_rating}/10
                      </div>
                      <div className="text-sm text-green-600 font-medium">Mood Rating</div>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(employeeAverages.mood_rating / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {employeeAverages.stress_level}/10
                      </div>
                      <div className="text-sm text-red-600 font-medium">Stress Level</div>
                      <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(employeeAverages.stress_level / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">
                        {employeeAverages.energy_level}/10
                      </div>
                      <div className="text-sm text-yellow-600 font-medium">Energy Level</div>
                      <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(employeeAverages.energy_level / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">
                        {employeeAverages.work_satisfaction}/10
                      </div>
                      <div className="text-sm text-purple-600 font-medium">Work Satisfaction</div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(employeeAverages.work_satisfaction / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                      <div className="text-lg font-semibold text-gray-700">
                        {employeeAverages.work_life_balance}/10
                      </div>
                      <div className="text-xs text-gray-600">Work-Life Balance</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                      <div className="text-lg font-semibold text-gray-700">
                        {employeeAverages.anxiety_level}/10
                      </div>
                      <div className="text-xs text-gray-600">Anxiety Level</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                      <div className="text-lg font-semibold text-gray-700">
                        {employeeAverages.confidence_level}/10
                      </div>
                      <div className="text-xs text-gray-600">Confidence Level</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                      <div className="text-lg font-semibold text-gray-700">
                        {employeeAverages.sleep_quality}/10
                      </div>
                      <div className="text-xs text-gray-600">Sleep Quality</div>
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  {Object.keys(employeeAverages.department_breakdown).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Department Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(employeeAverages.department_breakdown).map(([dept, data]: [string, any]) => (
                          <Card key={dept} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">{dept}</h4>
                                <Badge variant="outline">
                                  {data.employee_count} employee{data.employee_count !== 1 ? 's' : ''}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Overall Wellness:</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{data.averages?.overall_wellness || 0}/10</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${((data.averages?.overall_wellness || 0) / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Mood:</span>
                                  <span className="font-medium">{data.averages?.mood_rating || 0}/10</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Stress:</span>
                                  <span className="font-medium">{data.averages?.stress_level || 0}/10</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Energy:</span>
                                  <span className="font-medium">{data.averages?.energy_level || 0}/10</span>
                                </div>

                                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                                  {data.count} total reports
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wellness Insights */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Key Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-800">
                          <strong>Highest Performing Area:</strong> {
                            Object.entries({
                              'Mood': employeeAverages.mood_rating,
                              'Energy': employeeAverages.energy_level,
                              'Work Satisfaction': employeeAverages.work_satisfaction,
                              'Work-Life Balance': employeeAverages.work_life_balance,
                              'Confidence': employeeAverages.confidence_level,
                              'Sleep Quality': employeeAverages.sleep_quality
                            }).sort(([, a], [, b]) => b - a)[0][0]
                          } ({
                            Object.entries({
                              'Mood': employeeAverages.mood_rating,
                              'Energy': employeeAverages.energy_level,
                              'Work Satisfaction': employeeAverages.work_satisfaction,
                              'Work-Life Balance': employeeAverages.work_life_balance,
                              'Confidence': employeeAverages.confidence_level,
                              'Sleep Quality': employeeAverages.sleep_quality
                            }).sort(([, a], [, b]) => b - a)[0][1]
                          }/10)
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-800">
                          <strong>Area for Improvement:</strong> {
                            employeeAverages.stress_level > 6 ? 'Stress Management' :
                              employeeAverages.anxiety_level > 6 ? 'Anxiety Support' :
                                Object.entries({
                                  'Mood': employeeAverages.mood_rating,
                                  'Energy': employeeAverages.energy_level,
                                  'Work Satisfaction': employeeAverages.work_satisfaction,
                                  'Work-Life Balance': employeeAverages.work_life_balance,
                                  'Confidence': employeeAverages.confidence_level,
                                  'Sleep Quality': employeeAverages.sleep_quality
                                }).sort(([, a], [, b]) => a - b)[0][0]
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Wellness Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    No employee wellness reports found for the selected time period.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/employer/employees')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Employees
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                                  {employee.first_name?.charAt(0) || 'E'}{employee.last_name?.charAt(0) || 'E'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{employee.first_name} {employee.last_name}</div>
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