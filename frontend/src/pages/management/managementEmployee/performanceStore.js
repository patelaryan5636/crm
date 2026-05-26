import { create } from "zustand";

const usePerformanceStore = create((set) => ({
  performanceData: [],

  setPerformanceData: (data) => set({ performanceData: data }),
}));

export default usePerformanceStore;