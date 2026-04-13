/**
 * Translation strings for React Email templates.
 * These run in the Node.js API route context, so next-intl cannot be used.
 * Supported locales: en, lt, ru, pl, et
 */

type Locale = 'en' | 'lt' | 'ru' | 'pl' | 'et';

interface BookingStrings {
  preview: (listingTitle: string) => string;
  title: string;
  greeting: (username: string) => string;
  body: (listingTitle: string) => string;
  listingLabel: string;
  dateLabel: string;
  cta: string;
  support: string;
  footer: string;
}

interface MessageStrings {
  preview: (senderName: string) => string;
  title: string;
  greeting: (recipientName: string) => string;
  body: (senderName: string) => string;
  cta: string;
  footerNote: string;
  footer: string;
}

interface SubscriptionStrings {
  preview: (listingTitle: string) => string;
  title: string;
  greeting: (username: string) => string;
  body1: (listingTitle: string) => string;
  body2: string;
  cta: string;
  thanks: string;
  footer: string;
}

interface InquiryStrings {
  preview: (name: string) => string;
  title: string;
  intro: (listingTitle: string) => string;
  fromLabel: string;
  emailLabel: string;
  phoneLabel: string;
  naValue: string;
  messageLabel: string;
  noMessage: string;
  cta: string;
  footer: string;
}

interface EmailStrings {
  booking: BookingStrings;
  message: MessageStrings;
  subscription: SubscriptionStrings;
  inquiry: InquiryStrings;
}

const translations: Record<Locale, EmailStrings> = {
  en: {
    booking: {
      preview: (t) => `New booking received for ${t}`,
      title: 'New Booking Received',
      greeting: (u) => `Hello, ${u},`,
      body: (t) => `You have received a new booking for your listing: ${t}.`,
      listingLabel: 'Listing:',
      dateLabel: 'Date:',
      cta: 'Manage Bookings',
      support: 'If you have any questions, feel free to contact our support.',
      footer: '© 2026 Planuojam. All rights reserved.',
    },
    message: {
      preview: (s) => `New Message from ${s}`,
      title: 'New Message Received',
      greeting: (r) => `Hello, ${r},`,
      body: (s) => `You have received a new message from ${s}.`,
      cta: 'Reply to Message',
      footerNote: "Don't keep them waiting! Fast responses help improve your service rating.",
      footer: '© 2026 Planuojam. All rights reserved.',
    },
    subscription: {
      preview: (t) => `Your listing "${t}" is now live!`,
      title: 'Listing Activated!',
      greeting: (u) => `Congratulations, ${u}!`,
      body1: (t) => `Your subscription was successful, and your listing "${t}" is now live and visible to all users on Planuojam.`,
      body2: 'You can now start receiving bookings and messages from potential customers. Keep your calendar updated to ensure a smooth experience for your clients.',
      cta: 'View My Listing',
      thanks: 'Thank you for being part of our community!',
      footer: '© 2026 Planuojam. All rights reserved.',
    },
    inquiry: {
      preview: (n) => `New Availability Inquiry from ${n}`,
      title: 'New Availability Inquiry',
      intro: (t) => `You have received a new inquiry about your listing ${t}.`,
      fromLabel: 'From:',
      emailLabel: 'Email:',
      phoneLabel: 'Phone:',
      naValue: 'N/A',
      messageLabel: 'Message:',
      noMessage: 'No message provided.',
      cta: 'View All Inquiries',
      footer: '© 2026 Planuojam. All rights reserved.',
    },
  },
  lt: {
    booking: {
      preview: (t) => `Gautas naujas užsakymas: ${t}`,
      title: 'Gautas naujas užsakymas',
      greeting: (u) => `Sveiki, ${u},`,
      body: (t) => `Gavote naują užsakymą jūsų skelbimui: ${t}.`,
      listingLabel: 'Skelbimas:',
      dateLabel: 'Data:',
      cta: 'Tvarkyti užsakymus',
      support: 'Jei turite klausimų, nedvejodami susisiekite su mūsų palaikymo komanda.',
      footer: '© 2026 Planuojam. Visos teisės saugomos.',
    },
    message: {
      preview: (s) => `Nauja žinutė nuo ${s}`,
      title: 'Gauta nauja žinutė',
      greeting: (r) => `Sveiki, ${r},`,
      body: (s) => `Gavote naują žinutę nuo ${s}.`,
      cta: 'Atsakyti į žinutę',
      footerNote: 'Nedelskite! Greiti atsakymai pagerina jūsų paslaugos įvertinimą.',
      footer: '© 2026 Planuojam. Visos teisės saugomos.',
    },
    subscription: {
      preview: (t) => `Jūsų skelbimas „${t}" dabar aktyvus!`,
      title: 'Skelbimas aktyvuotas!',
      greeting: (u) => `Sveikiname, ${u}!`,
      body1: (t) => `Jūsų prenumerata sėkminga, o skelbimas „${t}" dabar matomas visiems Planuojam naudotojams.`,
      body2: 'Dabar galite gauti užsakymus ir žinutes iš potencialių klientų. Nuolat atnaujinkite savo kalendorių, kad klientams būtų patogu.',
      cta: 'Peržiūrėti mano skelbimą',
      thanks: 'Ačiū, kad esate mūsų bendruomenės dalis!',
      footer: '© 2026 Planuojam. Visos teisės saugomos.',
    },
    inquiry: {
      preview: (n) => `Nauja prieinamumo užklausa nuo ${n}`,
      title: 'Nauja prieinamumo užklausa',
      intro: (t) => `Gavote naują užklausą dėl jūsų skelbimo: ${t}.`,
      fromLabel: 'Nuo:',
      emailLabel: 'El. paštas:',
      phoneLabel: 'Telefonas:',
      naValue: 'Nenurodyta',
      messageLabel: 'Žinutė:',
      noMessage: 'Žinutė nepateikta.',
      cta: 'Peržiūrėti visas užklausas',
      footer: '© 2026 Planuojam. Visos teisės saugomos.',
    },
  },
  ru: {
    booking: {
      preview: (t) => `Получено новое бронирование: ${t}`,
      title: 'Новое бронирование получено',
      greeting: (u) => `Здравствуйте, ${u},`,
      body: (t) => `Вы получили новое бронирование для вашего объявления: ${t}.`,
      listingLabel: 'Объявление:',
      dateLabel: 'Дата:',
      cta: 'Управление бронированиями',
      support: 'Если у вас есть вопросы, обратитесь в нашу службу поддержки.',
      footer: '© 2026 Planuojam. Все права защищены.',
    },
    message: {
      preview: (s) => `Новое сообщение от ${s}`,
      title: 'Получено новое сообщение',
      greeting: (r) => `Здравствуйте, ${r},`,
      body: (s) => `Вы получили новое сообщение от ${s}.`,
      cta: 'Ответить на сообщение',
      footerNote: 'Не заставляйте ждать! Быстрые ответы улучшают рейтинг вашего сервиса.',
      footer: '© 2026 Planuojam. Все права защищены.',
    },
    subscription: {
      preview: (t) => `Ваше объявление «${t}» теперь активно!`,
      title: 'Объявление активировано!',
      greeting: (u) => `Поздравляем, ${u}!`,
      body1: (t) => `Ваша подписка успешна, и объявление «${t}» теперь видно всем пользователям Planuojam.`,
      body2: 'Вы можете начать получать бронирования и сообщения от потенциальных клиентов. Обновляйте календарь, чтобы обеспечить удобство для ваших клиентов.',
      cta: 'Просмотреть моё объявление',
      thanks: 'Спасибо, что являетесь частью нашего сообщества!',
      footer: '© 2026 Planuojam. Все права защищены.',
    },
    inquiry: {
      preview: (n) => `Новый запрос о доступности от ${n}`,
      title: 'Новый запрос о доступности',
      intro: (t) => `Вы получили новый запрос о вашем объявлении: ${t}.`,
      fromLabel: 'От:',
      emailLabel: 'Эл. почта:',
      phoneLabel: 'Телефон:',
      naValue: 'Не указано',
      messageLabel: 'Сообщение:',
      noMessage: 'Сообщение не предоставлено.',
      cta: 'Просмотреть все запросы',
      footer: '© 2026 Planuojam. Все права защищены.',
    },
  },
  pl: {
    booking: {
      preview: (t) => `Nowa rezerwacja otrzymana: ${t}`,
      title: 'Nowa rezerwacja otrzymana',
      greeting: (u) => `Witaj, ${u},`,
      body: (t) => `Otrzymałeś nową rezerwację dla swojego ogłoszenia: ${t}.`,
      listingLabel: 'Ogłoszenie:',
      dateLabel: 'Data:',
      cta: 'Zarządzaj rezerwacjami',
      support: 'Jeśli masz pytania, skontaktuj się z naszym zespołem wsparcia.',
      footer: '© 2026 Planuojam. Wszelkie prawa zastrzeżone.',
    },
    message: {
      preview: (s) => `Nowa wiadomość od ${s}`,
      title: 'Nowa wiadomość otrzymana',
      greeting: (r) => `Witaj, ${r},`,
      body: (s) => `Otrzymałeś nową wiadomość od ${s}.`,
      cta: 'Odpowiedz na wiadomość',
      footerNote: 'Nie każ im czekać! Szybkie odpowiedzi poprawiają ocenę Twojej usługi.',
      footer: '© 2026 Planuojam. Wszelkie prawa zastrzeżone.',
    },
    subscription: {
      preview: (t) => `Twoje ogłoszenie „${t}" jest teraz aktywne!`,
      title: 'Ogłoszenie aktywowane!',
      greeting: (u) => `Gratulacje, ${u}!`,
      body1: (t) => `Twoja subskrypcja zakończyła się sukcesem, a ogłoszenie „${t}" jest teraz widoczne dla wszystkich użytkowników Planuojam.`,
      body2: 'Możesz teraz otrzymywać rezerwacje i wiadomości od potencjalnych klientów. Aktualizuj swój kalendarz, aby zapewnić klientom komfort.',
      cta: 'Wyświetl moje ogłoszenie',
      thanks: 'Dziękujemy za bycie częścią naszej społeczności!',
      footer: '© 2026 Planuojam. Wszelkie prawa zastrzeżone.',
    },
    inquiry: {
      preview: (n) => `Nowe zapytanie o dostępność od ${n}`,
      title: 'Nowe zapytanie o dostępność',
      intro: (t) => `Otrzymałeś nowe zapytanie dotyczące Twojego ogłoszenia: ${t}.`,
      fromLabel: 'Od:',
      emailLabel: 'E-mail:',
      phoneLabel: 'Telefon:',
      naValue: 'Brak',
      messageLabel: 'Wiadomość:',
      noMessage: 'Brak wiadomości.',
      cta: 'Wyświetl wszystkie zapytania',
      footer: '© 2026 Planuojam. Wszelkie prawa zastrzeżone.',
    },
  },
  et: {
    booking: {
      preview: (t) => `Saadud uus broneering: ${t}`,
      title: 'Uus broneering saadud',
      greeting: (u) => `Tere, ${u},`,
      body: (t) => `Olete saanud uue broneeringu oma kuulutusele: ${t}.`,
      listingLabel: 'Kuulutus:',
      dateLabel: 'Kuupäev:',
      cta: 'Halda broneeringuid',
      support: 'Kui teil on küsimusi, võtke ühendust meie klienditoega.',
      footer: '© 2026 Planuojam. Kõik õigused kaitstud.',
    },
    message: {
      preview: (s) => `Uus sõnum kasutajalt ${s}`,
      title: 'Uus sõnum saadud',
      greeting: (r) => `Tere, ${r},`,
      body: (s) => `Olete saanud uue sõnumi kasutajalt ${s}.`,
      cta: 'Vasta sõnumile',
      footerNote: 'Ärge laske neil oodata! Kiired vastused parandavad teie teenuse hinnangut.',
      footer: '© 2026 Planuojam. Kõik õigused kaitstud.',
    },
    subscription: {
      preview: (t) => `Teie kuulutus „${t}" on nüüd aktiivne!`,
      title: 'Kuulutus aktiveeritud!',
      greeting: (u) => `Palju õnne, ${u}!`,
      body1: (t) => `Teie tellimus õnnestus ja kuulutus „${t}" on nüüd nähtav kõigile Planuojami kasutajatele.`,
      body2: 'Nüüd saate hakata saama broneeringuid ja sõnumeid potentsiaalsetelt klientidelt. Hoidke oma kalender ajakohasena.',
      cta: 'Vaata minu kuulutust',
      thanks: 'Täname, et olete meie kogukonna osa!',
      footer: '© 2026 Planuojam. Kõik õigused kaitstud.',
    },
    inquiry: {
      preview: (n) => `Uus saadavuse päring kasutajalt ${n}`,
      title: 'Uus saadavuse päring',
      intro: (t) => `Olete saanud uue päringu oma kuulutuse kohta: ${t}.`,
      fromLabel: 'Saatja:',
      emailLabel: 'E-post:',
      phoneLabel: 'Telefon:',
      naValue: 'Pole märgitud',
      messageLabel: 'Sõnum:',
      noMessage: 'Sõnumit pole esitatud.',
      cta: 'Vaata kõiki päringuid',
      footer: '© 2026 Planuojam. Kõik õigused kaitstud.',
    },
  },
};

export function getEmailStrings(locale?: string): EmailStrings {
  const key = (locale as Locale) in translations ? (locale as Locale) : 'en';
  return translations[key];
}
