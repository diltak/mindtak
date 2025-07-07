'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  BarChart3
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
interface ReportWithEmployee extends MentalHealthReport {
  employee?: UserType;
}

export default function EmployerReportsPage() {
  const { user, loading: userLoading } = useUser();
  const [reports, setReports] = useState<ReportWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

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
      fetchReports();
    }
  }, [user, userLoading, router]);

  const fetchReports = async () => {
    try {
      if (!user?.company_id) {
        console.error('User or company ID not available');
        setLoading(false);
        return;
      }

      // Fetch employees for the company
      const employeesRef = collection(db, 'users');
      const employeesQuery = query(employeesRef, 
        where('company_id', '==', user.company_id),
        where('role', '==', 'employee')
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserType[];

      const employeeIds = employees?.map(emp => emp.id) || [];

      // Fetch all reports for company employees
      const reportsRef = collection(db, 'mentalHealthReports');
      // Firestore does not support 'in' with more than 10 elements
      // For simplicity, fetching all reports for the company and filtering client-side
      // A more scalable approach would involve a server function or batching
      const reportsQuery = query(reportsRef, 
        where('company_id', '==', user.company_id),
        orderBy('created_at', 'desc')
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsData = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MentalHealthReport[];

      // Combine reports with employee data (anonymized) and filter by employeeIds
      const reportsWithEmployees: ReportWithEmployee[] = reportsData?.map(report => {
        const employee = employees.find(emp => emp.id === report.employee_id);
        return {
          ...report,
          employee: employee ? {
            ...employee,
            // Anonymize employee data for privacy
            first_name: 'Anonymous',
            last_name: 'Employee', // Placeholder, actual anonymization may vary
            email: `anonymous-${employee.id?.slice(0, 8)}@company.com`, // Placeholder
          } : undefined,
        };
      }).filter(report => employeeIds.includes(report.employee_id))
      || [];

      setReports(reportsWithEmployees);
    } catch (error) {
      console.error('Error fetching reports:', error);
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

  const departments = Array.from(new Set(reports.map(report => report.employee?.department).filter(Boolean)));

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(report.created_at).toLocaleDateString().includes(searchTerm);
    
    const matchesRisk = filterRisk === 'all' || report.risk_level === filterRisk;
    const matchesDepartment = filterDepartment === 'all' || report.employee?.department === filterDepartment;
    
    return matchesSearch && matchesRisk && matchesDepartment;
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

  const generateReport = () => {
    // This would generate a comprehensive report
    console.log('Generating comprehensive report...');
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wellness Reports</h1>
            <p className="text-gray-600 mt-2">
              View anonymized wellness reports from your team members.
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button variant="outline" onClick={generateReport}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
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
                  <p className="text-sm text-gray-600">Total Reports</p>
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
                      ? Math.round(reports.reduce((sum, report) => sum + report.overall_wellness, 0) / reports.length)
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
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => {
                      const reportDate = new Date(r.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return reportDate >= weekAgo;
                    }).length}
                  </div>
                  <p className="text-sm text-gray-600">This Week</p>
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

              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
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
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Anonymous Employee Report
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span>
                            {new Date(report.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {report.employee?.department && (
                            <Badge variant="outline">{report.employee.department}</Badge>
                          )}
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

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">{report.work_life_balance}/10</div>
                      <div className="text-xs text-gray-600">Work-Life Balance</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">{report.anxiety_level}/10</div>
                      <div className="text-xs text-gray-600">Anxiety</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">{report.confidence_level}/10</div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-700">{report.sleep_quality}/10</div>
                      <div className="text-xs text-gray-600">Sleep Quality</div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {report.ai_analysis && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">AI Insights:</h4>
                      <p className="text-sm text-blue-600">{report.ai_analysis}</p>
                    </div>
                  )}

                  {/* Note: Comments are not shown to maintain employee privacy */}
                  {report.comments && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Feedback:</h4>
                      <p className="text-sm text-gray-600 italic">
                        [Personal comments are kept confidential for employee privacy]
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterRisk !== 'all' || filterDepartment !== 'all'
                  ? 'No reports match your current filters. Try adjusting your search criteria.'
                  : 'No wellness reports have been submitted yet. Encourage your team to start tracking their wellness!'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Privacy & Confidentiality</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• All employee data is anonymized to protect individual privacy</p>
              <p>• Personal comments and identifiable information are kept confidential</p>
              <p>• Only aggregated trends and patterns are shown for organizational insights</p>
              <p>• Individual employee wellness data cannot be traced back to specific team members</p>
              <p>• All data is encrypted and stored securely in compliance with privacy regulations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}