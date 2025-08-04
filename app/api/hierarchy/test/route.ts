// app/api/hierarchy/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getDirectReports, 
  getTeamHierarchy, 
  getTeamStats, 
  getManagerPermissions,
  canAccessEmployeeData,
  getHierarchyAnalytics
} from '@/lib/hierarchy-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const testType = searchParams.get('testType') || 'all';

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: 'userId and companyId are required' },
        { status: 400 }
      );
    }

    const results: any = {};

    try {
      if (testType === 'all' || testType === 'directReports') {
        const directReports = await getDirectReports(userId);
        results.directReports = {
          count: directReports.length,
          employees: directReports.map(emp => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            role: emp.role,
            department: emp.department,
            position: emp.position
          }))
        };
      }

      if (testType === 'all' || testType === 'hierarchy') {
        const hierarchy = await getTeamHierarchy(userId, 3);
        results.teamHierarchy = {
          levels: hierarchy.length,
          structure: hierarchy.map(node => ({
            user: {
              id: node.user.id,
              name: `${node.user.first_name} ${node.user.last_name}`,
              role: node.user.role,
              level: node.level
            },
            childrenCount: node.children.length
          }))
        };
      }

      if (testType === 'all' || testType === 'teamStats') {
        const teamStats = await getTeamStats(userId);
        results.teamStats = teamStats;
      }

      if (testType === 'all' || testType === 'analytics') {
        const analytics = await getHierarchyAnalytics(companyId);
        results.hierarchyAnalytics = analytics;
      }

      // Test permissions (mock user data)
      if (testType === 'all' || testType === 'permissions') {
        const mockUser = {
          id: userId,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'Manager',
          role: 'manager' as const,
          company_id: companyId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          hierarchy_level: 3,
          can_view_team_reports: true,
          can_approve_leaves: true,
          can_manage_employees: true,
          skip_level_access: false,
          is_department_head: false
        };
        
        const permissions = getManagerPermissions(mockUser);
        results.permissions = permissions;
      }

    } catch (serviceError: any) {
      results.error = serviceError.message;
    }

    return NextResponse.json({
      success: true,
      userId,
      companyId,
      testType,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Hierarchy test error:', error);
    return NextResponse.json(
      { error: 'Failed to test hierarchy system', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, targetUserId, companyId } = await request.json();

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: 'userId and targetUserId are required' },
        { status: 400 }
      );
    }

    // Test access permissions
    const canAccess = await canAccessEmployeeData(userId, targetUserId);

    return NextResponse.json({
      success: true,
      canAccess,
      userId,
      targetUserId,
      message: canAccess 
        ? 'User has access to target employee data' 
        : 'User does not have access to target employee data'
    });

  } catch (error: any) {
    console.error('Access test error:', error);
    return NextResponse.json(
      { error: 'Failed to test access permissions', details: error.message },
      { status: 500 }
    );
  }
}