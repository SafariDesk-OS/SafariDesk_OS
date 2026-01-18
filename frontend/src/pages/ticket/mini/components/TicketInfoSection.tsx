import React from 'react';
import { Info, Calendar, Globe, Monitor } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { formatDate } from '../../../../utils/displayHelpers';

interface TicketInfoSectionProps {
    createdAt: string;
    browser?: string;
    language?: string;
    ipAddress?: string;
    userAgent?: string;
}

export const TicketInfoSection: React.FC<TicketInfoSectionProps> = ({
    createdAt,
    browser,
    language,
    ipAddress,
    userAgent,
}) => {
    return (
        <CollapsibleSection
            title="Ticket Information"
            defaultOpen={false}
            icon={<Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
        >
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(createdAt)}</p>
                    </div>
                </div>

                {browser && (
                    <div className="flex items-start gap-2">
                        <Monitor className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Browser</p>
                            <p className="text-gray-900 dark:text-gray-100">{browser}</p>
                        </div>
                    </div>
                )}

                {language && (
                    <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Language</p>
                            <p className="text-gray-900 dark:text-gray-100">{language}</p>
                        </div>
                    </div>
                )}

                {ipAddress && (
                    <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                            <p className="text-gray-900 dark:text-gray-100 font-mono text-xs">{ipAddress}</p>
                        </div>
                    </div>
                )}

                {userAgent && (
                    <div className="flex items-start gap-2">
                        <Monitor className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">User Agent</p>
                            <p className="text-gray-700 dark:text-gray-300 text-xs break-all">
                                {userAgent}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};
