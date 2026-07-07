import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { AuthPage } from "./pages/auth";
import { BiblePage } from "./pages/bible";
import { BuilderPage } from "./pages/builder";
import { DashboardPage } from "./pages/dashboard";
import { HistoryPage } from "./pages/history";
import { LandingPage } from "./pages/landing";
import { LivePage } from "./pages/live";
import { MediaPage } from "./pages/media";
import { PlannerPage } from "./pages/planner";
import { SettingsPage } from "./pages/settings";

export function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route path="/reset-password" element={<AuthPage mode="reset" />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="builder" element={<BuilderPage />} />
          <Route path="live" element={<LivePage />} />
          <Route path="bible" element={<BiblePage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
