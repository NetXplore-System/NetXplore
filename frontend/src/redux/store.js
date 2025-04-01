import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../redux/user/userSlice";
import tableReducer from "../redux/table/tableSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    table: tableReducer,
  },
});

export default store;
