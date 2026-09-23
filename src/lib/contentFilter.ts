/**
 * Anti-Harassment & Smart Content Filter
 * Real-time client-side keyword masking, spam & predatory link detection, and toxicity rating.
 */

const TOXIC_PATTERNS = [
  // Profanity & Harassment
  "abuse", "toxic", "harass", "threat", "stalker", "scam", "fraud",
  "stupid", "idiot", "loser", "ugly", "hate", "kill", "die",
  "creep", "pervert", "slut", "bitch", "bastard", "asshole",
  // Inappropriate Malayalam / Hinglish Slurs & terms
  "poda", "podi", "myre", "thendi", "patti", "kallan", "chetta",
  "badword1", "badword2"
];

const LINK_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|io|me|xyz|ru|cn)[^\s]*)/gi;

export interface FilterResult {
  cleanText: string;
  isToxic: boolean;
  hasLinks: boolean;
  matchedWords: string[];
}

export function sanitizeMessage(input: string): FilterResult {
  if (!input) {
    return { cleanText: "", isToxic: false, hasLinks: false, matchedWords: [] };
  }

  let cleanText = input;
  const matchedWords: string[] = [];

  // Check toxic words
  TOXIC_PATTERNS.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    if (regex.test(cleanText)) {
      matchedWords.push(term);
      cleanText = cleanText.replace(regex, (match) => "*".repeat(match.length));
    }
  });

  const hasLinks = LINK_REGEX.test(input);

  return {
    cleanText,
    isToxic: matchedWords.length > 0,
    hasLinks,
    matchedWords
  };
}
