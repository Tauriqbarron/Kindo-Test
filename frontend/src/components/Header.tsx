export default function Header() {
  return (
    <header className="bg-kindo-purple text-white shadow-md">
      <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
        <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
          <path d="M12 10v12M12 16h6a4 4 0 000-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-xl font-semibold tracking-tight">Kindo</h1>
      </div>
    </header>
  );
}
