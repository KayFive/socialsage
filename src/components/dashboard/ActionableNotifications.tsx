// components/dashboard/ActionableNotifications.tsx
import { Clock, TrendingUp, Calendar } from 'lucide-react';

interface ActionableNotificationsProps {
  notifications: Array<{
    id: string;
    type: 'timing' | 'opportunity' | 'milestone' | 'insight' | 'reminder';
    title: string;
    body: string;
    action_label: string;
    action_data?: any;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function ActionableNotifications({ notifications }: ActionableNotificationsProps) {
  // Safety check to ensure notifications is an array
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'timing':
      case 'optimal_posting_time':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'opportunity':
      case 'trending_opportunity':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'reminder':
      case 'posting_reminder':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      default:
        return <span className="text-lg">🔔</span>;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'timing':
      case 'optimal_posting_time':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'opportunity':
      case 'trending_opportunity':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'reminder':
      case 'posting_reminder':
        return 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const handleAction = (notification: any) => {
    // Handle different action types
    switch (notification.type) {
      case 'timing':
      case 'optimal_posting_time':
        // Could open Instagram or a scheduling tool
        window.open('https://instagram.com', '_blank');
        break;
      case 'opportunity':
      case 'trending_opportunity':
        // Could show trend details or redirect to content creation
        console.log('Show trending opportunity details:', notification.action_data);
        break;
      case 'reminder':
      case 'posting_reminder':
        // Could open calendar or scheduling interface
        console.log('Open posting scheduler');
        break;
      default:
        console.log('Handle action:', notification.action_label);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notifications.slice(0, 3).map((notification) => (
          <div 
            key={notification.id} 
            className={`rounded-lg p-4 border ${getNotificationBg(notification.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  {notification.body}
                </p>
                <button
                  onClick={() => handleAction(notification)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {notification.action_label}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}