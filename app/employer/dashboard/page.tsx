'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Brain, 
  Heart,
  BarChart3,
  UserPlus,
  Shield,
  Calendar,
  Activity
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import type { MentalHealthReport, User as UserType } from '@/types';

interface DashboardStats {
  totalEmployees: number;
  totalReports: number;
  averageWellness: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  recentReports: MentalHealthReport[];
  departmentStats: { [key: string]: { count: number; avgWellness: number } };
  trendData: { date: string; wellness: number; stress: number; mood: number }[];
}
import { db } from '@/lib/firebase';

export default function EmployerDashboard() {
  const { user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalReports: 0,
    averageWellness: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    recentReports: [],
    departmentStats: {},
    trendData: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user?.role !== 'employer') {
      // router.push('/employee/dashboard'); // Assuming redirection logic is handled elsewhere or intended behavior is different for Firebase Auth
      return;
    }

    if (user && user.company_id) { // Ensure company_id exists for fetching data
      fetchDashboardData();
    }
  }, [user, userLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch company employees
      const employeesCollectionRef = collection(db, 'users');
      const employeesQuery = query(
        employeesCollectionRef,
        where('company_id', '==', user!.company_id),
        where('role', '==', 'employee')
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserType[];

      const employeeIds = employees.map(emp => emp.id);

      if (employeeIds.length === 0) {
        // No employees, so no reports to fetch
        setLoading(false);
        return;
      }

      // Fetch all reports for company employees (without orderBy to avoid composite index requirement)
      const reportsCollectionRef = collection(db, 'mental_health_reports');
      const reportsQuery = query(
        reportsCollectionRef,
        where('employee_id', 'in', employeeIds)
      );

      const reportsSnapshot = await getDocs(reportsQuery);
      const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MentalHealthReport[];

      // Sort reports by created_at in JavaScript (descending order)
      const sortedReports = reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate statistics
      const totalReports = sortedReports?.length || 0;
      const averageWellness = totalReports > 0 
        ? Math.round(sortedReports!.reduce((sum, report) => sum + report.overall_wellness, 0) / totalReports)
        : 0;

      const riskCounts = sortedReports.reduce((acc, report) => {
        acc[report.risk_level]++;
        return acc;
      }, { low: 0, medium: 0, high: 0 }) || { low: 0, medium: 0, high: 0 };

      // Department statistics
      const departmentStats: { [key: string]: { count: number; avgWellness: number } } = {};
      employees?.forEach(employee => {
        const dept = employee.department ?? 'Unassigned'; // Use nullish coalescing
        const employeeReports = sortedReports?.filter(r => r.employee_id === employee.id) || [];
        const avgWellness = employeeReports.length > 0
          ? employeeReports.reduce((sum, r) => sum + r.overall_wellness, 0) / employeeReports.length
          : 0;

        if (!departmentStats[dept]) {
          departmentStats[dept] = { count: 0, avgWellness: 0 };
        }
        departmentStats[dept].count++;
        departmentStats[dept].avgWellness = avgWellness;
      });

      // Trend data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentReports = sortedReports.filter(r =>
        new Date(r.created_at) >= thirtyDaysAgo
      ) || [];

      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayReports = recentReports.filter(r => 
          r.created_at.split('T')[0] === dateStr
        );

        if (dayReports.length > 0) {
          trendData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            wellness: Math.round(dayReports.reduce((sum, r) => sum + r.overall_wellness, 0) / dayReports.length),
            stress: Math.round(dayReports.reduce((sum, r) => sum + (11 - r.stress_level), 0) / dayReports.length),
            mood: Math.round(dayReports.reduce((sum, r) => sum + r.mood_rating, 0) / dayReports.length),
          });
        }
      }

      setStats({
        totalEmployees: employees.length,
        totalReports,
        averageWellness,
        highRiskCount: riskCounts.high,
        mediumRiskCount: riskCounts.medium,
        lowRiskCount: riskCounts.low,
        recentReports: sortedReports?.slice(0, 10) || [],
        departmentStats,
        trendData,
      });
      setLoading(false); // Set loading to false after data is fetched
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const riskData = [
    { name: 'Low Risk', value: stats.lowRiskCount, color: '#10B981' },
    { name: 'Medium Risk', value: stats.mediumRiskCount, color: '#F59E0B' },
    { name: 'High Risk', value: stats.highRiskCount, color: '#EF4444' },
  ];

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
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Employer Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor your team's mental health and wellness trends.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/employer/employees">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Employees</h3>
                    <p className="text-sm text-gray-600">View and manage team</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employer/analytics">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">Detailed insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employer/reports">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Reports</h3>
                    <p className="text-sm text-gray-600">Generate reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employer/employees/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <UserPlus className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Employee</h3>
                    <p className="text-sm text-gray-600">Onboard new team member</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
                  <p className="text-xs text-gray-600">Active team members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Wellness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.averageWellness}/10</div>
                  <Progress value={stats.averageWellness * 10} className="w-16 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalReports}</div>
                  <p className="text-xs text-gray-600">Wellness submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">High Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.highRiskCount}</div>
                  <p className="text-xs text-gray-600">Require attention</p>
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
                <span>Wellness Trends (Last 30 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="wellness" stroke="#8B5CF6" strokeWidth={2} name="Wellness" />
                    <Line type="monotone" dataKey="mood" stroke="#3B82F6" strokeWidth={2} name="Mood" />
                    <Line type="monotone" dataKey="stress" stroke="#10B981" strokeWidth={2} name="Stress (Inverted)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No trend data available yet.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Risk Level Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totalReports > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2">
                    {riskData.map((item) => (
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
                <div className="h-200 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No risk data available yet.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Department Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.departmentStats).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats.departmentStats).map(([dept, data]) => (
                  <div key={dept} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">{dept}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Employees:</span>
                        <span className="font-medium">{data.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Wellness:</span>
                        <span className="font-medium">{Math.round(data.avgWellness)}/10</span>
                      </div>
                      <Progress value={data.avgWellness * 10} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No department data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Wellness Reports</span>
              </div>
              <Link href="/employer/reports">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentReports.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Anonymous Employee Report
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()} at{' '}
                        {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {/* Format time */}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Wellness: {report.overall_wellness}/10
                        </div>
                        <div className="text-sm text-gray-600">
                          Stress: {report.stress_level}/10
                        </div>
                      </div>
                      <Badge 
                        className={
                          report.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                          report.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }
                      >
                        {report.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No recent reports available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}