// Voice-Controlled Hotel Booking Automation Engine for Naidu Hotel
// Handles English, Telugu, and Hindi multilingual conversation, mid-conversation corrections,
// date validation, dynamic room matching, and automatic pre-filled navigation.

import { RoomType } from '../types/hotel';

export type SupportedLanguage = 'en' | 'te' | 'hi';

export type BookingStep =
  | 'ask_room'
  | 'ask_checkin'
  | 'ask_checkout'
  | 'ask_guests'
  | 'confirm_summary'
  | 'completed';

export interface VoiceBookingState {
  isActive: boolean;
  step: BookingStep;
  language: SupportedLanguage;
  roomTypeId?: string;
  roomTypeName?: string;
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  guests?: number;
  adults?: number;
  children?: number;
  estimatedPrice?: number;
  nights?: number;
  isConfirmed?: boolean;
  readyToNavigate?: boolean;
  lastCorrectionNotice?: string;
}

export interface EngineProcessResult {
  state: VoiceBookingState;
  replyText: string;
  speechText: string;
  language: SupportedLanguage;
  action?: 'navigate_to_booking' | 'stay_in_chat' | 'cancelled';
  suggestedPrompts?: string[];
}

// Comprehensive detection for Telugu, Hindi, and English scripts and phonetics
export const detectSpokenLanguage = (text: string, currentLang: SupportedLanguage = 'en'): SupportedLanguage => {
  if (!text) return currentLang;

  // 1. Unicode character ranges (absolute certainty)
  const teluguRegex = /[\u0C00-\u0C7F]/;
  const hindiRegex = /[\u0900-\u097F]/;

  if (teluguRegex.test(text)) return 'te';
  if (hindiRegex.test(text)) return 'hi';

  const lower = text.toLowerCase();

  // 2. Telugu transliterated phrases & phonetic keywords
  const teluguKeywords = [
    'naku', 'naaku', 'gadi', 'gadulu', 'repu', 'ellundi', 'monna', 'sare', 'avunu', 'vaddu',
    'vellu', 'iddaru', 'mugguru', 'naluguru', 'aiduguru', 'aaruguru', 'yenta', 'enta', 'dharalu',
    'dhanyavadalu', 'cheppandi', 'andi', 'babu', 'choodandi', 'unnaaya', 'unnaya', 'kaavali',
    'kavali', 'eppudu', 'yepudu', 'ela', 'chesukondi', 'chesuko', 'sahayam', 'cheyyi',
    'cheyyandi', 'namaskaram', 'namaskaramu', 'munduku', 'meeru', 'nenu', 'manaki', 'roju',
    'rojulu', 'rathri', 'veldam', 'chusta', 'ivvandi'
  ];

  for (const kw of teluguKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lower) || lower.includes(kw)) {
      return 'te';
    }
  }

  // 3. Hindi transliterated phrases & phonetic keywords
  const hindiKeywords = [
    'mujhe', 'humko', 'hamen', 'chahiye', 'kamra', 'kamre', 'theek', 'haan', 'han', 'nahin',
    'nahi', 'aage', 'do log', 'teen log', 'char log', 'panch log', 'kitna', 'kitne', 'batao',
    'batayein', 'daam', 'kiraya', 'kab', 'kripya', 'madad', 'accha', 'achha', 'karna', 'karo',
    'karein', 'kaise', 'suprabhat', 'dhanyawad', 'shukriya', 'namaste', 'namaskar', 'chalye',
    'chalo', 'bhaiya', 'pusthi', 'aaj', 'kal', 'parson', 'raat', 'raatein', 'kholo'
  ];

  for (const kw of hindiKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lower) || lower.includes(kw)) {
      return 'hi';
    }
  }

  // 4. Strong English signals switch back to English if previously in another language
  const englishKeywords = [
    'book', 'room', 'hotel', 'deluxe', 'suite', 'check', 'available', 'night', 'dates', 'today',
    'tomorrow', 'guests', 'adults', 'children', 'cost', 'price', 'cancel', 'policy', 'refund',
    'hello', 'hi', 'yes', 'no', 'proceed', 'reserve', 'what', 'how', 'when', 'who', 'show'
  ];
  const englishMatches = englishKeywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
  if (englishMatches.length >= 1) {
    return 'en';
  }

  return currentLang;
};

// Check if message is a booking intent
export const isBookingIntent = (text: string): boolean => {
  const lower = text.toLowerCase();
  const keywords = [
    'book a room',
    'book room',
    'i want to book',
    'reserve a room',
    'make a reservation',
    'reserve room',
    'booking',
    'గదిని బుక్',
    'గది బుక్',
    'రూమ్ బుక్',
    'బుకింగ్ చేయాలి',
    'బుక్ చేయాలి',
    'రిజర్వేషన్',
    'రూమ్ కావాలి',
    'कमरा बुक',
    'रूम बुक',
    'बुकिंग करनी है',
    'आरक्षण करना है',
    'मुझे कमरा चाहिए',
    'कमरा आरक्षित',
    'book deluxe',
    'book suite',
    'book villa',
    'book penthouse'
  ];

  return keywords.some(k => lower.includes(k.toLowerCase()));
};

// Check if message is a cancellation intent
export const isCancellationIntent = (text: string): boolean => {
  const lower = text.toLowerCase();
  const cancelKeywords = [
    'cancel booking',
    'cancel the booking',
    'cancel it',
    'stop booking',
    'abort',
    'never mind',
    'dont want to book',
    "don't want to book",
    'వద్దు',
    'రద్దు చేయి',
    'ఆపు',
    'బుకింగ్ వద్దు',
    'రద్దు',
    'रद्द करें',
    'रद्द करो',
    'बुकिंग रद्द',
    'रोकें',
    'नहीं चाहिए'
  ];

  return cancelKeywords.some(k => lower.includes(k.toLowerCase()));
};

// Check if message is a confirmation intent
export const isConfirmationIntent = (text: string): boolean => {
  const lower = text.toLowerCase().trim();
  const confirmPhrases = [
    'yes',
    'proceed',
    'confirm',
    'sure',
    'ok',
    'okay',
    'go ahead',
    'yes proceed',
    'please proceed',
    'navigate',
    'సరే',
    'వెళ్లు',
    'అవును',
    'ధృవీకరించు',
    'హా',
    'ముందుకు సాగండి',
    'వెళ్లండి',
    'సరే వెళ్లండి',
    'हाँ',
    'आगे बढ़ो',
    'आगे बढ़ो',
    'ठीक है',
    'सही है',
    'पुष्टि करें',
    'हाँ आगे बढ़ो',
    'चलो'
  ];

  return confirmPhrases.some(p => lower === p || lower.startsWith(p) || lower.includes(p));
};

// Natural Spoken Date Parser
export const parseSpokenDate = (text: string, referenceDate: Date = new Date()): string | null => {
  const lower = text.toLowerCase().trim();
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  // Relative dates (check 'day after tomorrow' first so 'tomorrow' substring doesn't match early)
  if (
    lower.includes('day after tomorrow') ||
    lower.includes('day after') ||
    lower.includes('ఎల్లుండి') ||
    lower.includes('परसों')
  ) {
    const dayAfter = new Date(today.getTime() + 2 * 86400000);
    return dayAfter.toISOString().split('T')[0];
  }

  if (lower.includes('today') || lower.includes('ఈ రోజు') || lower.includes('आज')) {
    return today.toISOString().split('T')[0];
  }

  if (lower.includes('tomorrow') || lower.includes('రేపు') || lower.includes('कल')) {
    const tmrw = new Date(today.getTime() + 86400000);
    return tmrw.toISOString().split('T')[0];
  }

  if (lower.includes('next week') || lower.includes('వచ్చే వారం') || lower.includes('अगले हफ्ते')) {
    const nextWk = new Date(today.getTime() + 7 * 86400000);
    return nextWk.toISOString().split('T')[0];
  }

  // Handle specific day of week like "next friday"
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let d = 0; d < daysOfWeek.length; d++) {
    if (lower.includes(daysOfWeek[d])) {
      const currentDay = today.getDay();
      let diff = d - currentDay;
      if (diff <= 0) diff += 7;
      const target = new Date(today.getTime() + diff * 86400000);
      return target.toISOString().split('T')[0];
    }
  }

  // Direct ISO pattern: YYYY-MM-DD
  const isoMatch = lower.match(/\b(202\d)-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1]);
    const m = String(parseInt(isoMatch[2])).padStart(2, '0');
    const d = String(parseInt(isoMatch[3])).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = lower.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](202\d))?\b/);
  if (slashMatch) {
    const d = String(parseInt(slashMatch[1])).padStart(2, '0');
    const m = String(parseInt(slashMatch[2])).padStart(2, '0');
    const y = slashMatch[3] ? slashMatch[3] : String(today.getFullYear());
    return `${y}-${m}-${d}`;
  }

  // Month name matchers: "November 10", "10th Nov", "నవంబర్ 10", "10 नवंबर"
  const monthMap: Record<string, number> = {
    jan: 1, january: 1, 'జనవరి': 1, 'जनवरी': 1,
    feb: 2, february: 2, 'ఫిబ్రవరి': 2, 'फरवरी': 2,
    mar: 3, march: 3, 'మార్చి': 3, 'मार्च': 3,
    apr: 4, april: 4, 'ఏప్రిల్': 4, 'अप्रैल': 4,
    may: 5, 'మే': 5, 'मई': 5,
    jun: 6, june: 6, 'జూన్': 6, 'जून': 6,
    jul: 7, july: 7, 'జూలై': 7, 'जुलाई': 7,
    aug: 8, august: 8, 'ఆగస్టు': 8, 'अगस्त': 8,
    sep: 9, sept: 9, september: 9, 'సెప్టెంబర్': 9, 'सितंबर': 9,
    oct: 10, october: 10, 'అక్టోబర్': 10, 'अक्टूबर': 10,
    nov: 11, november: 11, 'నవంబర్': 11, 'नवंबर': 11,
    dec: 12, december: 12, 'డిసెంబర్': 12, 'दिसंबर': 12
  };

  for (const [mName, mNum] of Object.entries(monthMap)) {
    if (lower.includes(mName)) {
      // Look for day numbers around month name
      const dayMatches = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/g);
      if (dayMatches && dayMatches.length > 0) {
        const dayVal = parseInt(dayMatches[0]);
        if (dayVal >= 1 && dayVal <= 31) {
          const year = today.getFullYear();
          const targetDate = new Date(year, mNum - 1, dayVal);
          // If date already passed in current year, roll over to next year
          if (targetDate.getTime() < today.getTime()) {
            targetDate.setFullYear(year + 1);
          }
          const y = targetDate.getFullYear();
          const m = String(targetDate.getMonth() + 1).padStart(2, '0');
          const d = String(targetDate.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }
    }
  }

  // Bare number provided (e.g. "10", "15th")
  const bareNum = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (bareNum) {
    const dayVal = parseInt(bareNum[1]);
    if (dayVal >= 1 && dayVal <= 31) {
      const targetDate = new Date(today);
      if (dayVal < today.getDate()) {
        targetDate.setMonth(today.getMonth() + 1);
      }
      targetDate.setDate(dayVal);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
};

// Spoken guest count extractor
export const parseGuestCount = (text: string): { guests?: number; adults?: number; children?: number } => {
  const lower = text.toLowerCase();

  const numberWords: [string, number][] = [
    ['one', 1], ['single', 1], ['ఒకరు', 1], ['ఒక్కరు', 1], ['ఒక', 1], ['एक', 1],
    ['two', 2], ['couple', 2], ['ఇద్దరు', 2], ['రెండు', 2], ['दो', 2],
    ['three', 3], ['ముగ్గురు', 3], ['మూడు', 3], ['तीन', 3],
    ['four', 4], ['నలుగురు', 4], ['నాలుగు', 4], ['चार', 4],
    ['five', 5], ['ఐదుగురు', 5], ['ఐదు', 5], ['पाँच', 5], ['पांच', 5],
    ['six', 6], ['ఆరుగురు', 6], ['ఆరు', 6], ['छह', 6]
  ];

  let totalGuests: number | undefined;

  for (const [word, num] of numberWords) {
    const isAscii = /^[a-z0-9]+$/i.test(word);
    if (isAscii) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
        totalGuests = num;
        break;
      }
    } else {
      if (lower.includes(word)) {
        totalGuests = num;
        break;
      }
    }
  }

  // Digit matches like "2 adults", "3 people", "4"
  const digitMatch = lower.match(/\b(\d{1,2})\s*(?:adults?|guests?|people|persons?|మంది|लोग)?\b/);
  if (digitMatch && !totalGuests) {
    const val = parseInt(digitMatch[1]);
    if (val >= 1 && val <= 12) {
      totalGuests = val;
    }
  }

  // Children breakdown if mentioned
  let children: number | undefined;
  const childMatch = lower.match(/(\d+)\s*(?:kids?|children|పిల్లలు|बच्चे)/);
  if (childMatch) {
    children = parseInt(childMatch[1]);
  }

  return {
    guests: totalGuests,
    adults: totalGuests ? (children ? Math.max(1, totalGuests - children) : totalGuests) : undefined,
    children
  };
};

// Match room name against actual hotel room types
export const matchRoomType = (text: string, roomTypes: RoomType[]): RoomType | null => {
  const lower = text.toLowerCase();

  const aliases: Record<string, string[]> = {
    deluxe: ['deluxe ocean', 'deluxe', 'ocean view', 'ocean', 'డీలక్స్', 'సముద్రపు', 'डीलक्स', 'ओशन'],
    executive: ['executive business suite', 'business suite', 'executive suite', 'executive', 'suite', 'ఎగ్జిక్యూటివ్ సూట్', 'ఎగ్జిక్యూటివ్', 'సూట్', 'एग्जीक्यूटिव सुइट', 'सुइट', 'एग्जीक्यूटिव'],
    presidential: ['presidential penthouse', 'luxery penthouse', 'presidential', 'penthouse', 'ప్రెసిడెన్షియల్', 'పెంట్‌హౌస్', 'पेंटहाउस', 'प्रेसिडेंशियल'],
    garden: ['premier garden villa', 'garden villa', 'garden', 'villa', 'గార్డెన్ విల్లా', 'గార్డెన్', 'విల్లా', 'गार्डन विला', 'गार्डन', 'विला'],
    single: ['single sharing', 'single room', 'single', 'సింగిల్', 'ఒంటరి', 'सिंगल'],
    double: ['double sharing', 'double room', 'double', 'ట్విన్', 'డబుల్', 'डबल'],
    triple: ['triple sharing', 'triple room', 'triple', 'ట్రిపుల్', 'ट्रिपल'],
    four: ['four sharing', 'four room', 'four', 'ఫోర్', 'चार']
  };

  let bestMatch: RoomType | null = null;
  let highestIndex = -1;

  for (const [key, searchTerms] of Object.entries(aliases)) {
    for (const term of searchTerms) {
      const idx = lower.lastIndexOf(term);
      if (idx > highestIndex) {
        const matched = roomTypes.find(rt => rt.name.toLowerCase().includes(key) || rt.code.toLowerCase().includes(key));
        if (matched) {
          highestIndex = idx;
          bestMatch = matched;
        }
      }
    }
  }

  return bestMatch;
};

// Check if dates are valid
export const validateStayDates = (
  checkInStr?: string,
  checkOutStr?: string
): { isValid: boolean; errorKey?: 'past_date' | 'checkout_before_checkin' } => {
  if (!checkInStr) return { isValid: true };

  const todayStr = new Date().toISOString().split('T')[0];

  if (checkInStr < todayStr) {
    return { isValid: false, errorKey: 'past_date' };
  }

  if (checkOutStr) {
    if (checkOutStr <= checkInStr) {
      return { isValid: false, errorKey: 'checkout_before_checkin' };
    }
  }

  return { isValid: true };
};

// Multilingual Prompt Message Dictionary
export const PROMPTS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    start: "I would be delighted to assist you with booking a room at Naidu Hotel. Which type of room would you like?",
    ask_room: "Which type of room would you like? We offer Deluxe Ocean View, Executive Business Suite, Premier Garden Villa, and Presidential Penthouse.",
    ask_checkin: "What is your check-in date?",
    ask_checkout: "What is your check-out date?",
    ask_guests: "How many guests will stay?",
    invalid_past_date: "The check-in date cannot be in the past. What is your preferred check-in date?",
    invalid_checkout_date: "Your check-out date must be after your check-in date. What is your check-out date?",
    room_unavailable: "We are sorry, that room type is currently fully booked for your selected dates. Would you like to select an alternative available room or adjust your dates?",
    summary_confirm: "You are booking {roomName} for {guests} guest(s), checking in on {checkIn} and checking out on {checkOut} ({nights} night(s), estimated ₹{price}). Shall I proceed to the booking page with these details?",
    navigating: "Navigating to the booking page. Please complete your reservation.",
    cancelled: "The booking process has been cancelled. How else can I assist you with Naidu Hotel?",
    correction_room: "Updated room preference to {value}.",
    correction_checkin: "Updated check-in date to {value}.",
    correction_checkout: "Updated check-out date to {value}.",
    correction_guests: "Updated guest count to {value}.",
  },
  te: {
    start: "నాయుడు హోటల్‌లో గది బుక్ చేయడంలో మీకు సహాయం చేయడానికి సంతోషిస్తున్నాను. మీరు ఏ రకమైన గదిని కోరుకుంటున్నారు?",
    ask_room: "మీరు ఏ రకమైన గదిని బుక్ చేయాలనుకుంటున్నారు? మా వద్ద డీలక్స్ ఓషన్ వ్యూ, ఎగ్జిక్యూటివ్ బిజినెస్ సూట్, గార్డెన్ విల్లా మరియు ప్రెసిడెన్షియల్ పెంట్‌హౌస్ అందుబాటులో ఉన్నాయి.",
    ask_checkin: "మీ చెక్-ఇన్ తేదీ ఏది?",
    ask_checkout: "మీ చెక్-ఔట్ తేదీ ఏది?",
    ask_guests: "ఎంతమంది అతిథులు బస చేస్తారు?",
    invalid_past_date: "చెక్-ఇన్ తేదీ గతంలో ఉండకూడదు. దయచేసి భవిష్యత్ చెక్-ఇన్ తేదీని తెలియజేయండి.",
    invalid_checkout_date: "చెక్-ఔట్ తేదీ తప్పనిసరిగా చెక్-ఇన్ తేదీ తర్వాత ఉండాలి. దయచేసి మీ చెక్-ఔట్ తేదీని చెప్పండి.",
    room_unavailable: "క్షమించండి, మీరు ఎంచుకున్న తేదీలలో ఆ గది అందుబాటులో లేదు. మరొక గదిని ఎంచుకోవాలనుకుంటున్నారా లేదా తేదీలను మార్చాలనుకుంటున్నారా?",
    summary_confirm: "{guests} అతిథులకు {roomName}, చెక్-ఇన్ {checkIn}, చెక్-ఔట్ {checkOut} ({nights} రాత్రులు, అంచనా వ్యయం ₹{price}). ఈ వివరాలతో బుకింగ్ పేజీకి వెళ్లమంటారా?",
    navigating: "బుకింగ్ పేజీకి వెళ్తున్నాము. దయచేసి మీ రిజర్వేషన్ పూర్తి చేయండి.",
    cancelled: "బుకింగ్ ప్రక్రియ రద్దు చేయబడింది. నాయుడు హోటల్ గురించి మీకు ఇంకా ఏమి సహాయం కావాలి?",
    correction_room: "గదిని {value} గా మార్చాము.",
    correction_checkin: "చెక్-ఇన్ తేదీని {value} గా నవీకరించాము.",
    correction_checkout: "చెక్-ఔట్ తేదీని {value} గా నవీకరించాము.",
    correction_guests: "అతిథుల సంఖ్యను {value} గా మార్చాము.",
  },
  hi: {
    start: "नायडू होटल में कमरा बुक करने में आपकी सहायता करने में मुझे खुशी होगी। आप किस प्रकार का कमरा चाहेंगे?",
    ask_room: "आप किस प्रकार का कमरा बुक करना चाहते हैं? हमारे पास डीलक्स ओशन व्यू, एग्जीक्यूटिव बिजनेस सुइट, प्रीमियर गार्डन विला और प्रेसिडेंशियल पेंटहाउस उपलब्ध हैं।",
    ask_checkin: "आपकी चेक-इन तारीख क्या है?",
    ask_checkout: "आपकी चेक-आउट तारीख क्या है?",
    ask_guests: "कितने मेहमान ठहरेंगे?",
    invalid_past_date: "चेक-इन तारीख पिछली तारीख नहीं हो सकती। कृपया अपनी चेक-इन तारीख बताएं।",
    invalid_checkout_date: "चेक-आउट तारीख चेक-इन तारीख के बाद होनी चाहिए। कृपया अपनी चेक-आउट तारीख बताएं।",
    room_unavailable: "क्षमा करें, आपके द्वारा चुनी गई तारीखों के लिए वह कमरा उपलब्ध नहीं है। क्या आप दूसरा कमरा चुनना चाहेंगे या तारीखें बदलना चाहेंगे?",
    summary_confirm: "{guests} मेहमानों के लिए {roomName}, चेक-इन {checkIn}, चेक-आउट {checkOut} ({nights} रातें, अनुमानित ₹{price})। क्या मैं इन विवरणों के साथ बुकिंग पेज पर आगे बढ़ूँ?",
    navigating: "बुकिंग पेज पर जा रहे हैं। कृपया अपना आरक्षण पूरा करें।",
    cancelled: "बुकिंग प्रक्रिया रद्द कर दी गई है। नायडू होटल के संबंध में मैं आपकी और क्या मदद कर सकता हूँ?",
    correction_room: "कमरे का विकल्प {value} में अपडेट कर दिया गया है।",
    correction_checkin: "चेक-इन तारीख {value} में अपडेट कर दी गई है।",
    correction_checkout: "चेक-आउट तारीख {value} में अपडेट कर दी गई है।",
    correction_guests: "मेहमानों की संख्या {value} में अपडेट कर दी गई है।",
  }
};

/**
 * Main Engine Processor for Voice Hotel Booking Conversation
 */
export const processVoiceBookingInput = (
  userMessage: string,
  currentState: VoiceBookingState,
  roomTypes: RoomType[]
): EngineProcessResult => {
  const language = detectSpokenLanguage(userMessage, currentState.language || 'en');
  const lowerMsg = userMessage.toLowerCase();
  const dict = PROMPTS[language] || PROMPTS.en;

  // 1. Check for Cancellation Intent at any time
  if (isCancellationIntent(userMessage)) {
    const resetState: VoiceBookingState = {
      isActive: false,
      step: 'ask_room',
      language,
    };
    return {
      state: resetState,
      replyText: dict.cancelled,
      speechText: dict.cancelled,
      language,
      action: 'cancelled',
      suggestedPrompts: [
        'What rooms are available this weekend?',
        'Tell me about hotel dining and pool',
        'What is the free cancellation policy?'
      ]
    };
  }

  // Clone active state
  let nextState: VoiceBookingState = {
    ...currentState,
    isActive: true,
    language
  };

  // 2. Mid-Conversation Correction Handling
  let correctionAck = '';

  // A. Room Correction
  const matchedRoom = matchRoomType(userMessage, roomTypes);
  if (matchedRoom && (lowerMsg.includes('change') || lowerMsg.includes('switch') || lowerMsg.includes('మార్చు') || lowerMsg.includes('बदलें') || !nextState.roomTypeId)) {
    nextState.roomTypeId = matchedRoom.id;
    nextState.roomTypeName = matchedRoom.name;
    correctionAck += dict.correction_room.replace('{value}', matchedRoom.name) + ' ';
  }

  // B. Guest Count Correction
  const guestInfo = parseGuestCount(userMessage);
  if (guestInfo.guests !== undefined && (lowerMsg.includes('guest') || lowerMsg.includes('adult') || lowerMsg.includes('people') || lowerMsg.includes('make it') || lowerMsg.includes('actually') || lowerMsg.includes('మంది') || lowerMsg.includes('लोग') || !nextState.guests)) {
    nextState.guests = guestInfo.guests;
    if (guestInfo.adults) nextState.adults = guestInfo.adults;
    if (guestInfo.children) nextState.children = guestInfo.children;
    correctionAck += dict.correction_guests.replace('{value}', String(guestInfo.guests)) + ' ';
  }

  // C. Date Correction or Input
  const isCheckInExplicit =
    /\b(check\s*in|from)\b/i.test(lowerMsg) ||
    lowerMsg.includes('చెక్ ఇన్') ||
    lowerMsg.includes('నుండి') ||
    lowerMsg.includes('చేరిన') ||
    lowerMsg.includes('चेक इन') ||
    lowerMsg.includes('से');

  const isCheckOutExplicit =
    /\b(check\s*out|until|till)\b/i.test(lowerMsg) ||
    /\bto\s+(?:the\s+)?(?:\d|nov|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|tomorrow|next)/i.test(lowerMsg) ||
    lowerMsg.includes('చెక్ ఔట్') ||
    lowerMsg.includes('వరకు') ||
    lowerMsg.includes('నిష్క్రమణ') ||
    lowerMsg.includes('चेक आउट') ||
    lowerMsg.includes('तक');

  // Check if user specified a date range in one sentence (e.g. "from tomorrow to day after tomorrow", "రేపు నుండి ఎల్లుండి వరకు", "कल से परसों तक")
  let rangeExtracted = false;
  if (lowerMsg.includes('నుండి')) {
    const parts = lowerMsg.split('నుండి');
    const dIn = parseSpokenDate(parts[0]);
    const dOut = parseSpokenDate(parts.slice(1).join(' ').replace(/వరకు/g, ' '));
    if (dIn && dOut) {
      nextState.checkIn = dIn;
      nextState.checkOut = dOut;
      correctionAck += dict.correction_checkin.replace('{value}', dIn) + ' ' + dict.correction_checkout.replace('{value}', dOut) + ' ';
      rangeExtracted = true;
    }
  } else if (lowerMsg.includes(' से ')) {
    const parts = lowerMsg.split(' से ');
    const dIn = parseSpokenDate(parts[0]);
    const dOut = parseSpokenDate(parts.slice(1).join(' ').replace(/तक/g, ' '));
    if (dIn && dOut) {
      nextState.checkIn = dIn;
      nextState.checkOut = dOut;
      correctionAck += dict.correction_checkin.replace('{value}', dIn) + ' ' + dict.correction_checkout.replace('{value}', dOut) + ' ';
      rangeExtracted = true;
    }
  } else {
    const rangeSplit = lowerMsg.split(/\b(?:to|until|till)\b/i);
    if (rangeSplit.length >= 2) {
      const checkInCandidate = parseSpokenDate(rangeSplit[0]);
      const checkOutCandidate = parseSpokenDate(rangeSplit.slice(1).join(' '));
      if (checkInCandidate && checkOutCandidate) {
        nextState.checkIn = checkInCandidate;
        nextState.checkOut = checkOutCandidate;
        correctionAck += dict.correction_checkin.replace('{value}', checkInCandidate) + ' ' + dict.correction_checkout.replace('{value}', checkOutCandidate) + ' ';
        rangeExtracted = true;
      }
    }
  }

  if (!rangeExtracted) {
    const extractedDate = parseSpokenDate(userMessage);

    if (extractedDate) {
      if (isCheckOutExplicit || (nextState.checkIn && !nextState.checkOut && nextState.step === 'ask_checkout')) {
        nextState.checkOut = extractedDate;
        correctionAck += dict.correction_checkout.replace('{value}', extractedDate) + ' ';
      } else if (isCheckInExplicit || !nextState.checkIn || nextState.step === 'ask_checkin') {
        nextState.checkIn = extractedDate;
        correctionAck += dict.correction_checkin.replace('{value}', extractedDate) + ' ';
      }
    }
  }

  // 3. Date Validation Checks
  const dateValidation = validateStayDates(nextState.checkIn, nextState.checkOut);
  if (!dateValidation.isValid) {
    if (dateValidation.errorKey === 'past_date') {
      nextState.checkIn = undefined; // reset invalid check-in
      return {
        state: nextState,
        replyText: (correctionAck ? correctionAck + '\n\n' : '') + dict.invalid_past_date,
        speechText: dict.invalid_past_date,
        language,
        suggestedPrompts: ['Tomorrow', 'Next Friday', 'November 15']
      };
    } else if (dateValidation.errorKey === 'checkout_before_checkin') {
      nextState.checkOut = undefined; // reset invalid check-out
      return {
        state: nextState,
        replyText: (correctionAck ? correctionAck + '\n\n' : '') + dict.invalid_checkout_date,
        speechText: dict.invalid_checkout_date,
        language,
        suggestedPrompts: ['Day after tomorrow', '2 nights after check-in']
      };
    }
  }

  // 4. Missing Information Progression Logic
  // Check what is missing in priority: roomType -> checkIn -> checkOut -> guests -> confirm
  if (!nextState.roomTypeId) {
    nextState.step = 'ask_room';
    const roomPrompts = roomTypes.slice(0, 4).map(r => r.name);
    return {
      state: nextState,
      replyText: (correctionAck ? correctionAck + '\n\n' : '') + dict.ask_room,
      speechText: dict.ask_room,
      language,
      suggestedPrompts: roomPrompts
    };
  }

  if (!nextState.checkIn) {
    nextState.step = 'ask_checkin';
    return {
      state: nextState,
      replyText: (correctionAck ? correctionAck + '\n\n' : '') + dict.ask_checkin,
      speechText: dict.ask_checkin,
      language,
      suggestedPrompts: ['Tomorrow', 'Next weekend', 'November 10']
    };
  }

  if (!nextState.checkOut) {
    nextState.step = 'ask_checkout';
    return {
      state: nextState,
      replyText: (correctionAck ? correctionAck + '\n\n' : '') + dict.ask_checkout,
      speechText: dict.ask_checkout,
      language,
      suggestedPrompts: ['Day after tomorrow', '3 days stay', 'November 12']
    };
  }

  if (!nextState.guests) {
    nextState.step = 'ask_guests';
    return {
      state: nextState,
      replyText: (correctionAck ? correctionAck + '\n\n' : '') + dict.ask_guests,
      speechText: dict.ask_guests,
      language,
      suggestedPrompts: ['1 guest', '2 adults', '2 adults and 1 child']
    };
  }

  // 5. Calculate stay metrics: nights & estimated total price
  const selectedRoomObj = roomTypes.find(r => r.id === nextState.roomTypeId);
  const d1 = new Date(nextState.checkIn);
  const d2 = new Date(nextState.checkOut);
  const diffTime = Math.max(d2.getTime() - d1.getTime(), 86400000);
  const nights = Math.max(Math.ceil(diffTime / 86400000), 1);
  nextState.nights = nights;

  const basePrice = selectedRoomObj ? selectedRoomObj.basePrice : 2799;
  const estimatedPrice = Math.round(basePrice * nights * 1.12); // Including GST
  nextState.estimatedPrice = estimatedPrice;

  // 6. If currently at confirmation step, check if user confirmed
  if (nextState.step === 'confirm_summary') {
    if (isConfirmationIntent(userMessage)) {
      nextState.isConfirmed = true;
      nextState.readyToNavigate = true;
      nextState.step = 'completed';

      return {
        state: nextState,
        replyText: dict.navigating,
        speechText: dict.navigating,
        language,
        action: 'navigate_to_booking'
      };
    }
  }

  // 7. All information collected: Summarize and Ask for Confirmation
  nextState.step = 'confirm_summary';
  const summaryMessage = dict.summary_confirm
    .replace('{roomName}', nextState.roomTypeName || 'Selected Room')
    .replace('{guests}', String(nextState.guests))
    .replace('{checkIn}', nextState.checkIn)
    .replace('{checkOut}', nextState.checkOut)
    .replace('{nights}', String(nights))
    .replace('{price}', estimatedPrice.toLocaleString('en-IN'));

  return {
    state: nextState,
    replyText: (correctionAck ? correctionAck + '\n\n' : '') + summaryMessage,
    speechText: summaryMessage,
    language,
    suggestedPrompts: language === 'te'
      ? ['సరే వెళ్లు', 'గది మార్చు', 'తేదీలను మార్చు', 'రద్దు చేయి']
      : language === 'hi'
      ? ['हाँ, आगे बढ़ो', 'कमरा बदलें', 'तारीख बदलें', 'रद्द करें']
      : ['Yes, proceed', 'Change room', 'Change dates', 'Cancel booking']
  };
};
