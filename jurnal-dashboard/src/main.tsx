import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import AppShell from "./AppShell";
import Overview from "./pages/Overview";
import RekapBulanan from "./pages/RekapBulanan";
import MonitoringHarian from "./pages/MonitoringHarian";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/rekap-bulanan" element={<RekapBulanan />} />
          <Route path="/monitoring-harian" element={<MonitoringHarian />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
