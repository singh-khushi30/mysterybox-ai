import { notFound } from "next/navigation";
import { ResultReveal } from "@/components/investigation/ResultReveal";
import { getInvestigation } from "@/lib/investigation";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseFile = getInvestigation(id);
  if (!caseFile) notFound();
  return <ResultReveal caseFile={caseFile} />;
}
