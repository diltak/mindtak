'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
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
  RefreshCw,
  BarChart3,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { getTeamStats, getHierarchyAnalytics, getDirectReports, getHierarchyFilteredReports } from '@/lib/hierarchy-service';
import { getDemoUser, getDemoTeamStats, demoReports, demoUsers } from '@/lib/demo-data';
import type { TeamStats, HierarchyAnalytics, User, MentalHealthReport } from '@/types/index';
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
  Cell
} from 'recharts';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6'
};

export default function ManagerAnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [analytics, setAnalytics] = useState<HierarchyAnalytics | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamReports, setTeamReports] = useState<MentalHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [user, userLoading, timeRange]);

  // Recalculate chart data when team reports change
  useEffect(() => {
    // This will trigger re-render of charts when teamReports state changes
  }, [teamReports, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const currentUser = user || getDemoUser('manager');

      try {
        // Try to get real data
        const stats = await getTeamStats(currentUser.id);
        setTeamStats(stats);

        const hierarchyAnalytics = await getHierarchyAnalytics(currentUser.company_id || 'demo-company');
        setAnalytics(hierarchyAnalytics);

        // Get team members and their reports
        const directReports = await getDirectReports(currentUser.id);
        setTeamMembers(directReports);

        const reports = await getHierarchyFilteredReports(currentUser.id, currentUser.company_id || 'demo-company', parseInt(timeRange));
        setTeamReports(reports);

      } catch (error) {
        console.log('Using demo data for manager analytics');
        // Use demo data
        setTeamStats(getDemoTeamStats());

        // Set demo team members and reports
        const demoTeamMembers = demoUsers.filter(u => u.manager_id === 'demo-manager-1');
        setTeamMembers(demoTeamMembers);
        setTeamReports(demoReports);

        // Generate demo analytics
        const demoAnalytics: HierarchyAnalytics = {
          team_wellness_comparison: [
            {
              team_name: "Emily's Engineering Team",
              manager_name: "Emily Rodriguez",
              avg_wellness: 6.3,
              team_size: 3,
              high_risk_count: 1
            }
          ],
          department_performance: [
            {
              department: "Engineering",
              avg_wellness: 6.3,
              employee_count: 3,
              manager_count: 1
            }
          ],
          hierarchy_health: [
            {
              level: 4,
              level_name: "Individual Contributors",
              avg_wellness: 6.3,
              employee_count: 3
            }
          ]
        };
        setAnalytics(demoAnalytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate trend data from actual reports
  const generateTrendData = () => {
    if (teamReports.length === 0) {
      return [];
    }

    const trendData = [];
    const days = Math.min(parseInt(timeRange), 30); // Limit to 30 days for chart readability

    // Group reports by date
    const reportsByDate = new Map();
    teamReports.forEach(report => {
      const dateStr = report.created_at.split('T')[0];
      if (!reportsByDate.has(dateStr)) {
        reportsByDate.set(dateStr, []);
      }
      reportsByDate.get(dateStr).push(report);
    });

    // Generate data points for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayReports = reportsByDate.get(dateStr) || [];

      if (dayReports.length > 0) {
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          wellness: Math.round((dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.overall_wellness, 0) / dayReports.length) * 10) / 10,
          stress: Math.round((dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.stress_level, 0) / dayReports.length) * 10) / 10,
          mood: Math.round((dayReports.reduce((sum: number, r: MentalHealthReport) => sum + r.mood_rating, 0) / dayReports.length) * 10) / 10,
          reports: dayReports.length
        });
      }
    }

    return trendData;
  };

  const trendData = generateTrendData();

  // Generate risk distribution from actual reports
  const generateRiskDistribution = () => {
    if (teamReports.length === 0) {
      return [];
    }

    const lowRisk = teamReports.filter(r => r.risk_level === 'low').length;
    const mediumRisk = teamReports.filter(r => r.risk_level === 'medium').length;
    const highRisk = teamReports.filter(r => r.risk_level === 'high').length;

    const distribution = [];
    if (lowRisk > 0) distribution.push({ name: 'Low Risk', value: lowRisk, color: COLORS.success });
    if (mediumRisk > 0) distribution.push({ name: 'Medium Risk', value: mediumRisk, color: COLORS.warning });
    if (highRisk > 0) distribution.push({ name: 'High Risk', value: highRisk, color: COLORS.danger });

    return distribution;
  };

  const riskDistribution = generateRiskDistribution();

  const currentUser = user || getDemoUser('manager');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={currentUser} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <Link href="/manager/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Team Analytics</h1>
            <p className="text-gray-600 mt-2">
              Deep insights into your team's mental health and wellness trends
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

        {/* Time Range Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                Showing data for your direct reports and team
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        {teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {teamStats.team_size}
                    </div>
                    <p className="text-sm text-gray-600">Team Members</p>
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
                      {teamStats.avg_team_wellness}/10
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
                  <BarChart3 className="h-8 w-8 text-purple-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Team Wellness Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Team Wellness Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip
                      formatter={(value, name) => [
                        value !== null ? `${value}/10` : 'No data',
                        name
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="wellness"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Wellness"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="Mood"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      stroke={COLORS.danger}
                      strokeWidth={2}
                      name="Stress"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No wellness trend data available</p>
                    <p className="text-sm mt-2">Team members need to submit wellness reports to see trends</p>
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
                <span>Team Risk Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskDistribution.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {riskDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value} member{item.value !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No risk data available</p>
                    <p className="text-sm mt-2">Team wellness reports needed to assess risk levels</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Member Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Individual Team Member Wellness</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  // Find the most recent report for this team member
                  const memberReport = teamReports?.find(r => r.employee_id === member.id);

                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-medium">
                            {member.first_name?.[0] || 'U'}{member.last_name?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{member.position || 'Team Member'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {memberReport?.overall_wellness ? `${memberReport.overall_wellness}/10` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">Wellness</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {memberReport?.stress_level ? `${memberReport.stress_level}/10` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">Stress</div>
                        </div>

                        <div className="text-center">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${memberReport?.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                            memberReport?.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              memberReport?.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {memberReport?.risk_level?.toUpperCase() || 'NO DATA'}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/manager/team-member/${member.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members</h3>
                <p className="text-gray-600">
                  No team members found. Add team members to see their wellness analytics.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recommended Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Generate dynamic action items based on team data */}
              {teamReports.filter(report => report.risk_level === 'high').length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">High Priority</h4>
                  <p className="text-sm text-red-700 mb-3">
                    {teamReports.filter(report => report.risk_level === 'high').length} team member(s) showing high risk levels. Immediate attention recommended.
                  </p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Schedule Check-ins
                  </Button>
                </div>
              )}

              {teamStats && teamStats.avg_team_wellness < 6 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Medium Priority</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Team wellness average ({teamStats.avg_team_wellness}/10) is below optimal. Consider workload review.
                  </p>
                  <Button size="sm" variant="outline">
                    Review Workload
                  </Button>
                </div>
              )}

              {teamReports.filter(report => report.risk_level === 'low' && report.overall_wellness >= 8).length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Positive Trend</h4>
                  <p className="text-sm text-green-700">
                    {teamReports.filter(report => report.risk_level === 'low' && report.overall_wellness >= 8).length} team member(s) showing excellent wellness metrics. Consider sharing best practices.
                  </p>
                </div>
              )}

              {teamReports.length === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">No Recent Data</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    No recent wellness reports from your team. Encourage team members to complete their wellness check-ins.
                  </p>
                  <Button size="sm" variant="outline">
                    Send Reminder
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}