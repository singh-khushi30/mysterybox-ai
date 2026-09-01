import { DeskSkeleton } from "@/components/shared/DeskSkeleton";

export default function CasesLoading() {
  return (
    <main className="desk-blotter min-h-dvh px-6 py-16">
      <DeskSkeleton />
    </main>
  );
}
