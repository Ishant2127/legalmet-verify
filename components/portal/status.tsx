import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_META, CERTIFICATE_STATUS_META } from "@/lib/constants";
import type { ApplicationStatus, CertificateState, InstrumentStatus } from "@/lib/types";

export function CertificateStatus({ state }: { state: CertificateState }) {
  const meta = CERTIFICATE_STATUS_META[state];
  const variant =
    state === "valid"
      ? "success"
      : state === "expiring"
        ? "warning"
        : state === "revoked"
          ? "danger"
          : "default";
  return (
    <Badge variant={variant} dot>
      {meta.label}
    </Badge>
  );
}

export function ApplicationStatus({ status }: { status: ApplicationStatus }) {
  const meta = APPLICATION_STATUS_META[status];
  const variant =
    status === "approved"
      ? "success"
      : status === "rejected"
        ? "danger"
        : status === "inspection"
          ? "info"
          : "warning";
  return (
    <Badge variant={variant} dot>
      {meta.label}
    </Badge>
  );
}

export function InstrumentStatusBadge({ status }: { status: InstrumentStatus }) {
  if (status === "active") {
    return (
      <Badge variant="success" dot>
        Active
      </Badge>
    );
  }
  if (status === "under_review") {
    return (
      <Badge variant="warning" dot>
        Under review
      </Badge>
    );
  }
  return <Badge variant="default" dot>Inactive</Badge>;
}
