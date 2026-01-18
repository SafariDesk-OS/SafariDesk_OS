// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// interface UIState {
//   theme: 'light' | 'dark' | 'system';
//   sidebarCollapsed: boolean;
//   sidebarOpen: boolean; // For mobile
  
//   // Actions
//   setTheme: (theme: 'light' | 'dark' | 'system') => void;
//   toggleSidebar: () => void;
//   setSidebarOpen: (open: boolean) => void;
//   toggleTheme: () => void;
// }

// export const useUIStore = create<UIState>()(
//   persist(
//     (set, get) => ({
//       theme: 'system',
//       sidebarCollapsed: false,
//       sidebarOpen: false,

//       setTheme: (theme) => {
//         set({ theme });
        
//         // Apply theme to document
//         const root = document.documentElement;
//         if (theme === 'dark') {
//           root.classList.add('dark');
//         } else if (theme === 'light') {
//           root.classList.remove('dark');
//         } else {
//           // System theme
//           const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//           if (prefersDark) {
//             root.classList.add('dark');
//           } else {
//             root.classList.remove('dark');
//           }
//         }
//       },

//       toggleSidebar: () => {
//         set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
//       },

//       setSidebarOpen: (open) => {
//         set({ sidebarOpen: open });
//       },

//       toggleTheme: () => {
//         const { theme } = get();
//         const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
//         get().setTheme(newTheme);
//       },
//     }),
//     {
//       name: 'ui-storage',
//       onRehydrateStorage: (state) => {
//         // Apply theme on load
//         if (state?.theme) {
//           const root = document.documentElement;
//           if (state.theme === 'dark') {
//             root.classList.add('dark');
//           } else if (state.theme === 'light') {
//             root.classList.remove('dark');
//           } else {
//             const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//             if (prefersDark) {
//               root.classList.add('dark');
//             } else {
//               root.classList.remove('dark');
//             }
//           }
//         }
//       },
//     }
//   )
// );



import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // For mobile
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Changed from 'system' to 'light'
      sidebarCollapsed: false,
      sidebarOpen: false,

      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: (state) => {
        // Apply theme on load
        if (state?.theme) {
          const root = document.documentElement;
          if (state.theme === 'dark') {
            root.classList.add('dark');
          } else if (state.theme === 'light') {
            root.classList.remove('dark');
          } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        }
      },
    }
  )
);