# 🏢 Organizational Hierarchy Implementation

This document outlines the complete organizational hierarchy system implemented in the employee wellness platform, similar to Keka HRS.

## 🎯 **Overview**

The hierarchy system provides:
- **Multi-level organizational structure** (CEO → VP → Director → Manager → Employee)
- **Role-based access control** with granular permissions
- **Team management capabilities** for managers
- **Hierarchy-aware reporting** and analytics
- **Org chart visualization** with interactive features

## 📊 **Key Features Implemented**

### **1. Enhanced User Model**
```typescript
interface User {
  // Hierarchy fields
  hierarchy_level?: number;        // 0=CEO, 1=VP, 2=Director, 3=Manager, 4=Employee
  reporting_chain?: string[];      // Full hierarchy path
  direct_reports?: string[];       // Array of direct subordinate IDs
  manager_id?: string;            // Direct manager
  
  // Permissions
  is_department_head?: boolean;
  can_approve_leaves?: boolean;
  can_view_team_reports?: boolean;
  can_manage_employees?: boolean;
  skip_level_access?: boolean;     // Can view subordinates' subordinates
}
```

### **2. Hierarchy Service Functions**
- `getDirectReports(managerId)` - Get immediate team members
- `getTeamHierarchy(managerId, depth)` - Build complete org tree
- `getAllSubordinates(managerId)` - Get all team members recursively
- `canAccessEmployeeData(viewerId, targetId)` - Permission checking
- `getTeamStats(managerId)` - Team wellness analytics
- `updateReportingChain(employeeId, newManagerId)` - Maintain relationships
- `getHierarchyFilteredReports(userId, companyId)` - Role-based reports

### **3. Manager Dashboard**
**Location**: `/manager/dashboard`
- Team overview with wellness metrics
- Direct reports management
- Quick actions for team operations
- Permission-based feature access

### **4. Organization Chart**
**Location**: `/manager/org-chart`
- Interactive hierarchy visualization
- Expandable/collapsible tree structure
- Role-based icons and badges
- Wellness indicators (optional)
- Export functionality

### **5. Enhanced Employee Creation**
**Location**: `/employer/employees/new`
- Hierarchy level selection
- Manager assignment
- Permission configuration
- Automatic role determination based on level

## 🔐 **Permission System**

### **Access Levels**
1. **Employee**: Own data only
2. **Manager**: Direct reports + team analytics
3. **Department Head**: Department-wide access
4. **Skip-Level Manager**: Can view subordinates' teams
5. **HR/Admin**: Company-wide access

### **Permission Matrix**
| Permission | Employee | Manager | Dept Head | HR/Admin |
|------------|----------|---------|-----------|----------|
| View own reports | ✅ | ✅ | ✅ | ✅ |
| View direct reports | ❌ | ✅ | ✅ | ✅ |
| View team analytics | ❌ | ✅ | ✅ | ✅ |
| View department data | ❌ | ❌ | ✅ | ✅ |
| Manage employees | ❌ | ✅* | ✅ | ✅ |
| Access org chart | ❌ | ✅ | ✅ | ✅ |

*Only their direct reports

## 🚀 **Usage Examples**

### **1. Creating a Manager**
```typescript
// In employee creation form
const newEmployee = {
  hierarchy_level: 3,           // Manager level
  can_view_team_reports: true,
  can_manage_employees: true,
  manager_id: 'senior-manager-id'
};
```

### **2. Checking Access Permissions**
```typescript
const canAccess = await canAccessEmployeeData(managerId, employeeId);
if (canAccess) {
  // Show employee wellness data
}
```

### **3. Getting Team Statistics**
```typescript
const teamStats = await getTeamStats(managerId);
console.log(`Team size: ${teamStats.team_size}`);
console.log(`Average wellness: ${teamStats.avg_team_wellness}/10`);
```

## 🧪 **Testing the System**

### **Test Pages**
1. **Hierarchy Test**: `/test-hierarchy`
   - Test all hierarchy functions
   - Verify permissions
   - Check team statistics

2. **Reports Test**: `/test-reports`
   - Test hierarchy-filtered reports
   - Verify personal history access

### **API Endpoints**
- `GET /api/hierarchy/test` - Test hierarchy functions
- `POST /api/hierarchy/test` - Test access permissions
- `GET /api/reports/recent` - Test filtered reports

## 📱 **Navigation Updates**

The navbar now includes manager-specific navigation:
- **Team Dashboard** - Manager's team overview
- **Org Chart** - Interactive organization chart
- **AI Assistant** - Wellness chat with team context

## 🔄 **Integration with Existing Features**

### **Enhanced Chat AI**
- AI now has access to team context for managers
- Can reference team wellness trends
- Provides manager-specific insights

### **Hierarchy-Aware Reports**
- Reports page shows only accessible data
- Managers see team reports
- HR sees company-wide data

### **Analytics Enhancement**
- Team-based analytics for managers
- Department comparisons
- Hierarchy health metrics

## 🎨 **UI Components**

### **1. OrgChart Component**
```typescript
<OrgChart
  hierarchy={teamHierarchy}
  onUserSelect={handleUserSelect}
  showWellnessIndicators={true}
  compactView={false}
/>
```

### **2. ManagerDashboard Component**
```typescript
<ManagerDashboard 
  manager={user} 
  onViewTeamMember={handleViewTeamMember}
/>
```

## 🔧 **Configuration**

### **Hierarchy Levels**
```typescript
const hierarchyLevels = [
  { value: '0', label: 'Executive (CEO, President)' },
  { value: '1', label: 'Senior Management (VP, SVP)' },
  { value: '2', label: 'Middle Management (Director)' },
  { value: '3', label: 'Team Lead (Manager)' },
  { value: '4', label: 'Individual Contributor' },
];
```

### **Default Permissions**
- **Level 0-2**: Full management permissions
- **Level 3**: Team management only
- **Level 4**: No management permissions

## 📈 **Benefits**

1. **Scalable Organization**: Supports complex org structures
2. **Role-Based Security**: Granular access control
3. **Manager Empowerment**: Tools for team management
4. **Data Privacy**: Appropriate access levels
5. **Visual Clarity**: Interactive org charts
6. **Wellness Focus**: Team health monitoring

## 🔮 **Future Enhancements**

- **Leave Management**: Approval workflows
- **Performance Reviews**: Hierarchy-based reviews
- **Goal Setting**: Cascading objectives
- **Team Scheduling**: Manager scheduling tools
- **Bulk Operations**: Mass team updates

---

The hierarchy system is now fully integrated and ready for production use! 🚀