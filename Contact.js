const DETAILS = [
  { label: "Address", value: "8 Rhodes, Quigney, East London, Eastern Cape, South Africa" },
  { label: "WhatsApp / Phone", value: "+27 71 088 8897" },
  { label: "Hours", value: "By appointment" },
];

const SOCIALS = [
  { label: "IG", href: "https://instagram.com/nailsby_freddy" },
  { label: "TT", href: "https://tiktok.com/@nailsby_freddy" },
  { label: "WA", href: "https://wa.me/27710888897" },
];

export default function Contact() {
  return (
    <section id="contact" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Find us
        </p>
        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Contact &amp; hours
        </h2>
      </div>

      <div className="grid gap-9 md:grid-cols-2">
        <div>
          <ul className="list-none p-0 m-0 mb-6.5">
            {DETAILS.map((d) => (
              <li key={d.label} className="py-3 border-b border-line text-[0.94rem]">
                <b className="block text-xs tracking-wide uppercase text-gold mb-1">
                  {d.label}
                </b>
                {d.value}
              </li>
            ))}
          </ul>
          <div className="flex gap-3.5 mt-5.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-[38px] h-[38px] border border-line rounded-full flex items-center justify-center text-[0.78rem] font-bold hover:border-gold hover:text-gold transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="aspect-[4/3] rounded-sm border border-line overflow-hidden bg-gradient-to-br from-[#e7dcc9] to-[#c9b696] flex items-center justify-center text-ink-soft text-[0.85rem] text-center px-4">
          Map embed placeholder — add a Google Maps embed for 8 Rhodes, Quigney, East London
        </div>
      </div>
    </section>
  );
}
