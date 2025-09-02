"use client";

import { useTranslations } from "next-intl";

export default function ContactStatic() {
  const t = useTranslations("Contact");
  return (
    <div className="space-y-8 text-gray-700">
      <div>
        <h3 className="text-xl font-semibold mb-2">{t("chatWithUs.title")}</h3>
        <ul className="space-y-1">
          <li>
            <a href="#" className="text-black hover:underline">
              {t("chatWithUs.liveChat")}
            </a>
          </li>
          <li>
            <a href="#" className="text-black hover:underline">
              {t("chatWithUs.email")}
            </a>
          </li>
          <li>
            <a href="#" className="text-black hover:underline">
              {t("chatWithUs.messageOnX")}
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{t("callUs.title")}</h3>
        <p>
          {t("callUs.hours")}
          <br />
          <a href="tel:+15550000000" className="text-black font-medium hover:underline">
            {t("callUs.phone")}
          </a>
        </p>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{t("visitUs.title")}</h3>
        <p>
          {t("visitUs.description")}
          <br />
          <a href="https://maps.google.com" className="text-black font-medium hover:underline">
            {t("visitUs.address")}
          </a>
        </p>
      </div>
    </div>
  );
}
