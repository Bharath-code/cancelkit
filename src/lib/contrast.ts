// WCAG contrast for founder brand colors: white text on the brand color when
// it clears 4.5:1, otherwise dark ink (NFR § Accessibility).

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const [la, lb] = [luminance(hexA), luminance(hexB)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Text color to place on a brand-colored surface: white when it clears AA,
// otherwise whichever of white/ink contrasts harder (mid-tone brands can't
// reach 4.5 with either — take the best available).
export function textOn(brandHex: string): string {
  try {
    const white = contrastRatio("#FFFFFF", brandHex);
    if (white >= 4.5) return "#FFFFFF";
    return contrastRatio("#16181D", brandHex) > white ? "#16181D" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
}
