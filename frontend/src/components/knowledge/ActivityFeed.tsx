import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Edit, Clock, User } from 'lucide-react';
import http from '../../services/http';

interface ActivityItem {
  id: string;
  type: 'approved' | 'rejected' | 'submitted' | 'edited';
  article: {
    title: string;
    slug: string;
    author: string;
  };
  user: string;
  timestamp: string;
  metadata?: {
    rejection_reason?: string;
  };
}

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ limit = 10, showHeader = true }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await http.get(`/kb/analytics/activity_feed/?limit=${limit}`);
        setActivities(response.data);
      } catch (error) {
        console.error('Failed to fetch activity feed:', error);
        // Fallback to mock data if API fails
        const mockActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'approved',
            article: {
              title: 'Building & Publishing Articles in the SafariDesk Knowledge Base',
              slug: 'building-publishing-articles-in-the-safaridesk-knowledge-base',
              author: 'John Doe'
            },
            user: 'Admin User',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: '2',
            type: 'submitted',
            article: {
              title: 'New Feature Guide: Advanced Search',
              slug: 'new-feature-guide-advanced-search',
              author: 'Mike Johnson'
            },
            user: 'Mike Johnson',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          }
        ];
        setActivities(mockActivities.slice(0, limit));
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'submitted':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'edited':
        return <Edit className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'approved':
        return (
          <span>
            <span className="font-semibold text-green-600">{activity.user}</span>
            {' '}approved article{' '}
            <span className="font-medium">{activity.article.title}</span>
            {' '}by {activity.article.author}
          </span>
        );
      case 'rejected':
        return (
          <span>
            <span className="font-semibold text-red-600">{activity.user}</span>
            {' '}rejected article{' '}
            <span className="font-medium">{activity.article.title}</span>
            {' '}by {activity.article.author}
            {activity.metadata?.rejection_reason && (
              <div className="text-sm text-gray-500 mt-1">
                Reason: {activity.metadata.rejection_reason}
              </div>
            )}
          </span>
        );
      case 'submitted':
        return (
          <span>
            <span className="font-semibold text-blue-600">{activity.user}</span>
            {' '}submitted article{' '}
            <span className="font-medium">{activity.article.title}</span>
            {' '}for approval
          </span>
        );
      case 'edited':
        return (
          <span>
            <span className="font-semibold text-yellow-600">{activity.user}</span>
            {' '}updated article{' '}
            <span className="font-medium">{activity.article.title}</span>
          </span>
        );
      default:
        return <span>Unknown activity</span>;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Knowledge Base Activity
          </h3>
        )}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Knowledge Base Activity
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <User className="w-4 h-4 mr-1" />
            Recent changes
          </div>
        </div>
      )}

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 dark:text-white">
                  {getActivityText(activity)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && showHeader && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
