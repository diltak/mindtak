// lib/demo-data.ts
import type { User, MentalHealthReport, HierarchyNode } from '@/types/index';

export const demoUsers: User[] = [
  {
    id: 'demo-ceo-1',
    email: 'ceo@demo.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'employer',
    company_id: 'demo-company',
    department: 'Executive',
    position: 'CEO',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    hierarchy_level: 0,
    can_view_team_reports: true,
    can_manage_employees: true,
    can_approve_leaves: true,
    is_department_head: true,
    skip_level_access: true,
    direct_reports: ['demo-vp-1', 'demo-vp-2']
  },
  {
    id: 'demo-vp-1',
    email: 'vp.eng@demo.com',
    first_name: 'Michael',
    last_name: 'Chen',
    role: 'manager',
    company_id: 'demo-company',
    department: 'Engineering',
    position: 'VP of Engineering',
    manager_id: 'demo-ceo-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    hierarchy_level: 1,
    can_view_team_reports: true,
    can_manage_employees: true,
    can_approve_leaves: true,
    is_department_head: true,
    skip_level_access: true,
    direct_reports: ['demo-manager-1', 'demo-manager-2'],
    reporting_chain: ['demo-ceo-1']
  },
  {
    id: 'demo-manager-1',
    email: 'manager@demo.com',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    role: 'manager',
    company_id: 'demo-company',
    department: 'Engineering',
    position: 'Engineering Manager',
    manager_id: 'demo-vp-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    hierarchy_level: 3,
    can_view_team_reports: true,
    can_manage_employees: true,
    can_approve_leaves: true,
    direct_reports: ['demo-emp-1', 'demo-emp-2', 'demo-emp-3'],
    reporting_chain: ['demo-ceo-1', 'demo-vp-1']
  },
  {
    id: 'demo-emp-1',
    email: 'john@demo.com',
    first_name: 'John',
    last_name: 'Smith',
    role: 'employee',
    company_id: 'demo-company',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    manager_id: 'demo-manager-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    hierarchy_level: 4,
    reporting_chain: ['demo-ceo-1', 'demo-vp-1', 'demo-manager-1']
  },
  {
    id: 'demo-emp-2',
    email: 'alice@demo.com',
    first_name: 'Alice',
    last_name: 'Williams',
    role: 'employee',
    company_id: 'demo-company',
    department: 'Engineering',
    position: 'Software Engineer',
    manager_id: 'demo-manager-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    hierarchy_level: 4,
    reporting_chain: ['demo-ceo-1', 'demo-vp-1', 'demo-manager-1']
  },
  {
    id: 'demo-emp-3',
    email: 'bob@demo.com',
    first_name: 'Bob',
    last_name: 'Davis',
    role: 'employee',
    company_id: 'demo-company',
    department: 'Engineering',
    position: 'Junior Software Engineer',
    manager_id: 'demo-manager-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    hierarchy_level: 4,
    reporting_chain: ['demo-ceo-1', 'demo-vp-1', 'demo-manager-1']
  }
];

export const demoReports: MentalHealthReport[] = [
  {
    id: 'demo-report-1',
    employee_id: 'demo-emp-1',
    company_id: 'demo-company',
    stress_level: 6,
    mood_rating: 7,
    energy_level: 6,
    work_satisfaction: 8,
    work_life_balance: 5,
    anxiety_level: 4,
    confidence_level: 7,
    sleep_quality: 6,
    overall_wellness: 6.5,
    risk_level: 'medium',
    session_type: 'text',
    session_duration: 300,
    ai_analysis: 'Employee shows moderate stress levels but good work satisfaction. Recommend focus on work-life balance.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-report-2',
    employee_id: 'demo-emp-2',
    company_id: 'demo-company',
    stress_level: 8,
    mood_rating: 4,
    energy_level: 3,
    work_satisfaction: 5,
    work_life_balance: 3,
    anxiety_level: 8,
    confidence_level: 4,
    sleep_quality: 3,
    overall_wellness: 4.2,
    risk_level: 'high',
    session_type: 'voice',
    session_duration: 450,
    ai_analysis: 'Employee showing signs of burnout with high stress and anxiety. Immediate intervention recommended.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-report-3',
    employee_id: 'demo-emp-3',
    company_id: 'demo-company',
    stress_level: 3,
    mood_rating: 8,
    energy_level: 8,
    work_satisfaction: 9,
    work_life_balance: 8,
    anxiety_level: 2,
    confidence_level: 8,
    sleep_quality: 8,
    overall_wellness: 8.1,
    risk_level: 'low',
    session_type: 'text',
    session_duration: 180,
    ai_analysis: 'Employee demonstrates excellent wellness metrics across all categories. Continue current practices.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export function getDemoUser(role: string = 'employee'): User {
  switch (role) {
    case 'manager':
      return demoUsers.find(u => u.id === 'demo-manager-1') || demoUsers[2];
    case 'employer':
      return demoUsers.find(u => u.id === 'demo-ceo-1') || demoUsers[0];
    case 'vp':
      return demoUsers.find(u => u.id === 'demo-vp-1') || demoUsers[1];
    default:
      return demoUsers.find(u => u.id === 'demo-emp-1') || demoUsers[3];
  }
}

export function getDemoHierarchy(): HierarchyNode[] {
  const buildNode = (user: User): HierarchyNode => {
    const children = demoUsers
      .filter(u => u.manager_id === user.id)
      .map(buildNode);
    
    return {
      user,
      children,
      level: user.hierarchy_level || 0,
      isExpanded: true
    };
  };

  // Start with CEO (no manager)
  const ceo = demoUsers.find(u => !u.manager_id);
  return ceo ? [buildNode(ceo)] : [];
}

export function getDemoTeamStats() {
  return {
    team_size: 3,
    direct_reports: 3,
    total_subordinates: 3,
    avg_team_wellness: 6.3,
    high_risk_team_members: 1,
    team_departments: ['Engineering'],
    recent_reports_count: 3
  };
}
