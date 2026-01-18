import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    ChevronRight,
    ChevronLeft,
    Menu,
    X,
    Settings,
} from 'lucide-react';

export interface ViewItem {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}



interface GenericPersistentNavProps {
    viewItems: ViewItem[];
    viewCounts?: Record<string, number>;
    viewsTitle?: string;
    showSettings?: boolean;
    onSettingsClick?: () => void;
}

/**
 * Generic persistent navigation component
 * Shows only view items - main navigation is in top header
 */
export const GenericPersistentNav: React.FC<GenericPersistentNavProps> = ({
    viewItems,
    viewCounts = {},
    viewsTitle = 'Views',
    showSettings = false,
    onSettingsClick,
}) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const getCountForView = (viewPath: string): number | undefined => {
        const viewName = new URLSearchParams(viewPath.split('?')[1]).get('view');
        return viewName ? viewCounts[viewName] : undefined;
    };

    const navContent = (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Header - Fixed Height */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                {!isCollapsed && (
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Views
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
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                </button>
            </div>

            {/* Views Section - Scrollable */}
            <nav className="flex-1 overflow-y-auto p-2">
                {viewItems.length > 0 && (
                    <div className="mt-2">
                        <div className="mt-1 space-y-0.5">
                                {viewItems.map((view) => {
                                    const count = getCountForView(view.path);
                                    const isActive = location.pathname + location.search === view.path;
                                    const Icon = view.icon;

                                    return (
                                        <NavLink
                                            key={view.path}
                                            to={view.path}
                                            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors mr-2 ${isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            {!isCollapsed && (
                                                <>
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
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </nav>

            {showSettings && onSettingsClick && (
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2" style={{ paddingBottom: '12px' }}>
                    <button
                        onClick={onSettingsClick}
                        className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-sm transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span>Settings</span>}
                    </button>
                </div>
            )}
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
