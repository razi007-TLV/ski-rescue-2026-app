export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-sky-950 via-blue-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛷️</span>
          <span className="text-xl font-bold tracking-tight">Ski &amp; Rescue 2026</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/70">
          <a href="#" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Incidents</a>
          <a href="#" className="hover:text-white transition-colors">Teams</a>
          <a href="#" className="hover:text-white transition-colors">Map</a>
        </nav>
        <button className="rounded-full bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 text-sm font-medium border border-white/20">
          Sign In
        </button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8 py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-sm text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          2026 Season · Live
        </div>

        <h1 className="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Mountain Safety,{" "}
          <span className="text-sky-400">Reimagined</span>
        </h1>

        <p className="max-w-xl text-lg text-white/60 leading-relaxed">
          A unified platform for ski patrol teams to manage incidents, coordinate rescues,
          track personnel, and ensure every guest gets home safe — in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button className="rounded-full bg-sky-500 hover:bg-sky-400 transition-colors px-7 py-3 text-sm font-semibold shadow-lg shadow-sky-500/30">
            Get Started
          </button>
          <button className="rounded-full border border-white/20 hover:bg-white/10 transition-colors px-7 py-3 text-sm font-semibold">
            View Demo
          </button>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-8 pb-20 max-w-5xl mx-auto w-full">
        {[
          {
            icon: "🚨",
            title: "Incident Dispatch",
            desc: "Log, triage, and dispatch rescue teams to incidents across the mountain instantly.",
          },
          {
            icon: "🗺️",
            title: "Live Trail Map",
            desc: "Real-time overlay of open/closed runs, patrol positions, and active incidents.",
          },
          {
            icon: "📋",
            title: "Audit & Reports",
            desc: "End-of-day reports, compliance exports, and season-over-season analytics.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-semibold text-white mb-1">{card.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-5 text-center text-xs text-white/30">
        © 2026 Ski &amp; Rescue App · Built with Next.js &amp; Tailwind CSS
      </footer>
    </div>
  );
}
