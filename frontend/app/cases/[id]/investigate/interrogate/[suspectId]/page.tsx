import { notFound } from "next/navigation";
import { InterrogationDesk } from "@/components/interrogation/InterrogationDesk";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadSuspectForCase } from "@/lib/investigation/load";

export default async function InterrogatePage({
  params,
}: {
  params: Promise<{ id: string; suspectId: string }>;
}) {
  const { id, suspectId } = await params;
  const result = await loadSuspectForCase(id, suspectId);
  if (result.status === "not_found") notFound();
  if (result.status === "error") {
    return <DeskNotice title="The bureau is silent" detail={result.message} />;
  }
  return <InterrogationDesk caseFile={result.data.caseFile} suspect={result.data.suspect} />;
}
