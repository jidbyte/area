import { Mail, MessageCircle } from "lucide-react";

import { siteConfig } from "@/shared/config/site";
import { ContactForm } from "@/features/app/messaging/client/contact-form";
import { GlobalNav } from "@/shared/components/app/global-nav";

export const metadata = { title: `Contact — ${siteConfig.name}` };

export default function ContactPage() {
  return (
    <div>
      <GlobalNav />
      <div className="mx-auto max-w-3xl p-4 md:px-12 py-10">
      <h1 className="text-3xl font-bold text-ink">Get in touch</h1>
      <p className="mt-2 max-w-xl text-neutral">
        Questions about {siteConfig.name}, a store you bought from, or setting
        up your own store? Send us a message and we'll get back to you.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <ContactForm />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
              Contact info
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Mail className="size-4" /> {siteConfig.contactEmail}
              </a>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <MessageCircle className="size-4" /> {siteConfig.supportEmail}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
              Follow us
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <a href={siteConfig.social.x} target="_blank" rel="noreferrer" className="hover:text-primary">
                X (Twitter)
              </a>
              <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" className="hover:text-primary">
                Facebook
              </a>
              <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" className="hover:text-primary">
                Instagram
              </a>
              <a href={siteConfig.social.tiktok} target="_blank" rel="noreferrer" className="hover:text-primary">
                TikTok
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral">
              About {siteConfig.name}
            </h2>
            <p className="mt-3 text-sm text-neutral">{siteConfig.description}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
