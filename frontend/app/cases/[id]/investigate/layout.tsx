import { notFound } from "next/navigation";
import { InvestigationShell } from "@/components/investigation/InvestigationShell";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function InvestigateLayout({
  children,
  params,
}: LayoutProps<"/cases/[id]/investigate">) {
  const { id } = await params;
  const result = await loadInvestigation(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <main className="desk-blotter min-h-dvh px-6">
        <DeskNotice title="The bureau is silent" detail={result.message} />
      </main>
    );
  }

  return <InvestigationShell caseFile={result.data}>{children}</InvestigationShell>;
}
