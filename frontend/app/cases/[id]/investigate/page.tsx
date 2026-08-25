import { notFound } from "next/navigation";
import { OverviewDesk } from "@/components/investigation/OverviewDesk";
import { getInvestigation } from "@/lib/investigation";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseFile = getInvestigation(id);
  if (!caseFile) notFound();
  return <OverviewDesk caseFile={caseFile} />;
}
