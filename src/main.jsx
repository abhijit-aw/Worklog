import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { StoreProvider } from "./store";
import App from "./App";
import "./index.css";
 
createRoot(document.getElementById("root")).render(
  <StoreProvider><HashRouter><App /></HashRouter></StoreProvider>
);
 