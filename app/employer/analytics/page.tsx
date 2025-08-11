'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  Users,
  Brain,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import { db } from '@/lib/firebase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { toast } from 'sonner';

import type { MentalHealthReport, User } from '@/types/index';
import { demoUsers, demoReports } from '@/lib/demo-data';

interface AnalyticsData {
  departmentStats: { [key: string]: { count: number; avgWellness: number; avgStress: number; avgMood: number; avgEnergy: number } };
  trendData: { date: string; wellness: number; stress: number; mood: number; energy: number; reports: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  monthlyReports: { month: string; reports: number; avgWellness: number }[];
  wellnessMetrics: {
    totalEmployees: number;
    totalReports: number;
    avgWellness: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6'
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    departmentStats: {},
    trendData: [],
    riskDistribution: [],
    monthlyReports: [],
    wellnessMetrics: {
      totalEmployees: 0,
      totalReports: 0,
      avgWellness: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [useDemoData, setUseDemoData] = useState(true);

  useEffect(() => {
    console.log('Analytics useEffect - userLoading:', userLoading, 'user:', user);

    if (!userLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Allow access for employer, hr, admin, and manager roles
      if (!['employer', 'hr', 'admin', 'manager'].includes(user.role)) {
        router.push('/');
        return;
      }

      console.log('User authorized, fetching analytics');
      fetchAnalytics();
    }
  }, [user, userLoading, timeRange, selectedDepartment, useDemoData, router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const companyId = user?.company_id;

      if (!companyId) {
        console.log('No company ID found for user');
        toast.error('Company information not found');
        setLoading(false);
        return;
      }

      console.log('Fetching analytics for company:', companyId);

      // Fetch company employees (including all roles for better analytics)
      const employeesRef = collection(db, 'users');
      const employeesQuery = query(
        employeesRef,
        where('company_id', '==', companyId),
        where('is_active', '==', true)
      );

      let employees: User[] = [];
      try {
        const employeeSnapshot = await getDocs(employeesQuery);
        employees = employeeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        console.log('Found employees:', employees.length);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employee data');
        employees = [];
      }

      // Calculate date range
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch all reports for company (without date filter to avoid composite index requirement)
      const reportsRef = collection(db, 'mental_health_reports');
      const reportsQuery = query(
        reportsRef,
        where('company_id', '==', companyId)
      );

      let allReportsRaw: MentalHealthReport[] = [];
      try {
        const reportSnapshot = await getDocs(reportsQuery);
        allReportsRaw = reportSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MentalHealthReport));
      } catch (error) {
        console.log('Error fetching reports, using empty array:', error);
        allReportsRaw = [];
      }

      // Filter by date in JavaScript
      const allReports = allReportsRaw.filter(report =>
        new Date(report.created_at) >= startDate
      );

      console.log('Found reports:', allReports.length);
      console.log('Date range:', startDate.toISOString(), 'to', new Date().toISOString());

      // Filter by department if selected
      let filteredEmployees = employees;
      if (selectedDepartment !== 'all') {
        filteredEmployees = employees.filter(emp => emp.department === selectedDepartment);
      }

      const filteredEmployeeIds = new Set(filteredEmployees.map(emp => emp.id));
      const filteredReports = allReports.filter(report =>
        filteredEmployeeIds.has(report.employee_id)
      );

      console.log('Filtered reports:', filteredReports.length);

      // Calculate wellness metrics
      const wellnessMetrics = {
        totalEmployees: filteredEmployees.length,
        totalReports: filteredReports.length,
        avgWellness: filteredReports.length > 0
          ? Math.round((filteredReports.reduce((sum, r) => sum + r.overall_wellness, 0) / filteredReports.length) * 10) / 10
          : 0,
        highRiskCount: filteredReports.filter(r => r.risk_level === 'high').length,
        mediumRiskCount: filteredReports.filter(r => r.risk_level === 'medium').length,
        lowRiskCount: filteredReports.filter(r => r.risk_level === 'low').length,
      };

      // Calculate department statistics
      const departmentStats: { [key: string]: { count: number; avgWellness: number; avgStress: number; avgMood: number; avgEnergy: number } } = {};

      filteredEmployees.forEach(employee => {
        const dept = employee.department || 'Unassigned';
        const employeeReports = filteredReports.filter(r => r.employee_id === employee.id);

        if (!departmentStats[dept]) {
          departmentStats[dept] = { count: 0, avgWellness: 0, avgStress: 0, avgMood: 0, avgEnergy: 0 };
        }

        departmentStats[dept].count++;

        if (employeeReports.length > 0) {
          departmentStats[dept].avgWellness = Math.round((employeeReports.reduce((sum, r) => sum + r.overall_wellness, 0) / employeeReports.length) * 10) / 10;
          departmentStats[dept].avgStress = Math.round((employeeReports.reduce((sum, r) => sum + r.stress_level, 0) / employeeReports.length) * 10) / 10;
          departmentStats[dept].avgMood = Math.round((employeeReports.reduce((sum, r) => sum + r.mood_rating, 0) / employeeReports.length) * 10) / 10;
          departmentStats[dept].avgEnergy = Math.round((employeeReports.reduce((sum, r) => sum + r.energy_level, 0) / employeeReports.length) * 10) / 10;
        }
      });

      // Calculate trend data (daily averages)
      const trendData = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayReports = filteredReports.filter(r =>
          r.created_at.split('T')[0] === dateStr
        );

        if (dayReports.length > 0) {
          trendData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            wellness: Math.round((dayReports.reduce((sum, r) => sum + r.overall_wellness, 0) / dayReports.length) * 10) / 10,
            stress: Math.round((dayReports.reduce((sum, r) => sum + r.stress_level, 0) / dayReports.length) * 10) / 10,
            mood: Math.round((dayReports.reduce((sum, r) => sum + r.mood_rating, 0) / dayReports.length) * 10) / 10,
            energy: Math.round((dayReports.reduce((sum, r) => sum + r.energy_level, 0) / dayReports.length) * 10) / 10,
            reports: dayReports.length
          });
        }
      }

      // Calculate risk distribution
      const riskDistribution = [
        { name: 'Low Risk', value: wellnessMetrics.lowRiskCount, color: COLORS.success },
        { name: 'Medium Risk', value: wellnessMetrics.mediumRiskCount, color: COLORS.warning },
        { name: 'High Risk', value: wellnessMetrics.highRiskCount, color: COLORS.danger },
      ].filter(item => item.value > 0);

      // Calculate monthly reports
      const monthlyData: { [key: string]: { reports: number; totalWellness: number } } = {};

      filteredReports.forEach(report => {
        const month = new Date(report.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        });

        if (!monthlyData[month]) {
          monthlyData[month] = { reports: 0, totalWellness: 0 };
        }

        monthlyData[month].reports++;
        monthlyData[month].totalWellness += report.overall_wellness;
      });

      const monthlyReports = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          reports: data.reports,
          avgWellness: Math.round((data.totalWellness / data.reports) * 10) / 10,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // If no data found and user wants demo data, use demo data
      if (filteredReports.length === 0 && (employees.length === 0 || useDemoData)) {
        console.log('Using demo data for analytics');

        const demoEmployees = demoUsers.filter(u => u.company_id === 'demo-company');
        const demoReportsData = demoReports.filter(r => r.company_id === 'demo-company');

        // Calculate demo metrics
        const demoWellnessMetrics = {
          totalEmployees: demoEmployees.length,
          totalReports: demoReportsData.length,
          avgWellness: demoReportsData.length > 0
            ? Math.round((demoReportsData.reduce((sum, r) => sum + r.overall_wellness, 0) / demoReportsData.length) * 10) / 10
            : 0,
          highRiskCount: demoReportsData.filter(r => r.risk_level === 'high').length,
          mediumRiskCount: demoReportsData.filter(r => r.risk_level === 'medium').length,
          lowRiskCount: demoReportsData.filter(r => r.risk_level === 'low').length,
        };

        // Calculate demo department stats
        const demoDepartmentStats: { [key: string]: { count: number; avgWellness: number; avgStress: number; avgMood: number; avgEnergy: number } } = {};

        demoEmployees.forEach(employee => {
          const dept = employee.department || 'Unassigned';
          const employeeReports = demoReportsData.filter(r => r.employee_id === employee.id);

          if (!demoDepartmentStats[dept]) {
            demoDepartmentStats[dept] = { count: 0, avgWellness: 0, avgStress: 0, avgMood: 0, avgEnergy: 0 };
          }

          demoDepartmentStats[dept].count++;

          if (employeeReports.length > 0) {
            demoDepartmentStats[dept].avgWellness = Math.round((employeeReports.reduce((sum, r) => sum + r.overall_wellness, 0) / employeeReports.length) * 10) / 10;
            demoDepartmentStats[dept].avgStress = Math.round((employeeReports.reduce((sum, r) => sum + r.stress_level, 0) / employeeReports.length) * 10) / 10;
            demoDepartmentStats[dept].avgMood = Math.round((employeeReports.reduce((sum, r) => sum + r.mood_rating, 0) / employeeReports.length) * 10) / 10;
            demoDepartmentStats[dept].avgEnergy = Math.round((employeeReports.reduce((sum, r) => sum + r.energy_level, 0) / employeeReports.length) * 10) / 10;
          }
        });

        // Generate demo trend data
        const demoTrendData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          demoTrendData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            wellness: Math.round((6 + Math.random() * 2) * 10) / 10,
            stress: Math.round((4 + Math.random() * 3) * 10) / 10,
            mood: Math.round((6 + Math.random() * 2) * 10) / 10,
            energy: Math.round((5 + Math.random() * 3) * 10) / 10,
            reports: Math.floor(Math.random() * 3) + 1
          });
        }

        // Demo risk distribution
        const demoRiskDistribution = [
          { name: 'Low Risk', value: demoWellnessMetrics.lowRiskCount, color: COLORS.success },
          { name: 'Medium Risk', value: demoWellnessMetrics.mediumRiskCount, color: COLORS.warning },
          { name: 'High Risk', value: demoWellnessMetrics.highRiskCount, color: COLORS.danger },
        ].filter(item => item.value > 0);

        setAnalytics({
          departmentStats: demoDepartmentStats,
          trendData: demoTrendData,
          riskDistribution: demoRiskDistribution,
          monthlyReports: [
            { month: 'Nov 2024', reports: 8, avgWellness: 6.2 },
            { month: 'Dec 2024', reports: 12, avgWellness: 6.8 },
            { month: 'Jan 2025', reports: 15, avgWellness: 6.5 }
          ],
          wellnessMetrics: demoWellnessMetrics,
        });

        toast.info('Showing demo analytics data. Toggle off demo mode to see real data.');
      } else if (filteredReports.length === 0 && employees.length > 0) {
        console.log('No reports found, showing empty state with employee count');

        // Generate basic stats with employee count but no reports
        const basicWellnessMetrics = {
          totalEmployees: employees.length,
          totalReports: 0,
          avgWellness: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
        };

        const basicDepartmentStats: { [key: string]: { count: number; avgWellness: number; avgStress: number; avgMood: number; avgEnergy: number } } = {};

        employees.forEach(employee => {
          const dept = employee.department || 'Unassigned';
          if (!basicDepartmentStats[dept]) {
            basicDepartmentStats[dept] = { count: 0, avgWellness: 0, avgStress: 0, avgMood: 0, avgEnergy: 0 };
          }
          basicDepartmentStats[dept].count++;
        });

        setAnalytics({
          departmentStats: basicDepartmentStats,
          trendData: [],
          riskDistribution: [],
          monthlyReports: [],
          wellnessMetrics: basicWellnessMetrics,
        });

        toast.info('No wellness reports found. Encourage employees to submit their wellness reports to see analytics.');
      } else {
        setAnalytics({
          departmentStats,
          trendData,
          riskDistribution,
          monthlyReports,
          wellnessMetrics,
        });

        if (filteredReports.length > 0) {
          toast.success(`Analytics loaded with ${filteredReports.length} reports`);
        }
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data. Please try again.');

      // Set empty state on error
      setAnalytics({
        departmentStats: {},
        trendData: [],
        riskDistribution: [],
        monthlyReports: [],
        wellnessMetrics: {
          totalEmployees: 0,
          totalReports: 0,
          avgWellness: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const departments = Object.keys(analytics.departmentStats);

  const exportData = async () => {
    try {
      toast.info('Preparing analytics export...');

      const csvData = [
        ['Metric', 'Value'],
        ['Total Employees', analytics.wellnessMetrics.totalEmployees],
        ['Total Reports', analytics.wellnessMetrics.totalReports],
        ['Average Wellness', analytics.wellnessMetrics.avgWellness],
        ['High Risk Employees', analytics.wellnessMetrics.highRiskCount],
        ['Medium Risk Employees', analytics.wellnessMetrics.mediumRiskCount],
        ['Low Risk Employees', analytics.wellnessMetrics.lowRiskCount],
        [''],
        ['Department', 'Employee Count', 'Avg Wellness', 'Avg Stress', 'Avg Mood', 'Avg Energy'],
        ...Object.entries(analytics.departmentStats).map(([dept, stats]) => [
          dept, stats.count, stats.avgWellness, stats.avgStress, stats.avgMood, stats.avgEnergy
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}d-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Analytics exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export analytics');
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Deep insights into your team's mental health and wellness trends
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button
              variant={useDemoData ? "default" : "outline"}
              onClick={() => setUseDemoData(!useDemoData)}
              className={useDemoData ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Brain className="h-4 w-4 mr-2" />
              {useDemoData ? 'Demo Mode' : 'Use Demo'}
            </Button>
            <Button variant="outline" onClick={fetchAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => router.push('/employer/reports/custom')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Custom Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <p>Showing data for {timeRange} days</p>
                  <p>{selectedDepartment === 'all' ? 'All departments' : selectedDepartment}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.wellnessMetrics.totalEmployees}
                  </div>
                  <p className="text-sm text-gray-600">Active Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.wellnessMetrics.avgWellness}/10
                  </div>
                  <p className="text-sm text-gray-600">Avg Wellness</p>
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
                    {analytics.wellnessMetrics.highRiskCount}
                  </div>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.wellnessMetrics.totalReports}
                  </div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Wellness Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Wellness Trends Over Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="wellness" stroke={COLORS.primary} strokeWidth={2} name="Wellness" />
                    <Line type="monotone" dataKey="mood" stroke={COLORS.success} strokeWidth={2} name="Mood" />
                    <Line type="monotone" dataKey="energy" stroke={COLORS.purple} strokeWidth={2} name="Energy" />
                    <Line type="monotone" dataKey="stress" stroke={COLORS.danger} strokeWidth={2} name="Stress" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No trend data available for the selected period</p>
                    <p className="text-sm mt-2">Try selecting a longer time range or check if employees have submitted reports</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Level Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.riskDistribution.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {analytics.riskDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No risk data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Department Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Department Wellness Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(analytics.departmentStats).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analytics.departmentStats).map(([dept, stats]) => ({
                    department: dept,
                    wellness: stats.avgWellness,
                    stress: stats.avgStress,
                    mood: stats.avgMood,
                    energy: stats.avgEnergy,
                    employees: stats.count,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="wellness" fill={COLORS.primary} name="Avg Wellness" />
                    <Bar dataKey="mood" fill={COLORS.success} name="Avg Mood" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No department data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Monthly Report Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.monthlyReports.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyReports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="reports" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.3} name="Reports" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No monthly data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Department Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Department Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.departmentStats).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analytics.departmentStats).map(([dept, stats]) => (
                  <div key={dept} className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-3">{dept}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Employees:</span>
                        <span className="font-medium">{stats.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Wellness:</span>
                        <span className="font-medium">{stats.avgWellness}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Mood:</span>
                        <span className="font-medium">{stats.avgMood}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Stress:</span>
                        <span className="font-medium">{stats.avgStress}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Energy:</span>
                        <span className="font-medium">{stats.avgEnergy}/10</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(stats.avgWellness / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Department Data</h3>
                <p className="text-gray-500 mb-4">
                  No wellness reports found for the selected criteria.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Ensure employees have submitted wellness reports</p>
                  <p>• Try selecting a longer time range</p>
                  <p>• Check if the department filter is too restrictive</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* No Data State */}
        {analytics.wellnessMetrics.totalEmployees === 0 && (
          <Card className="mt-8">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employee Data Found</h3>
              <p className="text-gray-500 mb-6">
                It looks like there are no active employees in your company yet.
              </p>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p>To see analytics data:</p>
                <p>• Add employees to your company</p>
                <p>• Ensure employees have submitted wellness reports</p>
                <p>• Check that your company ID is properly configured</p>
              </div>
              <Button onClick={() => router.push('/employer/employees')}>
                <Users className="h-4 w-4 mr-2" />
                Manage Employees
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Analytics data is updated in real-time based on employee wellness reports</p>
          <p className="mt-1">All data is aggregated and anonymized for privacy compliance</p>
        </div>
      </div>
    </div>
  );
}
