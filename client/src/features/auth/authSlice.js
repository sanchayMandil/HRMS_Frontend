import { createSlice } from "@reduxjs/toolkit";

const USER_KEY = "hrms_user";

const loadFromStorage = () => {
  try {
    return { user: JSON.parse(localStorage.getItem(USER_KEY) || "null") };
  } catch {
    return { user: null };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadFromStorage(),
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    logout: () => {
      localStorage.removeItem(USER_KEY);
      return { user: null };
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
