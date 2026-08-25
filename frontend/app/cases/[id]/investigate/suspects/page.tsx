import { notFound } from "next/navigation";
import { SuspectGrid } from "@/components/suspects/SuspectGrid";
import { getInvestigation } from "@/lib/investigation";

export default async function SuspectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseFile = getInvestigation(id);
  if (!caseFile) notFound();

  return (
    <div>
      <p className="mb-6 font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
        Four remain in the house
      </p>
      <SuspectGrid caseFile={caseFile} />
    </div>
  );
}
