// Curated, offline-friendly travel phrasebook. No backend, no API — same spirit
// as the Stories tab's static data module. Each language ships ~12 essential
// phrases grouped by category, with a plain-English pronunciation hint so a
// traveler can read it aloud without knowing the script. When a real i18n /
// content backend lands, this module is replaced.

export type Phrase = {
  /** What you want to say, in English. */
  english: string;
  /** The phrase in the local language. */
  translation: string;
  /** A simple, read-it-aloud pronunciation hint. */
  pronunciation: string;
};

export type PhraseCategory = {
  /** Section heading shown in the UI. */
  category: string;
  phrases: Phrase[];
};

export type Language = {
  /** Stable key used for the chip + lookups. */
  code: string;
  /** Display name in English. */
  name: string;
  /** Name as written natively (shown under the English name). */
  nativeName: string;
  /** A small flag/emoji cue. */
  flag: string;
  /** Where it's most useful — a one-line hint for the picker. */
  region: string;
  categories: PhraseCategory[];
};

export const PHRASEBOOK: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'Spain & Latin America',
    categories: [
      {
        category: 'Greetings',
        phrases: [
          { english: 'Hello', translation: 'Hola', pronunciation: 'OH-lah' },
          { english: 'Thank you', translation: 'Gracias', pronunciation: 'GRAH-syas' },
          { english: 'Please', translation: 'Por favor', pronunciation: 'por fah-VOR' },
        ],
      },
      {
        category: 'Getting around',
        phrases: [
          { english: 'Where is the station?', translation: '¿Dónde está la estación?', pronunciation: 'DON-deh es-TAH lah es-tah-SYON' },
          { english: 'How much is it?', translation: '¿Cuánto cuesta?', pronunciation: 'KWAN-toh KWES-tah' },
          { english: 'I am lost', translation: 'Estoy perdido', pronunciation: 'es-TOY per-DEE-doh' },
        ],
      },
      {
        category: 'Food',
        phrases: [
          { english: 'A table for two', translation: 'Una mesa para dos', pronunciation: 'OO-nah MEH-sah PAH-rah dos' },
          { english: 'The bill, please', translation: 'La cuenta, por favor', pronunciation: 'lah KWEN-tah por fah-VOR' },
        ],
      },
      {
        category: 'Emergencies',
        phrases: [
          { english: 'Help!', translation: '¡Ayuda!', pronunciation: 'ah-YOO-dah' },
          { english: 'Call a doctor', translation: 'Llame a un médico', pronunciation: 'YAH-meh ah oon MEH-dee-koh' },
        ],
      },
      {
        category: 'Numbers',
        phrases: [
          { english: 'One, two, three', translation: 'Uno, dos, tres', pronunciation: 'OO-noh, dos, tres' },
        ],
      },
    ],
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'France, Canada & West Africa',
    categories: [
      {
        category: 'Greetings',
        phrases: [
          { english: 'Hello', translation: 'Bonjour', pronunciation: 'bon-ZHOOR' },
          { english: 'Thank you', translation: 'Merci', pronunciation: 'mair-SEE' },
          { english: 'Please', translation: "S'il vous plaît", pronunciation: 'seel voo PLEH' },
        ],
      },
      {
        category: 'Getting around',
        phrases: [
          { english: 'Where is the station?', translation: 'Où est la gare?', pronunciation: 'oo eh lah GAR' },
          { english: 'How much is it?', translation: "C'est combien?", pronunciation: 'seh kom-BYAN' },
          { english: 'I am lost', translation: 'Je suis perdu', pronunciation: 'zhuh swee pair-DOO' },
        ],
      },
      {
        category: 'Food',
        phrases: [
          { english: 'A table for two', translation: 'Une table pour deux', pronunciation: 'oon TAH-bluh poor DUH' },
          { english: 'The bill, please', translation: "L'addition, s'il vous plaît", pronunciation: 'lah-dee-SYON seel voo PLEH' },
        ],
      },
      {
        category: 'Emergencies',
        phrases: [
          { english: 'Help!', translation: 'Au secours!', pronunciation: 'oh suh-KOOR' },
          { english: 'Call a doctor', translation: 'Appelez un médecin', pronunciation: 'ah-play uhn med-SAN' },
        ],
      },
      {
        category: 'Numbers',
        phrases: [
          { english: 'One, two, three', translation: 'Un, deux, trois', pronunciation: 'uhn, duh, trwah' },
        ],
      },
    ],
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'Italy & Switzerland',
    categories: [
      {
        category: 'Greetings',
        phrases: [
          { english: 'Hello', translation: 'Ciao', pronunciation: 'chow' },
          { english: 'Thank you', translation: 'Grazie', pronunciation: 'GRAH-tsyeh' },
          { english: 'Please', translation: 'Per favore', pronunciation: 'pair fah-VOH-reh' },
        ],
      },
      {
        category: 'Getting around',
        phrases: [
          { english: 'Where is the station?', translation: "Dov'è la stazione?", pronunciation: 'doh-VEH lah stah-TSYOH-neh' },
          { english: 'How much is it?', translation: 'Quanto costa?', pronunciation: 'KWAN-toh KOS-tah' },
          { english: 'I am lost', translation: 'Mi sono perso', pronunciation: 'mee SOH-noh PAIR-soh' },
        ],
      },
      {
        category: 'Food',
        phrases: [
          { english: 'A table for two', translation: 'Un tavolo per due', pronunciation: 'oon TAH-voh-loh pair DOO-eh' },
          { english: 'The bill, please', translation: 'Il conto, per favore', pronunciation: 'eel KON-toh pair fah-VOH-reh' },
        ],
      },
      {
        category: 'Emergencies',
        phrases: [
          { english: 'Help!', translation: 'Aiuto!', pronunciation: 'ah-YOO-toh' },
          { english: 'Call a doctor', translation: 'Chiami un medico', pronunciation: 'KYAH-mee oon MEH-dee-koh' },
        ],
      },
      {
        category: 'Numbers',
        phrases: [
          { english: 'One, two, three', translation: 'Uno, due, tre', pronunciation: 'OO-noh, DOO-eh, treh' },
        ],
      },
    ],
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'Japan',
    categories: [
      {
        category: 'Greetings',
        phrases: [
          { english: 'Hello', translation: 'こんにちは', pronunciation: 'kon-nee-chee-wah' },
          { english: 'Thank you', translation: 'ありがとう', pronunciation: 'ah-ree-GAH-toh' },
          { english: 'Excuse me / Sorry', translation: 'すみません', pronunciation: 'soo-mee-mah-SEN' },
        ],
      },
      {
        category: 'Getting around',
        phrases: [
          { english: 'Where is the station?', translation: '駅はどこですか？', pronunciation: 'EH-kee wah DOH-koh des-kah' },
          { english: 'How much is it?', translation: 'いくらですか？', pronunciation: 'ee-KOO-rah des-kah' },
          { english: 'I am lost', translation: '道に迷いました', pronunciation: 'mee-chee nee mah-yoy-mash-tah' },
        ],
      },
      {
        category: 'Food',
        phrases: [
          { english: 'A table for two', translation: '二人です', pronunciation: 'foo-tah-REE des' },
          { english: 'The bill, please', translation: 'お会計お願いします', pronunciation: 'oh-kai-kei oh-neh-gai shee-mahs' },
        ],
      },
      {
        category: 'Emergencies',
        phrases: [
          { english: 'Help!', translation: '助けて！', pronunciation: 'tah-SOO-keh-teh' },
          { english: 'Call a doctor', translation: '医者を呼んでください', pronunciation: 'EE-shah oh yon-deh koo-dah-sai' },
        ],
      },
      {
        category: 'Numbers',
        phrases: [
          { english: 'One, two, three', translation: '一、二、三', pronunciation: 'ee-chee, nee, san' },
        ],
      },
    ],
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    region: 'India',
    categories: [
      {
        category: 'Greetings',
        phrases: [
          { english: 'Hello', translation: 'नमस्ते', pronunciation: 'nuh-muh-STAY' },
          { english: 'Thank you', translation: 'धन्यवाद', pronunciation: 'DHUN-yuh-vaad' },
          { english: 'Please', translation: 'कृपया', pronunciation: 'KRIP-yah' },
        ],
      },
      {
        category: 'Getting around',
        phrases: [
          { english: 'Where is the station?', translation: 'स्टेशन कहाँ है?', pronunciation: 'STAY-shun kuh-HAAN hai' },
          { english: 'How much is it?', translation: 'यह कितने का है?', pronunciation: 'yeh KIT-neh kah hai' },
          { english: 'I am lost', translation: 'मैं रास्ता भूल गया', pronunciation: 'main RAAS-tah bhool guh-YAH' },
        ],
      },
      {
        category: 'Food',
        phrases: [
          { english: 'A table for two', translation: 'दो लोगों के लिए मेज़', pronunciation: 'doh loh-GON keh lee-yeh mez' },
          { english: 'The bill, please', translation: 'बिल दीजिए', pronunciation: 'bill DEE-jee-yeh' },
        ],
      },
      {
        category: 'Emergencies',
        phrases: [
          { english: 'Help!', translation: 'मदद!', pronunciation: 'muh-DUD' },
          { english: 'Call a doctor', translation: 'डॉक्टर को बुलाओ', pronunciation: 'DOCK-tur koh boo-LAH-oh' },
        ],
      },
      {
        category: 'Numbers',
        phrases: [
          { english: 'One, two, three', translation: 'एक, दो, तीन', pronunciation: 'ek, doh, teen' },
        ],
      },
    ],
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    region: 'Portugal & Brazil',
    categories: [
      {
        category: 'Greetings',
        phrases: [
          { english: 'Hello', translation: 'Olá', pronunciation: 'oh-LAH' },
          { english: 'Thank you', translation: 'Obrigado', pronunciation: 'oh-bree-GAH-doo' },
          { english: 'Please', translation: 'Por favor', pronunciation: 'poor fah-VOR' },
        ],
      },
      {
        category: 'Getting around',
        phrases: [
          { english: 'Where is the station?', translation: 'Onde fica a estação?', pronunciation: 'ON-jee FEE-kah ah es-tah-SOWN' },
          { english: 'How much is it?', translation: 'Quanto custa?', pronunciation: 'KWAN-too KOOS-tah' },
          { english: 'I am lost', translation: 'Estou perdido', pronunciation: 'es-TOH per-DEE-doo' },
        ],
      },
      {
        category: 'Food',
        phrases: [
          { english: 'A table for two', translation: 'Uma mesa para dois', pronunciation: 'OO-mah MEH-zah PAH-rah doysh' },
          { english: 'The bill, please', translation: 'A conta, por favor', pronunciation: 'ah KON-tah poor fah-VOR' },
        ],
      },
      {
        category: 'Emergencies',
        phrases: [
          { english: 'Help!', translation: 'Socorro!', pronunciation: 'soh-KOH-hoo' },
          { english: 'Call a doctor', translation: 'Chame um médico', pronunciation: 'SHAH-meh oom MEH-jee-koo' },
        ],
      },
      {
        category: 'Numbers',
        phrases: [
          { english: 'One, two, three', translation: 'Um, dois, três', pronunciation: 'oom, doysh, trehsh' },
        ],
      },
    ],
  },
];
