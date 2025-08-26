'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Plus,
  Search,
  Filter,
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Import db
import type { MentalHealthReport } from '@/types';

export default function EmployeeReportsPage() {
  const { user, loading: userLoading } = useUser();
  const [reports, setReports] = useState<MentalHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      return;
    }

    if (user?.role !== 'employee') {
      // router.push('/employer/dashboard');
      return;
    }

    if (user) {
      fetchReports();
    }
  }, [user, userLoading, router]);

  const fetchReports = async () => {
    if (!user) return;

    try {
      const reportsCollection = collection(db, 'mental_health_reports');
      const q = query(
        reportsCollection,
        where('employee_id', '==', user.id)
      );
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MentalHealthReport[];
      
      // Sort by created_at in JavaScript to avoid Firestore index requirements
      const sortedData = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setReports(sortedData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (riskLevel: 'low' | 'medium' | 'high') => {
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

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(report.created_at).toLocaleDateString().includes(searchTerm);
    
    const matchesRisk = filterRisk === 'all' || report.risk_level === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'wellness-high':
        return b.overall_wellness - a.overall_wellness;
      case 'wellness-low':
        return a.overall_wellness - b.overall_wellness;
      case 'stress-high':
        return b.stress_level - a.stress_level;
      case 'stress-low':
        return a.stress_level - b.stress_level;
      default: // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
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
      <Navbar user={user || undefined} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wellness Reports</h1>
            <p className="text-gray-600 mt-2">
              Track your mental health journey and view your progress over time.
            </p>
          </div>
          <Link href="/employee/reports/new">
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="wellness-high">Highest Wellness</SelectItem>
                  <SelectItem value="wellness-low">Lowest Wellness</SelectItem>
                  <SelectItem value="stress-high">Highest Stress</SelectItem>
                  <SelectItem value="stress-low">Lowest Stress</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <span>{filteredReports.length} of {reports.length} reports</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {sortedReports.length > 0 ? (
          <div className="space-y-6">
            {sortedReports.map((report, index) => {
              const previousReport = sortedReports[index + 1];
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                      <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(report.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {getRiskLevelBadge(report.risk_level)}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {report.overall_wellness}/10
                          </div>
                          <div className="text-sm text-gray-600">Overall Wellness</div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <span className="text-lg font-semibold text-blue-700">
                            {report.mood_rating}/10
                          </span>
                          {previousReport && getTrendIcon(report.mood_rating, previousReport.mood_rating)}
                        </div>
                        <div className="text-xs text-blue-600">Mood</div>
                      </div>

                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <span className="text-lg font-semibold text-red-700">
                            {report.stress_level}/10
                          </span>
                          {previousReport && getTrendIcon(previousReport.stress_level, report.stress_level)}
                        </div>
                        <div className="text-xs text-red-600">Stress</div>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <span className="text-lg font-semibold text-green-700">
                            {report.energy_level}/10
                          </span>
                          {previousReport && getTrendIcon(report.energy_level, previousReport.energy_level)}
                        </div>
                        <div className="text-xs text-green-600">Energy</div>
                      </div>

                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <span className="text-lg font-semibold text-purple-700">
                            {report.work_satisfaction}/10
                          </span>
                          {previousReport && getTrendIcon(report.work_satisfaction, previousReport.work_satisfaction)}
                        </div>
                        <div className="text-xs text-purple-600">Work Satisfaction</div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-700">{report.work_life_balance}/10</div>
                        <div className="text-xs text-gray-600">Work-Life Balance</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-700">{report.anxiety_level}/10</div>
                        <div className="text-xs text-gray-600">Anxiety</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-700">{report.confidence_level}/10</div>
                        <div className="text-xs text-gray-600">Confidence</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-700">{report.sleep_quality}/10</div>
                        <div className="text-xs text-gray-600">Sleep Quality</div>
                      </div>
                    </div>

                    {/* Comments */}
                    {report.comments && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Personal Notes:</h4>
                        <p className="text-sm text-gray-600">{report.comments}</p>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {report.ai_analysis && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">AI Insights:</h4>
                        <p className="text-sm text-blue-600">{report.ai_analysis}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterRisk !== 'all' 
                  ? 'No reports match your current filters. Try adjusting your search criteria.'
                  : 'You haven\'t created any wellness reports yet. Start tracking your mental health today!'
                }
              </p>
              {!searchTerm && filterRisk === 'all' && (
                <Link href="/employee/reports/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Report
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
