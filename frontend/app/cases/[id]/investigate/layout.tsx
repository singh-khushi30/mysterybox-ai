import { notFound } from "next/navigation";
import { InvestigationShell } from "@/components/investigation/InvestigationShell";
import { getInvestigation } from "@/lib/investigation";

export default async function InvestigateLayout({
  children,
  params,
}: LayoutProps<"/cases/[id]/investigate">) {
  const { id } = await params;
  const caseFile = getInvestigation(id);

  if (!caseFile) {
    notFound();
  }

  return <InvestigationShell caseFile={caseFile}>{children}</InvestigationShell>;
}
