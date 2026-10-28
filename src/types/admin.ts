/**
 * Tipos de las pantallas del panel administrador.
 *
 * Son tipos de transporte entre las server functions de `src/server/admin/` y
 * los componentes. Reutilizan el modelo de `src/types/models` para que el diseño
 * de las pantallas no cambie al consumir Supabase.
 */

import type { EstadoInmuebleDb, TipoInmuebleDb } from "@/types/domain";
import type {
	Inmueble,
	Proveedor,
	Usuario,
	Vendedor,
	VisitaDetalle,
	VisitaEstado,
} from "@/types/models";

export interface ImagenInmuebleAdmin {
	id: string;
	path: string | null;
	url: string | null;
	alt: string | null;
	orden: number;
	esPortada: boolean;
}

export interface InmuebleAdmin extends Inmueble {
	zonaId: string;
	proveedorNombre: string | null;
	agenteNombre: string | null;
	imagenesDetalle: ImagenInmuebleAdmin[];
}

export interface InmuebleProveedorResumen {
	id: string;
	codigo: string;
	titulo: string;
	tipo: Inmueble["tipo"];
	estado: Inmueble["estado"];
	precio: number;
	zona: string;
}

export interface ProveedorAdmin extends Proveedor {
	inmueblesCount: number;
	inmuebles: InmuebleProveedorResumen[];
}

export interface DatosListaVendedores {
	vendedores: Vendedor[];
	candidatos: Usuario[];
}

export interface OpcionProveedorAdmin {
	id: string;
	nombre: string;
	tipo: Proveedor["tipo"];
	zonaPrincipal: string;
	telefono: string;
	email?: string;
}

export interface OpcionesInmuebleAdmin {
	proveedores: OpcionProveedorAdmin[];
}

export interface DatosInmuebleAdmin {
	inmueble: InmuebleAdmin;
	proveedores: OpcionProveedorAdmin[];
}

export interface ImagenGuardarInmueble {
	id?: string;
	path: string | null;
	url: string;
	alt?: string | null;
	orden: number;
	esPortada: boolean;
}

export interface AlertaCobroAdmin {
	id: string;
	clienteNombre: string;
	inmuebleCodigo: string;
	estado: "En mora" | "Por vencer";
	monto: number;
	fechaVencimiento: string;
}

export interface PuntoIngresoAdmin {
	mes: string;
	cobrado: number;
	comisiones: number;
}

export interface ResumenDashboardAdmin {
	inmueblesActivos: number;
	visitasSemana: number;
	alquileresVigentes: number;
	cobrosDelMes: number;
	cuotasEnMora: number;
	moraTotal: number;
	cuotasPorVencer: number;
	morosidadPorcentaje: number;
}

export interface DashboardAdmin {
	resumen: ResumenDashboardAdmin;
	proximasVisitas: VisitaDetalle[];
	alertas: AlertaCobroAdmin[];
	ingresos: PuntoIngresoAdmin[];
	visitasPorEstado: Array<{ estado: VisitaEstado; cantidad: number }>;
}

export interface DatosVisitasAdmin {
	visitas: VisitaDetalle[];
	vendedores: Vendedor[];
}

/** Entrada del formulario de inmueble, ya normalizada para el servidor. */
export interface GuardarInmuebleInput {
	id?: string;
	modo: "crear" | "editar";
	publicar: boolean;
	titulo: string;
	tipo: TipoInmuebleDb;
	estado: EstadoInmuebleDb;
	zona: string;
	direccion: string;
	m2: number;
	habitaciones: number | null;
	banos: number;
	estacionamientos: number;
	piso: number | null;
	amoblado: boolean;
	descripcion: string;
	proveedorId: string;
	precio: number;
	costoPublicacion: number;
	disponibleDesde: string;
	destacado: boolean;
	amenidades: string[];
	imagenes: ImagenGuardarInmueble[];
}
