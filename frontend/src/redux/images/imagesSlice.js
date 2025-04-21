import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

const initialState = {
    images: [],
};

const imagesSlice = createSlice({
    name: "images",
    initialState,
    reducers: {
        addToEnd(state, action) {            
            state.images.push(action.payload);
            toast.success("Image added to list.");
        },
        replaseImage(state, action) {
            toast.success("Image already exists for this graph, replacing it.");
            state.images[action.payload.imageIndex] = action.payload;
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
export const checkImagesValue = (store) => (next) => (action) => {
    if (action.type === "images/addToEnd") {
        const state = store.getState();

        const existingImageIndex = state.images.images.findIndex(
            (image) =>
                image?.index === action.payload?.index &&
                image.type === action.payload.type
        );

        if (existingImageIndex !== -1) {
            store.dispatch({
                type: "images/replaseImage",
                payload: {
                    ...action.payload,
                    imageIndex: existingImageIndex,
                },
            });
            return; 
        }

        return next(action);
    }

    return next(action);
};

export default imagesSlice.reducer;
