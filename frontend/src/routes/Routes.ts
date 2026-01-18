import { LayoutDashboard, Ticket, CheckSquare, Package, FileText, Users, UserCheck2, Settings,Lock, List } from "lucide-react";
import { NavigationItem } from "../types";
// import AssetManagementPage from "../pages/asset-management/AssetManagementPage";

export const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, role: ['customer', 'admin', 'agent'] },
  { name: (role: string) => (role === 'admin' ? 'Tickets' : 'My Tickets'), href: '/tickets', icon: Ticket, role: ['customer', 'admin', 'agent'] },
  { name: (role: string) => (role === 'admin' ? 'Tasks' : 'My Tasks'), href: '/tasks', icon: CheckSquare, role: ['customer', 'admin', 'agent'] },
  { name: (role: string) => (role === 'admin' ? 'Assets' : 'My Assets'), href: '/assets', icon: Package, role: ['customer', 'admin', 'agent'] },
  { name: 'Knowledge Base', href: '/knowledge', icon: FileText, role: ['customer', 'admin', 'agent'] },
  { 
    name: 'User Mgnt', 
    icon: Users,
    role: ['admin'],
    children: [
      { name: 'Agents', href: '/users/agents', icon: Users, role: ['admin'] },
      { name: 'Customers', href: '/users/customers', icon: UserCheck2, role: ['admin'] },
      { name: 'Role & Permissions', href: '/users/roles', icon: Lock, role: ['admin'] },
    ]
  },
  { name: 'Configurations', href: '/config/general', icon: Settings, role: ['admin'] },
  // REMOVED: Request workflow has been removed from the system
  // { name: 'Requests', href: '/requests', icon: List, role: ['admin'] },

];
