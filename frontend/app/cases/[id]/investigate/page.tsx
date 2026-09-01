import { notFound } from "next/navigation";
import { OverviewDesk } from "@/components/investigation/OverviewDesk";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function OverviewPage({
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
  return <OverviewDesk caseFile={result.data} />;
}
