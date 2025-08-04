'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import type { MentalHealthReport } from '@/types';

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const reportId = params.id as string;
    const [report, setReport] = useState<MentalHealthReport | null>(null);
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
        const fetchReport = async () => {
            if (!user || user.role !== 'employer') return;

            try {
                const reportDoc = await getDoc(doc(db, 'mental_health_reports', reportId));

                if (reportDoc.exists()) {
                    const reportData = reportDoc.data() as MentalHealthReport;

                    // Verify this report belongs to the current employer's company
                    if (reportData.company_id !== (user as any).company_id) {
                        setError('Report not found or access denied');
                        return;
                    }

                    setReport({ ...reportData, id: reportDoc.id } as MentalHealthReport);
                } else {
                    setError('Report not found');
                }
            } catch (err) {
                console.error('Error fetching report:', err);
                setError('Failed to load report data');
            } finally {
                setLoading(false);
            }
        };

        if (reportId && user && user.role === 'employer') {
            fetchReport();
        }
    }, [reportId, user]);

    const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
        switch (riskLevel) {
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        if (score >= 4) return 'text-orange-600';
        return 'text-red-600';
    };

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

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar user={user} />
                <div className="container mx-auto p-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            {error || 'Report not found'}
                        </h1>
                        <Link href="/employer/reports">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Reports
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
                    <Link href="/employer/reports">
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Reports
                        </Button>
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Mental Health Report</h1>
                            <p className="text-gray-600">
                                Generated on {new Date(report.created_at).toLocaleDateString()} at{' '}
                                {new Date(report.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                        <Badge className={getRiskLevelColor(report.risk_level)}>
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {report.risk_level.toUpperCase()} RISK
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Overall Wellness Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5" />
                                Overall Wellness
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <div className={`text-4xl font-bold ${getScoreColor(report.overall_wellness)}`}>
                                    {report.overall_wellness}/10
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Wellness Score</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Session Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <Badge variant="outline">{report.session_type}</Badge>
                            </div>
                            {report.session_duration && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Duration:</span>
                                    <span>{Math.round(report.session_duration / 60)} minutes</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Employee ID:</span>
                                <span className="font-mono text-sm">{report.employee_id}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Brain className="mr-2 h-5 w-5" />
                                AI Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {report.sentiment_score && (
                                <div className="mb-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Sentiment Score:</span>
                                        <span className={getScoreColor(report.sentiment_score * 10)}>
                                            {(report.sentiment_score * 10).toFixed(1)}/10
                                        </span>
                                    </div>
                                </div>
                            )}
                            {report.emotion_tags && report.emotion_tags.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Detected Emotions:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {report.emotion_tags.map((emotion, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {emotion}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Metrics */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Detailed Wellness Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(report.mood_rating)}`}>
                                    {report.mood_rating}/10
                                </div>
                                <p className="text-sm text-gray-600">Mood Rating</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(10 - report.stress_level)}`}>
                                    {report.stress_level}/10
                                </div>
                                <p className="text-sm text-gray-600">Stress Level</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(report.energy_level)}`}>
                                    {report.energy_level}/10
                                </div>
                                <p className="text-sm text-gray-600">Energy Level</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(report.work_satisfaction)}`}>
                                    {report.work_satisfaction}/10
                                </div>
                                <p className="text-sm text-gray-600">Work Satisfaction</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(report.work_life_balance)}`}>
                                    {report.work_life_balance}/10
                                </div>
                                <p className="text-sm text-gray-600">Work-Life Balance</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(10 - report.anxiety_level)}`}>
                                    {report.anxiety_level}/10
                                </div>
                                <p className="text-sm text-gray-600">Anxiety Level</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(report.confidence_level)}`}>
                                    {report.confidence_level}/10
                                </div>
                                <p className="text-sm text-gray-600">Confidence Level</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(report.sleep_quality)}`}>
                                    {report.sleep_quality}/10
                                </div>
                                <p className="text-sm text-gray-600">Sleep Quality</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Analysis & Comments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {report.ai_analysis && (
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">{report.ai_analysis}</p>
                            </CardContent>
                        </Card>
                    )}

                    {report.comments && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Comments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">{report.comments}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-4">
                    <Button>Download Report</Button>
                    <Button variant="outline">Share Report</Button>
                    <Button variant="outline">Schedule Follow-up</Button>
                </div>
            </div>
        </div>
    );
}