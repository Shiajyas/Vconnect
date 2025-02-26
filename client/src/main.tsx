import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  // <QueryClientProvider client={queryClient}>
    <BrowserRouter>
     
        <App />
   
    </BrowserRouter>
  // </QueryClientProvider>
);
