import { toast } from 'react-hot-toast';

export const successNotification = (message: string): void => {
  toast.success(message);
};

export const errorNotification = (message: string): void => {
  toast.error(message);
};

export const infoNotification = (message: string): void => {
  toast(message);
};

export const warningNotification = (message: string): void => {
  toast(message, { icon: '⚠️' });
};

export const clearAllNotifications = (): void => {
  toast.dismiss();
};

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export const showNotification = (
  type: NotificationType,
  message: string,
): void => {
  const notificationMap = {
    success: successNotification,
    error: errorNotification,
    info: infoNotification,
    warning: warningNotification,
  };

  notificationMap[type](message);
};
