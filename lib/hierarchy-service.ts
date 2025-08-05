// lib/hierarchy-service.ts
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Department, HierarchyNode, TeamStats, ManagerPermissions, HierarchyAnalytics, MentalHealthReport } from '@/types/index';

/**
 * Gets all direct reports for a manager
 */
export async function getDirectReports(managerId: string): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const directReportsQuery = query(
      usersRef,
      where('manager_id', '==', managerId),
      where('is_active', '==', true)
    );
    
    const snapshot = await getDocs(directReportsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    throw new Error('Failed to fetch direct reports');
  }
}

/**
 * Gets the complete team hierarchy for a manager (including sub-teams)
 */
export async function getTeamHierarchy(managerId: string, maxDepth: number = 3): Promise<HierarchyNode[]> {
  try {
    const buildHierarchy = async (userId: string, currentDepth: number): Promise<HierarchyNode[]> => {
      if (currentDepth >= maxDepth) return [];
      
      const directReports = await getDirectReports(userId);
      const nodes: HierarchyNode[] = [];
      
      for (const user of directReports) {
        const children = await buildHierarchy(user.id, currentDepth + 1);
        nodes.push({
          user,
          children,
          level: currentDepth,
          isExpanded: currentDepth < 2 // Auto-expand first 2 levels
        });
      }
      
      return nodes;
    };
    
    return await buildHierarchy(managerId, 0);
  } catch (error) {
    console.error('Error building team hierarchy:', error);
    throw new Error('Failed to build team hierarchy');
  }
}

/**
 * Gets all subordinates (direct and indirect) for a manager
 */
export async function getAllSubordinates(managerId: string): Promise<User[]> {
  try {
    const allSubordinates: User[] = [];
    const visited = new Set<string>();
    
    const collectSubordinates = async (currentManagerId: string) => {
      if (visited.has(currentManagerId)) return;
      visited.add(currentManagerId);
      
      const directReports = await getDirectReports(currentManagerId);
      
      for (const employee of directReports) {
        allSubordinates.push(employee);
        // Recursively get their subordinates if they're also managers
        if (employee.direct_reports && employee.direct_reports.length > 0) {
          await collectSubordinates(employee.id);
        }
      }
    };
    
    await collectSubordinates(managerId);
    return allSubordinates;
  } catch (error) {
    console.error('Error fetching all subordinates:', error);
    throw new Error('Failed to fetch all subordinates');
  }
}

/**
 * Checks if a user can access another user's data based on hierarchy
 */
export async function canAccessEmployeeData(viewerId: string, targetEmployeeId: string): Promise<boolean> {
  try {
    // Same user can always access their own data
    if (viewerId === targetEmployeeId) return true;
    
    // Get viewer's information
    const viewerDoc = await getDoc(doc(db, 'users', viewerId));
    if (!viewerDoc.exists()) return false;
    
    const viewer = { id: viewerDoc.id, ...viewerDoc.data() } as User;
    
    // HR and admin can access all data
    if (viewer.role === 'hr' || viewer.role === 'admin' || viewer.role === 'employer') {
      return true;
    }
    
    // Get target employee's information
    const targetDoc = await getDoc(doc(db, 'users', targetEmployeeId));
    if (!targetDoc.exists()) return false;
    
    const targetEmployee = { id: targetDoc.id, ...targetDoc.data() } as User;
    
    // Check if viewer is direct manager
    if (targetEmployee.manager_id === viewerId) return true;
    
    // Check if viewer is in the reporting chain (skip-level manager)
    if (viewer.skip_level_access && targetEmployee.reporting_chain?.includes(viewerId)) {
      return true;
    }
    
    // Check department head access
    if (viewer.is_department_head && viewer.department === targetEmployee.department) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking access permissions:', error);
    return false;
  }
}

/**
 * Gets team statistics for a manager
 */
export async function getTeamStats(managerId: string): Promise<TeamStats> {
  try {
    const directReports = await getDirectReports(managerId);
    const allSubordinates = await getAllSubordinates(managerId);
    
    // Get recent wellness reports for the team
    const reportsRef = collection(db, 'mental_health_reports');
    const teamMemberIds = allSubordinates.map(emp => emp.id);
    
    // Since Firestore doesn't support 'in' queries with more than 10 items,
    // we'll fetch reports in batches if needed
    const batchSize = 10;
    let allReports: MentalHealthReport[] = [];
    
    for (let i = 0; i < teamMemberIds.length; i += batchSize) {
      const batch = teamMemberIds.slice(i, i + batchSize);
      const batchQuery = query(
        reportsRef,
        where('employee_id', 'in', batch)
      );
      const batchSnapshot = await getDocs(batchQuery);
      const batchReports = batchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MentalHealthReport[];
      allReports = [...allReports, ...batchReports];
    }
    
    // Filter reports from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReports = allReports.filter(report => 
      new Date(report.created_at) >= thirtyDaysAgo
    );
    
    // Calculate team wellness average
    const avgTeamWellness = recentReports.length > 0
      ? Math.round((recentReports.reduce((sum, report) => sum + report.overall_wellness, 0) / recentReports.length) * 10) / 10
      : 0;
    
    // Count high-risk team members
    const highRiskMembers = recentReports.filter(report => report.risk_level === 'high').length;
    
    // Get unique departments
    const teamDepartments = [...new Set(allSubordinates.map(emp => emp.department).filter((dept): dept is string => Boolean(dept)))];
    
    return {
      team_size: allSubordinates.length,
      direct_reports: directReports.length,
      total_subordinates: allSubordinates.length,
      avg_team_wellness: avgTeamWellness,
      high_risk_team_members: highRiskMembers,
      team_departments: teamDepartments,
      recent_reports_count: recentReports.length
    };
  } catch (error) {
    console.error('Error calculating team stats:', error);
    throw new Error('Failed to calculate team stats');
  }
}

/**
 * Gets manager permissions based on their role and hierarchy level
 */
export function getManagerPermissions(user: User): ManagerPermissions {
  const isManager = user.role === 'manager' || user.role === 'hr' || user.role === 'admin' || user.role === 'employer';
  const hierarchyLevel = user.hierarchy_level || 999;
  
  return {
    can_view_direct_reports: isManager,
    can_view_team_reports: user.can_view_team_reports || false,
    can_view_subordinate_teams: user.skip_level_access || false,
    can_approve_leaves: user.can_approve_leaves || false,
    can_manage_team_members: user.can_manage_employees || false,
    can_access_analytics: hierarchyLevel <= 3 || user.role === 'hr', // Directors and above
    hierarchy_access_level: user.skip_level_access ? 2 : 1 // How many levels down they can access
  };
}

/**
 * Updates user's reporting chain when manager changes
 */
export async function updateReportingChain(employeeId: string, newManagerId?: string): Promise<void> {
  try {
    let newReportingChain: string[] = [];
    
    if (newManagerId) {
      // Get new manager's reporting chain
      const managerDoc = await getDoc(doc(db, 'users', newManagerId));
      if (managerDoc.exists()) {
        const manager = { id: managerDoc.id, ...managerDoc.data() } as User;
        newReportingChain = [...(manager.reporting_chain || []), newManagerId];
      }
    }
    
    // Update employee's reporting chain and manager
    await updateDoc(doc(db, 'users', employeeId), {
      manager_id: newManagerId || null,
      reporting_chain: newReportingChain,
      updated_at: new Date().toISOString()
    });
    
    // Update old manager's direct reports
    if (newManagerId) {
      const oldEmployeeDoc = await getDoc(doc(db, 'users', employeeId));
      if (oldEmployeeDoc.exists()) {
        const oldEmployee = { id: oldEmployeeDoc.id, ...oldEmployeeDoc.data() } as User;
        if (oldEmployee.manager_id && oldEmployee.manager_id !== newManagerId) {
          // Remove from old manager's direct reports
          await updateDoc(doc(db, 'users', oldEmployee.manager_id), {
            direct_reports: arrayRemove(employeeId)
          });
        }
      }
      
      // Add to new manager's direct reports
      await updateDoc(doc(db, 'users', newManagerId), {
        direct_reports: arrayUnion(employeeId)
      });
    }
  } catch (error) {
    console.error('Error updating reporting chain:', error);
    throw new Error('Failed to update reporting chain');
  }
}

/**
 * Gets hierarchy analytics for company leadership
 */
export async function getHierarchyAnalytics(companyId: string): Promise<HierarchyAnalytics> {
  try {
    // Get all company employees
    const usersRef = collection(db, 'users');
    const companyQuery = query(
      usersRef,
      where('company_id', '==', companyId),
      where('is_active', '==', true)
    );
    const usersSnapshot = await getDocs(companyQuery);
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    
    // Get all wellness reports for the company
    const reportsRef = collection(db, 'mental_health_reports');
    const reportsQuery = query(
      reportsRef,
      where('company_id', '==', companyId)
    );
    const reportsSnapshot = await getDocs(reportsQuery);
    const allReports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MentalHealthReport[];
    
    // Filter recent reports (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReports = allReports.filter(report => 
      new Date(report.created_at) >= thirtyDaysAgo
    );
    
    // Team wellness comparison
    const managers = allUsers.filter(user => 
      user.role === 'manager' || (user.direct_reports && user.direct_reports.length > 0)
    );
    
    const teamWellnessComparison = await Promise.all(
      managers.map(async (manager) => {
        const teamStats = await getTeamStats(manager.id);
        return {
          team_name: `${manager.first_name} ${manager.last_name}'s Team`,
          manager_name: `${manager.first_name} ${manager.last_name}`,
          avg_wellness: teamStats.avg_team_wellness,
          team_size: teamStats.team_size,
          high_risk_count: teamStats.high_risk_team_members
        };
      })
    );
    
    // Department performance
    const departments = [...new Set(allUsers.map(user => user.department).filter((dept): dept is string => Boolean(dept)))];
    const departmentPerformance = departments.map(dept => {
      const deptEmployees = allUsers.filter(user => user.department === dept);
      const deptReports = recentReports.filter(report => {
        const employee = allUsers.find(user => user.id === report.employee_id);
        return employee?.department === dept;
      });
      
      const avgWellness = deptReports.length > 0
        ? Math.round((deptReports.reduce((sum, report) => sum + report.overall_wellness, 0) / deptReports.length) * 10) / 10
        : 0;
      
      const managerCount = deptEmployees.filter(emp => 
        emp.role === 'manager' || (emp.direct_reports && emp.direct_reports.length > 0)
      ).length;
      
      return {
        department: dept,
        avg_wellness: avgWellness,
        employee_count: deptEmployees.length,
        manager_count: managerCount
      };
    });
    
    // Hierarchy health by level
    const hierarchyLevels = [
      { level: 0, level_name: 'Executive' },
      { level: 1, level_name: 'Senior Management' },
      { level: 2, level_name: 'Middle Management' },
      { level: 3, level_name: 'Team Leads' },
      { level: 4, level_name: 'Individual Contributors' }
    ];
    
    const hierarchyHealth = hierarchyLevels.map(levelInfo => {
      const levelEmployees = allUsers.filter(user => 
        (user.hierarchy_level || 999) === levelInfo.level
      );
      const levelReports = recentReports.filter(report => {
        const employee = allUsers.find(user => user.id === report.employee_id);
        return (employee?.hierarchy_level || 999) === levelInfo.level;
      });
      
      const avgWellness = levelReports.length > 0
        ? Math.round((levelReports.reduce((sum, report) => sum + report.overall_wellness, 0) / levelReports.length) * 10) / 10
        : 0;
      
      return {
        level: levelInfo.level,
        level_name: levelInfo.level_name,
        avg_wellness: avgWellness,
        employee_count: levelEmployees.length
      };
    }).filter(level => level.employee_count > 0);
    
    return {
      team_wellness_comparison: teamWellnessComparison,
      department_performance: departmentPerformance,
      hierarchy_health: hierarchyHealth
    };
  } catch (error) {
    console.error('Error generating hierarchy analytics:', error);
    throw new Error('Failed to generate hierarchy analytics');
  }
}

/**
 * Gets filtered reports based on user's hierarchy permissions
 */
export async function getHierarchyFilteredReports(
  userId: string, 
  companyId: string, 
  days: number = 7
): Promise<MentalHealthReport[]> {
  try {
    const user = await getDoc(doc(db, 'users', userId));
    if (!user.exists()) throw new Error('User not found');
    
    const userData = { id: user.id, ...user.data() } as User;
    const permissions = getManagerPermissions(userData);
    
    // Get all accessible employee IDs based on hierarchy
    let accessibleEmployeeIds: string[] = [];
    
    if (userData.role === 'hr' || userData.role === 'admin' || userData.role === 'employer') {
      // HR/Admin can see all company reports
      const allEmployees = await getDocs(query(
        collection(db, 'users'),
        where('company_id', '==', companyId),
        where('is_active', '==', true)
      ));
      accessibleEmployeeIds = allEmployees.docs.map(doc => doc.id);
    } else if (permissions.can_view_team_reports) {
      // Managers can see their team's reports
      const subordinates = await getAllSubordinates(userId);
      accessibleEmployeeIds = [userId, ...subordinates.map(emp => emp.id)];
    } else {
      // Regular employees can only see their own reports
      accessibleEmployeeIds = [userId];
    }
    
    // Fetch reports for accessible employees
    const reportsRef = collection(db, 'mental_health_reports');
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    // Batch the queries if we have many employees
    const batchSize = 10;
    let allReports: MentalHealthReport[] = [];
    
    for (let i = 0; i < accessibleEmployeeIds.length; i += batchSize) {
      const batch = accessibleEmployeeIds.slice(i, i + batchSize);
      const batchQuery = query(
        reportsRef,
        where('employee_id', 'in', batch),
        where('company_id', '==', companyId)
      );
      const batchSnapshot = await getDocs(batchQuery);
      const batchReports = batchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MentalHealthReport[];
      allReports = [...allReports, ...batchReports];
    }
    
    // Filter by date and sort by newest first
    return allReports
      .filter(report => new Date(report.created_at) >= daysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
  } catch (error) {
    console.error('Error fetching hierarchy filtered reports:', error);
    throw new Error('Failed to fetch filtered reports');
  }
}