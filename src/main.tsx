import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(17,17,19,0.92)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(18px)",
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
