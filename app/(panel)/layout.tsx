import { Suspense } from "react";
import { PanelCargando, PanelShell } from "@/components/panel-shell";

// Con cacheComponents, usePathname/useParams/useSearchParams necesitan un Suspense por encima.
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<PanelCargando />}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}
