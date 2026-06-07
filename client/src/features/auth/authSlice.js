import { createSlice } from "@reduxjs/toolkit";

const TOKEN_KEY = "hrms_access_token";
const USER_KEY = "hrms_user";

const loadFromStorage = () => {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY) || null,
      user: JSON.parse(localStorage.getItem(USER_KEY) || "null")
    };
  } catch {
    return { token: null, user: null };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadFromStorage(),
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { token: null, user: null };
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
