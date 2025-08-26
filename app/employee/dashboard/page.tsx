'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  MessageSquare,
 AlertTriangle,
  Heart,
  Battery,
  Smile,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { MentalHealthReport } from '@/types';
import { auth, db } from '@/lib/firebase';
import { withAuth } from '@/components/auth/with-auth';

function EmployeeDashboard() {
  const { user, loading: userLoading } = useUser();
  const [reports, setReports] = useState<MentalHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    averageMood: 0,
    averageStress: 0,
    averageEnergy: 0,
    reportsCount: 0,
    lastReportDate: null as string | null,
  });
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      

      // Fetch reports from Firestore where employee_id matches current user's ID
      const reportsRef = collection(db, 'mental_health_reports');
      const q = query(reportsRef, where('employee_id', '==', user.id));
      const querySnapshot = await getDocs(q);

      console.log('Query snapshot size:', querySnapshot.size);

      const fetchedReports: MentalHealthReport[] = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Ensure created_at is a string
          created_at: data.created_at || new Date().toISOString()
        } as MentalHealthReport;
      });

      console.log('Fetched reports:', fetchedReports.length);

      // Sort reports by created_at in JavaScript (descending order)
      const sortedReports = fetchedReports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Limit to 10 most recent reports
      const limitedReports = sortedReports.slice(0, 10);

      setReports(limitedReports);

      // Calculate stats
      if (limitedReports.length > 0) {
        const totalMood = limitedReports.reduce((sum: number, report: MentalHealthReport) => sum + (report.mood_rating || 0), 0);
        const totalStress = limitedReports.reduce((sum: number, report: MentalHealthReport) => sum + (report.stress_level || 0), 0);
        const totalEnergy = limitedReports.reduce((sum: number, report: MentalHealthReport) => sum + (report.energy_level || 0), 0);

        setStats({
          averageMood: Math.round(totalMood / limitedReports.length),
          averageStress: Math.round(totalStress / limitedReports.length),
          averageEnergy: Math.round(totalEnergy / limitedReports.length),
          reportsCount: limitedReports.length,
          lastReportDate: limitedReports[0].created_at,
        });
      } else {
        // Set default stats when no reports
        setStats({
          averageMood: 0,
          averageStress: 0,
          averageEnergy: 0,
          reportsCount: 0,
          lastReportDate: null,
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Set default stats on error
      setStats({
        averageMood: 0,
        averageStress: 0,
        averageEnergy: 0,
        reportsCount: 0,
        lastReportDate: null,
      });
      setReports([]);
    } finally {
      // Always set loading to false
      setLoading(false);
    }
  };

  const getWellnessStatus = (score: number): { label: string; color: string; textColor: string } => {
    if (score >= 8) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 6) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score >= 4) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Needs Attention', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getRiskLevelBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return colors[riskLevel];
  };

  const chartData = reports.slice(0, 7).reverse().map((report, index) => ({
    date: new Date(report.created_at).toLocaleDateString(),
    mood: report.mood_rating,
    stress: 11 - report.stress_level, // Invert stress for better visualization
    energy: report.energy_level,
    wellness: report.overall_wellness,
  }));

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

  const latestReport = reports[0];
  const wellnessStatus = latestReport ? getWellnessStatus(latestReport.overall_wellness) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.first_name || user.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor your mental wellness and track your progress over time.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/employee/reports/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">New Wellness Check</h3>
                    <p className="text-sm text-gray-600">Record your current state</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employee/chat">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Chat with our wellness AI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employee/reports">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Reports</h3>
                    <p className="text-sm text-gray-600">Track your progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Mood</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <Smile className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {latestReport ? latestReport.mood_rating : '-'}/10
                </div>
                <Progress value={latestReport ? latestReport.mood_rating * 10 : 0} className="w-16 h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stress Level</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {latestReport ? latestReport.stress_level : '-'}/10
                </div>
                <Progress value={latestReport ? latestReport.stress_level * 10 : 0} className="w-16 h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Energy Level</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <Battery className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {latestReport ? latestReport.energy_level : '-'}/10
                </div>
                <Progress value={latestReport ? latestReport.energy_level * 10 : 0} className="w-16 h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Wellness</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {latestReport ? latestReport.overall_wellness : '-'}/10
                </div>
                {wellnessStatus && (
                  <Badge className={`${wellnessStatus.textColor} bg-opacity-20`}>
                    {wellnessStatus.label}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wellness Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Wellness Trends (Last 7 Reports)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="mood" stroke="#3B82F6" strokeWidth={2} name="Mood" />
                    <Line type="monotone" dataKey="stress" stroke="#F59E0B" strokeWidth={2} name="Stress (Inverted)" />
                    <Line type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={2} name="Energy" />
                    <Line type="monotone" dataKey="wellness" stroke="#8B5CF6" strokeWidth={2} name="Overall Wellness" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No reports yet. Create your first wellness check to see trends.</p>
                    <Link href="/employee/reports/new">
                      <Button className="mt-4">Create Report</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Reports</span>
                </div>
                <Link href="/employee/reports">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Wellness: {report.overall_wellness}/10
                        </p>
                      </div>
                      <Badge className={getRiskLevelBadge(report.risk_level)}>
                        {report.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No reports yet</p>
                  <Link href="/employee/reports/new">
                    <Button>Create Your First Report</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wellness Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Daily Wellness Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-2">Take Breaks</h3>
                <p className="text-sm text-gray-600">
                  Take a 5-minute break every hour to refresh your mind.
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Brain className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-2">Practice Mindfulness</h3>
                <p className="text-sm text-gray-600">
                  Try 5 minutes of deep breathing or meditation.
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
                <p className="text-sm text-gray-600">
                  Reach out to our AI assistant or a colleague for support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(EmployeeDashboard, ['employee']);