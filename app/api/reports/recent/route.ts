// app/api/reports/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRecentReports, generateReportsAnalytics, formatReportsForAI, getPersonalHistory, formatPersonalHistoryForAI } from '@/lib/reports-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get company-wide reports
    const reports = await getRecentReports(companyId, days);
    const analytics = generateReportsAnalytics(reports);
    const aiContext = formatReportsForAI(reports, analytics);

    let personalData = null;
    if (userId) {
      try {
        const personalHistory = await getPersonalHistory(userId, companyId, 30);
        const personalAiContext = formatPersonalHistoryForAI(personalHistory);
        personalData = {
          history: personalHistory,
          aiContext: personalAiContext
        };
      } catch (error) {
        console.error('Error fetching personal history:', error);
        personalData = { error: 'Failed to fetch personal history' };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        companyReports: {
          count: reports.length,
          analytics,
          aiContext
        },
        personalHistory: personalData
      }
    });

  } catch (error: any) {
    console.error('Error fetching recent reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    );
  }
}