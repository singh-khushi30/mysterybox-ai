import { CaseLibrary } from "@/components/case/CaseLibrary";
import { loadPlayableCases } from "@/lib/investigation/load";

export default async function CasesPage() {
  const result = await loadPlayableCases();

  if (result.status !== "ok") {
    return (
      <CaseLibrary
        files={[]}
        notice={
          <p className="mt-6 max-w-xl font-display text-lg text-beige/55 italic">
            {result.status === "error"
              ? `The bureau is silent. ${result.message}`
              : "The drawer is empty. No playable files have been released."}
          </p>
        }
      />
    );
  }

  return <CaseLibrary files={result.data} />;
}
