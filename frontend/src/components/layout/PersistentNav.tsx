import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    CheckSquare,
    BookOpen,
    Settings,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    Inbox,
    UserX,
    AlertCircle,
    CheckCircle,
    RotateCcw,
    AlertTriangle,
    XCircle,
    User,
    ShieldAlert,
    Archive,
    Trash2,
} from 'lucide-react';

interface ViewItem {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    count?: number;
}

const MAIN_NAV_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
    { name: 'Configurations', path: '/config', icon: Settings },
];

const VIEW_ITEMS: ViewItem[] = [
    { name: 'All Tickets', path: '/tickets?view=all_tickets', icon: Inbox },
    { name: 'All Unassigned', path: '/tickets?view=all_unassigned', icon: UserX },
    { name: 'All Unresolved', path: '/tickets?view=all_unresolved', icon: AlertCircle },
    { name: 'All Resolved', path: '/tickets?view=all_resolved', icon: CheckCircle },
    { name: 'Reopened', path: '/tickets?view=reopened', icon: RotateCcw },
    { name: 'My Overdue', path: '/tickets?view=my_overdue', icon: AlertTriangle },
    { name: 'My Unresolved', path: '/tickets?view=my_unresolved', icon: XCircle },
    { name: 'My Resolved', path: '/tickets?view=my_resolved', icon: CheckCircle },
    { name: 'Requested by Me', path: '/tickets?view=requested_by_me', icon: User },
    { name: 'SLA Breached', path: '/tickets?view=sla_breached', icon: ShieldAlert },
    { name: 'Archived', path: '/tickets?view=archived', icon: Archive },
    { name: 'Trash', path: '/tickets?view=trash', icon: Trash2 },
];

interface PersistentNavProps {
    viewCounts?: Record<string, number>;
}

export const PersistentNav: React.FC<PersistentNavProps> = ({ viewCounts = {} }) => {
    const [isViewsOpen, setIsViewsOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const getCountForView = (viewPath: string): number | undefined => {
        const viewName = new URLSearchParams(viewPath.split('?')[1]).get('view');
        return viewName ? viewCounts[viewName] : undefined;
    };

    const navContent = (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                {!isCollapsed && (
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        SafariDesk
                    </h2>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:block"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {MAIN_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && <span>{item.name}</span>}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Views Section */}
                {!isCollapsed && (
                    <div className="mt-6">
                        <button
                            onClick={() => setIsViewsOpen(!isViewsOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                            <span>Views</span>
                            {isViewsOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>

                        {isViewsOpen && (
                            <div className="mt-1 space-y-0.5">
                                {VIEW_ITEMS.map((view) => {
                                    const count = getCountForView(view.path);
                                    const isActive = location.pathname + location.search === view.path;
                                    const Icon = view.icon;

                                    return (
                                        <NavLink
                                            key={view.path}
                                            to={view.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="flex-1 truncate">{view.name}</span>
                                            {count !== undefined && (
                                                <span
                                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${count > 0
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {count}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 lg:hidden"
                aria-label="Toggle navigation menu"
            >
                {isMobileOpen ? (
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:sticky top-0 left-0 h-screen z-40 transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {navContent}
            </aside>
        </>
    );
};
