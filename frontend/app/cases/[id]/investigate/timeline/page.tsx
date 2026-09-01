import { notFound } from "next/navigation";
import { TimelineView } from "@/components/timeline/TimelineView";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadInvestigation(id);
  if (result.status === "not_found") notFound();
  if (result.status === "error") {
    return <DeskNotice title="The bureau is silent" detail={result.message} />;
  }

  return (
    <div>
      <p className="mb-6 max-w-xl text-beige/60">
        The night compresses to a handful of marks. Filter by the person who claims the hour.
      </p>
      <TimelineView caseFile={result.data} />
    </div>
  );
}
