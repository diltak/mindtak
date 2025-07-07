'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Brain,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
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
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

import type { MentalHealthReport, User } from '@/types/index';

interface AnalyticsData {
  departmentStats: { [key: string]: { count: number; avgWellness: number; avgStress: number } };
  trendData: { date: string; wellness: number; stress: number; mood: number; energy: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  monthlyReports: { month: string; reports: number; avgWellness: number }[];
  correlationData: { metric: string; correlation: number }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    departmentStats: {},
    trendData: [],
    riskDistribution: [],
    monthlyReports: [],
    correlationData: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user?.role !== 'employer') {
      router.push('/employee/dashboard');
      return;
    }

    if (user) {
      fetchAnalytics();
    }
  }, [user, userLoading, router, timeRange, selectedDepartment]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const companyId = user?.company_id;
      if (!companyId) {
        setLoading(false);
        return;
      }

      // Fetch company employees
      const employeesRef = collection(db, 'users');
      const employeesQuery = query(employeesRef, where('company_id', '==', companyId), where('role', '==', 'employee'));
      const employeeSnapshot = await getDocs(employeesQuery);
      const employees: User[] = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

      const employeeIds = employees.map(emp => emp.id).filter(id => id !== undefined) as string[];

      // Calculate date range
      const daysAgo = parseInt(timeRange); // Ensure daysAgo is declared here
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch reports within date range
      const reportsRef = collection(db, 'mentalHealthReports');
      let reportsQuery = query(reportsRef, where('employee_id', 'in', employeeIds), where('created_at', '>=', startDate.toISOString()), orderBy('created_at', 'asc'));

      const reportSnapshot = await getDocs(reportsQuery);
      const reports: MentalHealthReport[] = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MentalHealthReport));

      // TODO: Replace with Firebase query for reports
      // Need a mentalHealthReports collection with employee_id and created_at fields
      // Filter by department if selected
      let filteredEmployees = employees || [];
      if (selectedDepartment !== 'all') {
        filteredEmployees = employees?.filter(emp => emp.department === selectedDepartment) || [];
 }
      const filteredEmployeeIdsSet = new Set(filteredEmployees.map(emp => emp.id));
      const filteredReports = reports?.filter((report: MentalHealthReport) =>
        filteredEmployeeIdsSet.has(report.employee_id)
      ) || [];
      // Calculate department statistics
      const departmentStats: { [key: string]: { count: number; avgWellness: number; avgStress: number } } = {};
      
      filteredEmployees.forEach(employee => {
        const dept = employee.department || 'Unassigned';
        const employeeReports = filteredReports.filter(r => r.employee_id === employee.id);
        
        if (!departmentStats[dept]) {
          departmentStats[dept] = { count: 0, avgWellness: 0, avgStress: 0 };
        }
        
        departmentStats[dept].count++;

        if (employeeReports.length > 0) {
          departmentStats[dept].avgWellness = employeeReports.reduce((sum: number, r: MentalHealthReport) => sum + r.overall_wellness, 0) / employeeReports.length;
          departmentStats[dept].avgStress = employeeReports.reduce((sum: number, r: MentalHealthReport) => sum + r.stress_level, 0) / employeeReports.length;
        }
      });

      // Calculate trend data
      const daysAgoTrend = parseInt(timeRange); // Use a different variable name
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
            wellness: Math.round(dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.overall_wellness, 0) / dayReports.length),
            stress: Math.round(dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.stress_level, 0) / dayReports.length),
            mood: Math.round(dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.mood_rating, 0) / dayReports.length),
            energy: Math.round(dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.energy_level, 0) / dayReports.length),
          });
        }
      }

      // Calculate risk distribution
      const riskCounts = filteredReports.reduce((acc: { [key: string]: number }, report: MentalHealthReport) => {
        acc[report.risk_level]++;
        return acc;
      }, { low: 0, medium: 0, high: 0 });

      const riskDistribution = [
        { name: 'Low Risk', value: riskCounts.low, color: '#10B981' },
        { name: 'Medium Risk', value: riskCounts.medium, color: '#F59E0B' },
        { name: 'High Risk', value: riskCounts.high, color: '#EF4444' },
      ];

      // Calculate monthly reports
      const monthlyData: { [key: string]: { reports: number; totalWellness: number } } = {};

      filteredReports.forEach(report => {
        const month = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) || 'Unknown Month';
        if (!monthlyData[month]) {
          monthlyData[month] = { reports: 0, totalWellness: 0 };
        }
        monthlyData[month].reports = (monthlyData[month].reports || 0) + 1;
        monthlyData[month].totalWellness += report.overall_wellness;
      });

      const monthlyReports = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        reports: data.reports,
        avgWellness: Math.round(data.totalWellness / data.reports),
      }));

      // Calculate correlation data (simplified)
      const correlationData = [
        { metric: 'Sleep Quality', correlation: 0.75 },
        { metric: 'Work-Life Balance', correlation: 0.68 },
        { metric: 'Energy Level', correlation: 0.82 },
        { metric: 'Work Satisfaction', correlation: 0.71 },
        { metric: 'Confidence Level', correlation: 0.64 },
      ];

      // TODO: Implement actual correlation calculation based on report data
      setAnalytics({
        departmentStats,
        trendData,
        riskDistribution,
        monthlyReports,
        correlationData,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = Object.keys(analytics.departmentStats);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Deep insights into your team's mental health and wellness trends.
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button variant="outline" onClick={fetchAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
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
                    {Object.values(analytics.departmentStats).reduce((sum, dept) => sum + dept.count, 0)}
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
                    {analytics.trendData.length > 0
                      ? Math.round(analytics.trendData.reduce((sum: number, day) => sum + day.wellness, 0) / analytics.trendData.length)
                      : 0
                    }/10
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
                    {analytics.riskDistribution.find(r => r.name === 'High Risk')?.value || 0}
                  </div>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.trendData.length > 1
                      ? analytics.trendData[analytics.trendData.length - 1].wellness > analytics.trendData[0].wellness
                        ? '+' + Math.round(((analytics.trendData[analytics.trendData.length - 1].wellness - analytics.trendData[0].wellness) / analytics.trendData[0].wellness) * 100) + '%'
                        : Math.round(((analytics.trendData[analytics.trendData.length - 1].wellness - analytics.trendData[0].wellness) / analytics.trendData[0].wellness) * 100) + '%'
                      : '0%'
                    }
                  </div>
                  <p className="text-sm text-gray-600">Wellness Trend</p>
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
                <AreaChart className="h-5 w-5" /> {/* Corrected icon for area chart */}
                <span>Wellness Trends Over Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} >
                  <AreaChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="wellness" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Wellness" />
                    <Area type="monotone" dataKey="mood" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Mood" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  <p>No trend data available for the selected period.</p>
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
              {analytics.riskDistribution.some(r => r.value > 0) ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart >
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
                            className="w-3 h-3 rounded-full" // TODO: Add type for item in map
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
                <div className="h-200 flex items-center justify-center text-gray-500">
                  <p>No risk data available.</p>
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
                <BarChart className="h-5 w-5" /> {/* Corrected icon for bar chart */}
                <span>Department Wellness Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(analytics.departmentStats).length > 0 ? (
                <ResponsiveContainer width="100%" height={300} >
                  <BarChart data={Object.entries(analytics.departmentStats).map(([dept, stats]) => ({
                    department: dept,
                    wellness: Math.round(stats.avgWellness),
                    stress: Math.round(stats.avgStress),
                    employees: stats.count,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="wellness" fill="#10B981" name="Avg Wellness" />
                    <Bar dataKey="stress" fill="#EF4444" name="Avg Stress" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  <p>No department data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Correlation Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Wellness Correlation Factors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.correlationData.map((item) => (
                  <div key={item.metric} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{item.metric}</span>
                      <span className="text-sm text-gray-600">{Math.round(item.correlation * 100)}%</span> {/* TODO: Add type for item in map */}
                    </div> {/* TODO: Add type for item in map */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${item.correlation * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <div key={dept} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">{dept}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Employees:</span>
                        <span className="font-medium">{stats.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Wellness:</span>
                        <span className="font-medium">{Math.round(stats.avgWellness)}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Stress:</span>
                        <span className="font-medium">{Math.round(stats.avgStress)}/10</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full" // TODO: Add type for stats in map
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
                <p className="text-gray-500">No department data available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}