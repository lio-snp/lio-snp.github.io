type Point = readonly [number, number];
const tex = String.raw;
const scale = [2, 1] as const;
const densityScales = [[1.8, 0.5], [0.65, 1.4]] as const;

export const options = {
  marginal: {
    raw: { label: '|rⱼ|', tex: tex`u_j=|r_j|` },
    scaled: { label: '|rⱼ| / aⱼ', tex: tex`u_j=|r_j|/a_j,\quad (a_1,a_2)=(${scale})` },
    asinh: { label: '|Fⱼ(rⱼ)|', tex: tex`u_j=|F_j(r_j)|,\quad F_j(r)=\operatorname{asinh}(r/a_j)`, detail: tex`(a_1,a_2)=(${scale})` },
  },
  transform: {
    identity: { label: 'Identity', tex: tex`\mathbf z=\mathbf u` },
    linear: { label: 'Linear', tex: tex`\mathbf z=(u_1+\tfrac12 u_2,\ u_2)` },
    monotonic: { label: 'Monotonic', tex: tex`z_j=u_j+\tfrac14 u_j^2` },
    shear: { label: 'Invertible nonlinear', tex: tex`\mathbf z=(u_1,\ u_2+\tfrac14 u_1^2)` },
  },
  aggregate: {
    max: { label: 'Max', tex: tex`s(\mathbf r)=\max_j |z_j|` },
    l2: { label: 'L₂', tex: tex`s(\mathbf r)=\|\mathbf z\|_2` },
    density: {
      label: 'Direct density',
      tex: tex`s(\mathbf r)=-\log p(\mathbf z),\quad p=\tfrac12(\phi_1+\phi_2)`,
      detail: tex`\phi_i=\mathcal N\bigl(\mathbf 0,\operatorname{diag}(\boldsymbol{\sigma}_i^2)\bigr)`,
      parameters: tex`\boldsymbol{\sigma}_1=(${densityScales[0]}),\quad \boldsymbol{\sigma}_2=(${densityScales[1]})`,
    },
  },
} as const;

export type Knobs = { [K in keyof typeof options]: keyof typeof options[K] };
export const defaults = { marginal: 'raw', transform: 'identity', aggregate: 'l2' } as const satisfies Knobs;
export const defaultTarget = 90;
export const presets = [
  { name: 'A · Square', knobs: { ...defaults, aggregate: 'max' } },
  { name: 'B · Circle', knobs: defaults },
  { name: 'C · Ellipse', knobs: { ...defaults, marginal: 'scaled' } },
] as const satisfies ReadonlyArray<{name: string; knobs: Knobs}>;

function drawResiduals(count: number, seed: number): Point[] {
  function uniform() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 0.5) / 2 ** 32;
  }
  return Array.from({ length: count }, () => {
    const radius = Math.sqrt(-2 * Math.log(uniform()));
    const angle = 2 * Math.PI * uniform();
    const a = radius * Math.cos(angle);
    const b = radius * Math.sin(angle);
    // Two centered Gaussians share the same correlation, with occasional larger errors.
    const multiplier = uniform() < 0.12 ? 1.55 : 1;
    const rho = 0.65;
    return [multiplier * 1.7 * a, multiplier * 0.85 * (rho * a + Math.sqrt(1 - rho ** 2) * b)];
  });
}

export const calibration = drawResiduals(350, 46093);
export const test = drawResiduals(160, 85423);

export function scoreFor({ marginal, transform, aggregate }: Knobs) {
  return ([r1, r2]: Point) => {
    let u = Math.abs(r1);
    let v = Math.abs(r2);
    if (marginal !== 'raw') {
      u /= scale[0];
      v /= scale[1];
    }
    if (marginal === 'asinh') {
      u = Math.asinh(u);
      v = Math.asinh(v);
    }

    switch (transform) {
      case 'linear': u += v / 2; break;
      case 'monotonic': u += u ** 2 / 4; v += v ** 2 / 4; break;
      case 'shear': v += u ** 2 / 4; break;
    }

    if (aggregate === 'max') return Math.max(Math.abs(u), Math.abs(v));
    if (aggregate === 'l2') return Math.hypot(u, v);
    const [a, b] = densityScales.map(([sx, sy]) =>
      -Math.log(4 * Math.PI * sx * sy) - ((u / sx) ** 2 + (v / sy) ** 2) / 2
    );
    // Stable log-sum-exp, including the mixture weights above.
    return -Math.max(a, b) - Math.log1p(Math.exp(-Math.abs(a - b)));
  };
}

export function conformalThreshold(scores: readonly number[], target: number) {
  const rank = Math.ceil((scores.length + 1) * target / 100);
  if (rank > scores.length) return Infinity;
  return [...scores].sort((a, b) => a - b)[rank - 1];
}

export const extent = 7;
export const plot = { left: 38, top: 13, size: 334, width: 388, height: 390 };
export const plotX = (x: number) => plot.left + plot.size * (x + extent) / (2 * extent);
export const plotY = (y: number) => plot.top + plot.size * (extent - y) / (2 * extent);

const angles = 720;
const step = 2 * Math.PI / angles;
const rays = Array.from({ length: angles }, (_, i) => {
  const x = Math.cos(i * step);
  const y = Math.sin(i * step);
  return { x, y, edge: extent / Math.max(Math.abs(x), Math.abs(y)) };
});

export function evaluate(knobs: Knobs, target: number) {
  const score = scoreFor(knobs);
  const threshold = conformalThreshold(calibration.map(score), target);
  const covered = test.map(point => score(point) <= threshold);
  const count = covered.filter(Boolean).length;
  let clipped = false;
  const visibleRadii: number[] = [];

  // These scores are nondecreasing along rays in the absolute-residual orthant.
  // Every ray therefore has one boundary crossing for a finite threshold.
  const boundary = rays.map(({x, y, edge}): Point => {
    if (score([edge * x, edge * y]) <= threshold) clipped = true;
    if (!Number.isFinite(threshold)) {
      visibleRadii.push(edge);
      return [edge * x, edge * y];
    }

    let low = 0;
    let high = edge;
    while (score([high * x, high * y]) <= threshold) high *= 2;
    for (let i = 0; i < 21; i++) {
      const mid = (low + high) / 2;
      if (score([mid * x, mid * y]) <= threshold) low = mid;
      else high = mid;
    }
    const radius = (low + high) / 2;
    visibleRadii.push(Math.min(radius, edge));
    return [radius * x, radius * y];
  });
  const area = Math.sin(step) / 2 * visibleRadii.reduce((sum, radius, index) =>
    sum + radius * visibleRadii[(index + 1) % angles], 0);
  const path = boundary.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'}${plotX(x).toFixed(2)} ${plotY(y).toFixed(2)}`).join(' ') + ' Z';
  return { threshold, count, covered, clipped, area, path };
}

export function metricValues(target: number, result: ReturnType<typeof evaluate>, areaUnit = 'units²') {
  return {
    target: `${target}%`,
    test: `${(100 * result.count / test.length).toFixed(1)}%`,
    area: `${result.area.toFixed(2)} ${areaUnit}`,
    threshold: Number.isFinite(result.threshold) ? Number(result.threshold.toPrecision(5)).toString() : '∞',
  };
}
