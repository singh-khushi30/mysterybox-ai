import { notFound } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { InvestigationShell } from "@/components/investigation/InvestigationShell";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadInvestigation } from "@/lib/investigation/load";
import { getServerUser } from "@/lib/supabase/server";

export default async function InvestigateLayout({
  children,
  params,
}: LayoutProps<"/cases/[id]/investigate">) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) {
    return <AuthGate>{null}</AuthGate>;
  }

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
