import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import DatasetPage from "./DatasetPage.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },           // your existing predictor UI
  { path: "/dataset", element: <DatasetPage /> }, // new paginated table
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
