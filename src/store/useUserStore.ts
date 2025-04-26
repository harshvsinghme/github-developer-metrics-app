import { create } from 'zustand';

interface UserState {
  email: string | null;
  setEmail: (email: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  email: null,
  setEmail: (email) => set({ email })
}));

