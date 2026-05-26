import { create } from "zustand";

const useDeadlinesStore = create((set) => ({
  deadlines: [],
  loading: false,

  setDeadlines: (data) => set({ deadlines: data }),

  addDeadline: (item) =>
    set((state) => ({
      deadlines: [...state.deadlines, item],
    })),

  clearDeadlines: () => set({ deadlines: [] }),
}));

export default useDeadlinesStore;