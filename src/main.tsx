import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import AppShell from "./AppShell";
import Overview from "./pages/Overview";
import Monitoring from "./pages/Monitoring";
import Leaderboard from "./pages/Leaderboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/kinerja-pic" element={<Leaderboard />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
