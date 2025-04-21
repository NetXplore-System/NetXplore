import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../redux/user/userSlice";
import tableReducer from "../redux/table/tableSlice";
import imagesReducer, { checkImagesValue } from "../redux/images/imagesSlice";


const store = configureStore({
  reducer: {
    user: userReducer,
    table: tableReducer,
    images: imagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(checkImagesValue), 
});

export default store;
