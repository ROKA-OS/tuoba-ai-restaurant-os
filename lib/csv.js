// CSV parsing + Geidea amount parsing — pure and testable.

export function parseCSV(text) {
  const lines = String(text ?? '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim();
    });
    return obj;
  });
  return { headers, rows };
}

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[_\-\s]+/g, '');
}

// Parse a money cell that may be "1,234.56" (US), "1.234,56" (EU),
// "1234,56", "EGP 1234", "(1234)" negative, etc. Returns 0 on failure.
export function parseAmount(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  // Strip currency symbols/letters, keep digits, separators, minus.
  s = s.replace(/[^0-9.,\-]/g, '');
  if (!s || s === '-' || s === '.' || s === ',') return 0;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  if (hasDot && hasComma) {
    // Last separator is the decimal separator.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // EU: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,234.56
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma: if single comma with 1-2 trailing digits -> decimal (1234,56),
    // otherwise thousands separator (1,234).
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

export function guessColumn(headers, patterns) {
  return headers.find((h) => patterns.some((p) => normalize(h).includes(p))) || '';
}
