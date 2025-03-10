import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  loading: false,
  user_id: "",
  user_email: "",
  user_name: "",
  user_photo: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setToken: (state, action) => {
      console.log("Dispatching setToken:", action.payload);
      state.token = action.payload;
    },
    removeToken: (state) => {
      state.token = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      console.log("Dispatching setUser:", action.payload);
      state.user_id = action.payload.user_id;
      state.user_email = action.payload.user_email;
      state.user_name = action.payload.user_name;
      state.user_photo = action.payload.user_photo;
      state.token = action.payload.token;  // 🔥 Ensure token is stored
    },
    removeUser: (state) => {
      state.user_id = "";
      state.user_email = "";
      state.user_name = "";
      state.user_photo = "";
      state.token = null;
    },
  },
});

export const { setToken, removeToken, setLoading, setUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
