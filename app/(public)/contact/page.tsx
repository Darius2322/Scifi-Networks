import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getActiveSites, getSiteSettings } from '@/lib/data/public';
import { ContactForm } from '@/components/marketing/contact-form';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with SciFi Networks — phone, WhatsApp, email, or send us a message directly.',
};

export default async function ContactPage() {
  const [sites, settings] = await Promise.all([getActiveSites(), getSiteSettings()]);
  const contact = settings.company_contact ?? {};
  const phone = contact.phone || '+254700000000';
  const whatsapp = contact.whatsapp || phone;
  const email = contact.email || 'support@scifinetworks.example';

  return (
    <>
      <SiteHeader />
      <main className="container-page py-14">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Contact Us</h1>
        <p className="mt-2 text-ink-800/80 max-w-prose">
          Have a question before signing up, or need to reach a specific site office? We're here.
        </p>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-medium text-ink-800/60 uppercase tracking-wide">Get in touch</h2>
              <div className="mt-3 space-y-2 text-ink-950">
                <p>Phone: <a href={`tel:${phone}`} className="text-signal-500 hover:text-signal-600">{phone}</a></p>
                <p>WhatsApp: <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} className="text-signal-500 hover:text-signal-600">{whatsapp}</a></p>
                <p>Email: <a href={`mailto:${email}`} className="text-signal-500 hover:text-signal-600">{email}</a></p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-ink-800/60 uppercase tracking-wide">Business hours</h2>
              <p className="mt-3 text-ink-950">Monday – Saturday, 8:00 AM – 6:00 PM</p>
            </div>

            {sites.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-ink-800/60 uppercase tracking-wide">Service locations</h2>
                <ul className="mt-3 space-y-1 text-ink-950">
                  {sites.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="text-sm font-medium text-ink-800/60 uppercase tracking-wide">Support</h2>
              <p className="mt-3 text-ink-800/80">
                Already a customer? <a href="/track" className="text-signal-500 hover:text-signal-600">Track your request</a> for
                the fastest way to report an issue.
              </p>
            </div>
          </div>

          <div className="border border-ink-950/10 p-6">
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
