'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  ArrowLeft,
  Eye,
  Shield
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { getHierarchyFilteredReports, getDirectReports } from '@/lib/hierarchy-service';
import { getDemoUser, demoReports, demoUsers } from '@/lib/demo-data';
import type { MentalHealthReport, User } from '@/types/index';

interface ReportWithEmployee extends MentalHealthReport {
  employee?: User;
}

export default function ManagerTeamReportsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [reports, setReports] = useState<ReportWithEmployee[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    fetchTeamReports();
  }, [user, userLoading]);

  const fetchTeamReports = async () => {
    try {
      setLoading(true);
      
      // Use demo user if no real user
      const currentUser = user || getDemoUser('manager');
      
      try {
        // Try to get real data
        const filteredReports = await getHierarchyFilteredReports(currentUser.id, currentUser.company_id || 'demo-company', 30);
        const directReports = await getDirectReports(currentUser.id);
        
        // Combine reports with employee data
        const reportsWithEmployees: ReportWithEmployee[] = filteredReports.map(report => {
          const employee = directReports.find(emp => emp.id === report.employee_id);
          return {
            ...report,
            employee
          };
        });

        setReports(reportsWithEmployees);
        setTeamMembers(directReports);
      } catch (error) {
        console.log('Using demo data for team reports');
        // Use demo data
        const demoTeamMembers = demoUsers.filter(u => u.manager_id === 'demo-manager-1');
        const reportsWithEmployees: ReportWithEmployee[] = demoReports.map(report => {
          const employee = demoTeamMembers.find(emp => emp.id === report.employee_id);
          return {
            ...report,
            employee
          };
        });
        
        setReports(reportsWithEmployees);
        setTeamMembers(demoTeamMembers);
      }
    } catch (error) {
      console.error('Error fetching team reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-red-100 text-red-700 border-red-200',
    };
    const icons = {
      low: <CheckCircle className="h-3 w-3" />,
      medium: <Clock className="h-3 w-3" />,
      high: <AlertTriangle className="h-3 w-3" />,
    };
    return (
      <Badge className={`${colors[riskLevel]} flex items-center space-x-1`}>
        {icons[riskLevel]}
        <span>{riskLevel.toUpperCase()}</span>
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(report.created_at).toLocaleDateString().includes(searchTerm);
    
    const matchesRisk = filterRisk === 'all' || report.risk_level === filterRisk;
    const matchesEmployee = filterEmployee === 'all' || report.employee_id === filterEmployee;
    
    return matchesSearch && matchesRisk && matchesEmployee;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'wellness-high':
        return b.overall_wellness - a.overall_wellness;
      case 'wellness-low':
        return a.overall_wellness - b.overall_wellness;
      case 'stress-high':
        return b.stress_level - a.stress_level;
      case 'stress-low':
        return a.stress_level - b.stress_level;
      case 'risk-high':
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.risk_level] - riskOrder[a.risk_level];
      default: // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Team Wellness Reports</h1>
            <p className="text-gray-600 mt-2">
              View and monitor wellness reports from your direct reports and team members.
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => window.print()}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
                  <p className="text-sm text-gray-600">Team Reports</p>
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
                    {reports.length > 0 
                      ? Math.round(reports.reduce((sum, report) => sum + report.overall_wellness, 0) / reports.length * 10) / 10
                      : 0
                    }/10
                  </div>
                  <p className="text-sm text-gray-600">Avg Team Wellness</p>
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
                    {reports.filter(r => r.risk_level === 'high').length}
                  </div>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {teamMembers.length}
                  </div>
                  <p className="text-sm text-gray-600">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="wellness-high">Highest Wellness</SelectItem>
                  <SelectItem value="wellness-low">Lowest Wellness</SelectItem>
                  <SelectItem value="stress-high">Highest Stress</SelectItem>
                  <SelectItem value="stress-low">Lowest Stress</SelectItem>
                  <SelectItem value="risk-high">Highest Risk</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <span>{filteredReports.length} of {reports.length} reports</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {sortedReports.length > 0 ? (
          <div className="space-y-6">
            {sortedReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {report.employee?.first_name?.[0]}{report.employee?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.employee ? `${report.employee.first_name} ${report.employee.last_name}` : 'Team Member'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{report.employee?.position || 'Employee'}</span>
                          <span>
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {report.session_type === 'voice' ? 'Voice Session' : 'Text Session'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getRiskLevelBadge(report.risk_level)}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {report.overall_wellness}/10
                        </div>
                        <div className="text-sm text-gray-600">Overall Wellness</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-700">
                        {report.mood_rating}/10
                      </div>
                      <div className="text-xs text-blue-600">Mood</div>
                    </div>

                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-700">
                        {report.stress_level}/10
                      </div>
                      <div className="text-xs text-red-600">Stress</div>
                    </div>

                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-700">
                        {report.energy_level}/10
                      </div>
                      <div className="text-xs text-green-600">Energy</div>
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-700">
                        {report.work_satisfaction}/10
                      </div>
                      <div className="text-xs text-purple-600">Work Satisfaction</div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {report.ai_analysis && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">AI Insights:</h4>
                      <p className="text-sm text-blue-600">{report.ai_analysis}</p>
                    </div>
                  )}

                  {/* Manager Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Session Duration: {Math.floor((report.session_duration || 0) / 60)}m {(report.session_duration || 0) % 60}s
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Schedule Check-in
                      </Button>
                      <Button variant="outline" size="sm">
                        Send Resources
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Reports Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterRisk !== 'all' || filterEmployee !== 'all'
                  ? 'No reports match your current filters. Try adjusting your search criteria.'
                  : 'Your team members haven\'t submitted any wellness reports yet. Encourage them to start tracking their wellness!'
                }
              </p>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View Team Members
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manager Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Manager Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">When to Take Action:</h4>
                <ul className="space-y-1">
                  <li>• High risk employees need immediate attention</li>
                  <li>• Declining wellness trends over multiple reports</li>
                  <li>• Stress levels consistently above 7/10</li>
                  <li>• Work satisfaction below 5/10</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                <ul className="space-y-1">
                  <li>• Schedule one-on-one check-ins</li>
                  <li>• Provide mental health resources</li>
                  <li>• Adjust workload if necessary</li>
                  <li>• Connect with HR for additional support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}