import Link from "next/link";

export const metadata = {
  title: "Freddy Nails — Owner",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/icon-admin-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-admin-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-admin-192.png", sizes: "180x180", type: "image/png" }],
  },
};

const links = [
  { href: "/admin", label: "Bookings", icon: "📋" },
  { href: "/admin/cash", label: "Cash booking", icon: "💵" },
  { href: "/admin/clients", label: "Clients", icon: "👥" },
  { href: "/admin/waitlist", label: "Waitlist", icon: "⏳" },
  { href: "/admin/money", label: "Money", icon: "💰" },
  { href: "/admin/promos", label: "Promo codes", icon: "🏷️" },
  { href: "/admin/site", label: "Banner & days off", icon: "📢" },
  { href: "/admin/calendar", label: "Calendar", icon: "📅" },
];

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0c0b0a] text-[#f4eee6]">
      {/* Left sidebar panel — Microsoft Store style */}
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-white/10"
        style={{
          background: "linear-gradient(180deg, rgba(24,22,20,0.82) 0%, rgba(17,16,15,0.78) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5 bg-white/[0.03]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6b36a]/20 text-lg">
            ⚙️
          </div>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
              Owner
            </p>
            <p className="text-sm font-semibold text-[#f4eee6]">Freddy Nails</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {links.map(({ href, label, icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-[#c9c0b6] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-[#d6b36a] hover:shadow-[0_0_20px_rgba(214,179,106,0.08)] hover:backdrop-blur-md"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="text-base opacity-80">{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#a79a87] transition-colors hover:text-[#d6b36a]"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="ml-[220px] flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
