import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  message: string;
  show: (message?: string) => void;
  hide: () => void;
}

let autoDismissTimer: any = null;

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  message: 'Loading Blueprint...',
  show: (message = 'Loading Studio...') => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    autoDismissTimer = setTimeout(() => {
      set({ isLoading: false });
    }, 4500);
    set({ isLoading: true, message });
  },
  hide: () => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    set({ isLoading: false });
  },
}));
