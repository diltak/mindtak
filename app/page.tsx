import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Shield, TrendingUp, Users, MessageSquare, BarChart3, Building, UserCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">WellnessHub</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              </div>
              <Link href="/demo">
                <Button className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Try Demo</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              AI-Powered
              <span className="text-blue-600"> Mental Health</span>
              <br />
              Analytics Platform
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Empower your organization with comprehensive mental health insights, real-time wellness tracking, 
              and AI-driven analytics to create a healthier, more productive workplace.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-3 flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Register Your Company</span>
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Access Portals Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Portal</h2>
            <p className="mt-4 text-lg text-gray-600">
              Secure access for employers and employees with role-specific features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Employer Portal */}
            <Card className="hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Employer Portal</CardTitle>
                <CardDescription>
                  Comprehensive dashboard for managing team wellness and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Team wellness analytics and insights</li>
                  <li>• Employee account management</li>
                  <li>• Anonymous aggregate reporting</li>
                  <li>• Risk assessment and alerts</li>
                  <li>• Department-wise analytics</li>
                </ul>
                <div className="space-y-2">
                  <Link href="/auth/login">
                    <Button className="w-full">Employer Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="outline" className="w-full">Register Company</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Employee Portal */}
            <Card className="hover:shadow-lg transition-shadow duration-300 border-green-200">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Employee Portal</CardTitle>
                <CardDescription>
                  Personal wellness tracking and AI-powered mental health support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Personal wellness dashboard</li>
                  <li>• AI chatbot for mental health support</li>
                  <li>• Confidential mood and stress tracking</li>
                  <li>• Progress visualization and trends</li>
                  <li>• Wellness resources and tips</li>
                </ul>
                <div className="space-y-2">
                  <Link href="/auth/login">
                    <Button className="w-full bg-green-600 hover:bg-green-700">Employee Sign In</Button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    Account created by your employer
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Comprehensive Mental Health Solutions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to support employee wellness and organizational health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Analytics */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>AI-Powered Analytics</CardTitle>
                <CardDescription>
                  Advanced emotion detection and sentiment analysis using cutting-edge AI technology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Real-time emotion recognition</li>
                  <li>• Sentiment analysis</li>
                  <li>• Risk assessment algorithms</li>
                  <li>• Predictive wellness insights</li>
                </ul>
              </CardContent>
            </Card>

            {/* Interactive Communication */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Interactive Communication</CardTitle>
                <CardDescription>
                  Voice and text-based AI interactions with natural language processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Voice-to-text conversion</li>
                  <li>• AI chatbot support</li>
                  <li>• Confidential conversations</li>
                  <li>• 24/7 availability</li>
                </ul>
              </CardContent>
            </Card>

            {/* Comprehensive Dashboards */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Comprehensive Dashboards</CardTitle>
                <CardDescription>
                  Role-based dashboards with personalized insights and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Employee wellness tracking</li>
                  <li>• Employer analytics overview</li>
                  <li>• Custom reporting tools</li>
                  <li>• Historical trend analysis</li>
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise Security */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  HIPAA-compliant data protection with industry-leading security measures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• End-to-end encryption</li>
                  <li>• HIPAA compliance</li>
                  <li>• Role-based access control</li>
                  <li>• Audit logging</li>
                </ul>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <Users className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Comprehensive employee management and organizational insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Employee onboarding</li>
                  <li>• Department-wise analytics</li>
                  <li>• Risk assessment alerts</li>
                  <li>• Anonymous reporting</li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics & Reporting */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>Advanced Reporting</CardTitle>
                <CardDescription>
                  Generate comprehensive reports with actionable insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Wellness trend reports</li>
                  <li>• Stress level indicators</li>
                  <li>• Engagement metrics</li>
                  <li>• Custom report builder</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-200">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Workplace Wellness?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of organizations already using WellnessHub to create healthier, 
            more productive work environments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="px-8 py-3 flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Register Your Company</span>
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 border-white hover:bg-white hover:text-blue border-w-600">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">WellnessHub</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 WellnessHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
