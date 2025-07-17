'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Keep this import
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock, // Keep this import
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { User as UserType, MentalHealthReport as MentalHealthReportType } from '@/types';
import { useUser } from '@/hooks/use-user';
import { db } from '@/lib/firebase'; // Import db from Firebase
// import { DocumentSnapshot, DocumentData } from 'firebase/firestore';

interface EmployeeWithStats extends UserType {
  latest_report?: MentalHealthReportType;
  reports_count: number;
  average_wellness: number;
  last_report_date?: string;
}

export default function EmployeesPage() {
  const { user, loading: userLoading } = useUser();
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const router = useRouter(); // Initialize router

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user?.role !== 'employer') {
      // router.push('/employee/dashboard');
      return;
    }

    if (user && user.role === 'employer' && user.company_id) {
      fetchEmployees();
    }
  }, [user, userLoading, router]);

  const fetchEmployees = async () => { // Added async keyword
    try {
      // Fetch company employees
      const employeesRef = collection(db, 'users');
      const employeesQuery = query(
        employeesRef,
        where('company_id', '==', (user as UserType & { company_id: string }).company_id),
        where('role', '==', 'employee')
        // Removed orderBy to avoid index requirements - will sort in JavaScript
      );

      const employeeSnapshot = await getDocs(employeesQuery);

      const employeesData: UserType[] = employeeSnapshot.docs.map(doc => ({
        ...doc.data() as UserType,
        id: doc.id, // Explicitly assign id from doc.id
      }));

      if (!employeesData) {
        console.error('No employees found');
        return;
      }

      // Fetch reports for each employee
      const employeesWithStats: EmployeeWithStats[] = [];

      const reportPromises = employeesData.map(async (employee) => {
        const reportsRef = collection(db, 'mental_health_reports');
        const reportsQuery = query(
          reportsRef,
          where('employee_id', '==', employee.id) // Fixed field name
          // Removed orderBy to avoid index requirements - will sort in JavaScript
        );

        try {
          const reportSnapshot = await getDocs(reportsQuery);

          const reports: MentalHealthReportType[] = reportSnapshot.docs.map(doc => ({
            ...doc.data() as MentalHealthReportType,
            id: doc.id,
          }));

          // Sort reports by created_at in JavaScript (newest first)
          const sortedReports = reports.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const reportsCount = sortedReports.length || 0;
          const averageWellness = reportsCount > 0
            ? Math.round(sortedReports.reduce((sum: number, report: MentalHealthReportType) => sum + report.overall_wellness, 0) / reportsCount)
            : 0;

          employeesWithStats.push({
            ...employee,
            latest_report: sortedReports?.[0], // Get the most recent report
            reports_count: reportsCount,
            average_wellness: averageWellness,
            last_report_date: sortedReports?.[0]?.created_at,
          });
        } catch (error) {
          console.error(`Error fetching reports for employee ${employee.id}:`, error);
          // Add employee with no report data
          employeesWithStats.push({
            ...employee,
            latest_report: undefined,
            reports_count: 0,
            average_wellness: 0,
            last_report_date: undefined,
          });
        }
      });

      // Wait for all report fetches to complete
      await Promise.all(reportPromises);



      setEmployees(employeesWithStats);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (riskLevel?: 'low' | 'medium' | 'high') => {
    if (!riskLevel) return <Badge className="bg-gray-100 text-gray-700">No Data</Badge>;

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)));

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' ||
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesRisk = filterRisk === 'all' || employee.latest_report?.risk_level === filterRisk;

    return matchesSearch && matchesDepartment && matchesRisk;
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and monitor their wellness status.
            </p>
          </div>
          <Link href="/employer/employees/new">
            <Button className="mt-4 sm:mt-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.latest_report?.risk_level === 'low').length}
                  </div>
                  <p className="text-sm text-gray-600">Low Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.latest_report?.risk_level === 'medium').length}
                  </div>
                  <p className="text-sm text-gray-600">Medium Risk</p>
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
                    {employees.filter(emp => emp.latest_report?.risk_level === 'high').length}
                  </div>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <span>{filteredEmployees.length} of {employees.length} employees</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        {filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {getInitials(employee.first_name, employee.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{employee.email}</span>
                        </div>
                        {employee.department && (
                          <p className="text-sm text-gray-600">{employee.department}</p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Employee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Wellness Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-700">
                        {employee.average_wellness || 'N/A'}
                        {employee.average_wellness && '/10'}
                      </div>
                      <div className="text-xs text-blue-600">Avg Wellness</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-700">
                        {employee.reports_count}
                      </div>
                      <div className="text-xs text-purple-600">Total Reports</div>
                    </div>
                  </div>

                  {/* Risk Level and Last Report */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Risk Level:</span>
                      {getRiskLevelBadge(employee.latest_report?.risk_level)}
                    </div>

                    {employee.last_report_date && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(employee.last_report_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Latest Metrics */}
                  {employee.latest_report && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {employee.latest_report.mood_rating}/10
                          </div>
                          <div className="text-gray-600">Mood</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {employee.latest_report.stress_level}/10
                          </div>
                          <div className="text-gray-600">Stress</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {employee.latest_report.energy_level}/10
                          </div>
                          <div className="text-gray-600">Energy</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {employee.latest_report.work_satisfaction}/10
                          </div>
                          <div className="text-gray-600">Work Sat.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employees Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterDepartment !== 'all' || filterRisk !== 'all'
                  ? 'No employees match your current filters. Try adjusting your search criteria.'
                  : 'You haven\'t added any employees yet. Start building your team!'
                }
              </p>
              {!searchTerm && filterDepartment === 'all' && filterRisk === 'all' && (
                <Link href="/employer/employees/new">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Employee
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}