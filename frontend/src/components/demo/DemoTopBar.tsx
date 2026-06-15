'use client';

import { useUserStore } from '@/stores/userStore';
import DemoRoleToggle from './DemoRoleToggle';

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Slim top strip carrying the Brand⇄Creator switch where judges can't miss it.
// Demo build only, and only once signed in. Sits above page content.
export default function DemoTopBar() {
  const user = useUserStore((s) => s.user);
  if (!DEMO || !user) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 h-12 px-4"
      style={{ background: 'rgba(168,85,247,0.06)', borderBottom: '1px solid #1a1a1a' }}
    >
      <DemoRoleToggle />
    </div>
  );
}
