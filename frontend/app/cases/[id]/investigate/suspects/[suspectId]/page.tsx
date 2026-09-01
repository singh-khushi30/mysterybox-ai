import Link from "next/link";
import { notFound } from "next/navigation";
import { SuspectProfile } from "@/components/suspects/SuspectProfile";
import { DeskNotice } from "@/components/shared/DeskNotice";
import { loadSuspectForCase } from "@/lib/investigation/load";

export default async function SuspectDetailPage({
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

  return (
    <div>
      <Link
        href={`/cases/${id}/investigate/suspects`}
        className="mb-6 inline-block font-mono text-[0.62rem] tracking-[0.24em] text-brass/80 uppercase hover:text-brass"
      >
        All suspects
      </Link>
      <SuspectProfile caseFile={result.data.caseFile} suspect={result.data.suspect} />
    </div>
  );
}
