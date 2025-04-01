import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    tableData: [],
};

const tableSlice = createSlice({
    name: "table",
    initialState,
    reducers: {
        setTableData(state, action) {
            state.tableData.push(action.payload);
        },
        clearTableData(state) {
            state.tableData = [];
        }
    },
});

export const { setTableData, clearTableData } = tableSlice.actions;

export default tableSlice.reducer;
