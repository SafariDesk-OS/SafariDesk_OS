import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GenericPersistentNav } from './GenericPersistentNav';
import { AGENT_TASK_VIEW_ITEMS, TASK_VIEW_ITEMS } from './taskViewConfigs';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { useAuthStore } from '../../stores/authStore';
import TaskSettingsModal from '../settings/TaskSettingsModal';

/**
 * Layout specifically for task-related pages
 * Shows GenericPersistentNav with task-specific views and counts
 */
export const TaskPageLayout: React.FC = () => {
    const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const location = useLocation();
    const { user } = useAuthStore();
    
    // Check if user is admin
    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'superuser' || role === 'administrator';
    
    // Check if we're viewing an individual task (has task ID in URL)
    const isIndividualTaskView = /^\/task\/[^/]+$/.test(location.pathname);

    useEffect(() => {
        const fetchTaskCounts = async () => {
            try {
                const response = await http.get(APIS.TASK_COUNTS);
                setTaskCounts(response.data);
            } catch (error: unknown) {
                const errorMsg = error instanceof Error ? error.message : "Failed to fetch task counts";
                console.error(errorMsg);
            }
        };

        fetchTaskCounts();
        // Refresh counts every 30 seconds
        const interval = setInterval(fetchTaskCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const viewItems = role ? (isAdmin ? TASK_VIEW_ITEMS : AGENT_TASK_VIEW_ITEMS) : TASK_VIEW_ITEMS;

    return (
        <div className="flex max-h-[84vh] overflow-hidden">
            {!isIndividualTaskView && (
                <GenericPersistentNav
                    viewItems={viewItems}
                    viewCounts={taskCounts}
                    viewsTitle="Views"
                    showSettings={isAdmin}
                    onSettingsClick={() => setShowSettingsModal(true)}
                />
            )}
            <main className={`${isIndividualTaskView ? 'w-full' : 'flex-1'} overflow-y-auto bg-gray-50 dark:bg-gray-900`}>
                <Outlet />
            </main>
            
            {/* Settings Modal */}
            <TaskSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </div>
    );
};
