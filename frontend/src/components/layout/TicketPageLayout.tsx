import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GenericPersistentNav } from './GenericPersistentNav';
import { AGENT_TICKET_VIEW_ITEMS, TICKET_VIEW_ITEMS } from './viewConfigs';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { useAuthStore } from '../../stores/authStore';
import TicketSettingsModal from '../settings/TicketSettingsModal';

/**
 * Layout specifically for ticket-related pages
 * Shows GenericPersistentNav with ticket-specific views and counts
 */
export const TicketPageLayout: React.FC = () => {
    const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const location = useLocation();
    const { user } = useAuthStore();
    
    // Check if user is admin
    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'superuser' || role === 'administrator';
    
    // Check if we're viewing an individual ticket (has ticket ID in URL)
    const isIndividualTicketView = /^\/ticket\/[^/]+$/.test(location.pathname);

    useEffect(() => {
        const fetchTicketCounts = async () => {
            try {
                const response = await http.get(APIS.TICKET_COUNTS);
                setTicketCounts(response.data);
            } catch (error: unknown) {
                const errorMsg = error instanceof Error ? error.message : "Failed to fetch ticket counts";
                console.error(errorMsg);
            }
        };

        fetchTicketCounts();
        // Refresh counts every 30 seconds
        const interval = setInterval(fetchTicketCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const viewItems = role ? (isAdmin ? TICKET_VIEW_ITEMS : AGENT_TICKET_VIEW_ITEMS) : TICKET_VIEW_ITEMS;

    return (
        <div className="flex max-h-[84vh] overflow-hidden">
            {!isIndividualTicketView && (
                <GenericPersistentNav
                    viewItems={viewItems}
                    viewCounts={ticketCounts}
                    viewsTitle="Views"
                    showSettings={isAdmin}
                    onSettingsClick={() => setShowSettingsModal(true)}
                />
            )}
            <main className={`${isIndividualTicketView ? 'w-full' : 'flex-1'} overflow-y-auto bg-gray-50 dark:bg-gray-900`}>
                <Outlet />
            </main>
            
            {/* Settings Modal */}
            <TicketSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </div>
    );
};
