import { notFound } from "next/navigation";
import { EvidenceGrid } from "@/components/evidence/EvidenceGrid";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { spokenCount } from "@/lib/investigation";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function EvidencePage({
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

  const count = result.data.evidence.length;

  return (
    <div>
      <p className="mb-6 max-w-xl text-beige/60">
        {count === 0
          ? "No files have been released to the desk."
          : `${spokenCount(count)} ${count === 1 ? "file is" : "files are"} associated with this night.`}
      </p>
      <EvidenceGrid caseFile={result.data} />
    </div>
  );
}
