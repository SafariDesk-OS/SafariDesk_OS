import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; 
const WARNING_TIMEOUT = 30 * 1000;

export const useInactivityLogout = () => {
  const { logout, isAuthenticated } = useAuthStore();
  const activityTimer = useRef<any>(null); 
  const warningTimer = useRef<any>(null); 
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_TIMEOUT / 1000);

  // Function to perform a full reset of all timers and state
  const fullResetTimers = useCallback(() => {
    if (activityTimer.current) {
      clearTimeout(activityTimer.current);
    }
    if (warningTimer.current) {
      clearInterval(warningTimer.current); // Use clearInterval for setInterval
      warningTimer.current = null; // Clear ref
    }
    setShowWarning(false);
    setCountdown(WARNING_TIMEOUT / 1000);

    if (isAuthenticated) {
      activityTimer.current = setTimeout(() => {
        setShowWarning(true);
        // Start warning countdown only if it's not already running
        if (!warningTimer.current) {
          warningTimer.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(warningTimer.current!);
                warningTimer.current = null; // Clear ref after logout
                logout(); // Perform logout
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, logout]);

  const resetInactivityTimerAndHideWarning = useCallback(() => {
    if (activityTimer.current) {
      clearTimeout(activityTimer.current);
    }
    setShowWarning(false); // Hide the dialog

    if (isAuthenticated) {
      // Restart the main inactivity timer
      activityTimer.current = setTimeout(() => {
        setShowWarning(true);
        if (!warningTimer.current) { 
          warningTimer.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(warningTimer.current!);
                warningTimer.current = null;
                logout();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, logout]);


  const handleActivity = useCallback(() => {
    fullResetTimers();
  }, [fullResetTimers]);

  useEffect(() => {
    if (isAuthenticated) {
      fullResetTimers(); // Initial setup

      const events = ['load', 'click', 'keypress'];
      events.forEach((event) => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        if (activityTimer.current) {
          clearTimeout(activityTimer.current);
        }
        if (warningTimer.current) {
          clearInterval(warningTimer.current);
        }
        events.forEach((event) => {
          window.removeEventListener(event, handleActivity);
        });
      };
    } else {
      // Clear timers if not authenticated
      if (activityTimer.current) {
        clearTimeout(activityTimer.current);
      }
      if (warningTimer.current) {
        clearInterval(warningTimer.current);
      }
      setShowWarning(false);
      setCountdown(WARNING_TIMEOUT / 1000);
    }
  }, [isAuthenticated, handleActivity, fullResetTimers]);

  return { showWarning, countdown, resetInactivityTimerAndHideWarning };
};
