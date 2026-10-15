export interface CaseData {
  id: string;
  title: string;
  variants: Array<{
    name: string;
    seed: number;
    metrics: Record<string, number | string | null | undefined>;
    curve: Array<Record<string, number | null | undefined>>;
  }>;
}

const palette = ['#385b95', '#60857c', '#89709a', '#947951', '#658797', '#7b7974', '#a26468', '#716846'];
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const metricKeys = (data: CaseData) => {
  const keys = [...new Set(data.variants.flatMap(variant => variant.curve.flatMap(row => Object.keys(row).filter(key => key !== 'step' && finite(row[key])))))];
  const priority = ['test_accuracy', 'test_loss', 'train_loss', 'train_accuracy'];
  return keys.sort((a, b) => (priority.indexOf(a) < 0 ? 99 : priority.indexOf(a)) - (priority.indexOf(b) < 0 ? 99 : priority.indexOf(b)));
};
export const variantNames = (data: CaseData) => [...new Set(data.variants.map(variant => variant.name))];
export const numberLabel = (value: number) => {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e5 || Math.abs(value) < 0.001) return value.toExponential(1);
  return Number(value.toPrecision(4)).toString();
};

export function plotModel(data: CaseData, metric: string, selection = '', requestedLog = false) {
  const names = variantNames(data);
  const variants = data.variants.filter(variant => !selection || variant.name === selection);
  const hasSteps = data.variants.some(variant => variant.curve.some(row => 'step' in row));
  const series = variants.map(variant => ({
    name: variant.name, seed: variant.seed,
    color: palette[names.indexOf(variant.name) % palette.length],
    points: variant.curve.map((row, i) => {
      const x = hasSteps ? row.step : i + 1;
      return finite(x) && finite(row[metric]) ? { x, y: row[metric] as number } : null;
    }),
  }));
  const points = series.flatMap(series => series.points.filter((point): point is { x: number; y: number } => point !== null));
  const logAllowed = points.length > 0 && points.every(point => point.y > 0);
  const log = requestedLog && logAllowed;
  const transform = (y: number) => log ? Math.log10(y) : y;
  const xs = points.map(point => point.x);
  const ys = points.map(point => transform(point.y));
  let xMin = points.length ? Math.min(...xs) : 0;
  let xMax = points.length ? Math.max(...xs) : 1;
  let yMin = points.length ? Math.min(...ys) : 0;
  let yMax = points.length ? Math.max(...ys) : 1;
  if (xMin === xMax) { xMin -= 0.5; xMax += 0.5; }
  const yPad = yMin === yMax ? Math.max(Math.abs(yMin) * 0.08, 0.1) : (yMax - yMin) * 0.06;
  yMin -= yPad; yMax += yPad;
  const xPos = (x: number) => 62 + (x - xMin) / (xMax - xMin) * 598;
  const yPos = (y: number) => 245 - (transform(y) - yMin) / (yMax - yMin) * 220;
  const tickYPos = (y: number) => 245 - (y - yMin) / (yMax - yMin) * 220;
  const lines = series.map(line => {
    let previousPresent = false;
    const path = line.points.map(point => {
      if (!point) { previousPresent = false; return ''; }
      const command = previousPresent ? 'L' : 'M';
      previousPresent = true;
      return `${command}${xPos(point.x).toFixed(2)},${yPos(point.y).toFixed(2)}`;
    }).join(' ');
    return { ...line, path, dots: line.points.filter((point): point is { x: number; y: number } => point !== null).map(point => ({ x: xPos(point.x), y: yPos(point.y), value: point.y, step: point.x })) };
  });
  return {
    lines, log, logAllowed, pointCount: points.length, hasSteps,
    xTicks: Array.from({ length: 5 }, (_, i) => { const value = xMin + (xMax - xMin) * i / 4; return { at: xPos(value), label: numberLabel(value) }; }),
    yTicks: Array.from({ length: 5 }, (_, i) => { const value = yMin + (yMax - yMin) * i / 4; return { at: tickYPos(value), label: numberLabel(log ? 10 ** value : value) }; }),
    legend: names.filter(name => !selection || name === selection).map(name => ({ name, color: palette[names.indexOf(name) % palette.length], seeds: variants.filter(variant => variant.name === name).map(variant => variant.seed) })),
  };
}
