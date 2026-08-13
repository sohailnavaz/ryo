import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useAdminAnalytics, type AdminAnalytics, type AnalyticsGrain } from '@bnb/api';
import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@bnb/ui';
import { formatPrice, linearForecast } from '@bnb/utils';
import { SectionHeader } from '../shared/dashboard-chrome';
import { AdminShell } from './shell';

const RANGES: Array<{ days: number; label: string }> = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '12 months' },
];

// How far to project, per grain.
const HORIZON: Record<AnalyticsGrain, number> = { day: 14, week: 8, month: 6 };
const HORIZON_LABEL: Record<AnalyticsGrain, (n: number) => string> = {
  day: (n) => `${n} days`,
  week: (n) => `${n} weeks`,
  month: (n) => `${n} months`,
};

export function AdminAnalyticsScreen() {
  const [rangeDays, setRangeDays] = useState(90);
  const { data, isLoading } = useAdminAnalytics(rangeDays);

  return (
    <AdminShell
      title="Analytics & forecasting"
      subtitle="Revenue and demand trends with a projected outlook. Numbers are modelled from the booking stream — the ledger-based P&L lives on Finance."
    >
      <HStack className="mt-4 gap-2 flex-wrap items-center">
        {RANGES.map((r) => (
          <Button
            key={r.days}
            title={r.label}
            size="sm"
            variant={r.days === rangeDays ? 'primary' : 'outline'}
            onPress={() => setRangeDays(r.days)}
          />
        ))}
        <View className="flex-1" />
        <Badge variant="neutral">Preview · modelled</Badge>
      </HStack>

      {isLoading || !data ? <AnalyticsSkeleton /> : <AnalyticsBody data={data} />}
    </AdminShell>
  );
}

function AnalyticsBody({ data }: { data: AdminAnalytics }) {
  const { kpis, currency, grain, points } = data;
  const horizon = HORIZON[grain];

  // Forecasts run on the historical series.
  const netForecast = useMemo(
    () => linearForecast(points.map((p) => p.net_revenue_cents), horizon),
    [points, horizon],
  );
  const bookingForecast = useMemo(
    () => linearForecast(points.map((p) => p.bookings), horizon),
    [points, horizon],
  );

  const projectedNet = netForecast.forecast.reduce((s, v) => s + v, 0);
  const projectedNetLo = netForecast.lower.reduce((s, v) => s + v, 0);
  const projectedNetHi = netForecast.upper.reduce((s, v) => s + v, 0);
  const projectedBookings = Math.round(bookingForecast.forecast.reduce((s, v) => s + v, 0));

  const futureLabels = projectLabels(points, grain, horizon);

  return (
    <>
      <View className="mt-6 flex-row flex-wrap gap-4">
        <Kpi
          label={`Net revenue · ${rangeText(data.range_days)}`}
          value={formatPrice(kpis.net_revenue_cents, currency)}
          delta={kpis.net_revenue_delta_pct}
        />
        <Kpi
          label={`GMV · ${rangeText(data.range_days)}`}
          value={formatPrice(kpis.gmv_cents, currency)}
          delta={kpis.gmv_delta_pct}
        />
        <Kpi
          label={`Bookings · ${rangeText(data.range_days)}`}
          value={String(kpis.bookings)}
          delta={kpis.bookings_delta_pct}
        />
        <Kpi label="Avg booking value" value={formatPrice(kpis.arpb_cents, currency)} />
        <Kpi label="Take rate" value={`${(kpis.take_rate_bps / 100).toFixed(1)}%`} />
        <Kpi label="New guests" value={String(kpis.new_guests)} hint="booked this window" />
      </View>

      <View className="mt-10 flex-col lg:flex-row gap-6">
        <View className="flex-1">
          <SectionHeader
            title="Net revenue"
            subtitle={`Per ${grain} · solid = actual, faded = projected`}
          />
          <Card className="mt-3 p-5">
            <TrendChart
              actual={points.map((p) => ({ label: p.label, value: p.net_revenue_cents }))}
              forecast={netForecast.forecast.map((v, i) => ({
                label: futureLabels[i] ?? '',
                value: v,
                lower: netForecast.lower[i] ?? v,
                upper: netForecast.upper[i] ?? v,
              }))}
              tone="teal"
              format={(v) => formatPrice(v, currency)}
            />
          </Card>
        </View>
        <View className="flex-1">
          <SectionHeader
            title="Bookings"
            subtitle={`Per ${grain} · solid = actual, faded = projected`}
          />
          <Card className="mt-3 p-5">
            <TrendChart
              actual={points.map((p) => ({ label: p.label, value: p.bookings }))}
              forecast={bookingForecast.forecast.map((v, i) => ({
                label: futureLabels[i] ?? '',
                value: v,
                lower: bookingForecast.lower[i] ?? v,
                upper: bookingForecast.upper[i] ?? v,
              }))}
              tone="brand"
              format={(v) => String(Math.round(v))}
            />
          </Card>
        </View>
      </View>

      <View className="mt-10 flex-col lg:flex-row gap-6">
        <View className="flex-1">
          <SectionHeader title="Outlook" subtitle="Linear trend · 80% prediction band" />
          <Card className="mt-3 p-5 gap-4">
            <ForecastLine
              label={`Projected net revenue · next ${HORIZON_LABEL[grain](horizon)}`}
              value={formatPrice(projectedNet, currency)}
              band={`${formatPrice(projectedNetLo, currency)} – ${formatPrice(projectedNetHi, currency)}`}
              trend={netForecast.slope}
              trendUnit={`${formatPrice(Math.abs(Math.round(netForecast.slope)), currency)}/${grain}`}
            />
            <Divider />
            <ForecastLine
              label={`Projected bookings · next ${HORIZON_LABEL[grain](horizon)}`}
              value={String(projectedBookings)}
              band={`${Math.round(bookingForecast.lower.reduce((s, v) => s + v, 0))} – ${Math.round(
                bookingForecast.upper.reduce((s, v) => s + v, 0),
              )}`}
              trend={bookingForecast.slope}
              trendUnit={`${Math.abs(bookingForecast.slope).toFixed(1)}/${grain}`}
            />
            <Text variant="caption" className="text-ink-soft">
              Forecast fits an ordinary-least-squares trend to the {points.length} periods above
              and projects it forward. The band widens with the horizon. Not investment advice —
              a planning aid.
            </Text>
          </Card>
        </View>

        <View className="flex-1">
          <SectionHeader title="Top markets" subtitle={`By GMV · ${rangeText(data.range_days)}`} />
          <Card className="mt-3 p-0 overflow-hidden">
            {data.top_cities.length === 0 ? (
              <View className="p-6 items-center">
                <Text className="text-ink-soft">No bookings in this window.</Text>
              </View>
            ) : (
              data.top_cities.map((c, i) => {
                const max = data.top_cities[0]?.gmv_cents || 1;
                return (
                  <View
                    key={c.city}
                    className={`px-5 py-3 ${i < data.top_cities.length - 1 ? 'border-b border-surface-border' : ''}`}
                  >
                    <HStack className="justify-between items-center gap-3">
                      <Text className="font-semibold flex-1" numberOfLines={1}>
                        {c.city}
                      </Text>
                      <Text variant="small" className="text-ink-soft">
                        {c.bookings} bookings
                      </Text>
                      <Text className="font-semibold w-28 text-right">
                        {formatPrice(c.gmv_cents, currency)}
                      </Text>
                    </HStack>
                    <View className="mt-2 h-1.5 w-full rounded-full bg-surface-alt overflow-hidden">
                      <View
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${Math.max(4, (c.gmv_cents / max) * 100)}%` }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// Views-only bar chart: actual bars + faded forecast bars with a band block.
// No SVG / charting dep, so it renders identically on web and native.
// ---------------------------------------------------------------------------

type Bar = { label: string; value: number; lower?: number; upper?: number; forecast: boolean };

function TrendChart({
  actual,
  forecast,
  tone,
  format,
}: {
  actual: Array<{ label: string; value: number }>;
  forecast: Array<{ label: string; value: number; lower: number; upper: number }>;
  tone: 'teal' | 'brand';
  format: (v: number) => string;
}) {
  const H = 150;
  const bars: Bar[] = [
    ...actual.map((a) => ({ ...a, forecast: false })),
    ...forecast.map((f) => ({ ...f, forecast: true })),
  ];
  const max = Math.max(1, ...bars.map((b) => (b.forecast ? (b.upper ?? b.value) : b.value)));
  const step = Math.max(1, Math.ceil(bars.length / 8));
  const firstForecast = actual.length; // index where projection starts

  const solid = tone === 'teal' ? 'bg-teal-500' : 'bg-brand-500';
  const faded = tone === 'teal' ? 'bg-teal-300' : 'bg-brand-300';
  const band = tone === 'teal' ? 'bg-teal-100' : 'bg-brand-100';

  const peak = Math.max(...actual.map((a) => a.value), 0);

  return (
    <VStack className="gap-2">
      <HStack className="justify-between items-center">
        <HStack className="gap-3">
          <Legend swatch={solid} label="Actual" />
          <Legend swatch={faded} label="Forecast" />
        </HStack>
        <Text variant="caption" className="text-ink-soft">
          peak {format(peak)}
        </Text>
      </HStack>

      <View className="flex-row items-end gap-[3px]" style={{ height: H }}>
        {bars.map((b, i) => {
          const h = Math.max(2, (b.value / max) * H);
          const showDivider = i === firstForecast && firstForecast > 0;
          return (
            <View
              key={i}
              className="flex-1 items-center justify-end"
              style={{ height: H }}
            >
              {showDivider ? (
                <View
                  className="absolute top-0 bottom-0 border-l border-dashed border-warm-300"
                  style={{ left: -2 }}
                />
              ) : null}
              {b.forecast && b.upper != null && b.lower != null ? (
                <View
                  className={`absolute left-0 right-0 rounded-sm opacity-70 ${band}`}
                  style={{
                    bottom: (b.lower / max) * H,
                    height: Math.max(1, ((b.upper - b.lower) / max) * H),
                  }}
                />
              ) : null}
              <View
                className={`w-full rounded-t-sm ${b.forecast ? faded : solid}`}
                style={{ height: h }}
              />
            </View>
          );
        })}
      </View>

      <View className="flex-row gap-[3px]">
        {bars.map((b, i) => (
          <View key={i} className="flex-1 items-center">
            {i % step === 0 ? (
              <Text variant="caption" className="text-ink-muted" numberOfLines={1}>
                {b.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </VStack>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <HStack className="gap-1.5 items-center">
      <View className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
      <Text variant="caption" className="text-ink-soft">
        {label}
      </Text>
    </HStack>
  );
}

// ---------------------------------------------------------------------------

function Kpi({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
}) {
  return (
    <Card className="flex-1 min-w-[180px] p-5">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Heading level={2} className="mt-2">
        {value}
      </Heading>
      {delta !== undefined ? (
        <View className="mt-1">
          <DeltaBadge delta={delta} />
        </View>
      ) : hint ? (
        <Text variant="small" className="text-ink-soft mt-1">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <Text variant="small" className="text-ink-muted">
        no prior period
      </Text>
    );
  }
  const up = delta >= 0;
  return (
    <Text variant="small" className={up ? 'text-success' : 'text-danger'}>
      {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs prior period
    </Text>
  );
}

function ForecastLine({
  label,
  value,
  band,
  trend,
  trendUnit,
}: {
  label: string;
  value: string;
  band: string;
  trend: number;
  trendUnit: string;
}) {
  const up = trend >= 0;
  return (
    <VStack className="gap-1">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <HStack className="items-end gap-2 flex-wrap">
        <Heading level={2}>{value}</Heading>
        <Text variant="small" className={`mb-1 ${up ? 'text-success' : 'text-danger'}`}>
          {up ? '▲' : '▼'} {trendUnit}
        </Text>
      </HStack>
      <Text variant="caption" className="text-ink-muted">
        80% band: {band}
      </Text>
    </VStack>
  );
}

// ---------------------------------------------------------------------------

function rangeText(days: number): string {
  if (days >= 360) return '12mo';
  return `${days}d`;
}

/** Generate short labels for the future periods that continue the series. */
function projectLabels(
  points: Array<{ period: string }>,
  grain: AnalyticsGrain,
  horizon: number,
): string[] {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const last = points[points.length - 1]?.period;
  if (!last) return Array.from({ length: horizon }, () => '');
  const stepDays = grain === 'day' ? 1 : grain === 'week' ? 7 : 30;
  const out: string[] = [];
  const base = new Date(last + 'T00:00:00Z');
  for (let h = 1; h <= horizon; h++) {
    const d = new Date(base);
    if (grain === 'month') d.setUTCMonth(d.getUTCMonth() + h);
    else d.setUTCDate(d.getUTCDate() + h * stepDays);
    const mon = MONTHS[d.getUTCMonth()] ?? '';
    out.push(grain === 'month' ? `${mon} ${String(d.getUTCFullYear()).slice(2)}` : `${mon} ${d.getUTCDate()}`);
  }
  return out;
}

// ---------------------------------------------------------------------------

function AnalyticsSkeleton() {
  return (
    <>
      <View className="mt-6 flex-row flex-wrap gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 flex-1 min-w-[180px]" />
        ))}
      </View>
      <View className="mt-10 flex-col lg:flex-row gap-6">
        <Skeleton className="h-64 flex-1" />
        <Skeleton className="h-64 flex-1" />
      </View>
    </>
  );
}
