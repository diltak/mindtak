'use client';

import { useState, useEffect } from 'react';
import { useUser } from './use-user';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DashboardStats, Employee, MentalHealthReport, Company } from '@/types/index';

export interface EmployerData {
  company: Company | null;
  employees: Employee[];
  stats: DashboardStats | null;
  recentReports: MentalHealthReport[];
  loading: boolean;
  error: string | null;
}

export function useEmployer() {
  const { user } = useUser();
  const [data, setData] = useState<EmployerData>({
    company: null,
    employees: [],
    stats: null,
    recentReports: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!user || user.role !== 'employer' || !user.company_id) {
      setData(prev => ({ ...prev, loading: false, error: 'Invalid employer access' }));
      return;
    }

    const unsubscribes: (() => void)[] = [];

    // Load company data
    loadCompanyData();

    // Load employees
    const employeesQuery = query(
      collection(db, 'employees'),
      where('company_id', '==', user.company_id),
      where('status', '==', 'active')
    );

    const employeesUnsubscribe = onSnapshot(employeesQuery, (snapshot) => {
      const employees: Employee[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Employee, 'id'>
      }));
      
      setData(prev => ({ ...prev, employees }));
      
      // Update stats when employees change
      updateStats(employees);
    });

    unsubscribes.push(employeesUnsubscribe);

    // Load recent reports
    const reportsQuery = query(
      collection(db, 'mental_health_reports'),
      where('company_id', '==', user.company_id)
    );

    const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reports: MentalHealthReport[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<MentalHealthReport, 'id'>
      }));
      
      // Sort by date and take recent ones
      const recentReports = reports
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      setData(prev => ({ ...prev, recentReports }));
    });

    unsubscribes.push(reportsUnsubscribe);

    setData(prev => ({ ...prev, loading: false }));

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const loadCompanyData = async () => {
    if (!user?.company_id) return;

    try {
      const companyQuery = query(
        collection(db, 'companies'),
        where('id', '==', user.company_id)
      );
      
      const companySnapshot = await getDocs(companyQuery);
      
      if (!companySnapshot.empty) {
        const companyDoc = companySnapshot.docs[0];
        const company: Company = {
          id: companyDoc.id,
          ...companyDoc.data() as Omit<Company, 'id'>
        };
        
        setData(prev => ({ ...prev, company }));
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      setData(prev => ({ ...prev, error: 'Failed to load company data' }));
    }
  };

  const updateStats = async (employees: Employee[]) => {
    if (!user?.company_id) return;

    try {
      // Get active sessions
      const activeSessionsQuery = query(
        collection(db, 'chat_sessions'),
        where('company_id', '==', user.company_id),
        where('status', '==', 'active')
      );
      const activeSessionsSnapshot = await getDocs(activeSessionsQuery);

      // Get recent reports (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentReportsQuery = query(
        collection(db, 'mental_health_reports'),
        where('company_id', '==', user.company_id),
        where('created_at', '>=', thirtyDaysAgo.toISOString())
      );
      const recentReportsSnapshot = await getDocs(recentReportsQuery);

      // Calculate stats
      let totalWellnessScore = 0;
      let highRiskCount = 0;
      
      recentReportsSnapshot.docs.forEach(doc => {
        const report = doc.data() as MentalHealthReport;
        totalWellnessScore += report.overall_wellness;
        
        if (report.risk_level === 'high') {
          highRiskCount++;
        }
      });

      const averageWellnessScore = recentReportsSnapshot.size > 0 
        ? totalWellnessScore / recentReportsSnapshot.size 
        : 0;

      const stats: DashboardStats = {
        total_employees: employees.length,
        total_managers: 0, // TODO: Calculate actual managers count
        active_sessions: activeSessionsSnapshot.size,
        completed_reports: recentReportsSnapshot.size,
        average_wellness_score: Math.round(averageWellnessScore * 10) / 10,
        average_mood_score: 0, // TODO: Calculate actual mood score
        average_stress_score: 0, // TODO: Calculate actual stress score
        average_energy_score: 0, // TODO: Calculate actual energy score
        high_risk_employees: highRiskCount,
        medium_risk_employees: 0, // TODO: Calculate actual medium risk count
        low_risk_employees: 0, // TODO: Calculate actual low risk count
        wellness_trend: averageWellnessScore > 7 ? 'improving' : averageWellnessScore > 5 ? 'stable' : 'declining',
        department_stats: {}, // TODO: Calculate actual department stats
        weekly_reports: 0, // TODO: Calculate actual weekly reports
        participation_rate: 0, // TODO: Calculate actual participation rate
        last_updated: new Date().toISOString()
      };

      setData(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const refreshData = () => {
    if (user?.company_id) {
      loadCompanyData();
      updateStats(data.employees);
    }
  };

  return {
    ...data,
    refreshData
  };
}
