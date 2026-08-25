import { DetectiveNotes } from "@/components/notes/DetectiveNotes";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetectiveNotes caseId={id} />;
}
