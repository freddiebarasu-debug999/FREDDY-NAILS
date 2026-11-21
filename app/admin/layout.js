import Link from "next/link";

export const metadata = {
  title: "Freddy Nails — Owner",
  robots: { index: false, follow: false },
};

const links = [
  ["/admin", "Bookings"],
  ["/admin/clients", "Clients"],
  ["/admin/money", "Money"],
  ["/admin/promos", "Promo codes"],
  ["/admin/calendar", "Calendar"],
];

export default function AdminLayout({ children }) {
  return (
    <>
      <nav className="border-b border-white/10 bg-[#11100f]">
        <div className="mx-auto flex max-w-2xl gap-4 overflow-x-auto px-4 py-3">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#d6b36a]"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
