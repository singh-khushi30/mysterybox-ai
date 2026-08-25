import { notFound } from "next/navigation";
import { SolveDesk } from "@/components/investigation/SolveDesk";
import { getInvestigation } from "@/lib/investigation";

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseFile = getInvestigation(id);
  if (!caseFile) notFound();
  return <SolveDesk caseFile={caseFile} />;
}
