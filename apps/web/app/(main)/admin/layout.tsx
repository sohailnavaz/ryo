'use client';
import { StaffGate } from '@bnb/features';

// Gates the entire /admin/* operations console behind the staff/admin role
// (migration 0003). Replaces the open v2-preview access — non-staff users are
// bounced to the home page.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StaffGate>{children}</StaffGate>;
}
