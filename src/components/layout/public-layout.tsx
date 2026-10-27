import type { ReactNode } from "react";
import { BalloonDecor } from "@/components/brand/balloon";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";

/** Estructura común del sitio público: navbar flotante + contenido + footer. */
export function PublicLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col bg-background">
			<PublicNavbar />
			<main className="flex-1 pt-24 sm:pt-28">{children}</main>
			<BalloonDecor />
			<PublicFooter />
		</div>
	);
}
