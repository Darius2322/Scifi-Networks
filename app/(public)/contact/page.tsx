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
      <main className="container-page section-py">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink-950">Contact Us</h1>
        <p className="mt-2 text-ink-700 max-w-prose">
          Have a question before signing up, or need to reach a specific site office? We're here.
        </p>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div className="space-y-8">
            <div>
              <h2 className="text-xs font-semibold text-ink-700 uppercase tracking-wider">Get in touch</h2>
              <div className="mt-3 space-y-2 text-ink-950">
                <p>Phone: <a href={`tel:${phone}`} className="text-signal-500 hover:text-signal-600 font-medium">{phone}</a></p>
                <p>WhatsApp: <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} className="text-signal-500 hover:text-signal-600 font-medium">{whatsapp}</a></p>
                <p>Email: <a href={`mailto:${email}`} className="text-signal-500 hover:text-signal-600 font-medium">{email}</a></p>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-ink-700 uppercase tracking-wider">Business hours</h2>
              <p className="mt-3 text-ink-950">Monday – Saturday, 8:00 AM – 6:00 PM</p>
            </div>

            {sites.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-ink-700 uppercase tracking-wider">Service locations</h2>
                <ul className="mt-3 space-y-1 text-ink-950">
                  {sites.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="text-xs font-semibold text-ink-700 uppercase tracking-wider">Support</h2>
              <p className="mt-3 text-ink-700">
                Already a customer? <a href="/track" className="text-signal-500 hover:text-signal-600 font-medium">Track your request</a> for
                the fastest way to report an issue.
              </p>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
