'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Filter,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Settings,
  Save,
  Play,
  Loader2
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MentalHealthReport, User as UserType } from '@/types';

interface CustomReportConfig {
  name: string;
  description: string;
  dateRange: {
    start: string;
    end: string;
    preset: string;
  };
  filters: {
    departments: string[];
    riskLevels: string[];
    employeeIds: string[];
  };
  metrics: {
    wellness: boolean;
    mood: boolean;
    stress: boolean;
    energy: boolean;
    workSatisfaction: boolean;
    workLifeBalance: boolean;
    anxiety: boolean;
    confidence: boolean;
    sleepQuality: boolean;
  };
  groupBy: 'department' | 'employee' | 'date' | 'risk_level';
  format: 'csv' | 'pdf' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
}

export default function CustomReportPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [reportConfig, setReportConfig] = useState<CustomReportConfig>({
    name: '',
    description: '',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      preset: '30d'
    },
    filters: {
      departments: [],
      riskLevels: [],
      employeeIds: []
    },
    metrics: {
      wellness: true,
      mood: true,
      stress: true,
      energy: true,
      workSatisfaction: false,
      workLifeBalance: false,
      anxiety: false,
      confidence: false,
      sleepQuality: false
    },
    groupBy: 'department',
    format: 'csv',
    includeCharts: false,
    includeRawData: true
  });

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (user.role !== 'employer') {
        toast.error('Access denied. Employer role required.');
        router.push('/');
        return;
      }

      if (user.company_id) {
        loadEmployees();
      }
    }
  }, [user, userLoading, router]);

  const loadEmployees = async () => {
    try {
      const employeesQuery = query(
        collection(db, 'users'),
        where('company_id', '==', user!.company_id),
        where('role', 'in', ['employee', 'manager'])
      );

      const snapshot = await getDocs(employeesQuery);
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserType));

      setEmployees(employeesData);

      // Extract unique departments
      const uniqueDepartments = Array.from(
        new Set(employeesData.map(emp => emp.department).filter(Boolean))
      ) as string[];
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employee data');
    }
  };

  const handleDatePresetChange = (preset: string) => {
    const end = new Date().toISOString().split('T')[0];
    let start = '';

    switch (preset) {
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '1y':
        start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setReportConfig(prev => ({
      ...prev,
      dateRange: { start, end, preset }
    }));
  };

  const generateReport = async () => {
    if (!reportConfig.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    setLoading(true);
    try {
      // Fetch reports based on filters
      const reportsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user!.company_id)
      );

      const snapshot = await getDocs(reportsQuery);
      let reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MentalHealthReport));

      // Apply date filter
      reports = reports.filter(report => {
        const reportDate = new Date(report.created_at);
        const startDate = new Date(reportConfig.dateRange.start);
        const endDate = new Date(reportConfig.dateRange.end);
        return reportDate >= startDate && reportDate <= endDate;
      });

      // Apply department filter
      if (reportConfig.filters.departments.length > 0) {
        const employeesByDept = employees.filter(emp => 
          reportConfig.filters.departments.includes(emp.department || '')
        );
        const employeeIds = new Set(employeesByDept.map(emp => emp.id));
        reports = reports.filter(report => employeeIds.has(report.employee_id));
      }

      // Apply risk level filter
      if (reportConfig.filters.riskLevels.length > 0) {
        reports = reports.filter(report => 
          reportConfig.filters.riskLevels.includes(report.risk_level)
        );
      }

      // Apply employee filter
      if (reportConfig.filters.employeeIds.length > 0) {
        reports = reports.filter(report => 
          reportConfig.filters.employeeIds.includes(report.employee_id)
        );
      }

      // Generate report data
      const reportData = generateReportData(reports);
      
      // Export based on format
      if (reportConfig.format === 'csv') {
        exportCSV(reportData);
      } else if (reportConfig.format === 'json') {
        exportJSON(reportData);
      }

      toast.success('Custom report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = (reports: MentalHealthReport[]) => {
    const selectedMetrics = Object.entries(reportConfig.metrics)
      .filter(([_, selected]) => selected)
      .map(([metric, _]) => metric);

    const data: any[] = [];

    if (reportConfig.groupBy === 'employee') {
      const employeeGroups = reports.reduce((acc, report) => {
        if (!acc[report.employee_id]) {
          acc[report.employee_id] = [];
        }
        acc[report.employee_id].push(report);
        return acc;
      }, {} as { [key: string]: MentalHealthReport[] });

      Object.entries(employeeGroups).forEach(([employeeId, employeeReports]) => {
        const employee = employees.find(emp => emp.id === employeeId);
        const avgMetrics = calculateAverageMetrics(employeeReports, selectedMetrics);
        
        data.push({
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          employee_email: employee?.email || 'Unknown',
          department: employee?.department || 'Unassigned',
          report_count: employeeReports.length,
          ...avgMetrics
        });
      });
    } else if (reportConfig.groupBy === 'department') {
      const departmentGroups = reports.reduce((acc, report) => {
        const employee = employees.find(emp => emp.id === report.employee_id);
        const dept = employee?.department || 'Unassigned';
        
        if (!acc[dept]) {
          acc[dept] = [];
        }
        acc[dept].push(report);
        return acc;
      }, {} as { [key: string]: MentalHealthReport[] });

      Object.entries(departmentGroups).forEach(([department, deptReports]) => {
        const avgMetrics = calculateAverageMetrics(deptReports, selectedMetrics);
        const uniqueEmployees = new Set(deptReports.map(r => r.employee_id)).size;
        
        data.push({
          department,
          employee_count: uniqueEmployees,
          report_count: deptReports.length,
          ...avgMetrics
        });
      });
    } else if (reportConfig.groupBy === 'date') {
      const dateGroups = reports.reduce((acc, report) => {
        const date = report.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(report);
        return acc;
      }, {} as { [key: string]: MentalHealthReport[] });

      Object.entries(dateGroups).forEach(([date, dateReports]) => {
        const avgMetrics = calculateAverageMetrics(dateReports, selectedMetrics);
        
        data.push({
          date,
          report_count: dateReports.length,
          ...avgMetrics
        });
      });
    }

    return data;
  };

  const calculateAverageMetrics = (reports: MentalHealthReport[], selectedMetrics: string[]) => {
    const metrics: any = {};
    
    selectedMetrics.forEach(metric => {
      let fieldName = '';
      switch (metric) {
        case 'wellness': fieldName = 'overall_wellness'; break;
        case 'mood': fieldName = 'mood_rating'; break;
        case 'stress': fieldName = 'stress_level'; break;
        case 'energy': fieldName = 'energy_level'; break;
        case 'workSatisfaction': fieldName = 'work_satisfaction'; break;
        case 'workLifeBalance': fieldName = 'work_life_balance'; break;
        case 'anxiety': fieldName = 'anxiety_level'; break;
        case 'confidence': fieldName = 'confidence_level'; break;
        case 'sleepQuality': fieldName = 'sleep_quality'; break;
      }
      
      if (fieldName && reports.length > 0) {
        const avg = reports.reduce((sum, report) => sum + (report as any)[fieldName], 0) / reports.length;
        metrics[`avg_${metric}`] = Math.round(avg * 10) / 10;
      }
    });

    return metrics;
  };

  const exportCSV = (data: any[]) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportJSON = (data: any[]) => {
    const reportOutput = {
      report_name: reportConfig.name,
      description: reportConfig.description,
      generated_at: new Date().toISOString(),
      date_range: reportConfig.dateRange,
      filters: reportConfig.filters,
      metrics: reportConfig.metrics,
      group_by: reportConfig.groupBy,
      data
    };

    const blob = new Blob([JSON.stringify(reportOutput, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (userLoading) {
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
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Custom Report Builder</h1>
              <p className="text-gray-600 mt-1">
                Create customized wellness reports with specific metrics and filters
              </p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              Back to Analytics
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Report Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-name">Report Name *</Label>
                  <Input
                    id="report-name"
                    placeholder="e.g., Monthly Wellness Summary"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    placeholder="Brief description of this report..."
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quick Select</Label>
                  <Select value={reportConfig.dateRange.preset} onValueChange={handleDatePresetChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={reportConfig.dateRange.start}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value, preset: 'custom' }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={reportConfig.dateRange.end}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value, preset: 'custom' }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Departments</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {departments.map(dept => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={reportConfig.filters.departments.includes(dept)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  departments: [...prev.filters.departments, dept]
                                }
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  departments: prev.filters.departments.filter(d => d !== dept)
                                }
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`dept-${dept}`} className="text-sm">{dept}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Risk Levels</Label>
                  <div className="flex space-x-4 mt-2">
                    {['low', 'medium', 'high'].map(risk => (
                      <div key={risk} className="flex items-center space-x-2">
                        <Checkbox
                          id={`risk-${risk}`}
                          checked={reportConfig.filters.riskLevels.includes(risk)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  riskLevels: [...prev.filters.riskLevels, risk]
                                }
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  riskLevels: prev.filters.riskLevels.filter(r => r !== risk)
                                }
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`risk-${risk}`} className="text-sm capitalize">{risk} Risk</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Metrics to Include
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(reportConfig.metrics).map(([metric, selected]) => (
                    <div key={metric} className="flex items-center space-x-2">
                      <Checkbox
                        id={`metric-${metric}`}
                        checked={selected}
                        onCheckedChange={(checked) => {
                          setReportConfig(prev => ({
                            ...prev,
                            metrics: {
                              ...prev.metrics,
                              [metric]: checked as boolean
                            }
                          }));
                        }}
                      />
                      <Label htmlFor={`metric-${metric}`} className="text-sm">
                        {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Report Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Group By</Label>
                  <Select 
                    value={reportConfig.groupBy} 
                    onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, groupBy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="risk_level">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Export Format</Label>
                  <Select 
                    value={reportConfig.format} 
                    onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-charts"
                      checked={reportConfig.includeCharts}
                      onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeCharts: checked as boolean }))}
                    />
                    <Label htmlFor="include-charts" className="text-sm">Include Charts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-raw-data"
                      checked={reportConfig.includeRawData}
                      onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeRawData: checked as boolean }))}
                    />
                    <Label htmlFor="include-raw-data" className="text-sm">Include Raw Data</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    onClick={generateReport} 
                    disabled={loading || !reportConfig.name.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Generate Report
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Name:</strong> {reportConfig.name || 'Untitled Report'}</p>
                  <p><strong>Date Range:</strong> {reportConfig.dateRange.start} to {reportConfig.dateRange.end}</p>
                  <p><strong>Group By:</strong> {reportConfig.groupBy.replace('_', ' ')}</p>
                  <p><strong>Format:</strong> {reportConfig.format.toUpperCase()}</p>
                  <p><strong>Metrics:</strong> {Object.entries(reportConfig.metrics).filter(([_, selected]) => selected).length} selected</p>
                  {reportConfig.filters.departments.length > 0 && (
                    <p><strong>Departments:</strong> {reportConfig.filters.departments.join(', ')}</p>
                  )}
                  {reportConfig.filters.riskLevels.length > 0 && (
                    <p><strong>Risk Levels:</strong> {reportConfig.filters.riskLevels.join(', ')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}