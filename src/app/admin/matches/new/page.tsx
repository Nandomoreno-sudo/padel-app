import { MatchForm } from "./match-form";

export default function NewMatchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo partido</h1>
      <MatchForm />
    </div>
  );
}
