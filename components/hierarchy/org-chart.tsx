'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Mail, 
  Phone,
  Building,
  Crown,
  Shield,
  User as UserIcon
} from 'lucide-react';
import type { HierarchyNode, User } from '@/types/index';

interface OrgChartProps {
  hierarchy: HierarchyNode[];
  onUserSelect?: (user: User) => void;
  showWellnessIndicators?: boolean;
  compactView?: boolean;
}

interface UserCardProps {
  node: HierarchyNode;
  onToggle: (userId: string) => void;
  onUserSelect?: (user: User) => void;
  showWellnessIndicators?: boolean;
  compactView?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  node, 
  onToggle, 
  onUserSelect, 
  showWellnessIndicators = false,
  compactView = false 
}) => {
  const { user, children, level, isExpanded } = node;
  const hasChildren = children.length > 0;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'employer':
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'hr':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'manager':
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'employer':
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hr':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHierarchyLevel = () => {
    const levels = ['Executive', 'Senior Mgmt', 'Middle Mgmt', 'Team Lead', 'Individual'];
    return levels[user.hierarchy_level || 4] || 'Employee';
  };

  return (
    <div className={`ml-${level * 6}`}>
      <Card 
        className={`mb-2 hover:shadow-md transition-shadow cursor-pointer ${
          compactView ? 'p-2' : 'p-4'
        }`}
        onClick={() => onUserSelect?.(user)}
      >
        <CardContent className={compactView ? 'p-2' : 'p-4'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(user.id);
                  }}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <Avatar className={compactView ? 'h-8 w-8' : 'h-10 w-10'}>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold text-gray-900 ${
                    compactView ? 'text-sm' : 'text-base'
                  }`}>
                    {user.first_name} {user.last_name}
                  </h3>
                  {getRoleIcon(user.role)}
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <p className={`text-gray-600 ${compactView ? 'text-xs' : 'text-sm'}`}>
                    {user.position || 'Employee'}
                  </p>
                  {user.department && (
                    <Badge variant="outline" className="text-xs">
                      <Building className="h-3 w-3 mr-1" />
                      {user.department}
                    </Badge>
                  )}
                </div>
                
                {!compactView && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {user.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.toUpperCase()}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {getHierarchyLevel()}
              </Badge>
              
              {hasChildren && (
                <Badge variant="secondary" className="text-xs">
                  {children.length} {children.length === 1 ? 'Report' : 'Reports'}
                </Badge>
              )}
              
              {showWellnessIndicators && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Wellness OK</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l-2 border-gray-200 pl-4">
          {children.map((child) => (
            <UserCard
              key={child.user.id}
              node={child}
              onToggle={onToggle}
              onUserSelect={onUserSelect}
              showWellnessIndicators={showWellnessIndicators}
              compactView={compactView}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OrgChart: React.FC<OrgChartProps> = ({ 
  hierarchy, 
  onUserSelect, 
  showWellnessIndicators = false,
  compactView = false 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Auto-expand first level on mount
  useEffect(() => {
    const firstLevelIds = hierarchy.map(node => node.user.id);
    setExpandedNodes(new Set(firstLevelIds));
  }, [hierarchy]);

  const toggleNode = (userId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const updateHierarchyExpansion = (nodes: HierarchyNode[]): HierarchyNode[] => {
    return nodes.map(node => ({
      ...node,
      isExpanded: expandedNodes.has(node.user.id),
      children: updateHierarchyExpansion(node.children)
    }));
  };

  const updatedHierarchy = updateHierarchyExpansion(hierarchy);

  if (hierarchy.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Structure</h3>
          <p className="text-gray-600">
            No organizational hierarchy found. Add team members and assign managers to build your org chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Organization Chart</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set(hierarchy.map(n => n.user.id)))}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set())}
          >
            Collapse All
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {updatedHierarchy.map((node) => (
          <UserCard
            key={node.user.id}
            node={node}
            onToggle={toggleNode}
            onUserSelect={onUserSelect}
            showWellnessIndicators={showWellnessIndicators}
            compactView={compactView}
          />
        ))}
      </div>
    </div>
  );
};
