// Lightweight, dependency-free forecasting for the admin analytics trends.
//
// We fit an ordinary-least-squares (OLS) linear trend to the historical series
// and project it forward, with an 80% prediction band derived from the residual
// standard error (widening with the horizon). It's deliberately simple and
// explainable — the console labels it "linear trend", not a black box.

export type ForecastResult = {
  /** Fitted (trend) value for each historical point — for drawing the trend line. */
  fit: number[];
  /** Projected values for the next `horizon` periods. */
  forecast: number[];
  /** 80% lower / upper prediction band for each forecast point. */
  lower: number[];
  upper: number[];
  /** Change per period (positive = growing). */
  slope: number;
};

const Z_80 = 1.2816; // z-score for an 80% two-sided interval

function flat(n: number, v: number): number[] {
  return Array.from({ length: n }, () => v);
}

/**
 * Fit a linear trend to `values` (indexed 0..n-1) and forecast `horizon` steps.
 * Values are treated as non-negative (revenue / counts) — the band is clamped at 0.
 */
export function linearForecast(values: number[], horizon: number): ForecastResult {
  const n = values.length;
  if (horizon < 0) horizon = 0;
  if (n === 0) {
    return { fit: [], forecast: flat(horizon, 0), lower: flat(horizon, 0), upper: flat(horizon, 0), slope: 0 };
  }
  if (n === 1) {
    const v = values[0] as number;
    return { fit: [v], forecast: flat(horizon, v), lower: flat(horizon, v), upper: flat(horizon, v), slope: 0 };
  }

  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    sxx += dx * dx;
    sxy += dx * ((values[i] as number) - meanY);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = meanY - slope * meanX;

  const fit = values.map((_, i) => intercept + slope * i);

  // Residual standard error (unbiased: n-2 for a two-parameter fit).
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const r = (values[i] as number) - (fit[i] as number);
    ss += r * r;
  }
  const resStd = Math.sqrt(ss / Math.max(1, n - 2));

  const clamp0 = (v: number) => (v < 0 ? 0 : v);
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const x = n - 1 + h;
    const yhat = intercept + slope * x;
    // Band widens the further out we project.
    const se = resStd * Math.sqrt(1 + h / n);
    forecast.push(clamp0(yhat));
    lower.push(clamp0(yhat - Z_80 * se));
    upper.push(clamp0(yhat + Z_80 * se));
  }

  return { fit, forecast, lower, upper, slope };
}

/** Percent change between two totals, or null when the base is 0 (undefined). */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
