const DETAILS = [
  {
    label: "Address",
    value:
      "8 Rhodes, Quigney, East London, Eastern Cape, South Africa",
  },
  {
    label: "WhatsApp / Phone",
    value: "+27 71 088 8897",
  },
  {
    label: "Hours",
    value: "By appointment",
  },
];

const SOCIALS = [
  {
    label: "Instagram",
    shortLabel: "IG",
    href: "https://instagram.com/nailsby_freddy",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle
          cx="17.5"
          cy="6.5"
          r="1"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
  {
    label: "TikTok",
    shortLabel: "TT",
    href: "https://tiktok.com/@nailsby_freddy",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-[18px] h-[18px]"
        fill="currentColor"
      >
        <path d="M16.6 3c.4 2.2 1.6 3.7 3.4 4.1v3.1c-1.5-.1-2.8-.6-4-1.4v6.7c0 4.1-3.1 6.5-6.6 6.5-3.1 0-5.7-2.2-5.7-5.3 0-3.3 2.8-5.7 6.3-5.7.4 0 .8 0 1.2.1v3.2c-.4-.1-.8-.2-1.2-.2-1.5 0-2.8.9-2.8 2.4 0 1.3 1.1 2.2 2.4 2.2 1.7 0 3-1 3-3.3V3h4z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    shortLabel: "WA",
    href: "https://wa.me/27710888897",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-[18px] h-[18px]"
        fill="currentColor"
      >
        <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.7 6L.2 24l6.4-1.7c1.7.9 3.5 1.3 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.4-8.3zm-8.4 17.9h-.1c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.8 1 1-3.7-.2-.3a9.8 9.8 0 1 1 8.2 4.5zm5.4-7.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.8 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.4-3.8-3.2-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.7.7 2.4.8 3.3.7.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.6-.3z" />
      </svg>
    ),
  },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="max-w-[1180px] mx-auto px-5 py-22"
    >
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
              <li
                key={d.label}
                className="py-3 border-b border-line text-[0.94rem]"
              >
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
                aria-label={`Freddy Nails on ${s.label}`}
                title={s.label}
                className="group w-[42px] h-[42px] border border-line rounded-full flex items-center justify-center text-[#f4eee6] hover:border-gold hover:text-gold transition-all duration-300"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {s.icon}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="aspect-[4/3] rounded-sm border border-line overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m23!1m12!1m3!1d13380.723483862104!2d27.9131828!3d-33.025365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m8!3e6!4m0!4m5!1s0x1e66e184563d015d%3A0xcdcee218480d75c4!2sFreddy%20Nails%2C%208%20Rhodes%20St%2C%20Quigney%2C%20KuGompo%20City%2C%205201!3m2!1d-33.020050399999995!2d27.9157993!5e0!3m2!1sen!2sza!4v1787158534058!5m2!1sen!2sza"
            width="600"
            height="450"
            style={{
              border: 0,
              width: "100%",
              height: "100%",
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Freddy Nails location on Google Maps"
          />
        </div>
      </div>
    </section>
  );
}
