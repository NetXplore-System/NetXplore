import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    images: [],
};

const imagesSlice = createSlice({
    name: "images",
    initialState,
    reducers: {
        addToEnd(state, action) {
            state.images.push(action.payload);
        },
        addToStart(state, action) {
            state.images.unshift(action.payload);
        },
        removeFromEnd(state) {
            state.images.pop();
        },
        removeFromStart(state) {
            state.images.shift();
        },
        clearImages(state) {
            state.images = [];
        },
    },
});

export const { addToEnd, addToStart, clearImages, removeFromEnd,removeFromStart } = imagesSlice.actions;

export default imagesSlice.reducer;
