'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, Mail, User as UserIcon, Building, Users, Shield, Crown } from 'lucide-react';
import { auth, db } from '@/lib/firebase'; // Import Firebase auth and db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { useUser } from '@/hooks/use-user';
import { updateReportingChain } from '@/lib/hierarchy-service';
import { toast } from 'sonner';
import type { User } from '@/types/index';
export default function NewEmployeePage() {
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch potential managers on component mount
  useEffect(() => {
    const fetchManagers = async () => {
      if (!user?.company_id) return;
      
      try {
        const managersRef = collection(db, 'users');
        const managersQuery = query(
          managersRef,
          where('company_id', '==', user.company_id),
          where('is_active', '==', true)
        );
        const managersSnapshot = await getDocs(managersQuery);
        const managersData = managersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(u => u.role === 'manager' || u.role === 'hr' || u.role === 'admin' || u.role === 'employer');
        
        setManagers(managersData);
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    };

    fetchManagers();
  }, [user?.company_id]);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    managerId: '',
    hierarchyLevel: '4', // Default to individual contributor
    password: '',
    confirmPassword: '',
    canViewTeamReports: false,
    canApproveLeaves: false,
    canManageEmployees: false,
    isDepartmentHead: false,
    skipLevelAccess: false,
  });

  const [managers, setManagers] = useState<any[]>([]);

  const departments = [
    'Engineering',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Operations',
    'Customer Support',
    'Product',
    'Design',
    'Legal',
    'Other'
  ];

  const hierarchyLevels = [
    { value: '0', label: 'Executive (CEO, President)', icon: Crown },
    { value: '1', label: 'Senior Management (VP, SVP)', icon: Crown },
    { value: '2', label: 'Middle Management (Director)', icon: Shield },
    { value: '3', label: 'Team Lead (Manager)', icon: Users },
    { value: '4', label: 'Individual Contributor', icon: UserIcon },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field.startsWith('can') || field.startsWith('is') || field === 'skipLevelAccess' 
        ? value === 'true' 
        : value 
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user || !user.company_id) {
      setError('User information not available');
      setLoading(false);
      return;
    }

    if (!['employer', 'hr', 'admin', 'manager'].includes(user.role)) {
      setError('You do not have permission to add employees');
      setLoading(false);
      return;
    }

    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Determine role based on hierarchy level and permissions
        let role = 'employee';
        const hierarchyLevel = parseInt(formData.hierarchyLevel);
        if (hierarchyLevel <= 2 || formData.canManageEmployees) {
          role = 'manager';
        }

        // Create user profile with hierarchy data
        const userDocRef = doc(collection(db, 'users'), firebaseUser.uid);
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: formData.email,
          role: role,
          first_name: formData.firstName,
          last_name: formData.lastName,
          department: formData.department || '',
          position: formData.position || '',
          company_id: user.company_id,
          manager_id: formData.managerId && formData.managerId !== 'none' ? formData.managerId : null,
          hierarchy_level: hierarchyLevel,
          is_department_head: formData.isDepartmentHead,
          can_view_team_reports: formData.canViewTeamReports,
          can_approve_leaves: formData.canApproveLeaves,
          can_manage_employees: formData.canManageEmployees,
          skip_level_access: formData.skipLevelAccess,
          direct_reports: [],
          reporting_chain: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Update reporting chain if manager is assigned
        if (formData.managerId && formData.managerId !== 'none') {
          await updateReportingChain(firebaseUser.uid, formData.managerId);
        }

        toast.success('Employee added successfully with hierarchy setup!');
        
        // Redirect based on user role
        const redirectPath = user.role === 'employer' ? '/employer/employees' : `/${user.role}/employees`;
        router.push(redirectPath);
      } else {
        setError('Failed to create employee profile');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // Show a loading spinner while user info is being fetched
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
          <p className="text-gray-600 mb-4">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!['employer', 'hr', 'admin', 'manager'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You do not have permission to add employees.</p>
          <Link href={`/${user.role}/dashboard`}>
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={user.role === 'employer' ? '/employer/employees' : `/${user.role}/employees`} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-gray-600 mt-2">
            Create an account for a new team member to start tracking their wellness.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-6 w-6" />
              <span>Employee Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <UserIcon className="h-5 w-5" />
                  <span>Personal Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Work Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Position/Title</Label>
                    <Input
                      id="position"
                      placeholder="Software Engineer"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Hierarchy Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Hierarchy & Reporting</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hierarchyLevel">Hierarchy Level</Label>
                    <Select value={formData.hierarchyLevel} onValueChange={(value) => handleInputChange('hierarchyLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hierarchy level" />
                      </SelectTrigger>
                      <SelectContent>
                        {hierarchyLevels.map(level => {
                          const IconComponent = level.icon;
                          return (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center space-x-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{level.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerId">Reports To (Manager)</Label>
                    <Select value={formData.managerId} onValueChange={(value) => handleInputChange('managerId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {managers.map(manager => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.first_name} {manager.last_name} - {manager.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Permissions & Responsibilities</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isDepartmentHead">Department Head</Label>
                        <p className="text-sm text-gray-500">Can oversee entire department</p>
                      </div>
                      <Switch
                        id="isDepartmentHead"
                        checked={formData.isDepartmentHead}
                        onCheckedChange={(checked) => handleInputChange('isDepartmentHead', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="canViewTeamReports">View Team Reports</Label>
                        <p className="text-sm text-gray-500">Access team wellness reports</p>
                      </div>
                      <Switch
                        id="canViewTeamReports"
                        checked={formData.canViewTeamReports}
                        onCheckedChange={(checked) => handleInputChange('canViewTeamReports', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="canApproveLeaves">Approve Leaves</Label>
                        <p className="text-sm text-gray-500">Can approve time-off requests</p>
                      </div>
                      <Switch
                        id="canApproveLeaves"
                        checked={formData.canApproveLeaves}
                        onCheckedChange={(checked) => handleInputChange('canApproveLeaves', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="canManageEmployees">Manage Employees</Label>
                        <p className="text-sm text-gray-500">Can add/edit team members</p>
                      </div>
                      <Switch
                        id="canManageEmployees"
                        checked={formData.canManageEmployees}
                        onCheckedChange={(checked) => handleInputChange('canManageEmployees', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between md:col-span-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="skipLevelAccess">Skip-Level Access</Label>
                        <p className="text-sm text-gray-500">Can view reports of subordinates' teams</p>
                      </div>
                      <Switch
                        id="skipLevelAccess"
                        checked={formData.skipLevelAccess}
                        onCheckedChange={(checked) => handleInputChange('skipLevelAccess', checked.toString())}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Account Security</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPassword}
                  >
                    Generate Password
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link href={user.role === 'employer' ? '/employer/employees' : `/${user.role}/employees`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Important Information</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• The employee will receive login credentials via email</li>
              <li>• They can change their password after first login</li>
              <li>• All wellness data will be encrypted and secure</li>
              <li>• You'll only see anonymized aggregate data for privacy</li>
              <li>• Employees can update their profile information anytime</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
