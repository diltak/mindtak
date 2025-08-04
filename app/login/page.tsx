'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Users, 
  Building, 
  Shield, 
  ArrowLeft,
  User,
  Crown
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleLogin = (role: string) => {
    // For demo purposes, we'll simulate login by redirecting to appropriate dashboard
    // In a real app, this would handle actual authentication
    
    switch (role) {
      case 'employee':
        router.push('/employee/chat');
        break;
      case 'manager':
        router.push('/manager/dashboard');
        break;
      case 'employer':
        router.push('/employer/dashboard');
        break;
      case 'hr':
        router.push('/employer/analytics');
        break;
      default:
        router.push('/employee/chat');
    }
  };

  const roles = [
    {
      id: 'employee',
      title: 'Employee',
      description: 'Access personal wellness dashboard and AI chat',
      icon: User,
      color: 'bg-green-100 text-green-700 border-green-200',
      features: ['Personal wellness tracking', 'AI mental health support', 'Confidential reporting', 'Progress visualization']
    },
    {
      id: 'manager',
      title: 'Manager',
      description: 'Manage your team and view team wellness analytics',
      icon: Users,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      features: ['Team dashboard', 'Direct reports management', 'Team wellness analytics', 'Organization chart']
    },
    {
      id: 'employer',
      title: 'Employer',
      description: 'Full company analytics and employee management',
      icon: Building,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      features: ['Company-wide analytics', 'Employee management', 'Department insights', 'Risk assessment']
    },
    {
      id: 'hr',
      title: 'HR Admin',
      description: 'Human resources and compliance management',
      icon: Shield,
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      features: ['HR analytics', 'Compliance reporting', 'Employee privacy management', 'Policy insights']
    }
  ];

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Mind-DiLTak</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {selectedRole ? `${selectedRoleData?.title} Login` : 'Choose Your Role'}
          </h1>
          <p className="text-lg text-gray-600">
            {selectedRole 
              ? `Access your ${selectedRoleData?.title.toLowerCase()} dashboard and features`
              : 'Select your role to access the appropriate dashboard and features'
            }
          </p>
        </div>

        {selectedRole ? (
          // Single role view
          <div className="max-w-md mx-auto">
            <Card className={`hover:shadow-lg transition-shadow duration-300 ${selectedRoleData?.color.replace('text-', 'border-').replace('bg-', 'border-')}`}>
              <CardHeader className="text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${selectedRoleData?.color}`}>
                  {selectedRoleData?.icon && <selectedRoleData.icon className="h-8 w-8" />}
                </div>
                <CardTitle className="text-2xl">{selectedRoleData?.title}</CardTitle>
                <p className="text-gray-600">{selectedRoleData?.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Available Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {selectedRoleData?.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleRoleLogin(selectedRole)}
                  >
                    Continue as {selectedRoleData?.title}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedRole('')}
                  >
                    Choose Different Role
                  </Button>
                </div>

                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    Demo Mode - No Authentication Required
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Role selection grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {roles.map((role) => (
              <Card 
                key={role.id}
                className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${role.color.replace('text-', 'border-').replace('bg-', 'border-')} hover:scale-105`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${role.color}`}>
                    <role.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <p className="text-gray-600">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {role.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" variant="outline">
                    Select {role.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Crown className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Demo Mode</h3>
              </div>
              <p className="text-blue-700 mb-4">
                This is a demonstration version. No authentication is required - simply select your role to explore the features.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <Badge variant="outline" className="text-blue-700">No Login Required</Badge>
                <Badge variant="outline" className="text-blue-700">Full Feature Access</Badge>
                <Badge variant="outline" className="text-blue-700">Sample Data</Badge>
                <Badge variant="outline" className="text-blue-700">Interactive Demo</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}