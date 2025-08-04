'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import type { User as UserType } from '@/types';

interface Employee extends UserType {
    // Additional employee-specific fields if needed
}

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const employeeId = params.id as string;
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/');
            return;
        }

        if (user?.role !== 'employer') {
            // router.push('/employee/dashboard');
            return;
        }
    }, [user, userLoading, router]);

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!user || user.role !== 'employer') return;

            try {
                // Fetch from 'users' collection, not 'employees'
                const employeeDoc = await getDoc(doc(db, 'users', employeeId));

                if (employeeDoc.exists()) {
                    const employeeData = employeeDoc.data() as UserType;

                    // Verify this employee belongs to the current employer's company
                    if (employeeData.company_id !== (user as any).company_id) {
                        setError('Employee not found or access denied');
                        return;
                    }

                    // Verify this is actually an employee
                    if (employeeData.role !== 'employee') {
                        setError('User is not an employee');
                        return;
                    }

                    setEmployee({ ...employeeData, id: employeeDoc.id } as Employee);
                } else {
                    setError('Employee not found');
                }
            } catch (err) {
                console.error('Error fetching employee:', err);
                setError('Failed to load employee data');
            } finally {
                setLoading(false);
            }
        };

        if (employeeId && user && user.role === 'employer') {
            fetchEmployee();
        }
    }, [employeeId, user]);

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

    if (error || !employee) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar user={user} />
                <div className="container mx-auto p-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            {error || 'Employee not found'}
                        </h1>
                        <Link href="/employer/employees">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Employees
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/employer/employees">
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Employees
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">{employee.first_name} {employee.last_name}</h1>
                    <p className="text-gray-600">{employee.department || 'No department assigned'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-gray-500" />
                                <span>{employee.email}</span>
                            </div>
                            {employee.phone && (
                                <div className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4 text-gray-500" />
                                    <span>{employee.phone}</span>
                                </div>
                            )}
                            {employee.hire_date && (
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                    <span>Hired: {new Date(employee.hire_date).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                <span>Joined: {new Date(employee.created_at).toLocaleDateString()}</span>
                            </div>
                            {employee.last_login && (
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                    <span>Last Login: {new Date(employee.last_login).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div>
                                <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                                    {employee.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Employment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Position</label>
                                <p className="text-lg">{employee.position || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Department</label>
                                <p className="text-lg">{employee.department || 'Not specified'}</p>
                            </div>
                            {employee.employee_id && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                                    <p className="text-lg">{employee.employee_id}</p>
                                </div>
                            )}
                            {employee.manager_id && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Manager ID</label>
                                    <p className="text-lg">{employee.manager_id}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-500">User ID</label>
                                <p className="text-sm text-gray-600 font-mono">{employee.id}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-4">
                    <Button>Edit Employee</Button>
                    <Button variant="outline">View Performance</Button>
                    <Button variant="outline">Generate Report</Button>
                </div>
            </div>
        </div>
    );
}