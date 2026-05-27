import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 grid place-items-center mx-auto mb-4">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-3xl font-bold">404 — Page not found</h1>
        <p className="text-slate-500 mt-2">The page you are looking for doesn't exist or was moved.</p>
        <Link to="/" className="btn-primary inline-flex mt-6">Go to Dashboard</Link>
      </div>
    </div>
  );
}
