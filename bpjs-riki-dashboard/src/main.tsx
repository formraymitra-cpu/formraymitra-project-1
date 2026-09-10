import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DatasetProvider } from "./useDataset";
import Overview from "./pages/Overview";
import MonthlyProgress from "./pages/MonthlyProgress";
import LocationDetail from "./pages/LocationDetail";
import PaymentRecap from "./pages/PaymentRecap";
import ActivityLog from "./pages/ActivityLog";
import Notes from "./pages/Notes";
import "./index.css";

const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Overview /> },
      { path: "/progress", element: <MonthlyProgress /> },
      { path: "/lokasi", element: <LocationDetail /> },
      { path: "/nominal", element: <PaymentRecap /> },
      { path: "/aktivitas", element: <ActivityLog /> },
      { path: "/catatan", element: <Notes /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DatasetProvider>
      <RouterProvider router={router} />
    </DatasetProvider>
  </React.StrictMode>,
);
