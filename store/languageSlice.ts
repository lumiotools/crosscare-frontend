import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LanguageState {
  current: string;
  available: string[];
}

const initialState: LanguageState = {
  current: "en",
  available: ["en", "es", "ht", "pt"],
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
