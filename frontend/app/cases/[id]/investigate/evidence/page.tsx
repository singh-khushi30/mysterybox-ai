import { notFound } from "next/navigation";
import { EvidenceGrid } from "@/components/evidence/EvidenceGrid";
import { getInvestigation } from "@/lib/investigation";

export default async function EvidencePage({
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
        Thirteen files are associated with this night. Some are still under seal.
      </p>
      <EvidenceGrid caseFile={caseFile} />
    </div>
  );
}
