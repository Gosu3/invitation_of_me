// Guest signature geometry shared by the board (client) and /api/signatures (server).
// Coordinates live in a VIEW_W x VIEW_H viewBox over the photo; a mark's strokes are relative to its centre.

export const SIGNATURE_VIEW_W = 1000;
export const SIGNATURE_VIEW_H = 1500;
export const SIGNATURE_LIMITS = { strokes: 40, numbersPerStroke: 800, numbersTotal: 6000, textLength: 28 } as const;
export const SIGNATURE_SCALE = { min: 0.2, max: 1.12 } as const;
export const SIGNATURE_MAX_ROTATE = 30;

export type SignatureInk = 'moss' | 'ivory' | 'gold';
export const signatureInks: SignatureInk[] = ['moss', 'ivory', 'gold'];

// Handwriting fonts for typed signatures (all include the Vietnamese subset). perChar/h approximate the rendered
// size at 110px so the server can size the footprint without measuring; 'madi' is the default and is not stored.
export type SignatureFont = 'madi' | 'dancing' | 'vibes' | 'pacifico' | 'patrick' | 'charm';
export const signatureFonts: Record<SignatureFont, { family: string; label: string; perChar: number; h: number }> = {
  madi: { family: 'Ms Madi', label: 'Thanh mảnh', perChar: 38, h: 120 },
  dancing: { family: 'Dancing Script', label: 'Mềm mại', perChar: 37, h: 115 },
  vibes: { family: 'Great Vibes', label: 'Cổ điển', perChar: 40, h: 126 },
  pacifico: { family: 'Pacifico', label: 'Nét cọ', perChar: 45, h: 150 },
  patrick: { family: 'Patrick Hand', label: 'Chữ tay', perChar: 36, h: 120 },
  charm: { family: 'Charmonman', label: 'Bay bướm', perChar: 43, h: 160 },
};
export const signatureFontIds = Object.keys(signatureFonts) as SignatureFont[];
export const signatureFontFamily = (font: SignatureFont = 'madi') => `'${signatureFonts[font].family}', cursive`;

export type SignatureMark =
  | { kind: 'draw'; strokes: number[][]; w: number; h: number }
  | { kind: 'text'; text: string; font?: SignatureFont; w: number; h: number };

export type SignatureZone = { x: number; y: number; w: number; h: number };

export type SignaturePlacement = { x: number; y: number; scale: number; rotate: number };

export type PublicSignature = SignaturePlacement & {
  id: string;
  guestName: string;
  mark: SignatureMark;
  ink: SignatureInk;
  wish?: { guestName: string; message: string };
  createdAt: string;
};

export function signaturePath(points: number[]) {
  if (points.length < 4) return `M${points[0]} ${points[1]}l.1 0`;
  let d = `M${points[0].toFixed(1)} ${points[1].toFixed(1)}`;
  for (let i = 2; i < points.length - 2; i += 2) {
    const mx = (points[i] + points[i + 2]) / 2;
    const my = (points[i + 1] + points[i + 3]) / 2;
    d += `Q${points[i].toFixed(1)} ${points[i + 1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const n = points.length;
  return `${d}L${points[n - 2].toFixed(1)} ${points[n - 1].toFixed(1)}`;
}

/** Keeps every stroke's end points and evenly drops points in between until it fits `maxNumbers`. */
function thin(stroke: number[], maxNumbers: number) {
  if (stroke.length <= maxNumbers) return stroke;
  const points = stroke.length / 2;
  const keep = Math.max(2, Math.floor(maxNumbers / 2));
  const out: number[] = [];
  for (let i = 0; i < keep; i += 1) {
    const index = Math.round((i * (points - 1)) / (keep - 1)) * 2;
    out.push(stroke[index], stroke[index + 1]);
  }
  return out;
}

/** Centres freshly drawn strokes on their bounding box and fits them within the storage limits. */
export function centreStrokes(strokes: number[][]): SignatureMark | null {
  const usable = strokes.filter((stroke) => stroke.length >= 2).slice(-SIGNATURE_LIMITS.strokes);
  if (!usable.length) return null;
  const total = usable.reduce((sum, stroke) => sum + stroke.length, 0);
  const ratio = Math.min(1, SIGNATURE_LIMITS.numbersTotal / total);
  const fitted = usable.map((stroke) => thin(stroke, Math.min(SIGNATURE_LIMITS.numbersPerStroke, Math.max(4, Math.floor((stroke.length * ratio) / 2) * 2))));
  const bounds = strokeBounds(fitted);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  return measureMark({
    kind: 'draw',
    strokes: fitted.map((stroke) => stroke.map((value, index) => round1(index % 2 === 0 ? value - cx : value - cy))),
    w: 0,
    h: 0,
  });
}

export function textSignature(text: string, font: SignatureFont = 'madi'): SignatureMark {
  return measureMark({ kind: 'text', text, font, w: 0, h: 0 });
}

/** Recomputes w/h from the mark itself so stored sizes never depend on client input. */
export function measureMark(mark: SignatureMark): SignatureMark {
  if (mark.kind === 'text') {
    const font = mark.font && mark.font in signatureFonts ? mark.font : 'madi';
    const metrics = signatureFonts[font];
    return { kind: 'text', text: mark.text, ...(font === 'madi' ? {} : { font }), w: Math.max(mark.text.length * metrics.perChar, 80), h: metrics.h };
  }
  const bounds = strokeBounds(mark.strokes);
  return {
    kind: 'draw',
    strokes: mark.strokes,
    w: round1(Math.max(bounds.maxX - bounds.minX, 20)),
    h: round1(Math.max(bounds.maxY - bounds.minY, 20)),
  };
}

function strokeBounds(strokes: number[][]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const stroke of strokes) {
    for (let i = 0; i < stroke.length - 1; i += 2) {
      minX = Math.min(minX, stroke[i]); maxX = Math.max(maxX, stroke[i]);
      minY = Math.min(minY, stroke[i + 1]); maxY = Math.max(maxY, stroke[i + 1]);
    }
  }
  return { minX, minY, maxX, maxY };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function signatureFootprint(sig: { mark: SignatureMark } & Pick<SignaturePlacement, 'x' | 'y' | 'scale'>): SignatureZone {
  const w = (sig.mark.w * sig.scale) / SIGNATURE_VIEW_W;
  const h = (sig.mark.h * sig.scale) / SIGNATURE_VIEW_H;
  return { x: sig.x - w / 2, y: sig.y - h / 2, w, h };
}
