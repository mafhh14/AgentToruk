const ABUSIVE_PATTERNS = [
  /\b(kill|die|idiot|stupid)\b/i,
];

const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b\d{16}\b/,
];

const HUMAN_REQUEST_PATTERNS = [
  /\b(talk to|speak to|human|real person|agent|representative)\b/i,
];

export function checkInputGuardrails(message: string): {
  allowed: boolean;
  message?: string;
  flags: string[];
} {
  const flags: string[] = [];

  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(message)) {
      flags.push("abusive_language");
    }
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      flags.push("sensitive_data");
    }
  }

  if (flags.includes("abusive_language")) {
    return {
      allowed: false,
      flags,
      message:
        "I'm here to help, but I can't continue if messages contain abusive language. Please rephrase your question respectfully.",
    };
  }

  if (flags.includes("sensitive_data")) {
    return {
      allowed: true,
      flags,
      message: undefined,
    };
  }

  return { allowed: true, flags };
}

export function detectHumanRequest(message: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
}

export function checkOutputGuardrails(response: string): string {
  const riskyPhrases = [
    /refund (has been|is) approved/i,
    /guarantee(d)? (a )?refund/i,
    /i('ve| have) processed your refund/i,
  ];

  for (const pattern of riskyPhrases) {
    if (pattern.test(response)) {
      return response.replace(
        pattern,
        "I've submitted your request for review",
      );
    }
  }

  return response;
}
