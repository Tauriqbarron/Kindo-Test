import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-kindo-purple text-white shadow-md">
      <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
            <path d="M12 10v12M12 16h6a4 4 0 000-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="text-xl font-semibold tracking-tight">Kindo</h1>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-white/90 transition hover:text-white"
              >
                Dashboard
              </Link>
              <span className="text-sm text-white/70">{user?.first_name}</span>
              <button
                onClick={logout}
                className="rounded-lg border border-white/30 px-3 py-1 text-sm font-medium transition hover:bg-white/10"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/90 transition hover:text-white"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded-lg border border-white/30 px-3 py-1 text-sm font-medium transition hover:bg-white/10"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
