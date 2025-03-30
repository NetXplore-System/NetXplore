import 'aframe';

if (!window.AFRAME) {
  window.AFRAME = require('aframe');
}

console.log("AFRAME loaded:", window.AFRAME);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
