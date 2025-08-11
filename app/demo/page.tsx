'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Play,
  BarChart3,
  MessageSquare,
  Eye,
  Settings
} from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();
  const [selectedDemo, setSelectedDemo] = useState<string>('');

  const demos = [
    {
      id: 'employee',
      title: 'Employee Experience',
      description: 'Experience the employee wellness dashboard and AI chat',
      icon: User,
      color: 'bg-green-100 text-green-700 border-green-200',
      features: ['AI Mental Health Chat', 'Personal Wellness Dashboard', 'Mood & Stress Tracking', 'Progress Visualization'],
      route: '/employee/chat',
      demoData: 'Sample employee with wellness history'
    },
    {
      id: 'manager',
      title: 'Manager Dashboard',
      description: 'Explore team management and hierarchy features',
      icon: Users,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      features: ['Team Wellness Overview', 'Direct Reports Management', 'Organization Chart', 'Team Analytics'],
      route: '/manager/dashboard',
      demoData: 'Manager with 5 direct reports'
    },
    {
      id: 'employer',
      title: 'Employer Analytics',
      description: 'Full company insights and employee management',
      icon: Building,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      features: ['Company-wide Analytics', 'Employee Management', 'Department Insights', 'Risk Assessment'],
      route: '/employer/dashboard',
      demoData: 'Company with 50+ employees'
    },
    {
      id: 'hierarchy',
      title: 'Hierarchy System',
      description: 'Test the organizational hierarchy features',
      icon: Shield,
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      features: ['Org Chart Visualization', 'Permission Testing', 'Team Statistics', 'Access Control'],
      route: '/test-hierarchy',
      demoData: 'Multi-level organization structure'
    }
  ];

  const quickActions = [
    {
      title: 'AI Chat Demo',
      description: 'Try the AI mental health assistant',
      icon: MessageSquare,
      route: '/employee/chat',
      color: 'text-green-600'
    },
    {
      title: 'Manager Dashboard',
      description: 'View team management features',
      icon: Users,
      route: '/manager/dashboard',
      color: 'text-blue-600'
    },
    {
      title: 'Analytics Overview',
      description: 'Explore company analytics',
      icon: BarChart3,
      route: '/employer/analytics',
      color: 'text-purple-600'
    },
    {
      title: 'Org Chart',
      description: 'Interactive organization chart',
      icon: Eye,
      route: '/manager/org-chart',
      color: 'text-orange-600'
    },
    {
      title: 'Test System',
      description: 'Test hierarchy functions',
      icon: Settings,
      route: '/test-hierarchy',
      color: 'text-red-600'
    }
  ];

  const handleDemoStart = (route: string) => {
    router.push(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">WellnessHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Role-Based Login</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore all features of the WellnessHub platform with sample data. 
            No registration required - jump right into any role or feature.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <Card 
                key={action.title}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => handleDemoStart(action.route)}
              >
                <CardContent className="p-4 text-center">
                  <action.icon className={`h-8 w-8 mx-auto mb-2 ${action.color}`} />
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Demos */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Detailed Demos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {demos.map((demo) => (
              <Card 
                key={demo.id}
                className={`hover:shadow-lg transition-all duration-300 ${demo.color.replace('text-', 'border-').replace('bg-', 'border-')}`}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${demo.color}`}>
                    <demo.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{demo.title}</CardTitle>
                  <p className="text-gray-600">{demo.description}</p>
                  <Badge variant="outline" className="text-xs mt-2">
                    {demo.demoData}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Demo Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {demo.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handleDemoStart(demo.route)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start {demo.title} Demo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo Information */}
        <div className="mt-12">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Demo Information</h3>
                <p className="text-gray-600">
                  This interactive demo showcases the complete WellnessHub platform with realistic sample data
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sample Data</h4>
                  <p className="text-sm text-gray-600">
                    Pre-populated with realistic employee wellness data, team structures, and analytics
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Full Features</h4>
                  <p className="text-sm text-gray-600">
                    Access all platform features including AI chat, analytics, org charts, and management tools
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">No Registration</h4>
                  <p className="text-sm text-gray-600">
                    Jump right in and explore - no account creation or authentication required
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">AI-Powered Chat</Badge>
                  <Badge variant="secondary">Team Management</Badge>
                  <Badge variant="secondary">Wellness Analytics</Badge>
                  <Badge variant="secondary">Org Chart</Badge>
                  <Badge variant="secondary">Role-Based Access</Badge>
                  <Badge variant="secondary">Real-time Data</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
