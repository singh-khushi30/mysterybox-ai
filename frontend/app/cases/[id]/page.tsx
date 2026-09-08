import { notFound } from "next/navigation";
import { CaseDossier } from "@/components/case/CaseDossier";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadCaseFile } from "@/lib/investigation/load";

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadCaseFile(id);
  if (result.status === "not_found") notFound();
  if (result.status === "error") {
    return (
      <main className="desk-blotter min-h-dvh px-6">
        <DeskNotice title="The bureau is silent" detail={result.message} />
      </main>
    );
  }

  return <CaseDossier caseFile={result.data} />;
}
