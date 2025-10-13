import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
}

const initialState: SidebarState = {
  isOpen: false, // Closed by default, will be set based on screen size
  isCollapsed: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeSidebar: (state) => {
      state.isOpen = false;
    },
    openSidebar: (state) => {
      state.isOpen = true;
    },
    collapseSidebar: (state) => {
      state.isCollapsed = !state.isCollapsed;
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload;
    },
    setOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  closeSidebar,
  openSidebar,
  collapseSidebar,
  setCollapsed,
  setOpen,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
