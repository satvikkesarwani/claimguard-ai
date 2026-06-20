// ClaimGuard AI — Demo Guide (route: /demo-guide). 5-minute recording script.
import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { PageIntro } from "../components/ui";

const STEPS = [
  {
    time: "0:00",
    title: "Landing / Overview",
    route: "/",
    action: "Open the landing page",
    show: "Title, tagline, KPI cards and value cards",
    narration:
      "ClaimGuard AI is a multi-agent AI decision layer that makes health-insurance claims faster, fairer and fraud-resistant.",
  },
  {
    time: "0:30",
    title: "Claims Dashboard",
    route: "/claims",
    action: "Click Open Claims Dashboard, then filter by Critical Risk",
    show: "The full claims queue with live risk scores and one-click risk filters",
    narration:
      "Every claim is scored 0–100 and triaged into four risk bands. Auditors instantly see what needs attention.",
  },
  {
    time: "1:00",
    title: "Submit New Claim",
    route: "/claims/new",
    action: "Toggle 'inflated billing' and 'identity issue', watch the live score",
    show: "The hospital submission form with a live risk preview",
    narration:
      "Hospitals submit here. As I toggle risk signals, the estimated score updates using the same weights as the backend engine.",
  },
  {
    time: "1:45",
    title: "Run Multi-Agent Verification",
    route: "/agents/CLM-2012-CRIT",
    action: "Press Run Verification",
    show: "Ten specialized agents reporting status, confidence and evidence in sequence",
    narration:
      "Ten agents each verify one domain — documents, identity, coding, STG, billing, images, fraud patterns — then combine into one score.",
  },
  {
    time: "2:30",
    title: "Review Risk Score + Explainability",
    route: "/claims/CLM-2012-CRIT",
    action: "Scroll through summary, gauge, statuses and top factors",
    show: "AI summary, risk gauge, decision outputs and top risk factors",
    narration:
      "Every recommendation is explainable. The auditor sees exactly why this claim scored 100 and what drove it.",
  },
  {
    time: "3:15",
    title: "Take Auditor Action",
    route: "/claims/CLM-2012-CRIT",
    action: "Click Fraud Hold, add a note, confirm",
    show: "The human-in-the-loop decision modal creating an audit log + feedback event",
    narration:
      "AI recommends, but the human decides. The decision is logged to the audit trail and captured for the learning loop.",
  },
  {
    time: "3:45",
    title: "Show Decision Report",
    route: "/claims/CLM-2012-CRIT/report",
    action: "Open report, click Export JSON / Print",
    show: "A professional explainable report with evidence, reasons and the safety note",
    narration:
      "Auditors can print or export a full explainable report — trust score, evidence table, audit trail and the human-in-the-loop disclaimer.",
  },
  {
    time: "4:15",
    title: "Analytics + Fraud Workspace",
    route: "/analytics",
    action: "Show charts, then open Fraud Workspace",
    show: "Risk distribution, hospital anomaly leaderboard and fraud signal deep-dive",
    narration:
      "At population scale, policy teams get fraud heatmaps, hospital scorecards and fast-track metrics.",
  },
  {
    time: "4:45",
    title: "Architecture + Impact",
    route: "/architecture",
    action: "Show the three-layer architecture and security shield",
    show: "Integration, AI Decision and User layers with the security layer",
    narration:
      "The design is NHCX-ready and built for safe, auditable, human-in-the-loop adjudication at national scale.",
  },
  {
    time: "5:00",
    title: "Closing",
    route: "/",
    action: "Return to landing",
    show: "Faster claims + lower fraud + higher trust",
    narration:
      "ClaimGuard AI brings speed for genuine claims, defence against fraud, and transparency for every stakeholder.",
  },
];

export default function DemoGuide() {
  return (
    <div>
      <PageIntro
        title="Demo Guide"
        subtitle="A click-by-click 5-minute script for recording the demo video."
        demo="A ready-to-record walkthrough. Each step lists the route, the exact action, what to show on screen, and a narration line you can read verbatim. Click any 'Go' to jump straight there."
      />

      <div className="space-y-3">
        {STEPS.map((s) => (
          <div key={s.time} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex w-20 shrink-0 items-center gap-2 font-mono text-sm font-bold text-teal-700">
              <Clock className="h-4 w-4" /> {s.time}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-navy">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                <span className="font-semibold">Action:</span> {s.action} · <span className="font-semibold">Show:</span> {s.show}
              </p>
              <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-sm italic text-ink">“{s.narration}”</p>
            </div>
            <Link to={s.route} className="btn-ghost shrink-0">
              Go <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
