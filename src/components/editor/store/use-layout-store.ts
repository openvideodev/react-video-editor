import { create } from "zustand";

interface LayoutStore {
  floatingControl: string;
  floatingControlData: any;
  setFloatingControl: (control: string, data?: any) => void;
  openTransitionDialog: boolean;
  setOpenTransitionDialog: (open: boolean) => void;
}

const useLayoutStore = create<LayoutStore>((set) => ({
  floatingControl: "",
  floatingControlData: null,
  setFloatingControl: (control: string, data: any = null) =>
    set({ floatingControl: control, floatingControlData: data }),
  openTransitionDialog: false,
  setOpenTransitionDialog: (open: boolean) => set({ openTransitionDialog: open }),
}));

export default useLayoutStore;
