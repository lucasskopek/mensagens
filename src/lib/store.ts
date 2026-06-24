import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, User, UserConfig, Contact, Schedule, MessageHistory } from './types';

interface AppState {
  // Navigation
  currentView: AppView;
  setView: (view: AppView) => void;

  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isDevMode: boolean;

  // Onboarding
  config: UserConfig | null;
  setConfig: (config: UserConfig) => void;

  // Contacts
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;

  // Schedules
  schedules: Schedule[];
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;

  // Message History
  messageHistory: MessageHistory[];
  setMessageHistory: (history: MessageHistory[]) => void;
  addMessageToHistory: (msg: MessageHistory) => void;

  // UI
  isFreeTestSubmitted: boolean;
  setFreeTestSubmitted: (v: boolean) => void;
  showPricing: boolean;
  setShowPricing: (v: boolean) => void;

  // Reset
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'landing',
      setView: (view) => set({ currentView: view }),

      // Auth
      user: null,
      setUser: (user) => set({ user, isDevMode: user?.isDev ?? false }),
      isDevMode: false,

      // Onboarding
      config: null,
      setConfig: (config) => set({ config }),

      // Contacts
      contacts: [],
      setContacts: (contacts) => set({ contacts }),
      addContact: (contact) => set((s) => ({ contacts: [...s.contacts, contact] })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

      // Schedules
      schedules: [],
      setSchedules: (schedules) => set({ schedules }),
      addSchedule: (schedule) => set((s) => ({ schedules: [...s.schedules, schedule] })),
      updateSchedule: (schedule) =>
        set((s) => ({
          schedules: s.schedules.map((sc) => (sc.id === schedule.id ? schedule : sc)),
        })),
      removeSchedule: (id) =>
        set((s) => ({ schedules: s.schedules.filter((sc) => sc.id !== id) })),

      // Message History
      messageHistory: [],
      setMessageHistory: (history) => set({ messageHistory: history }),
      addMessageToHistory: (msg) =>
        set((s) => ({ messageHistory: [msg, ...s.messageHistory] })),

      // UI
      isFreeTestSubmitted: false,
      setFreeTestSubmitted: (v) => set({ isFreeTestSubmitted: v }),
      showPricing: false,
      setShowPricing: (v) => set({ showPricing: v }),

      // Reset
      logout: () =>
        set({
          user: null,
          isDevMode: false,
          config: null,
          contacts: [],
          schedules: [],
          messageHistory: [],
          currentView: 'landing',
          isFreeTestSubmitted: false,
          showPricing: false,
        }),
    }),
    {
      name: 'whatsromance-storage',
      partialize: (state) => ({
        user: state.user,
        isDevMode: state.isDevMode,
        config: state.config,
      }),
    }
  )
);