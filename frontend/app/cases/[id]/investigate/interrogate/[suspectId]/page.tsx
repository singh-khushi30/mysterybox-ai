import { notFound } from "next/navigation";
import { InterrogationDesk } from "@/components/interrogation/InterrogationDesk";
import { getInvestigation, getSuspect } from "@/lib/investigation";

export default async function InterrogatePage({
  params,
}: {
  params: Promise<{ id: string; suspectId: string }>;
}) {
  const { id, suspectId } = await params;
  const caseFile = getInvestigation(id);
  const suspect = getSuspect(id, suspectId);
  if (!caseFile || !suspect) notFound();
  return <InterrogationDesk caseFile={caseFile} suspect={suspect} />;
}
