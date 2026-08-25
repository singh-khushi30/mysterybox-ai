import Link from "next/link";
import { notFound } from "next/navigation";
import { SuspectProfile } from "@/components/suspects/SuspectProfile";
import { getInvestigation, getSuspect } from "@/lib/investigation";

export default async function SuspectDetailPage({
  params,
}: {
  params: Promise<{ id: string; suspectId: string }>;
}) {
  const { id, suspectId } = await params;
  const caseFile = getInvestigation(id);
  const suspect = getSuspect(id, suspectId);
  if (!caseFile || !suspect) notFound();

  return (
    <div>
      <Link
        href={`/cases/${id}/investigate/suspects`}
        className="mb-6 inline-block font-mono text-[0.62rem] tracking-[0.24em] text-brass/80 uppercase hover:text-brass"
      >
        All suspects
      </Link>
      <SuspectProfile caseFile={caseFile} suspect={suspect} />
    </div>
  );
}
