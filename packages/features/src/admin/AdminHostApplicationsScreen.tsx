import { useMemo, useState } from 'react';
import { View } from 'react-native';
// NOTE: useAdminHostApplications / useAdminReviewHostApplication are built by the
// host-application agent and re-exported from @bnb/api. Until the index.ts export
// lands these two names will not resolve under typecheck — that is expected and
// noted in the handoff; everything else in this file is self-contained.
import { useAdminHostApplications, useAdminReviewHostApplication } from '@bnb/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Pressable,
  ReasonCodeModal,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { AdminShell } from './shell';

// ---------------------------------------------------------------------------
// Local view-model. The canonical type lives with the host-applications agent;
// we read fields defensively so a slightly different shape still renders.
// ---------------------------------------------------------------------------

type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

type HostApplicationRow = {
  id: string;
  status: ApplicationStatus;
  applicant_name?: string;
  applicant_email?: string;
  applicant_avatar?: string | null;
  property_type?: string;
  property_title?: string;
  city?: string;
  country?: string;
  listings_intended?: number;
  about?: string;
  experience?: string;
  submitted_at?: string;
  [key: string]: unknown;
};

type ReviewDecision = 'approved' | 'rejected' | 'changes_requested';

const FILTERS: Array<{ key: 'all' | ApplicationStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'changes_requested', label: 'Changes requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const REJECT_REASONS = [
  { code: 'incomplete', label: 'Incomplete application' },
  { code: 'identity', label: 'Identity unverified' },
  { code: 'property_ineligible', label: 'Property ineligible' },
  { code: 'policy', label: 'Policy / T&S concern' },
  { code: 'duplicate', label: 'Duplicate applicant' },
  { code: 'other', label: 'Other' },
];

const CHANGES_REASONS = [
  { code: 'photos', label: 'Better photos needed' },
  { code: 'docs', label: 'Missing documents' },
  { code: 'pricing', label: 'Pricing / details unclear' },
  { code: 'description', label: 'Description too thin' },
  { code: 'other', label: 'Other' },
];

const APPROVE_REASONS = [
  { code: 'meets_bar', label: 'Meets onboarding bar' },
  { code: 'verified', label: 'Identity + property verified' },
  { code: 'returning_host', label: 'Returning / known host' },
  { code: 'other', label: 'Other' },
];

function statusVariant(s: ApplicationStatus): 'brand' | 'dark' | 'neutral' {
  if (s === 'pending') return 'brand';
  if (s === 'changes_requested') return 'dark';
  return 'neutral';
}

function statusLabel(s: ApplicationStatus): string {
  return s.replace(/_/g, ' ');
}

function applicantName(a: HostApplicationRow): string {
  return a.applicant_name || a.applicant_email || `Applicant ${a.id}`;
}

function propertyIntent(a: HostApplicationRow): string {
  const place = a.property_title || a.property_type || 'Property';
  const loc = [a.city, a.country].filter(Boolean).join(', ');
  return loc ? `${place} · ${loc}` : place;
}

export function AdminHostApplicationsScreen() {
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('pending');
  const query = useAdminHostApplications(filter === 'all' ? undefined : filter);
  const data = query.data as HostApplicationRow[] | undefined;
  const isLoading = query.isLoading;
  const isError = query.isError;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => data?.find((a) => a.id === selectedId) ?? null,
    [data, selectedId],
  );

  // Filter counts come from the active list only; for the tab bar we keep it
  // simple — show the count of the *current* result when a status is selected.
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.key] = 0;
    if (filter === 'all' && data) {
      c.all = data.length;
      for (const a of data) c[a.status] = (c[a.status] ?? 0) + 1;
    } else if (data) {
      c[filter] = data.length;
    }
    return c;
  }, [data, filter]);

  return (
    <AdminShell
      title="Host applications"
      subtitle="People who applied to host on Ryo. Review identity, property intent, and the pitch — then approve, reject, or ask for changes. Every decision is reason-coded and audit-logged."
    >
      <View className="mt-6 flex-row gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key];
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                setFilter(f.key);
                setSelectedId(null);
              }}
              className={`rounded-full border px-4 py-2 ${
                active ? 'bg-ink border-ink' : 'bg-surface border-surface-border'
              }`}
            >
              <Text
                variant="small"
                className={active ? 'text-white font-semibold' : 'text-ink'}
              >
                {f.label}
                {data && (filter === 'all' || active) ? ` · ${count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6 flex-col lg:flex-row gap-6">
        <View className="flex-1">
          {isLoading ? (
            <VStack className="gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </VStack>
          ) : isError ? (
            <Card className="p-8 items-center">
              <Text className="font-semibold">Couldn’t load applications.</Text>
              <Text variant="small" className="text-ink-soft mt-1 text-center">
                The host-applications service didn’t respond. Try refreshing.
              </Text>
              <Button
                variant="secondary"
                className="mt-4"
                onPress={() => query.refetch?.()}
              >
                Retry
              </Button>
            </Card>
          ) : !data || data.length === 0 ? (
            <Card className="p-10 items-center">
              <Text className="font-semibold">Queue is clear.</Text>
              <Text variant="small" className="text-ink-soft mt-1 text-center">
                {filter === 'pending'
                  ? 'No applications are waiting on a decision.'
                  : 'Nothing matches this filter.'}
              </Text>
            </Card>
          ) : (
            <VStack className="gap-2">
              {data.map((a) => (
                <Pressable key={a.id} onPress={() => setSelectedId(a.id)}>
                  <Card
                    className={`px-4 py-3 ${selectedId === a.id ? 'border-2 border-ink' : ''}`}
                  >
                    <HStack className="gap-3 items-center">
                      <Avatar
                        src={a.applicant_avatar ?? undefined}
                        name={applicantName(a)}
                        size={40}
                      />
                      <VStack className="flex-1 gap-0.5">
                        <HStack className="gap-2 items-center">
                          <Text className="font-semibold flex-1" numberOfLines={1}>
                            {applicantName(a)}
                          </Text>
                          <Badge variant={statusVariant(a.status)}>
                            {statusLabel(a.status)}
                          </Badge>
                        </HStack>
                        <Text
                          variant="small"
                          className="text-ink-soft"
                          numberOfLines={1}
                        >
                          {propertyIntent(a)}
                        </Text>
                        {a.submitted_at ? (
                          <Text variant="caption" className="mt-0.5">
                            Submitted {a.submitted_at}
                          </Text>
                        ) : null}
                      </VStack>
                    </HStack>
                  </Card>
                </Pressable>
              ))}
            </VStack>
          )}
        </View>

        <View className="lg:w-[420px]">
          <ApplicationDetail
            application={selected}
            onReviewed={() => setSelectedId(null)}
          />
        </View>
      </View>
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------

function ApplicationDetail({
  application,
  onReviewed,
}: {
  application: HostApplicationRow | null;
  onReviewed: () => void;
}) {
  const review = useAdminReviewHostApplication();
  const [mode, setMode] = useState<ReviewDecision | null>(null);

  if (!application) {
    return (
      <Card className="p-6 items-center">
        <Text className="text-ink-soft text-center">
          Select an application to review the full submission and act on it.
        </Text>
      </Card>
    );
  }

  const a = application;
  const decided = a.status === 'approved' || a.status === 'rejected';

  const modalConfig =
    mode === 'approved'
      ? {
          title: `Approve ${applicantName(a)}?`,
          message:
            'Grants host access and notifies the applicant. Their property goes into the moderation queue before going live.',
          reasonCodes: APPROVE_REASONS,
          confirmLabel: 'Approve host',
          destructive: false,
        }
      : mode === 'rejected'
        ? {
            title: `Reject ${applicantName(a)}?`,
            message:
              'Declines the application. The applicant is notified with the reason. This is reversible from their record.',
            reasonCodes: REJECT_REASONS,
            confirmLabel: 'Reject',
            destructive: true,
          }
        : {
            title: 'Request changes?',
            message:
              'Sends the application back to the applicant with your note so they can update and resubmit.',
            reasonCodes: CHANGES_REASONS,
            confirmLabel: 'Request changes',
            destructive: false,
          };

  return (
    <Card className="p-5">
      <ReasonCodeModal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={modalConfig.title}
        message={modalConfig.message}
        reasonCodes={modalConfig.reasonCodes}
        requireNote={mode !== 'approved'}
        confirmLabel={modalConfig.confirmLabel}
        destructive={modalConfig.destructive}
        loading={review.isPending}
        onSubmit={({ reason_code, note }) => {
          const decision = mode as ReviewDecision;
          const composedNote = note
            ? `${reason_code}: ${note}`
            : reason_code;
          review.mutate(
            { id: a.id, decision, note: composedNote },
            {
              onSuccess: () => {
                setMode(null);
                toast.success(
                  decision === 'approved'
                    ? 'Application approved.'
                    : decision === 'rejected'
                      ? 'Application rejected.'
                      : 'Changes requested.',
                );
                onReviewed();
              },
              onError: () => toast.error('Could not submit. Try again.'),
            },
          );
        }}
      />

      <HStack className="gap-3 items-center">
        <Avatar
          src={a.applicant_avatar ?? undefined}
          name={applicantName(a)}
          size={48}
        />
        <VStack className="flex-1 gap-0.5">
          <Text className="font-semibold">{applicantName(a)}</Text>
          {a.applicant_email ? (
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              {a.applicant_email}
            </Text>
          ) : null}
        </VStack>
        <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
      </HStack>

      <Divider className="my-4" />

      <VStack className="gap-3">
        <Field label="Property" value={propertyIntent(a)} />
        {typeof a.property_type === 'string' ? (
          <Field label="Type" value={a.property_type} />
        ) : null}
        {typeof a.listings_intended === 'number' ? (
          <Field label="Listings intended" value={String(a.listings_intended)} />
        ) : null}
        {a.submitted_at ? (
          <Field label="Submitted" value={a.submitted_at} />
        ) : null}
        <Field label="Application id" value={a.id} />
      </VStack>

      {a.about ? (
        <View className="mt-4">
          <Text variant="label">About the host</Text>
          <View className="mt-1 rounded-xl bg-surface-alt px-3 py-3">
            <Text variant="small">{a.about}</Text>
          </View>
        </View>
      ) : null}

      {a.experience ? (
        <View className="mt-3">
          <Text variant="label">Hosting experience</Text>
          <View className="mt-1 rounded-xl bg-surface-alt px-3 py-3">
            <Text variant="small">{a.experience}</Text>
          </View>
        </View>
      ) : null}

      <Divider className="my-4" />

      {decided ? (
        <View className="rounded-xl bg-surface-alt px-3 py-3">
          <Text variant="small" className="text-ink-soft">
            This application has been {statusLabel(a.status)}. Reverse it from the
            applicant’s record if needed.
          </Text>
        </View>
      ) : (
        <VStack className="gap-2">
          <Button variant="primary" onPress={() => setMode('approved')}>
            Approve
          </Button>
          <Button variant="outline" onPress={() => setMode('changes_requested')}>
            Request changes
          </Button>
          <Button variant="danger" onPress={() => setMode('rejected')}>
            Reject
          </Button>
        </VStack>
      )}

      <Text variant="caption" className="mt-3 text-ink-soft">
        Every decision requires a reason code and writes to the audit log.
      </Text>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between gap-3">
      <Text variant="small" className="text-ink-soft">
        {label}
      </Text>
      <Text variant="small" className="font-semibold text-right flex-1" numberOfLines={2}>
        {value}
      </Text>
    </HStack>
  );
}
