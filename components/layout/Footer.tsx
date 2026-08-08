import Image from "next/image";
import Link from "next/link";
import { siteContent } from "@/content/site";

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
          <div className="flex items-center gap-3">
            <Image src={siteContent.logo.src} alt={siteContent.logo.alt} width={32} height={32} />
            <p className="font-display text-2xl font-semibold">OTO</p>
          </div>
          {/*
           * Party identification runs as one unit under the candidate
           * identity: the ZLP badge, the white card on the deep green
           * plane as everywhere else on the site, set beside the line
           * that names the party.
           */}
          <div className="mt-4 flex items-start gap-4">
            <Image
              src={siteContent.partyLogo.src}
              alt={siteContent.partyLogo.alt}
              width={93}
              height={80}
              className="h-12 w-auto shrink-0"
            />
            <p className="max-w-sm font-body text-sm text-ink-inverse/80">
              Oluwasegun Theophilus Oladimeji, Zenith Labour Party candidate for the Oyo South Senatorial District.
            </p>
          </div>
        </div>
        {/*
         * Footer sits on bg-brand-green-deep throughout, so the gold ring
         * stays: brand-gold measures 8.19:1 there, well clear of WCAG
         * 1.4.11's 3:1 floor. A dark ring (ink or brand-green) would not
         * work on this plane, so this is not the shared light/dark split
         * Nav and Button use, only the dark half of it.
         */}
        <nav className="flex flex-col gap-2 sm:items-end">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-ink-inverse/80 hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
