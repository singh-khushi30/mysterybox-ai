import { notFound } from "next/navigation";
import { EvidenceBoardLoader } from "@/components/board/EvidenceBoardLoader";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function BoardPage({
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
  return <EvidenceBoardLoader caseFile={result.data} />;
}
