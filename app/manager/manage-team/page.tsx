'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  Edit,
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  ArrowLeft,
  UserPlus,
  Settings,
  MoreVertical
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { getDirectReports } from '@/lib/hierarchy-service';
import { getDemoUser, demoUsers } from '@/lib/demo-data';
import type { User } from '@/types/index';

export default function ManageTeamPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchTeamMembers();
  }, [user, userLoading]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      const currentUser = user || getDemoUser('manager');
      
      try {
        // Try to get real data
        const directReports = await getDirectReports(currentUser.id);
        setTeamMembers(directReports);
      } catch (error) {
        console.log('Using demo data for team management');
        // Use demo data
        const demoTeamMembers = demoUsers.filter(u => u.manager_id === 'demo-manager-1');
        setTeamMembers(demoTeamMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(teamMembers.map(member => member.department).filter((dept): dept is string => Boolean(dept)))];

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && member.is_active) ||
      (filterStatus === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleViewMember = (memberId: string) => {
    router.push(`/manager/team-member/${memberId}`);
  };

  const handleEditMember = (memberId: string) => {
    router.push(`/manager/edit-member/${memberId}`);
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Manage Team</h1>
            <p className="text-gray-600 mt-2">
              Manage your direct reports and team member information.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Request New Member
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
                  <p className="text-sm text-gray-600">Total Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
                  <p className="text-sm text-gray-600">Departments</p>
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
                    {teamMembers.filter(m => m.is_active).length}
                  </div>
                  <p className="text-sm text-gray-600">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Settings className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.hierarchy_level === 4).length}
                  </div>
                  <p className="text-sm text-gray-600">Individual Contributors</p>
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <span>{filteredMembers.length} of {teamMembers.length} members</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members List */}
        {filteredMembers.length > 0 ? (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.first_name} {member.last_name}
                          </h3>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {member.hierarchy_level !== undefined && (
                            <Badge variant="outline">
                              Level {member.hierarchy_level}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{member.position || 'Employee'}</span>
                          </span>
                          
                          {member.department && (
                            <span className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{member.department}</span>
                            </span>
                          )}
                          
                          {member.email && (
                            <span className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{member.email}</span>
                            </span>
                          )}
                          
                          {member.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{member.phone}</span>
                            </span>
                          )}
                        </div>

                        {member.hire_date && (
                          <div className="mt-2 text-xs text-gray-500">
                            Joined: {new Date(member.hire_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMember(member.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Permissions:</span>
                        <div className="mt-1 space-y-1">
                          {member.can_view_team_reports && (
                            <Badge variant="outline" className="text-xs mr-1">View Reports</Badge>
                          )}
                          {member.can_manage_employees && (
                            <Badge variant="outline" className="text-xs mr-1">Manage Team</Badge>
                          )}
                          {member.can_approve_leaves && (
                            <Badge variant="outline" className="text-xs mr-1">Approve Leaves</Badge>
                          )}
                          {member.is_department_head && (
                            <Badge variant="outline" className="text-xs mr-1">Dept Head</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Reporting:</span>
                        <div className="mt-1 text-gray-600">
                          {member.direct_reports && member.direct_reports.length > 0 ? (
                            <span>{member.direct_reports.length} direct reports</span>
                          ) : (
                            <span>No direct reports</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Last Activity:</span>
                        <div className="mt-1 text-gray-600">
                          {member.last_login ? (
                            new Date(member.last_login).toLocaleDateString()
                          ) : (
                            'Never logged in'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
                {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                  ? 'No team members match your current filters. Try adjusting your search criteria.'
                  : 'You don\'t have any team members assigned yet.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Request New Team Member
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Team Update
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Team Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
