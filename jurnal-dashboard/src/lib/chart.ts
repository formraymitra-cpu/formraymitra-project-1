const X0 = 40;
const X1 = 760;
const Y_TOP = 10;
const Y_BOTTOM = 250;

export function xFor(index: number, count: number) {
  if (count <= 1) return X0;
  const step = (X1 - X0) / (count - 1);
  return X0 + step * index;
}

export function yFor(value: number, max: number) {
  if (max <= 0) return Y_BOTTOM;
  return Y_TOP + (1 - value / max) * (Y_BOTTOM - Y_TOP);
}

export function linePoints(values: number[], max: number) {
  return values.map((v, i) => `${xFor(i, values.length)},${yFor(v, max)}`).join(" ");
}

export function areaPoints(top: number[], max: number) {
  const fwd = top.map((v, i) => `${xFor(i, top.length)},${yFor(v, max)}`);
  const rev = top.map((_, i) => `${xFor(top.length - 1 - i, top.length)},${Y_BOTTOM}`);
  return [...fwd, ...rev].join(" ");
}

export const chartBounds = { X0, X1, Y_TOP, Y_BOTTOM };
