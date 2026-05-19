export type NotificationEmailType =
  | "booking_provider"
  | "message"
  | "subscription"
  | "invoice"
  | "inquiry"
  | "contact";

type Locale = "en" | "lt" | "ru" | "pl" | "et";

const SUPPORTED_LOCALES: Locale[] = ["en", "lt", "ru", "pl", "et"];

export function normalizeEmailSubjectLocale(locale?: string | null): Locale {
  const normalized = (locale || "en").toLowerCase().split("-")[0] as Locale;
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : "en";
}

function value(data: Record<string, unknown> | undefined, key: string, fallback: string) {
  const raw = data?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

export function getNotificationEmailSubject(
  type: NotificationEmailType,
  locale?: string | null,
  data?: Record<string, unknown>,
) {
  const key = normalizeEmailSubjectLocale(locale);
  const listingTitle = value(data, "listingTitle", "Planuojam");
  const senderName = value(data, "senderName", "Planuojam");
  const firstName = value(data, "firstName", "Planuojam");
  const lastName = value(data, "lastName", "");
  const contactName = `${firstName} ${lastName}`.trim();
  const invoiceNumber = value(data, "invoiceNumber", "");

  const subjects: Record<NotificationEmailType, Record<Locale, string>> = {
    booking_provider: {
      en: `New Booking Received: ${listingTitle}`,
      lt: `Gautas naujas u\u017esakymas: ${listingTitle}`,
      ru: `\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e \u043d\u043e\u0432\u043e\u0435 \u0431\u0440\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435: ${listingTitle}`,
      pl: `Otrzymano now\u0105 rezerwacj\u0119: ${listingTitle}`,
      et: `Saadud uus broneering: ${listingTitle}`,
    },
    message: {
      en: `New message from ${senderName}`,
      lt: `Nauja \u017einut\u0117 nuo ${senderName}`,
      ru: `\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043e\u0442 ${senderName}`,
      pl: `Nowa wiadomo\u015b\u0107 od ${senderName}`,
      et: `Uus s\u00f5num kasutajalt ${senderName}`,
    },
    subscription: {
      en: "Your listing is now active!",
      lt: "J\u016bs\u0173 skelbimas dabar aktyvus!",
      ru: "\u0412\u0430\u0448\u0435 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0435 \u0442\u0435\u043f\u0435\u0440\u044c \u0430\u043a\u0442\u0438\u0432\u043d\u043e!",
      pl: "Twoje og\u0142oszenie jest ju\u017c aktywne!",
      et: "Teie kuulutus on n\u00fc\u00fcd aktiivne!",
    },
    invoice: {
      en: `Your invoice ${invoiceNumber} is ready`,
      lt: `J\u016bs\u0173 s\u0105skaita ${invoiceNumber} paruo\u0161ta`,
      ru: `\u0412\u0430\u0448 \u0441\u0447\u0435\u0442 ${invoiceNumber} \u0433\u043e\u0442\u043e\u0432`,
      pl: `Twoja faktura ${invoiceNumber} jest gotowa`,
      et: `Teie arve ${invoiceNumber} on valmis`,
    },
    inquiry: {
      en: `New Availability Inquiry: ${listingTitle}`,
      lt: `Nauja prieinamumo u\u017eklausa: ${listingTitle}`,
      ru: `\u041d\u043e\u0432\u044b\u0439 \u0437\u0430\u043f\u0440\u043e\u0441 \u043e \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e\u0441\u0442\u0438: ${listingTitle}`,
      pl: `Nowe zapytanie o dost\u0119pno\u015b\u0107: ${listingTitle}`,
      et: `Uus saadavuse p\u00e4ring: ${listingTitle}`,
    },
    contact: {
      en: `New contact message from ${contactName}`,
      lt: `Nauja kontaktin\u0117 \u017einut\u0117 nuo ${contactName}`,
      ru: `\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0438\u0437 \u0444\u043e\u0440\u043c\u044b \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u043e\u0432 \u043e\u0442 ${contactName}`,
      pl: `Nowa wiadomo\u015b\u0107 kontaktowa od ${contactName}`,
      et: `Uus kontaktis\u00f5num kasutajalt ${contactName}`,
    },
  };

  return subjects[type][key];
}
