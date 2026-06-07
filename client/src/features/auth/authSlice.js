import { createSlice } from "@reduxjs/toolkit";

const USER_KEY = "hrms_user";

const loadFromStorage = () => {
  try {
    return { user: JSON.parse(localStorage.getItem(USER_KEY) || "null"), token: null };
  } catch {
    return { user: null, token: null };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadFromStorage(),
  reducers: {
    setCredentials: (state, action) => {
      state.user  = action.payload.user;
      // token lives in Redux memory only — never persisted to localStorage
      if (action.payload.token !== undefined) {
        state.token = action.payload.token;
      }
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    logout: () => {
      localStorage.removeItem(USER_KEY);
      return { user: null, token: null };
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
