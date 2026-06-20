import { Link } from "react-router-dom";
import { ShieldQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldQuestion className="h-12 w-12 text-slate-300" />
      <h1 className="text-2xl font-extrabold text-navy">Page not found</h1>
      <p className="text-sm text-muted">This route is not part of the ClaimGuard AI MVP.</p>
      <Link to="/" className="btn-primary">
        Back to Overview
      </Link>
    </div>
  );
}
