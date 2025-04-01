import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    tableData: null,
};

const tableSlice = createSlice({
    name: "table",
    initialState,
    reducers: {
        setTableData(state, action) {
            state.tableData = action.payload;
        }
    },
});

export const { setTableData } = tableSlice.actions;

export default tableSlice.reducer;
