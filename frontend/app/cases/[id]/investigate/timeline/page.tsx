import { notFound } from "next/navigation";
import { TimelineView } from "@/components/timeline/TimelineView";
import { getInvestigation } from "@/lib/investigation";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseFile = getInvestigation(id);
  if (!caseFile) notFound();

  return (
    <div>
      <p className="mb-6 max-w-xl text-beige/60">
        The night compresses to a handful of marks. Filter by the person who claims the hour.
      </p>
      <TimelineView caseFile={caseFile} />
    </div>
  );
}
