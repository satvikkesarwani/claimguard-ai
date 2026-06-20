import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import ClaimsDashboard from "./pages/ClaimsDashboard";
import ClaimIntake from "./pages/ClaimIntake";
import ClaimReview from "./pages/ClaimReview";
import AgentsPage from "./pages/AgentsPage";
import ReportPage from "./pages/ReportPage";
import Analytics from "./pages/Analytics";
import FraudWorkspace from "./pages/FraudWorkspace";
import ForensicsLab from "./pages/ForensicsLab";
import HospitalPortal from "./pages/HospitalPortal";
import AuditLogs from "./pages/AuditLogs";
import Feedback from "./pages/Feedback";
import Architecture from "./pages/Architecture";
import DemoGuide from "./pages/DemoGuide";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/claims" element={<ClaimsDashboard />} />
        <Route path="/claims/new" element={<ClaimIntake />} />
        <Route path="/claims/:id" element={<ClaimReview />} />
        <Route path="/claims/:id/report" element={<ReportPage />} />
        <Route path="/agents/:claimId" element={<AgentsPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/fraud" element={<FraudWorkspace />} />
        <Route path="/forensics" element={<ForensicsLab />} />
        <Route path="/hospital" element={<HospitalPortal />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/demo-guide" element={<DemoGuide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
