'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, Mail, User, Building } from 'lucide-react';
import { auth, db } from '@/lib/firebase'; // Import Firebase auth and db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
export default function NewEmployeePage() {
  const { user } = useUser();
  const router = useRouter();


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!user || user.role !== 'employer' || !user.company_id) {
      return router.push('/'); // Redirect if not authorized
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
        // Create user profile
        const userDocRef = doc(collection(db, 'users'), firebaseUser.uid); // Assuming db is imported from '@/lib/firebase'
        await setDoc(userDocRef, {
          id: firebaseUser.uid, // Use Firebase Auth UID as document ID and id field
          email: formData.email,
          role: 'employee',
          first_name: formData.firstName,
          last_name: formData.lastName,
          department: formData.department || '',
          company_id: user.company_id,
        });

        toast.success('Employee added successfully!');
        router.push('/employer/employees');
      } else {
        setError('Failed to create employee profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to add employees.</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Only employers can add employees.</p>
          <Link href="/employee/dashboard">
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
          <Link href="/employer/employees" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
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
                  <User className="h-5 w-5" />
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
                <Link href="/employer/employees">
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