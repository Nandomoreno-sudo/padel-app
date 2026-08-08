import { requireAdmin } from "@/lib/supabase/dal";
import { getBaseUrl } from "@/lib/site-url";
import { CopyButton } from "@/components/copy-button";
import { CreateInvitationButton } from "./create-invitation-button";

export default async function AdminInvitationsPage() {
  const { supabase } = await requireAdmin();
  const baseUrl = await getBaseUrl();

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, code, is_used, created_at, used_by")
    .order("created_at", { ascending: false });

  const usedByIds = (invitations ?? [])
    .map((invitation) => invitation.used_by)
    .filter((id): id is string => Boolean(id));

  const namesById = new Map<string, string>();
  if (usedByIds.length > 0) {
    const { data: usedProfiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", usedByIds);
    for (const profile of usedProfiles ?? []) {
      namesById.set(profile.id, profile.name ?? "Sin nombre");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Invitaciones</h1>
        <p className="text-sm text-muted-foreground">
          Genera un código de invitación y comparte el enlace de registro por
          WhatsApp. Cada código solo se puede usar una vez.
        </p>
        <CreateInvitationButton />
      </div>

      <div className="space-y-3">
        {(invitations ?? []).map((invitation) => (
          <div
            key={invitation.id}
            className="space-y-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-base font-semibold tracking-wide">
                {invitation.code}
              </span>
              {invitation.is_used ? (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  Usada
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Disponible
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Creada el{" "}
                {new Date(invitation.created_at).toLocaleDateString("es-ES")}
              </span>
              {invitation.used_by && (
                <span>Usada por {namesById.get(invitation.used_by) ?? "—"}</span>
              )}
            </div>
            {!invitation.is_used && (
              <CopyButton
                label="Copiar enlace de registro"
                copiedLabel="¡Enlace copiado!"
                text={`${baseUrl}/register?code=${invitation.code}`}
                className="w-full"
              />
            )}
          </div>
        ))}

        {(invitations ?? []).length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            Todavía no se ha generado ninguna invitación.
          </p>
        )}
      </div>
    </div>
  );
}
