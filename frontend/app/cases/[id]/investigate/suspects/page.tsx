import { notFound } from "next/navigation";
import { SuspectGrid } from "@/components/suspects/SuspectGrid";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { spokenCount } from "@/lib/investigation";
import { loadInvestigation } from "@/lib/investigation/load";

export default async function SuspectsPage({
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

  const count = result.data.suspects.length;

  return (
    <div>
      <p className="mb-6 font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
        {count === 0 ? "No names remain in the house" : `${spokenCount(count)} remain in the house`}
      </p>
      <SuspectGrid caseFile={result.data} />
    </div>
  );
}
