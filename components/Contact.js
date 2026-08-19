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

        <div className="aspect-[4/3] rounded-sm border border-line overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m23!1m12!1m3!1d13380.723483862104!2d27.9131828!3d-33.025365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m8!3e6!4m0!4m5!1s0x1e66e184563d015d%3A0xcdcee218480d75c4!2sFreddy%20Nails%2C%208%20Rhodes%20St%2C%20Quigney%2C%20KuGompo%20City%2C%205201!3m2!1d-33.020050399999995!2d27.9157993!5e0!3m2!1sen!2sza!4v1787158534058!5m2!1sen!2sza"
            width="600"
            height="450"
            style={{ border: 0, width: "100%", height: "100%" }}
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
