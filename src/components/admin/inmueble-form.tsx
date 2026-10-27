import { useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
	Building2,
	CalendarDays,
	Check,
	ImagePlus,
	MapPin,
	Plus,
	Sparkles,
	Trash2,
	Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { EntityPicker } from "@/components/pickers/entity-picker";
import { ZonePicker } from "@/components/pickers/zone-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { proveedores as proveedoresIniciales } from "@/data/proveedores";
import type { Inmueble, InmuebleEstado, Proveedor } from "@/data/types";
import { TIPOS_INMUEBLE } from "@/lib/catalog";

const AMENIDADES = [
	"Patio interior",
	"Garaje",
	"Vista al Cerro Rico",
	"Cocina equipada",
	"Lavandería",
	"Calefacción a gas",
	"Ascensor",
	"Balcón",
	"Portero 24h",
	"Internet de fibra",
];

const ESTADOS_INMUEBLE: InmuebleEstado[] = [
	"Disponible",
	"Reservado",
	"En alquiler",
	"Inactivo",
];

interface ImagenPreview {
	id: string;
	nombre: string;
	url: string;
}

interface InmuebleFormProps {
	/** Inmueble a editar. Si se omite, el formulario crea uno nuevo. */
	inmueble?: Inmueble;
	onGuardar: (publicar: boolean, datos: DatosInmueble) => void;
}

export interface DatosInmueble {
	titulo: string;
	tipo: string;
	estado: InmuebleEstado;
	zona: string;
	direccion: string;
	m2: string;
	habitaciones: string;
	banos: string;
	estacionamientos: string;
	piso: string;
	amoblado: boolean;
	descripcion: string;
	proveedorId: string;
	precio: string;
	costoPublicacion: string;
	disponibleDesde: string;
	destacado: boolean;
	amenidades: string[];
}

export function InmuebleForm({ inmueble, onGuardar }: InmuebleFormProps) {
	const navigate = useNavigate();
	const inputArchivos = useRef<HTMLInputElement>(null);
	const editando = Boolean(inmueble);

	const [listaProveedores, setListaProveedores] =
		useState<Proveedor[]>(proveedoresIniciales);

	const [titulo, setTitulo] = useState(inmueble?.titulo ?? "");
	const [tipo, setTipo] = useState<string>(inmueble?.tipo ?? "Departamento");
	const [estado, setEstado] = useState<InmuebleEstado>(
		inmueble?.estado ?? "Disponible",
	);
	const [zona, setZona] = useState(inmueble?.zona ?? "Centro histórico");
	const [direccion, setDireccion] = useState(inmueble?.direccion ?? "");
	const [m2, setM2] = useState(inmueble ? String(inmueble.m2) : "");
	const [habitaciones, setHabitaciones] = useState(
		inmueble ? String(inmueble.habitaciones) : "2",
	);
	const [banos, setBanos] = useState(inmueble ? String(inmueble.banos) : "1");
	const [estacionamientos, setEstacionamientos] = useState(
		inmueble ? String(inmueble.estacionamientos) : "0",
	);
	const [piso, setPiso] = useState(
		inmueble?.piso !== null && inmueble?.piso !== undefined
			? String(inmueble.piso)
			: "",
	);
	const [amoblado, setAmoblado] = useState(inmueble?.amoblado ?? false);
	const [descripcion, setDescripcion] = useState(inmueble?.descripcion ?? "");
	const [proveedorId, setProveedorId] = useState(
		inmueble?.proveedorId ?? proveedoresIniciales[0].id,
	);
	const [precio, setPrecio] = useState(inmueble ? String(inmueble.precio) : "");
	const [costoPublicacion, setCostoPublicacion] = useState(
		inmueble ? String(inmueble.costoPublicacion) : "300",
	);
	const [disponibleDesde, setDisponibleDesde] = useState(
		inmueble?.fechaDisponibilidad ?? "2026-11-01",
	);
	const [destacado, setDestacado] = useState(inmueble?.destacado ?? false);
	const [amenidades, setAmenidades] = useState<string[]>(
		inmueble?.amenidades ?? [],
	);
	const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
	const [arrastrando, setArrastrando] = useState(false);

	// Alta rápida de proveedor desde el EntityPicker.
	const [npNombre, setNpNombre] = useState("");
	const [npTelefono, setNpTelefono] = useState("+591 ");
	const [npZona, setNpZona] = useState("");

	const esLocal = tipo === "Local";

	function alternarAmenidad(valor: string) {
		setAmenidades((prev) =>
			prev.includes(valor) ? prev.filter((a) => a !== valor) : [...prev, valor],
		);
	}

	function agregarArchivos(files: FileList | null) {
		if (!files || files.length === 0) return;
		const nuevas: ImagenPreview[] = Array.from(files).map((file) => ({
			id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
			nombre: file.name,
			url: URL.createObjectURL(file),
		}));
		setImagenes((prev) => [...prev, ...nuevas]);
		toast.success("Imágenes agregadas", {
			description: `${nuevas.length} archivo(s) listos para publicar.`,
		});
	}

	function quitarImagen(id: string) {
		setImagenes((prev) => {
			const objetivo = prev.find((i) => i.id === id);
			if (objetivo?.url.startsWith("blob:")) URL.revokeObjectURL(objetivo.url);
			return prev.filter((i) => i.id !== id);
		});
	}

	function guardar(publicar: boolean) {
		if (!titulo.trim() || !direccion.trim() || !precio.trim()) {
			toast.error("Faltan datos obligatorios", {
				description: "Completa título, dirección y precio de alquiler.",
			});
			return;
		}
		onGuardar(publicar, {
			titulo,
			tipo,
			estado,
			zona,
			direccion,
			m2,
			habitaciones: esLocal ? "0" : habitaciones,
			banos,
			estacionamientos,
			piso,
			amoblado,
			descripcion,
			proveedorId,
			precio,
			costoPublicacion,
			disponibleDesde,
			destacado,
			amenidades,
		});
	}

	function crearProveedor() {
		if (!npNombre.trim()) {
			toast.error("Indica el nombre del proveedor");
			return;
		}
		const nuevo: Proveedor = {
			id: `prv-${String(listaProveedores.length + 1).padStart(3, "0")}`,
			nombre: npNombre,
			tipo: "Persona",
			telefono: npTelefono,
			ciudad: "Potosí",
			zonaPrincipal: npZona || zona,
			estado: "Activo",
			desde: "2026-10-19",
		};
		setListaProveedores((prev) => [...prev, nuevo]);
		setProveedorId(nuevo.id);
		setNpNombre("");
		setNpTelefono("+591 ");
		setNpZona("");
		toast.success("Proveedor registrado", {
			description: `${nuevo.nombre} quedó seleccionado para este inmueble.`,
		});
	}

	return (
		<div className="pb-28">
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="flex flex-col gap-6 xl:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<Building2
									className="size-4 text-brand-text"
									aria-hidden="true"
								/>
								Información del inmueble
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="n-titulo">Título de la publicación *</Label>
								<Input
									id="n-titulo"
									value={titulo}
									onChange={(e) => setTitulo(e.target.value)}
									placeholder="Ej. Departamento moderno en Av. Villazón"
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-tipo">Tipo de inmueble *</Label>
									<Select value={tipo} onValueChange={setTipo}>
										<SelectTrigger id="n-tipo" aria-label="Tipo de inmueble">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{TIPOS_INMUEBLE.map((t) => (
												<SelectItem key={t} value={t}>
													{t}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-estado">Estado *</Label>
									<Select
										value={estado}
										onValueChange={(v) => setEstado(v as InmuebleEstado)}
									>
										<SelectTrigger id="n-estado" aria-label="Estado">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ESTADOS_INMUEBLE.map((e) => (
												<SelectItem key={e} value={e}>
													{e}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-zona">Zona *</Label>
									<ZonePicker
										id="n-zona"
										mode="single"
										value={zona ? [zona] : []}
										onChange={(zonas) => setZona(zonas[0] ?? "")}
										placeholder="Elegir zona…"
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="n-dir">Dirección *</Label>
								<Input
									id="n-dir"
									value={direccion}
									onChange={(e) => setDireccion(e.target.value)}
									placeholder="Calle y número, referencias"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-m2">Superficie (m²)</Label>
									<Input
										id="n-m2"
										type="number"
										min={0}
										inputMode="numeric"
										value={m2}
										onChange={(e) => setM2(e.target.value)}
										placeholder="90"
									/>
								</div>
								{esLocal ? (
									<div className="flex flex-col justify-end gap-2 sm:col-span-1">
										<p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
											Los locales no llevan habitaciones.
										</p>
									</div>
								) : (
									<div className="flex flex-col gap-2">
										<Label htmlFor="n-hab">Habitaciones</Label>
										<Input
											id="n-hab"
											type="number"
											min={0}
											inputMode="numeric"
											value={habitaciones}
											onChange={(e) => setHabitaciones(e.target.value)}
										/>
									</div>
								)}
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-banos">Baños</Label>
									<Input
										id="n-banos"
										type="number"
										min={0}
										inputMode="numeric"
										value={banos}
										onChange={(e) => setBanos(e.target.value)}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-parq">Parqueos</Label>
									<Input
										id="n-parq"
										type="number"
										min={0}
										inputMode="numeric"
										value={estacionamientos}
										onChange={(e) => setEstacionamientos(e.target.value)}
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-2">
									<Label htmlFor="n-piso">Piso (opcional)</Label>
									<Input
										id="n-piso"
										type="number"
										inputMode="numeric"
										value={piso}
										onChange={(e) => setPiso(e.target.value)}
										placeholder="Ej. 5"
									/>
								</div>
								<div className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
									<div>
										<Label htmlFor="n-amoblado" className="cursor-pointer">
											Amoblado
										</Label>
										<p className="text-xs text-muted-foreground">
											El inmueble incluye muebles
										</p>
									</div>
									<Checkbox
										id="n-amoblado"
										checked={amoblado}
										onCheckedChange={(v) => setAmoblado(v === true)}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="n-desc">Descripción</Label>
								<Textarea
									id="n-desc"
									value={descripcion}
									onChange={(e) => setDescripcion(e.target.value)}
									rows={4}
									placeholder="Describe el inmueble, su entorno y las condiciones del alquiler."
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<Sparkles
									className="size-4 text-brand-text"
									aria-hidden="true"
								/>
								Amenidades
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{AMENIDADES.map((a) => (
									<label
										key={a}
										htmlFor={`am-${a}`}
										className={cn(
											"flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
											amenidades.includes(a)
												? "border-primary/40 bg-blue-soft text-blue-deep"
												: "border-border text-muted-foreground hover:bg-accent",
										)}
									>
										<Checkbox
											id={`am-${a}`}
											checked={amenidades.includes(a)}
											onCheckedChange={() => alternarAmenidad(a)}
										/>
										{a}
									</label>
								))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<ImagePlus
									className="size-4 text-brand-text"
									aria-hidden="true"
								/>
								Imágenes del inmueble
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<button
								type="button"
								onClick={() => inputArchivos.current?.click()}
								onDragOver={(e) => {
									e.preventDefault();
									setArrastrando(true);
								}}
								onDragLeave={() => setArrastrando(false)}
								onDrop={(e) => {
									e.preventDefault();
									setArrastrando(false);
									agregarArchivos(e.dataTransfer.files);
								}}
								className={cn(
									"flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150",
									arrastrando
										? "border-primary bg-blue-soft"
										: "border-border hover:border-primary/40 hover:bg-accent/40",
								)}
							>
								<span className="grid size-12 place-items-center rounded-full bg-blue-soft text-brand-text">
									<Upload className="size-5" aria-hidden="true" />
								</span>
								<span className="mt-3 font-display text-sm font-bold text-foreground">
									Arrastra tus fotos aquí o haz clic para subir
								</span>
								<span className="mt-1 text-xs text-muted-foreground">
									PNG o JPG. La primera imagen será la portada.
								</span>
							</button>
							<input
								ref={inputArchivos}
								type="file"
								accept="image/*"
								multiple
								className="sr-only"
								onChange={(e) => agregarArchivos(e.target.files)}
							/>

							{imagenes.length > 0 ? (
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
									{imagenes.map((img, index) => (
										<div
											key={img.id}
											className="group relative overflow-hidden rounded-lg border border-border"
										>
											<img
												src={img.url}
												alt={img.nombre}
												className="aspect-[4/3] w-full object-cover"
											/>
											{index === 0 ? (
												<span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
													Portada
												</span>
											) : null}
											<button
												type="button"
												onClick={() => quitarImagen(img.id)}
												aria-label={`Quitar ${img.nombre}`}
												className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-foreground/80 text-background transition-colors hover:bg-destructive"
											>
												<Trash2 className="size-3.5" aria-hidden="true" />
											</button>
										</div>
									))}
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<MapPin className="size-4 text-brand-text" aria-hidden="true" />
								Propietario
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<EntityPicker
								items={listaProveedores.map((p) => ({
									id: p.id,
									nombre: p.nombre,
									secundario: `${p.tipo} · ${p.zonaPrincipal} · ${p.telefono}`,
								}))}
								value={proveedorId}
								onChange={(id) => id && setProveedorId(id)}
								placeholder="Buscar proveedor…"
								resumenBadge="Propietario"
								tabla={({ open, onOpenChange, onSelect }) => (
									<Dialog open={open} onOpenChange={onOpenChange}>
										<DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
											<DialogHeader>
												<DialogTitle>Proveedores</DialogTitle>
												<DialogDescription>
													Elige el propietario del inmueble.
												</DialogDescription>
											</DialogHeader>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Proveedor</TableHead>
														<TableHead>Zona</TableHead>
														<TableHead className="text-right">Acción</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{listaProveedores.map((p) => (
														<TableRow key={p.id}>
															<TableCell>
																<span className="block font-medium text-foreground">
																	{p.nombre}
																</span>
																<span className="block text-xs text-muted-foreground">
																	{p.tipo} · {p.telefono}
																</span>
															</TableCell>
															<TableCell className="text-muted-foreground">
																{p.zonaPrincipal}
															</TableCell>
															<TableCell className="text-right">
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => onSelect(p.id)}
																>
																	Elegir
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</DialogContent>
									</Dialog>
								)}
								nuevo={({ open, onOpenChange }) => (
									<Sheet open={open} onOpenChange={onOpenChange}>
										<SheetContent className="w-full overflow-y-auto sm:max-w-md">
											<SheetHeader>
												<SheetTitle className="font-display">
													Nuevo proveedor
												</SheetTitle>
												<SheetDescription>
													Alta rápida. Quedará seleccionado para este inmueble.
												</SheetDescription>
											</SheetHeader>
											<div className="flex flex-col gap-4 px-4">
												<div className="flex flex-col gap-2">
													<Label htmlFor="np-nombre">Nombre *</Label>
													<Input
														id="np-nombre"
														value={npNombre}
														onChange={(e) => setNpNombre(e.target.value)}
														placeholder="Ej. Juan Pérez"
													/>
												</div>
												<div className="flex flex-col gap-2">
													<Label htmlFor="np-tel">Teléfono</Label>
													<Input
														id="np-tel"
														value={npTelefono}
														onChange={(e) => setNpTelefono(e.target.value)}
													/>
												</div>
												<div className="flex flex-col gap-2">
													<Label htmlFor="np-zona">Zona principal</Label>
													<ZonePicker
														id="np-zona"
														mode="single"
														value={npZona ? [npZona] : []}
														onChange={(zonas) => setNpZona(zonas[0] ?? "")}
														placeholder="Elegir zona…"
													/>
												</div>
											</div>
											<SheetFooter className="flex-row justify-end gap-2 px-4">
												<Button
													variant="outline"
													onClick={() => onOpenChange(false)}
												>
													Cancelar
												</Button>
												<Button
													variant="default"
													onClick={() => {
														crearProveedor();
														onOpenChange(false);
													}}
												>
													<Plus aria-hidden="true" />
													Registrar y seleccionar
												</Button>
											</SheetFooter>
										</SheetContent>
									</Sheet>
								)}
								nuevoLabel="Nuevo proveedor"
							/>
							<p className="text-xs text-muted-foreground">
								El proveedor recibe la factura del costo de publicación.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<CalendarDays
									className="size-4 text-brand-text"
									aria-hidden="true"
								/>
								Publicación y precios
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="n-precio">Alquiler mensual (Bs) *</Label>
								<Input
									id="n-precio"
									type="number"
									min={0}
									inputMode="numeric"
									value={precio}
									onChange={(e) => setPrecio(e.target.value)}
									placeholder="2400"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="n-costo">Costo de publicación (Bs) *</Label>
								<Input
									id="n-costo"
									type="number"
									min={0}
									inputMode="numeric"
									value={costoPublicacion}
									onChange={(e) => setCostoPublicacion(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Monto cobrado al propietario por publicar el inmueble.
								</p>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="n-disp">Disponible desde *</Label>
								<Input
									id="n-disp"
									type="date"
									value={disponibleDesde}
									onChange={(e) => setDisponibleDesde(e.target.value)}
								/>
							</div>
							<label
								htmlFor="n-destacado"
								className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3"
							>
								<span className="flex items-center gap-2">
									<Sparkles className="size-4 text-cta" aria-hidden="true" />
									<span className="text-sm font-medium text-foreground">
										Marcar como destacado
									</span>
								</span>
								<Checkbox
									id="n-destacado"
									checked={destacado}
									onCheckedChange={(v) => setDestacado(v === true)}
								/>
							</label>
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md">
				<div className="mx-auto flex max-w-[1280px] flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
					<p className="mr-auto hidden text-xs text-muted-foreground sm:block">
						{imagenes.length > 0
							? `${imagenes.length} imagen(es) cargada(s) · `
							: ""}
						Los datos no se envían a ningún servidor (prototipo).
					</p>
					<Button
						variant="outline"
						onClick={() => void navigate({ to: "/admin/inmuebles" })}
					>
						Cancelar
					</Button>
					<Button variant="secondary" onClick={() => guardar(false)}>
						Guardar borrador
					</Button>
					<Button variant="cta" onClick={() => guardar(true)}>
						<Check aria-hidden="true" />
						{editando ? "Guardar cambios" : "Publicar inmueble"}
					</Button>
				</div>
			</div>
		</div>
	);
}
