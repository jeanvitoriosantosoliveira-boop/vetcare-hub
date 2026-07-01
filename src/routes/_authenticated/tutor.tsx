import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TutorShell } from "@/components/jvet/TutorShell";

export const Route = createFileRoute("/_authenticated/tutor")({
  component: () => (
    <TutorShell>
      <Outlet />
    </TutorShell>
  ),
});