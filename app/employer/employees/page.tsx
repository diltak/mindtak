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
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,

  Building,
  ChevronRight,
  ChevronDown,
  User,
  Crown,
  Shield,
  Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { User as UserType, MentalHealthReport as MentalHealthReportType } from '@/types';
import { useUser } from '@/hooks/use-user';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface EmployeeWithStats extends Omit<UserType, 'direct_reports'> {
  latest_report?: MentalHealthReportType;
  reports_count: number;
  average_wellness: number;
  last_report_date?: string;
  direct_reports?: EmployeeWithStats[];
}

interface HierarchyNode {
  employee: EmployeeWithStats;
  children: HierarchyNode[];
  level: number;
}

export default function EmployeesPage() {
  const { user, loading: userLoading } = useUser();
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('hierarchy');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (!['employer', 'hr', 'admin', 'manager'].includes(user.role)) {
        toast.error('Access denied. You do not have permission to view employees.');
        router.push(`/${user.role}/dashboard`);
        return;
      }

      if (user.company_id) {
        fetchEmployees();
      }
    }
  }, [user, userLoading, router]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      // Fetch all company users (employees, managers, etc.)
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('company_id', '==', user!.company_id),
        where('role', 'in', ['employee', 'manager'])
      );

      const userSnapshot = await getDocs(usersQuery);
      const usersData: UserType[] = userSnapshot.docs.map(doc => ({
        ...doc.data() as UserType,
        id: doc.id,
      }));

      // Fetch reports for each user
      const usersWithStats: EmployeeWithStats[] = [];

      const reportPromises = usersData.map(async (employee) => {
        const reportsRef = collection(db, 'mental_health_reports');
        const reportsQuery = query(
          reportsRef,
          where('employee_id', '==', employee.id)
        );

        try {
          const reportSnapshot = await getDocs(reportsQuery);
          const reports: MentalHealthReportType[] = reportSnapshot.docs.map(doc => ({
            ...doc.data() as MentalHealthReportType,
            id: doc.id,
          }));

          const sortedReports = reports.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const reportsCount = sortedReports.length || 0;
          const averageWellness = reportsCount > 0
            ? Math.round(sortedReports.reduce((sum, report) => sum + report.overall_wellness, 0) / reportsCount)
            : 0;

          const { direct_reports, ...employeeData } = employee;
          usersWithStats.push({
            ...employeeData,
            latest_report: sortedReports?.[0],
            reports_count: reportsCount,
            average_wellness: averageWellness,
            last_report_date: sortedReports?.[0]?.created_at,
            direct_reports: undefined, // Will be populated later in hierarchy building
          });
        } catch (error) {
          console.error(`Error fetching reports for employee ${employee.id}:`, error);
          const { direct_reports, ...employeeData } = employee;
          usersWithStats.push({
            ...employeeData,
            latest_report: undefined,
            reports_count: 0,
            average_wellness: 0,
            last_report_date: undefined,
            direct_reports: undefined, // Will be populated later in hierarchy building
          });
        }
      });

      await Promise.all(reportPromises);

      setEmployees(usersWithStats);
      buildHierarchy(usersWithStats);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (employees: EmployeeWithStats[]) => {
    const employeeMap = new Map<string, EmployeeWithStats>();
    employees.forEach(emp => employeeMap.set(emp.id, emp));

    // Find root employees (those without managers or whose managers aren't in the company)
    const rootEmployees: EmployeeWithStats[] = [];
    const childrenMap = new Map<string, EmployeeWithStats[]>();

    employees.forEach(employee => {
      if (employee.manager_id && employeeMap.has(employee.manager_id)) {
        // This employee has a manager in the company
        if (!childrenMap.has(employee.manager_id)) {
          childrenMap.set(employee.manager_id, []);
        }
        childrenMap.get(employee.manager_id)!.push(employee);
      } else {
        // This is a root employee (no manager or manager not in company)
        rootEmployees.push(employee);
      }
    });

    const buildTree = (employee: EmployeeWithStats, level: number = 0): HierarchyNode => {
      const children = childrenMap.get(employee.id) || [];
      return {
        employee,
        children: children.map(child => buildTree(child, level + 1)),
        level
      };
    };

    const tree = rootEmployees.map(emp => buildTree(emp));
    setHierarchyTree(tree);

    // Auto-expand first level
    const firstLevelIds = new Set(tree.map(node => node.employee.id));
    setExpandedNodes(firstLevelIds);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getRiskBadgeColor = (riskLevel?: 'low' | 'medium' | 'high') => {
    if (!riskLevel) return 'bg-gray-100 text-gray-700';
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[riskLevel];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'hr': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderHierarchyNode = (node: HierarchyNode) => {
    const { employee, children, level } = node;
    const isExpanded = expandedNodes.has(employee.id);
    const hasChildren = children.length > 0;

    return (
      <div key={employee.id} className="mb-2">
        <div 
          className={`flex items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow ${
            level > 0 ? 'ml-' + (level * 6) : ''
          }`}
          style={{ marginLeft: level * 24 }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleNode(employee.id)}
              className="mr-2 p-1 h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback>
              {getInitials(employee.first_name, employee.last_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">
                {employee.first_name} {employee.last_name}
              </h3>
              {getRoleIcon(employee.role)}
              <Badge variant="outline" className="text-xs">
                {employee.role}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{employee.email}</span>
              {employee.department && (
                <>
                  <span>•</span>
                  <span>{employee.department}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {employee.latest_report && (
              <Badge className={getRiskBadgeColor(employee.latest_report.risk_level)}>
                {employee.latest_report.risk_level} risk
              </Badge>
            )}
            <div className="text-right">
              <div className="text-sm font-medium">
                {employee.average_wellness || 'N/A'}
                {employee.average_wellness && '/10'}
              </div>
              <div className="text-xs text-gray-500">Wellness</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/employer/employees/${employee.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {children.map(child => renderHierarchyNode(child))}
          </div>
        )}
      </div>
    );
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
        <Navbar user={user || undefined} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'employer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and monitor their wellness status with organizational hierarchy.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('hierarchy')}
              >
                <Building className="h-4 w-4 mr-2" />
                Hierarchy
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Users className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
            <Link href="/employer/employees/new">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
                  <p className="text-sm text-gray-600">Total Team Members</p>
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
                  placeholder="Search team members..."
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
                <span>{filteredEmployees.length} of {employees.length} members</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {viewMode === 'hierarchy' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Organizational Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hierarchyTree.length > 0 ? (
                <div className="space-y-2">
                  {hierarchyTree.map(node => renderHierarchyNode(node))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hierarchy Data</h3>
                  <p className="text-gray-600">Add employees and set up manager relationships to see the organizational structure.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* List View */
          filteredEmployees.length > 0 ? (
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
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </h3>
                            {getRoleIcon(employee.role)}
                          </div>
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
                          <DropdownMenuItem asChild>
                            <Link href={`/employer/employees/${employee.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
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
                        {employee.latest_report ? (
                          <Badge className={getRiskBadgeColor(employee.latest_report.risk_level)}>
                            {employee.latest_report.risk_level} risk
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">No Data</Badge>
                        )}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterDepartment !== 'all' || filterRisk !== 'all'
                    ? 'No team members match your current filters. Try adjusting your search criteria.'
                    : 'You haven\'t added any team members yet. Start building your team!'
                  }
                </p>
                {!searchTerm && filterDepartment === 'all' && filterRisk === 'all' && (
                  <Link href="/employer/employees/new">
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Team Member
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}