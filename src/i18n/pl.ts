// The site's words in Polish: a translation of ./en.ts, key for key.
import type { Copy } from './en.ts';

const pl: Copy = {
  meta: {
    title: 'Bogdan Nenadović · Full-Stack Design Engineer',
    description:
      'Bogdan Nenadović, full-stack design engineer z Poznania. Projektuję, buduję i wdrażam kompletne produkty: React, Node.js, PostgreSQL, SwiftUI i 3D.',
    ogDescription: 'Projektuję, buduję i wdrażam kompletne produkty: interfejsy, backend, infrastrukturę i natywne aplikacje iOS.',
  },
  language: 'Język',
  name: 'Bogdan Nenadović',
  role: 'Full-Stack Design Engineer',
  location: 'Poznań, Polska',
  nav: { main: 'Menu główne', about: 'O mnie', services: 'Usługi', projects: 'Projekty', contact: 'Kontakt' },
  hero: {
    label: 'Wstęp',
    hello: 'CZEŚĆ, JESTEM',
    name: 'BOGDAN',
    heading: 'Cześć, jestem {name}, {role}',
    tagline: 'full-stack design engineer, który projektuje, buduje i wdraża kompletne produkty',
    scroll: 'Przewiń',
  },
  buttons: { contact: 'Skontaktuj się', email: 'Napisz do mnie', live: 'Zobacz na żywo', close: 'Zamknij', play: 'Odtwórz', pause: 'Pauza' },
  manifesto: {
    label: 'Manifest',
    phrases: [
      'Żyjemy we wszechświecie pełnym *możliwości*.',
      'Na *błękitnej* planecie, naszym wspólnym +domu+!',
      'Nasze ^serca^ biją w każdym zakątku świata.',
      'A w środku ^rozgrzewają je marzenia^.',
      'Niektóre z nich stają się *pomysłami*.',
      'I szukamy sposobu, by je *urzeczywistnić*.',
      'Pomaga mi w tym *komputer*.',
      'Umieściłem w nim swoje\n*najlepsze narzędzie*.',
      'I połączyłem go z *AI*.',
      'Aby\n*marzenia się spełniały*.',
    ],
  },
  about: {
    title: 'O mnie',
    portraitAlt: 'Bogdan Nenadović, portret z żabiej perspektywy w bluzie z kapturem',
    hello: 'Cześć, nazywam się Bogdan Nenadović, ale w sieci znają mnie jako',
    hint: 'Dlaczego?',
    close: 'Już wiem',
    text: 'Od ośmiu lat pomagam ludziom wcielać w życie pomysły i marzenia. Design, wideo i marketing nauczyły mnie, jak produkty powinny wyglądać, jakie emocje budzić i jak się sprzedawać. Dziś buduję je od A do Z: interfejsy, backend, infrastrukturę i natywne aplikacje iOS, w podejściu AI-native i z rygorystyczną weryfikacją. Zbudujmy coś, co działa bezbłędnie i robi niezapomniane wrażenie.',
    story: {
      question: 'Dlaczego SUNLUCKI?',
      text: 'Mój pseudonim łączy naszą gwiazdę, *Słońce*, które daje nam światło, ciepło i życie, oraz *szczęście*, które uśmiecha się tylko do tych, którzy próbują spełniać swoje marzenia.',
      philosophy: 'To cała moja filozofia: oddanie kosmosowi i szczęściu.',
    },
  },
  numbers: {
    title: 'Oto liczby',
    caption: 'Wszyscy kochają duże liczby… a ja je mam.',
    code: 'linii wdrożonego kodu',
    views: 'wyświetleń na YouTube, TikToku i Instagramie',
    hours: 'godzin pracy od 2016 roku',
    projects: 'zrealizowanych projektów',
    designs: 'projektów graficznych',
    videos: 'wyprodukowanych filmów',
    tracks: 'wyprodukowanych utworów',
    apps: 'natywnych aplikacji Apple',
    companies: 'założone firmy',
  },
  stack: {
    title: 'Stack',
    intro: 'Wszystko, czym buduję produkty, poukładane w folderach.',
    hover: 'Najedź na folder, żeby go otworzyć. Karteczki można dowolnie przeciągać.',
    tap: 'Stuknij folder, żeby go otworzyć.',
    swipe: 'Przesuń palcem: środkowy folder otwiera się sam.',
    tools: '{n} narzędzi',
  },
  services: {
    title: 'Usługi',
    list: [
      {
        name: 'Product Engineering',
        description:
          'Kompletne produkty webowe na stacku TypeScript, React, Node.js i PostgreSQL, z modelem danych, API, wdrożeniami i backupami w pakiecie. MVP i SaaS, które przetrwają zderzenie z produkcją.',
      },
      {
        name: 'Design Engineering',
        description:
          'Design systemy, animacje i interfejsy dopracowane w każdym detalu: dostępne komponenty, ruch oparty na fizyce sprężyn i Three.js / WebGL, gdy historia potrzebuje głębi.',
      },
      {
        name: 'Integracje AI',
        description:
          'Funkcje oparte na LLM, z zabezpieczeniami (ustrukturyzowane odpowiedzi, AI do dokumentów i asystenci), wdrażane w podejściu AI-native: specyfikacje, testy i bezlitosne review przy każdej zmianie.',
      },
      {
        name: 'Płatności i e-faktury',
        description:
          'Stripe, PayU, Przelewy24, marketplace’y i KSeF 2.0: integracje finansowe projektowane pod kątem poprawności, idempotencji i audytów.',
      },
      {
        name: 'Natywne aplikacje iOS',
        description: 'Aplikacje w SwiftUI z widżetami, Live Activities, synchronizacją offline i powiadomieniami push, połączone z tym samym backendem co wersja webowa.',
      },
      {
        name: 'Branding i motion design',
        description: 'Identyfikacja wizualna, opakowania i wideo tworzone z pomocą AI. Ta sama osoba zaprojektuje markę i wdroży produkt.',
      },
    ],
  },
  projects: {
    title: 'Projekty webowe',
    caseStudy: 'Case study na życzenie',
    demo: '{name}: demo produktu',
    sites: 'Strony',
    scenarios: 'Scenariusze',
    crm: {
      category: 'Własny produkt · SIMBIA CRM',
      name: 'CRM i system księgowy',
      description: 'CRM sprzedażowy z pełną księgowością, e-fakturowaniem w KSeF i open bankingiem. Działa na nim moja własna firma.',
      alts: ['Tablica kanban w SIMBIA CRM', 'Przegląd finansów w SIMBIA CRM', 'Pulpit SIMBIA CRM'],
      chapters: ['Pulpit', 'Scoring leadów', 'Priorytety', 'Kanban', 'Oferta', 'Follow-up', 'Faktura i KSeF', 'Aplikacja mobilna'],
    },
    b2b: {
      category: 'Sklepy klientów · Mind Logistic, PROTECTDENT, XyliMelts',
      name: 'Platforma sklepów B2B / B2C',
      description:
        'Jeden silnik e-commerce napędza trzy działające sklepy: hurt B2B z weryfikacją firm, kredytem kupieckim, 7 bramkami płatności i 6 kanałami marketplace oraz sklepy B2C dostępne nawet w 23 językach.',
      alts: ['Sekcja o odbiorcach portalu hurtowego', 'Kluczowe liczby platformy hurtowej', 'Strona startowa platformy hurtowej'],
      chapters: ['Rejestracja', 'Weryfikacja', 'Sklep', 'Twoja cena', 'Szybkie zamówienie', 'Kredyt kupiecki', 'Wysyłka', 'Kanały sprzedaży'],
    },
    hr: {
      category: 'Własny produkt · iApply',
      name: 'System zarządzania pracownikami',
      description:
        'Grafik zmian i rejestracja czasu pracy dla agencji zatrudnienia: check-in przez QR, GPS i NFC, tablica koordynatora na żywo i natywna aplikacja iOS.',
      alts: ['Centrum rejestracji QR w iApply', 'Planowanie zmian w iApply', 'Tygodniowy grafik w iApply'],
      chapters: ['Start', 'Check-in QR', 'Giełda zmian', 'Grafik', 'Zadania', 'Nadgodziny', 'Nieobecność', 'NFC'],
    },
    taxi: {
      category: 'Klient · TAXI BOSS',
      name: 'System zarządzania flotą',
      description:
        'Platforma dla partnerów flotowych Uber i Bolt: lejek rekrutacji kierowców, umowy z e-podpisem, synchronizacja z Uber API i aplikacja kierowcy w SwiftUI.',
      alts: ['Prezentacja samochodu 3D w TAXI BOSS', 'Pulpit kierowcy w TAXI BOSS', 'Strona startowa TAXI BOSS'],
      chapters: ['Kandydat', 'Rejestracja', 'Dokumenty', 'Umowa', 'Auto', 'Flota', 'Aplikacja kierowcy'],
    },
    wordpress: {
      category: 'Strony klientów · WordPress i Elementor',
      name: 'Strony WordPress',
      description:
        'Strony dla małych firm, zaprojektowane i zbudowane w oparciu o WordPress: cukiernia, barbershop z rezerwacjami online, firma przeprowadzkowa w Kanadzie, szkoła medyczna, drukarnia, salon fryzjerski, marka streetwearowa i sklepy internetowe.',
      alts: ['Strona cukierni KREEM na laptopie', 'Strona barbershopu Black Point na laptopie', 'Strona Lizard Moving na tablecie'],
      // each site's frames, in order
      slides: {
        'Lizard Moving': ['Demo strony mobilnej Lizard Moving', 'Strona Lizard Moving na tablecie', 'Strona główna Lizard Moving'],
        'Magic Patron': ['Demo strony mobilnej Magic Patron', 'Sklep Magic Patron na telefonie', 'Strona główna Magic Patron', 'Strona produktu Magic Patron'],
        Alibia: ['Demo sklepu mobilnego Alibia', 'Sklep Alibia na laptopie', 'Strona główna Alibia', 'Strona sklepu Alibia'],
        KREEM: ['Strona cukierni KREEM na laptopie', 'Strona główna KREEM', 'Strona z tortami KREEM'],
        'Black Point': ['Strona barbershopu Black Point na laptopie', 'Cennik Black Point na laptopie', 'Strona główna Black Point'],
        'Nami Clean': ['Strona firmy sprzątającej Nami Clean na laptopie', 'Strona główna Nami Clean'],
        Casada: ['Strona z fotelami Casada na laptopie', 'Strona główna Casada', 'Strona produktu Casada'],
        'ARAB 30': ['Sklep streetwearowy ARAB 30 na telefonie', 'Strona główna ARAB 30', 'Strona sklepu ARAB 30', 'Strona produktu ARAB 30'],
        'Architect Vision': ['Strona studia projektowania wnętrz Architect Vision na laptopie', 'Strona główna Architect Vision'],
        Enveloper: ['Strona główna Enveloper', 'Kategorie sklepu Enveloper'],
        Medicus: ['Strona główna szkoły medycznej Medicus'],
        'Hair Hub': ['Strona główna salonu Hair Hub'],
        Fencing: ['Strona główna Fencing dla sędziów szermierki'],
      },
    },
  },
  apps: {
    title: 'Aplikacje mobilne',
    caption:
      'Natywne aplikacje w SwiftUI, uzupełniające platformy webowe: rejestracja czasu pracy przez QR, GPS i NFC dla agencji zatrudnienia, aplikacja dla kierowców floty taxi i prywatny doradca finansów osobistych.',
    drag: 'Przeciągaj karty',
    previous: 'Poprzednia aplikacja',
    next: 'Następna aplikacja',
    iapply: {
      tagline: 'Czas pracy i grafik zmian dla agencji zatrudnienia',
      screens: [
        { caption: 'Na zmianie', alt: 'Ekran główny pracownika w iApply: trwająca zmiana z licznikiem czasu, zakończenie zmiany, dostępność, następna zmiana i godziny w tym miesiącu' },
        { caption: 'Kod QR miejsca pracy', alt: 'Kod QR koordynatora w iApply do rejestracji wejścia w miejscu pracy, z czasem wygaśnięcia i ustawieniami ważności' },
        { caption: 'Giełda zmian', alt: 'Giełda zmian w iApply: otwarte zmiany z wolnymi miejscami, zapis na dyżur i przyciski rezerwacji' },
        { caption: 'Tablica koordynatora', alt: 'Pulpit koordynatora w iApply: obecność na żywo, dzisiejsze zmiany, rezerwacja do zatwierdzenia i zadania' },
      ],
    },
    taxi: {
      tagline: 'Aplikacja dla kierowców floty taxi',
      screens: [
        { caption: 'Pulpit', alt: 'Pulpit kierowcy w TAXI BOSS: tygodniowe zarobki, kursy, suma z miesiąca, ocena i wynajęte auto' },
        { caption: 'Zarobki', alt: 'Zarobki w TAXI BOSS: sumy tygodniowe i wykres słupkowy z podziałem na dni' },
        { caption: 'Dokumenty', alt: 'Dokumenty w TAXI BOSS: wymagane zaświadczenia, zatwierdzone, każde z przyciskiem wymiany' },
        { caption: 'Grafik', alt: 'Grafik w TAXI BOSS: kalendarz miesiąca z dniami pracy, dniami wolnymi i okresami wynajmu' },
      ],
    },
    cashflow: {
      tagline: 'Prywatny doradca finansów osobistych',
      screens: [
        { caption: 'Przegląd', alt: 'Przegląd w CashFlow: miesięczne dochody, wydatki i zobowiązania, ile zostaje oraz wydatki według kategorii' },
        { caption: 'Plan spłaty długów', alt: 'Plan spłaty długów w CashFlow: długi ze strategiami kuli śnieżnej i lawiny oraz data wyjścia z długów' },
        { caption: 'Wydatki według kategorii', alt: 'Wydatki według kategorii w CashFlow: wykres pierścieniowy z udziałem każdej kategorii' },
        { caption: 'Długi i oszczędności', alt: 'Stan długów i oszczędności w CashFlow z pierścieniem celu oszczędnościowego i kartą wskazówek AI' },
      ],
    },
  },
  graphics: {
    title: 'Grafika',
    tiles: [
      'Plakaty cyklu wydarzeń HYPE',
      'Ihor Poperechny: plakat muzyczny',
      'Logo DC Consulting',
      'Branding Touch Coffee',
      'Wizytówki Da Vinci Tattoo',
      'Koszulka Black Point z nadrukiem Ant Might',
      'Social media barbershopu Black Point',
      'Branding Adaya',
      'Branding Soul Nation Tattoo',
      'Strimat: przewozy osobowe',
      'Branding Profi Dokument',
      'Branding Zero Śladu',
      'Wizytówki Yana Lashes',
      'Branding Stories Beauty',
      'Koszulka Black Point',
      'Wizytówki salonu depilacji laserowej',
      'Ulotka PROTECTDENT',
      'Logo Alibia',
      'Branding Time Relax Body',
      'Social media restauracji Na Serio Na Żarty',
      'Ihor Poperechny: wizytówka',
    ],
  },
  video: {
    title: 'Wideo',
    views: '{n} wyświetleń',
    viewsOn: '{n}+ wyświetleń na {platform}',
    play: 'Odtwórz {title}',
    tap: 'Dotknij, aby odtworzyć wideo',
    swipe: 'Przesuń w górę, aby oglądać dalej',
    // the credits under the films that are words, not names
    credits: {
      'AI film': 'Film AI',
      'Episode 1': 'Odcinek 1',
      'ARAB · co-director': 'ARAB · współreżyseria',
      'Filming and editing': 'Zdjęcia i montaż',
      'SUNLUCKI production': 'Produkcja SUNLUCKI',
    },
  },
  music: {
    title: 'Muzyka',
    nowPlaying: 'Teraz gra',
    previous: 'Poprzedni utwór',
    next: 'Następny utwór',
    seek: 'Przewijanie',
    playlist: 'Playlista',
    all: 'Pokaż wszystkie',
    fewer: 'Zwiń',
  },
  contact: {
    title: 'Porozmawiajmy',
    sceneAlt: 'Bogdan Nenadović unoszący się nad świecącym iPhone’em',
    pitch: 'Jestem otwarty na pracę zdalną jako product engineer lub design engineer oraz na kontrakty B2B. Moja baza to {location}, a współpracuję z zespołami z całej Europy i USA.',
    b2b: 'Kontrakty B2B przez SIMBIA sp. z o.o.',
    // the credits in the footer, around the names and links
    credits: {
      models: 'Modele 3D na licencji',
      by: 'autorstwa',
      recoloured: 'w zmienionej kolorystyce',
      and: 'i',
      particles: 'zamienione w cząsteczki',
      earth: 'Ziemia nocą: NASA Black Marble.',
      bits: 'Micro Slats, Tech Text i Folder Float z',
      quotes: ['„', '”'],
    },
  },
};

export default pl;
