export interface ContentSafetyResult {
  approved: boolean;
  category?: string;
}

interface BlocklistCategory {
  category: string;
  patterns: RegExp[];
}

const BLOCKLIST: BlocklistCategory[] = [
  {
    category: "violence",
    patterns: [/\bkill\b/i, /\bmurder\b/i, /\bgun\b/i, /\bweapon\b/i, /\bblood\b/i],
  },
  {
    category: "adult-content",
    patterns: [/\bsex\b/i, /\bporn\b/i, /\bnude\b/i],
  },
  {
    category: "insult",
    patterns: [/\bstupid\b/i, /\bidiot\b/i, /\bshut\s+up\b/i],
  },
  {
    category: "personal-info",
    patterns: [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, /\d{7,}/],
  },
];

export function checkContentSafety(text: string): ContentSafetyResult {
  for (const { category, patterns } of BLOCKLIST) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return { approved: false, category };
    }
  }

  return { approved: true };
}

export const SAFE_FALLBACK_REPLY_EN = "Let's talk about something else related to our lesson! 😊";
export const SAFE_FALLBACK_REPLY_PT = "Vamos falar sobre outra coisa relacionada à nossa lição! 😊";
