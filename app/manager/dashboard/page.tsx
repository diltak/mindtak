'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import { ManagerDashboard } from '@/components/hierarchy/manager-dashboard';
import { getManagerPermissions } from '@/lib/hierarchy-service';
import { getDemoUser } from '@/lib/demo-data';
import type { User } from '@/types/index';

export default function ManagerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo mode, allow access without authentication
    if (!userLoading) {
      if (!user) {
        // Create a demo manager user
        const demoUser = {
          id: 'demo-manager-1',
          email: 'manager@demo.com',
          first_name: 'Demo',
          last_name: 'Manager',
          role: 'manager' as const,
          company_id: 'demo-company',
          department: 'Engineering',
          position: 'Engineering Manager',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          hierarchy_level: 3,
          can_view_team_reports: true,
          can_manage_employees: true,
          direct_reports: ['demo-emp-1', 'demo-emp-2', 'demo-emp-3']
        };
        // In a real app, you'd set this in context, but for demo we'll just continue
      }
      setLoading(false);
    }
  }, [user, userLoading, router]);

  const handleViewTeamMember = (employee: User) => {
    // Navigate to team member's profile or reports
    router.push(`/manager/team-member/${employee.id}`);
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

  // Use demo user if no real user is available
  const currentUser = user || getDemoUser('manager');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ManagerDashboard 
          manager={currentUser} 
          onViewTeamMember={handleViewTeamMember}
        />
      </div>
    </div>
  );
}