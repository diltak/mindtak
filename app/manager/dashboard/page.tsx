'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Navbar } from '@/components/shared/navbar';
import { ManagerDashboard } from '@/components/hierarchy/manager-dashboard';
import { withAuth } from '@/components/auth/with-auth';
import type { User } from '@/types/index';

function ManagerDashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const handleViewTeamMember = (employee: User) => {
    // Navigate to team member's profile or reports
    router.push(`/manager/team-member/${employee.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ManagerDashboard 
          manager={user} 
          onViewTeamMember={handleViewTeamMember}
        />
      </div>
    </div>
  );
}

export default withAuth(ManagerDashboardPage, ['manager', 'admin']);
