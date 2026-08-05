import Link from "next/link";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#agenda", label: "Agenda" },
  { href: "/#get-involved", label: "Get Involved" },
  { href: "/gallery", label: "Gallery" },
];

export function Footer() {
  return (
    <footer className="bg-brand-green-deep px-6 py-12 text-ink-inverse sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold">OTO</p>
          <p className="mt-2 max-w-sm font-body text-sm text-ink-inverse/80">
            Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.
          </p>
        </div>
        <nav className="flex flex-col gap-2 sm:items-end">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-ink-inverse/80 hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
