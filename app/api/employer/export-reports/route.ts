import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MentalHealthReport } from '@/types/index';

export async function POST(request: NextRequest) {
  try {
    const { company_id, time_range } = await request.json();

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const daysBack = time_range === '7d' ? 7 : time_range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Query reports
    const reportsQuery = query(
      collection(db, 'mental_health_reports'),
      where('company_id', '==', company_id),
      where('created_at', '>=', startDate.toISOString())
      // Removed orderBy to avoid index requirements - will sort in JavaScript
    );

    const reportsSnapshot = await getDocs(reportsQuery);
    const reportsData: MentalHealthReport[] = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<MentalHealthReport, 'id'>
    }));

    // Sort reports by created_at in JavaScript (newest first)
    const reports = reportsData.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Generate CSV content
    const csvHeaders = [
      'Report ID',
      'Employee ID',
      'Date',
      'Session Type',
      'Mood Rating',
      'Stress Level',
      'Energy Level',
      'Work Satisfaction',
      'Work Life Balance',
      'Anxiety Level',
      'Confidence Level',
      'Sleep Quality',
      'Overall Wellness',
      'Risk Level',
      'Session Duration (min)',
      'AI Analysis Summary'
    ];

    const csvRows = reports.map(report => [
      report.id,
      report.employee_id.slice(-8), // Anonymized employee ID
      new Date(report.created_at).toLocaleDateString(),
      report.session_type,
      report.mood_rating,
      report.stress_level,
      report.energy_level,
      report.work_satisfaction,
      report.work_life_balance,
      report.anxiety_level,
      report.confidence_level,
      report.sleep_quality,
      report.overall_wellness,
      report.risk_level,
      report.session_duration ? Math.round(report.session_duration / 60) : 'N/A',
      report.ai_analysis ? `"${report.ai_analysis.replace(/"/g, '""')}"` : 'N/A'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="wellness-reports-${time_range}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export reports error:', error);
    return NextResponse.json(
      { error: 'Failed to export reports' },
      { status: 500 }
    );
  }
}
