import { notFound } from "next/navigation";
import { CaseDossier } from "@/components/case/CaseDossier";
import { getCaseById } from "@/lib/cases";

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseFile = getCaseById(id);

  if (!caseFile) {
    notFound();
  }

  return <CaseDossier caseFile={caseFile} />;
}
