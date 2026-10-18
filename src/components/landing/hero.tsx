import { useNavigate } from "@tanstack/react-router";
import { Building2, MapPin, Search, Wallet } from "lucide-react";
import { useState } from "react";
import { FlipWords } from "@/components/aceternity/flip-words";
import { Spotlight } from "@/components/aceternity/spotlight";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { BalloonMotif } from "@/components/brand/balloon";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CatalogSearch } from "@/lib/catalog";
import { TIPOS_INMUEBLE, ZONAS } from "@/lib/catalog";

interface RangoPrecio {
	id: string;
	label: string;
	min?: number;
	max?: number;
}

const RANGOS: RangoPrecio[] = [
	{ id: "todos", label: "Cualquier precio" },
	{ id: "bajo", label: "Hasta Bs 1.500", max: 1500 },
	{ id: "medio", label: "Bs 1.500 – 2.500", min: 1500, max: 2500 },
	{ id: "alto", label: "Bs 2.500 – 4.000", min: 2500, max: 4000 },
	{ id: "premium", label: "Más de Bs 4.000", min: 4000 },
];

export function Hero() {
	const navigate = useNavigate();
	const [tipo, setTipo] = useState<string>("todos");
	const [zona, setZona] = useState<string>("todas");
	const [rango, setRango] = useState<string>("todos");

	function buscar(evento: React.FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const rangoSel = RANGOS.find((r) => r.id === rango);
		const search: CatalogSearch = {
			tipo: tipo === "todos" ? undefined : tipo,
			zona: zona === "todas" ? undefined : zona,
			precioMin: rangoSel?.min,
			precioMax: rangoSel?.max,
		};
		void navigate({ to: "/propiedades", search });
	}

	return (
		<section className="relative overflow-hidden">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
			>
				<Spotlight className="-top-40 -left-20" intensity={0.14} />
				<div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-blue-soft via-background to-background" />
			</div>
			<BalloonMotif
				className="absolute -top-6 -right-10 -z-10 hidden w-72 lg:block xl:w-96"
				opacity={0.07}
			/>

			<div className="container-page grid items-center gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
				<div className="max-w-2xl">
					<h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
						Encuentra tu próximo{" "}
						<FlipWords
							words={["hogar", "departamento", "local", "terreno"]}
							className="text-primary"
						/>{" "}
						en Potosí
					</h1>

					<p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
						<TextGenerateEffect
							words="Publicamos inmuebles verificados en las mejores zonas de la ciudad. Agenda tu visita, firma tu contrato y gestiona tus cuotas mensuales en un solo lugar."
							stagger={0.02}
						/>
					</p>

					<form
						onSubmit={buscar}
						aria-label="Buscar propiedades"
						className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lift)] sm:p-5"
					>
						<div className="grid gap-3 md:grid-cols-3">
							<div className="grid gap-1.5">
								<Label
									htmlFor="hero-tipo"
									className="text-xs text-muted-foreground"
								>
									<Building2
										className="size-3.5 text-primary"
										aria-hidden="true"
									/>
									Tipo de inmueble
								</Label>
								<Select value={tipo} onValueChange={setTipo}>
									<SelectTrigger id="hero-tipo" className="w-full">
										<SelectValue placeholder="Todos" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todos">Todos los tipos</SelectItem>
										{TIPOS_INMUEBLE.map((t) => (
											<SelectItem key={t} value={t}>
												{t}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-1.5">
								<Label
									htmlFor="hero-zona"
									className="text-xs text-muted-foreground"
								>
									<MapPin
										className="size-3.5 text-primary"
										aria-hidden="true"
									/>
									Zona
								</Label>
								<Select value={zona} onValueChange={setZona}>
									<SelectTrigger id="hero-zona" className="w-full">
										<SelectValue placeholder="Todas" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todas">Todas las zonas</SelectItem>
										{ZONAS.map((z) => (
											<SelectItem key={z} value={z}>
												{z}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-1.5">
								<Label
									htmlFor="hero-rango"
									className="text-xs text-muted-foreground"
								>
									<Wallet
										className="size-3.5 text-primary"
										aria-hidden="true"
									/>
									Precio mensual
								</Label>
								<Select value={rango} onValueChange={setRango}>
									<SelectTrigger id="hero-rango" className="w-full">
										<SelectValue placeholder="Cualquier precio" />
									</SelectTrigger>
									<SelectContent>
										{RANGOS.map((r) => (
											<SelectItem key={r.id} value={r.id}>
												{r.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<Button
							type="submit"
							variant="cta"
							size="lg"
							className="mt-4 w-full md:w-auto md:px-8"
						>
							<Search aria-hidden="true" />
							Buscar propiedades
						</Button>
					</form>

					<dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
						<div>
							<dt className="text-xs text-muted-foreground">
								Inmuebles activos
							</dt>
							<dd className="font-display text-2xl font-extrabold tabular text-foreground">
								340+
							</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">
								Alquileres gestionados
							</dt>
							<dd className="font-display text-2xl font-extrabold tabular text-foreground">
								1.280+
							</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Satisfacción</dt>
							<dd className="font-display text-2xl font-extrabold tabular text-foreground">
								4,8/5
							</dd>
						</div>
					</dl>
				</div>

				<div className="relative">
					<SmartImage
						src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=70"
						alt="Casa en alquiler en Potosí con vista al Cerro Rico"
						aspectRatio="4 / 5"
						eager
						className="rounded-2xl border border-border shadow-[var(--shadow-lift)]"
						sizes="(max-width: 1024px) 100vw, 40vw"
					/>
					<div className="absolute -bottom-5 left-4 right-4 rounded-xl border border-border bg-card/95 p-4 backdrop-blur-sm sm:left-6 sm:right-auto sm:w-64">
						<p className="text-xs font-semibold tracking-wide text-primary uppercase">
							Zona Universitaria
						</p>
						<p className="mt-1 font-display text-lg font-bold text-foreground">
							Dúplex amoblado
						</p>
						<p className="text-sm text-muted-foreground">
							Bs 2.750 / mes · 3 hab · 2 baños
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
