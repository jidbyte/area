import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { siteConfig } from "@/shared/config/site";
import { MdFacebook } from "react-icons/md";
import { AiOutlineTikTok, AiOutlineInstagram, AiOutlineTwitter } from "react-icons/ai";
import { LuMail, LuPhone } from "react-icons/lu";

const ShopFooter = () => {
  const socialIcons = [
    { icon: MdFacebook, link: siteConfig.social.facebook },
    { icon: AiOutlineInstagram, link: siteConfig.social.instagram },
    { icon: AiOutlineTwitter, link: siteConfig.social.x },
    { icon: AiOutlineTikTok, link: siteConfig.social.tiktok },
  ];

  const linkSections = [
    {
      title: "WEBSITE",
      links: [
        { text: "Home", path: "/", icon: null },
        { text: "Shop", path: "/shop", icon: null },
        { text: "Browse stores", path: "/stores", icon: null },
        { text: "Start a store", path: "/onboarding", icon: null },
      ],
    },
    {
      title: "CONTACT",
      links: [
        { text: siteConfig.contactEmail, path: "/contact", icon: LuMail },
        { text: "Contact us", path: "/contact", icon: LuPhone },
      ],
    },
  ];

  return (
    <footer className="bg-solid dark:bg-accent text-sky-50 rounded-lg">
      <div className="mx-auto p-4 md:px-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mt-4 md:mt-8">
          <div>
            <Link href="/" className="text-4xl font-semibold font-mono">
              <span className="text-sky-50 px-3 py-1 border-4 border-sky-50 rounded-md">
                {siteConfig.name}
              </span>
            </Link>

            <p className="max-w-100 mt-6 text-sm">{siteConfig.description}</p>

            <div className="flex items-center gap-4 mt-4">
              {socialIcons.map((item, index) => (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  size="icon"
                  className="bg-white text-black hover:bg-sky-800 hover:text-white"
                >
                  <Link
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <item.icon className="size-5" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5 text-sm ">
            {linkSections.map((section, index) => (
              <div key={index}>
                <h3 className="font-bold tracking-wider text-sky-300 md:mb-5 mb-3">
                  {section.title}
                </h3>

                <ul className="space-y-2.5">
                  {section.links.map((link, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {link.icon && (
                        <link.icon className="size-4 text-sky-300" />
                      )}
                      <Link
                        href={link.path}
                        className="hover:underline transition"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="py-4 text-sm border-t border-primary/50 pt-6 mt-6">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default ShopFooter;
