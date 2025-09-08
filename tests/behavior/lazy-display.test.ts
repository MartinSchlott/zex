import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: lazy recursive display schemas ===");

// Global enums
export const StatusValues = ['ok', 'warn', 'error', 'info', 'inactive'] as const;
export const StatusSchema = zex
  .enum(StatusValues)
  .describe('Semantic status used by hosts for consistent visuals.');

export const AlertStatusValues = ['info', 'warn', 'error'] as const;
export const AlertStatusSchema = zex
  .enum(AlertStatusValues)
  .describe('Allowed statuses for alert view.');

export const CardEmphasisValues = ['normal', 'wide', 'full'] as const;
export const CardEmphasisSchema = zex
  .enum(CardEmphasisValues)
  .describe('Relative importance/size hint for cards.');

// Leaf / simple elements
export const HeadingSchema = zex.object({
  view: zex.literal('heading'),
  text: zex.string().describe('Heading text'),
  id: zex.string().optional(),
});

export const TextSchema = zex.object({
  view: zex.literal('text'),
  text: zex.string().describe('Plain text line'),
  id: zex.string().optional(),
});

export const MetricSchema = zex.object({
  view: zex.literal('metric'),
  label: zex.string(),
  value: zex.union(zex.string(), zex.number()),
  status: StatusSchema.optional(),
  unit: zex.string().optional(),
  id: zex.string().optional(),
});

export const ProgressSchema = zex.object({
  view: zex.literal('progress'),
  label: zex.string(),
  value: zex.string().optional().describe('Human-readable progress text, e.g. "3.1/4.0 GB"'),
  progress: zex.number().min(0).max(1).optional().describe('0.0 .. 1.0'),
  indeterminate: zex.boolean().optional(),
  id: zex.string().optional(),
});

export const GaugeSchema = zex.object({
  view: zex.literal('gauge'),
  label: zex.string(),
  value: zex.number(),
  min: zex.number().default(0).describe('Optional; defaults to 0'),
  max: zex.number().default(100).describe('Optional; defaults to 100'),
  unit: zex.string().optional(),
  thresholds: zex
    .object({
      warn: zex.number().describe('value >= warn → status "warn"'),
      error: zex.number().describe('value >= error → status "error"'),
    })
    .optional(),
  id: zex.string().optional(),
});

export const AlertSchema = zex.object({
  view: zex.literal('alert'),
  text: zex.string(),
  status: AlertStatusSchema,
  id: zex.string().optional(),
});

export const IndicatorSchema = zex.object({
  view: zex.literal('indicator'),
  label: zex.string().optional(),
  states: zex.array(
    zex.object({
      name: zex.string(),
      status: StatusSchema,
    }),
  ),
  id: zex.string().optional(),
});

export const ActivitySchema = zex.object({
  view: zex.literal('activity'),
  label: zex.string(),
  active: zex.boolean(),
  id: zex.string().optional(),
});

export const SeparatorSchema = zex
  .object({
    view: zex.literal('separator'),
  })
  .describe('Semantic visual divider');

// Forward declared symbol type
export type DisplayElement = zex.infer<typeof ElementUnionSchema>;

// Lazy handle
const DisplayElementLazy: any = zex.lazy(() => ElementUnionSchema);

// Layout elements
export const ColumnsSchema = zex.object({
  view: zex.literal('columns'),
  items: zex
    .array(DisplayElementLazy)
    .describe('Typically 2–4 simple elements (metric/gauge/etc.)'),
  id: zex.string().optional(),
});

export const ListSchema = zex.object({
  view: zex.literal('list'),
  items: zex.array(DisplayElementLazy),
  id: zex.string().optional(),
});

export const CardSchema = zex.object({
  view: zex.literal('card'),
  title: zex.string().optional(),
  emphasis: CardEmphasisSchema,
  items: zex.array(DisplayElementLazy),
  id: zex.string().optional(),
});

export const DashboardSchema = zex.object({
  view: zex.literal('dashboard'),
  items: zex.array(CardSchema).describe('Direct children MUST be cards'),
  id: zex.string().optional(),
});

// Discriminated Union of ALL elements (by "view")
export const ElementUnionSchema = zex
  .discriminatedUnion(
    'view',
    HeadingSchema,
    TextSchema,
    MetricSchema,
    ProgressSchema,
    GaugeSchema,
    AlertSchema,
    IndicatorSchema,
    ActivitySchema,
    ColumnsSchema,
    ListSchema,
    CardSchema,
    DashboardSchema,
    SeparatorSchema,
  )
  .describe('Any  display element');

// Top-level payload
export const DisplayPayloadSchema = zex.union(
  zex
    .array(ElementUnionSchema)
    .describe('Standard call: .display({ ...items... })'),
  DashboardSchema.describe(
    'Alternate single-element form: .display({ view="dashboard", ... })',
  ),
);

// Try parsing the provided sample (array with one dashboard)
const sample = [
  {
    view: 'dashboard',
    items: [
      {
        view: 'card',
        title: 'Node Overview',
        emphasis: 'wide',
        items: [
          { view: 'heading', text: 'Cluster Node EU-01' },
          { view: 'text', text: 'Uptime: 48 hours' },
          { view: 'separator' },
          {
            view: 'indicator',
            label: 'Components',
            states: [
              { name: 'Network', status: 'ok' },
              { name: 'Storage', status: 'warn' },
              { name: 'Compute', status: 'error' },
            ],
          },
        ],
      },
      {
        view: 'card',
        title: 'Resource Metrics',
        emphasis: 'normal',
        items: [
          {
            view: 'columns',
            items: [
              {
                view: 'gauge',
                label: 'CPU Usage',
                value: 72,
                unit: '%',
                thresholds: { warn: 70, error: 85 },
              },
              {
                view: 'gauge',
                label: 'RAM Usage',
                value: 5.6,
                min: 0,
                max: 16,
                unit: 'GB',
                thresholds: { warn: 12, error: 14 },
              },
            ],
          },
          {
            view: 'progress',
            label: 'Backup Progress',
            value: '75/100 files',
            progress: 0.75,
          },
        ],
      },
      {
        view: 'card',
        title: 'Alerts',
        emphasis: 'full',
        items: [
          {
            view: 'alert',
            text: 'High latency detected on Storage subsystem.',
            status: 'warn',
          },
          {
            view: 'activity',
            label: 'Rebalancing shards...',
            active: true,
          },
        ],
      },
    ],
  },
];

try {
  const parsed = DisplayPayloadSchema.parse(sample);
  console.log('✅ lazy recursive display parse succeeded');
  console.log('Root view:', Array.isArray(parsed) ? 'array' : (parsed as any).view);
} catch (e) {
  console.error('❌ lazy recursive display parse failed', e);
}
