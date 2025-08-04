// lib/reports-service.ts
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MentalHealthReport, User, ChatMessage } from '@/types/index';

export interface ReportWithEmployee extends MentalHealthReport {
  employee?: User;
}

export interface ReportsAnalytics {
  totalReports: number;
  avgWellness: number;
  avgStress: number;
  avgMood: number;
  avgEnergy: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  departmentBreakdown: { [key: string]: { count: number; avgWellness: number } };
  dailyTrends: { date: string; wellness: number; stress: number; reportCount: number }[];
}

export interface PersonalHistory {
  recentReports: MentalHealthReport[];
  previousSessions: {
    date: string;
    sessionType: 'text' | 'voice';
    duration?: number;
    keyTopics: string[];
    moodTrend: number;
    stressTrend: number;
  }[];
  progressTrends: {
    wellness: { current: number; previous: number; trend: 'improving' | 'stable' | 'declining' };
    stress: { current: number; previous: number; trend: 'improving' | 'stable' | 'declining' };
    mood: { current: number; previous: number; trend: 'improving' | 'stable' | 'declining' };
  };
}

/**
 * Fetches reports from the last N days for a specific company
 */
export async function getRecentReports(
  companyId: string, 
  days: number = 7
): Promise<ReportWithEmployee[]> {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const startDate = daysAgo.toISOString();

    // Fetch company employees first
    const employeesRef = collection(db, 'users');
    const employeesQuery = query(
      employeesRef,
      where('company_id', '==', companyId),
      where('role', '==', 'employee')
    );
    const employeesSnapshot = await getDocs(employeesQuery);
    const employees = employeesSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as User[];

    // Fetch reports for the company
    const reportsRef = collection(db, 'mental_health_reports');
    const reportsQuery = query(
      reportsRef,
      where('company_id', '==', companyId)
    );
    const reportsSnapshot = await getDocs(reportsQuery);
    const allReports = reportsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as MentalHealthReport[];

    // Filter by date in JavaScript and sort by newest first
    const recentReports = allReports
      .filter(report => new Date(report.created_at) >= daysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Combine reports with employee data
    const reportsWithEmployees: ReportWithEmployee[] = recentReports.map(report => {
      const employee = employees.find(emp => emp.id === report.employee_id);
      return {
        ...report,
        employee: employee ? {
          ...employee,
          // Anonymize for privacy while keeping useful info
          first_name: employee.first_name || 'Employee',
          last_name: employee.last_name || `#${employee.id?.slice(0, 4)}`,
          email: employee.email || `employee-${employee.id?.slice(0, 8)}@company.com`,
        } : undefined,
      };
    });

    return reportsWithEmployees;
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    throw new Error('Failed to fetch recent reports');
  }
}

/**
 * Generates analytics summary for recent reports
 */
export function generateReportsAnalytics(reports: ReportWithEmployee[]): ReportsAnalytics {
  if (reports.length === 0) {
    return {
      totalReports: 0,
      avgWellness: 0,
      avgStress: 0,
      avgMood: 0,
      avgEnergy: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      departmentBreakdown: {},
      dailyTrends: []
    };
  }

  // Calculate averages
  const avgWellness = Math.round((reports.reduce((sum, r) => sum + r.overall_wellness, 0) / reports.length) * 10) / 10;
  const avgStress = Math.round((reports.reduce((sum, r) => sum + r.stress_level, 0) / reports.length) * 10) / 10;
  const avgMood = Math.round((reports.reduce((sum, r) => sum + r.mood_rating, 0) / reports.length) * 10) / 10;
  const avgEnergy = Math.round((reports.reduce((sum, r) => sum + r.energy_level, 0) / reports.length) * 10) / 10;

  // Calculate risk distribution
  const highRiskCount = reports.filter(r => r.risk_level === 'high').length;
  const mediumRiskCount = reports.filter(r => r.risk_level === 'medium').length;
  const lowRiskCount = reports.filter(r => r.risk_level === 'low').length;

  // Department breakdown
  const departmentBreakdown: { [key: string]: { count: number; avgWellness: number } } = {};
  reports.forEach(report => {
    const dept = report.employee?.department || 'Unassigned';
    if (!departmentBreakdown[dept]) {
      departmentBreakdown[dept] = { count: 0, avgWellness: 0 };
    }
    departmentBreakdown[dept].count++;
  });

  // Calculate department averages
  Object.keys(departmentBreakdown).forEach(dept => {
    const deptReports = reports.filter(r => (r.employee?.department || 'Unassigned') === dept);
    departmentBreakdown[dept].avgWellness = Math.round(
      (deptReports.reduce((sum, r) => sum + r.overall_wellness, 0) / deptReports.length) * 10
    ) / 10;
  });

  // Daily trends for the last 7 days
  const dailyTrends: { date: string; wellness: number; stress: number; reportCount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayReports = reports.filter(r => r.created_at.split('T')[0] === dateStr);
    
    if (dayReports.length > 0) {
      dailyTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        wellness: Math.round((dayReports.reduce((sum, r) => sum + r.overall_wellness, 0) / dayReports.length) * 10) / 10,
        stress: Math.round((dayReports.reduce((sum, r) => sum + r.stress_level, 0) / dayReports.length) * 10) / 10,
        reportCount: dayReports.length
      });
    }
  }

  return {
    totalReports: reports.length,
    avgWellness,
    avgStress,
    avgMood,
    avgEnergy,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    departmentBreakdown,
    dailyTrends
  };
}

/**
 * Formats reports data for AI consumption
 */
export function formatReportsForAI(reports: ReportWithEmployee[], analytics: ReportsAnalytics): string {
  const summary = `
COMPANY WELLNESS SUMMARY (Last 7 Days):
- Total Reports: ${analytics.totalReports}
- Average Wellness Score: ${analytics.avgWellness}/10
- Average Stress Level: ${analytics.avgStress}/10
- Average Mood: ${analytics.avgMood}/10
- Average Energy: ${analytics.avgEnergy}/10

RISK DISTRIBUTION:
- High Risk: ${analytics.highRiskCount} employees
- Medium Risk: ${analytics.mediumRiskCount} employees  
- Low Risk: ${analytics.lowRiskCount} employees

DEPARTMENT BREAKDOWN:
${Object.entries(analytics.departmentBreakdown)
  .map(([dept, stats]) => `- ${dept}: ${stats.count} reports, avg wellness ${stats.avgWellness}/10`)
  .join('\n')}

RECENT TRENDS:
${analytics.dailyTrends
  .map(trend => `- ${trend.date}: ${trend.reportCount} reports, wellness ${trend.wellness}/10, stress ${trend.stress}/10`)
  .join('\n')}

KEY INSIGHTS:
- ${analytics.avgWellness >= 7 ? 'Overall wellness is good' : analytics.avgWellness >= 5 ? 'Overall wellness is moderate' : 'Overall wellness needs attention'}
- ${analytics.avgStress >= 7 ? 'Stress levels are concerning' : analytics.avgStress >= 5 ? 'Stress levels are moderate' : 'Stress levels are manageable'}
- ${analytics.highRiskCount > 0 ? `${analytics.highRiskCount} employees need immediate attention` : 'No high-risk employees identified'}
- Most active department: ${Object.entries(analytics.departmentBreakdown).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A'}
`;

  return summary.trim();
}
/**

 * Fetches personal chat history and reports for a specific user
 */
export async function getPersonalHistory(
  userId: string, 
  companyId: string, 
  days: number = 30
): Promise<PersonalHistory> {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Fetch user's personal reports
    const reportsRef = collection(db, 'mental_health_reports');
    const userReportsQuery = query(
      reportsRef,
      where('employee_id', '==', userId),
      where('company_id', '==', companyId)
    );
    const reportsSnapshot = await getDocs(userReportsQuery);
    const allUserReports = reportsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as MentalHealthReport[];

    // Filter by date and sort by newest first
    const recentReports = allUserReports
      .filter(report => new Date(report.created_at) >= daysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fetch user's chat sessions (if you have a chat_sessions collection)
    // For now, we'll extract session info from reports
    const previousSessions = recentReports.map(report => ({
      date: new Date(report.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      sessionType: report.session_type,
      duration: report.session_duration,
      keyTopics: extractKeyTopics(report),
      moodTrend: report.mood_rating,
      stressTrend: report.stress_level
    }));

    // Calculate progress trends
    const progressTrends = calculateProgressTrends(recentReports);

    return {
      recentReports,
      previousSessions,
      progressTrends
    };

  } catch (error) {
    console.error('Error fetching personal history:', error);
    throw new Error('Failed to fetch personal history');
  }
}

/**
 * Extracts key topics from a report based on scores and AI analysis
 */
function extractKeyTopics(report: MentalHealthReport): string[] {
  const topics: string[] = [];
  
  if (report.stress_level >= 7) topics.push('High Stress');
  if (report.anxiety_level >= 7) topics.push('Anxiety');
  if (report.work_satisfaction <= 4) topics.push('Work Dissatisfaction');
  if (report.work_life_balance <= 4) topics.push('Work-Life Balance');
  if (report.sleep_quality <= 4) topics.push('Sleep Issues');
  if (report.energy_level <= 4) topics.push('Low Energy');
  if (report.confidence_level <= 4) topics.push('Low Confidence');
  if (report.mood_rating <= 4) topics.push('Low Mood');
  
  // Add positive topics
  if (report.overall_wellness >= 8) topics.push('Good Wellness');
  if (report.mood_rating >= 8) topics.push('Positive Mood');
  if (report.energy_level >= 8) topics.push('High Energy');
  
  return topics.slice(0, 3); // Limit to top 3 topics
}

/**
 * Calculates progress trends comparing recent vs previous periods
 */
function calculateProgressTrends(reports: MentalHealthReport[]) {
  if (reports.length < 2) {
    return {
      wellness: { current: 0, previous: 0, trend: 'stable' as const },
      stress: { current: 0, previous: 0, trend: 'stable' as const },
      mood: { current: 0, previous: 0, trend: 'stable' as const }
    };
  }

  // Split reports into recent (last 7 days) and previous (8-14 days ago)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentReports = reports.filter(r => 
    new Date(r.created_at) >= sevenDaysAgo
  );
  const previousReports = reports.filter(r => 
    new Date(r.created_at) >= fourteenDaysAgo && 
    new Date(r.created_at) < sevenDaysAgo
  );

  const calculateAverage = (reports: MentalHealthReport[], field: keyof MentalHealthReport) => {
    if (reports.length === 0) return 0;
    return reports.reduce((sum, r) => sum + (r[field] as number), 0) / reports.length;
  };

  const getTrend = (current: number, previous: number): 'improving' | 'stable' | 'declining' => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  };

  const currentWellness = calculateAverage(recentReports, 'overall_wellness');
  const previousWellness = calculateAverage(previousReports, 'overall_wellness');
  const currentStress = calculateAverage(recentReports, 'stress_level');
  const previousStress = calculateAverage(previousReports, 'stress_level');
  const currentMood = calculateAverage(recentReports, 'mood_rating');
  const previousMood = calculateAverage(previousReports, 'mood_rating');

  return {
    wellness: { 
      current: Math.round(currentWellness * 10) / 10, 
      previous: Math.round(previousWellness * 10) / 10, 
      trend: getTrend(currentWellness, previousWellness) 
    },
    stress: { 
      current: Math.round(currentStress * 10) / 10, 
      previous: Math.round(previousStress * 10) / 10, 
      trend: getTrend(previousStress, currentStress) // Inverted for stress (lower is better)
    },
    mood: { 
      current: Math.round(currentMood * 10) / 10, 
      previous: Math.round(previousMood * 10) / 10, 
      trend: getTrend(currentMood, previousMood) 
    }
  };
}

/**
 * Formats personal history for AI consumption
 */
export function formatPersonalHistoryForAI(history: PersonalHistory): string {
  const { recentReports, previousSessions, progressTrends } = history;

  if (recentReports.length === 0) {
    return "This is the user's first wellness session. No previous history available.";
  }

  const latestReport = recentReports[0];
  const sessionCount = previousSessions.length;

  const summary = `
PERSONAL WELLNESS HISTORY:

RECENT ACTIVITY:
- Total sessions in last 30 days: ${sessionCount}
- Last session: ${previousSessions[0]?.date || 'N/A'}
- Session types: ${previousSessions.map(s => s.sessionType).join(', ')}

CURRENT STATE (Latest Report):
- Overall Wellness: ${latestReport.overall_wellness}/10
- Mood: ${latestReport.mood_rating}/10
- Stress Level: ${latestReport.stress_level}/10
- Energy: ${latestReport.energy_level}/10
- Work Satisfaction: ${latestReport.work_satisfaction}/10
- Sleep Quality: ${latestReport.sleep_quality}/10
- Risk Level: ${latestReport.risk_level}

PROGRESS TRENDS (Last 7 days vs Previous 7 days):
- Wellness: ${progressTrends.wellness.current}/10 (was ${progressTrends.wellness.previous}/10) - ${progressTrends.wellness.trend}
- Stress: ${progressTrends.stress.current}/10 (was ${progressTrends.stress.previous}/10) - ${progressTrends.stress.trend}
- Mood: ${progressTrends.mood.current}/10 (was ${progressTrends.mood.previous}/10) - ${progressTrends.mood.trend}

RECURRING THEMES:
${previousSessions.slice(0, 5).map(session => 
  `- ${session.date}: ${session.keyTopics.join(', ') || 'General wellness check'}`
).join('\n')}

${latestReport.ai_analysis ? `
PREVIOUS AI INSIGHTS:
${latestReport.ai_analysis}
` : ''}

KEY PATTERNS TO CONSIDER:
- ${progressTrends.wellness.trend === 'improving' ? 'User shows improving wellness trends' : 
     progressTrends.wellness.trend === 'declining' ? 'User shows declining wellness - needs extra support' : 
     'User wellness is stable'}
- ${progressTrends.stress.trend === 'improving' ? 'Stress management is improving' : 
     progressTrends.stress.trend === 'declining' ? 'Stress levels are increasing - focus on coping strategies' : 
     'Stress levels are consistent'}
- Session frequency: ${sessionCount > 10 ? 'Very engaged' : sessionCount > 5 ? 'Regularly engaged' : 'Occasional user'}
`;

  return summary.trim();
}