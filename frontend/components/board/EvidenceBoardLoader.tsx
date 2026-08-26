"use client";

import dynamic from "next/dynamic";
import type { Case } from "@/types/investigation";
import { BoardSkeleton } from "@/components/shared/DeskSkeleton";

const EvidenceBoard = dynamic(
  () => import("@/components/board/EvidenceBoard").then((mod) => mod.EvidenceBoard),
  {
    ssr: false,
    loading: () => <BoardSkeleton />,
  }
);

export function EvidenceBoardLoader({ caseFile }: { caseFile: Case }) {
  return <EvidenceBoard caseFile={caseFile} />;
}
