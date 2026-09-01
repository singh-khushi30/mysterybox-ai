import { notFound } from "next/navigation";
import { ResultReveal } from "@/components/investigation/ResultReveal";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function ResultPage({
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
  return <ResultReveal caseFile={result.data} />;
}
