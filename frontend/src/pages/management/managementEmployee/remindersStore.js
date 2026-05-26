import { create } from "zustand";

const useRemindersStore = create((set) => ({
  reminders: [],

  setReminders: (data) => set({ reminders: data }),

  addReminder: (item) =>
    set((state) => ({
      reminders: [...state.reminders, item],
    })),
}));

export default useRemindersStore;