import {
  Github,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react';
import Link from 'next/link';

const data = {
  twitterLink: 'https://x.com/flux_pay',
  githubLink: 'https://github.com/davre001/FluxPay',
  dribbbleLink: 'https://dribbble.com/fluxpay',
  services: {
    creators: '/creators',
    brands: '/brands',
    howitworks: '/how-it-works',
    escrow: '/smart-escrow',
  },
  about: {
    history: '/about',
    team: '/team',
    handbook: '/about',
    careers: '/about',
  },
  help: {
    faqs: '/faqs',
    support: '/about',
    livechat: '/about',
  },
  contact: {
    phone: '( +234 ) 807-296-6135',
    address: 'Akure, Nigeria',
  },
  company: {
    name: 'FluxPay',
    description:
      'The multichain infrastructure for creator-brand deals. Secured on-chain with USDC escrow and AI milestone verification.',
    logo: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=64&h=64&auto=format&fit=crop',
  },
};

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: data.twitterLink },
  { icon: Github, label: 'GitHub', href: data.githubLink },
];

const aboutLinks = [
  { text: 'About FluxPay', href: data.about.history },
  { text: 'Meet the Team', href: data.about.team },
];

const serviceLinks = [
  { text: 'For Creators', href: data.services.creators },
  { text: 'For Brands', href: data.services.brands },
  { text: 'How it Works', href: data.services.howitworks },
  { text: 'Smart Escrow', href: data.services.escrow },
];

const helpfulLinks = [
  { text: 'FAQs', href: data.help.faqs },
];

const contactInfo = [
  { icon: Phone, text: data.contact.phone },
  { icon: MapPin, text: data.contact.address, isAddress: true },
];

export default function Footer4Col() {
  return (
    <footer className="bg-secondary dark:bg-secondary/20 mt-16 w-full place-self-end rounded-t-xl">
      <div className="mx-auto max-w-screen-xl px-4 pt-16 pb-6 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <div className="text-primary flex justify-start">
              <span 
                className="text-5xl tracking-tight" 
                style={{ fontFamily: "'Grappa ExtraBold', sans-serif" }}
              >
                {data.company.name}
              </span>
            </div>

            <p className="text-foreground/50 mt-6 max-w-md text-center leading-relaxed sm:max-w-xs sm:text-left">
              {data.company.description}
            </p>

            <ul className="mt-8 flex justify-center gap-6 sm:justify-start md:gap-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-primary hover:text-primary/80 transition"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
            <div className="text-center sm:text-left">
              <p className="text-lg font-medium">FluxPay</p>
              <ul className="mt-8 space-y-4 text-sm">
                {aboutLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-secondary-foreground/70 transition"
                      href={href}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-medium">Platform</p>
              <ul className="mt-8 space-y-4 text-sm">
                {serviceLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-secondary-foreground/70 transition"
                      href={href}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-medium">Helpful Links</p>
              <ul className="mt-8 space-y-4 text-sm">
                {helpfulLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      href={href}
                      className="text-secondary-foreground/70 transition"
                    >
                      <span className="text-secondary-foreground/70 transition">
                        {text}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-medium">Contact Us</p>
              <ul className="mt-8 space-y-4 text-sm">
                {contactInfo.map(({ icon: Icon, text, isAddress }) => (
                  <li key={text}>
                    <a
                      className="flex items-center justify-center gap-1.5 sm:justify-start"
                      href="#"
                    >
                      <Icon className="text-primary size-5 shrink-0 shadow-sm" />
                      {isAddress ? (
                        <address className="text-secondary-foreground/70 -mt-0.5 flex-1 not-italic transition">
                          {text}
                        </address>
                      ) : (
                        <span className="text-secondary-foreground/70 flex-1 transition">
                          {text}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-6">
          <div className="text-center sm:flex sm:justify-between sm:text-left">
            <p className="text-sm">
              <span className="block sm:inline">All rights reserved.</span>
            </p>

            <p className="text-secondary-foreground/70 mt-4 text-sm transition sm:order-first sm:mt-0">
              &copy; 2026 {data.company.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
