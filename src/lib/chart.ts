const X0 = 40;
const X1 = 760;
const Y_TOP = 10;
const Y_BOTTOM = 250;

export function xFor(index: number, count: number) {
  const step = (X1 - X0) / (count - 1);
  return X0 + step * index;
}

export function yFor(pct: number) {
  return Y_TOP + (1 - pct / 100) * (Y_BOTTOM - Y_TOP);
}

export function linePoints(values: number[]) {
  return values.map((v, i) => `${xFor(i, values.length)},${yFor(v)}`).join(" ");
}

export function areaPoints(top: number[], bottom: number[]) {
  const fwd = top.map((v, i) => `${xFor(i, top.length)},${yFor(v)}`);
  const rev = bottom
    .map((v, i) => `${xFor(i, bottom.length)},${yFor(v)}`)
    .reverse();
  return [...fwd, ...rev].join(" ");
}

export const chartBounds = { X0, X1, Y_TOP, Y_BOTTOM };
