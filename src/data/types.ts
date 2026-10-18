/**
 * Modelo de dominio de RE/MAX Potosí.
 * Datos ficticios de ejemplo. Fuente única para todas las pantallas del prototipo.
 */

export type Rol = "Administrador" | "Vendedor" | "Cliente";

export type EstadoCuenta = "Activo" | "Inactivo";

export interface Usuario {
	id: string;
	nombre: string;
	email: string;
	telefono: string; // formato +591 ...
	rol: Rol;
	estado: EstadoCuenta;
	avatarUrl: string;
	creadoEl: string; // ISO date
}

export interface Vendedor {
	id: string;
	nombre: string;
	email: string;
	telefono: string;
	zona: string;
	comisionFija: number; // Bs por alquiler cerrado
	alquileresCerrados: number;
	estado: EstadoCuenta;
	avatarUrl: string;
	cargo: string;
	ingresoEl: string;
}

export interface Cliente {
	id: string;
	nombre: string;
	email: string;
	telefonoContacto: string;
	estado: EstadoCuenta;
	avatarUrl: string;
	desde: string;
}

export interface Proveedor {
	id: string;
	nombre: string;
	telefono: string;
	email: string;
	tipo: "Persona" | "Empresa";
	ciudad: string;
}

export type TipoInmueble = "Casa" | "Departamento" | "Local" | "Terreno";

export type InmuebleEstado = "Disponible" | "En alquiler" | "Destacado";

export interface Inmueble {
	id: string;
	codigo: string;
	titulo: string;
	tipo: TipoInmueble;
	estado: InmuebleEstado;
	destacado: boolean;
	precio: number; // Bs / mes
	zona: string;
	direccion: string;
	m2: number;
	habitaciones: number;
	banos: number;
	estacionamientos: number;
	piso: number | null;
	descripcion: string;
	fechaDisponibilidad: string; // ISO date
	costoPublicacion: number; // Bs cobrados al propietario
	imagenes: string[];
	amenidades: string[];
	proveedorId: string;
	vendedorId: string | null;
	publicadoEl: string; // ISO date
	visitasMes: number;
	amoblado: boolean;
}

export type VisitaEstado = "Pendiente" | "Realizada" | "Cancelada";

export interface Visita {
	id: string;
	clienteId: string;
	inmuebleId: string;
	vendedorId: string | null;
	fechaHora: string; // ISO datetime
	estado: VisitaEstado;
	canal: "Web" | "Teléfono" | "Presencial";
	notas: string;
}

export type AlquilerEstado = "Vigente" | "Finalizado" | "Suspendido";

export interface Alquiler {
	id: string;
	codigo: string;
	inmuebleId: string;
	clienteId: string;
	vendedorId: string;
	fechaInicio: string; // ISO date
	fechaFin: string; // ISO date
	montoMensual: number; // Bs
	diaCobro: number; // día del mes
	deposito: number; // Bs
	comisionFija: number; // Bs para el vendedor
	estado: AlquilerEstado;
	contratoEscaneado: boolean;
}

export type EstadoCuota = "Al día" | "Por vencer" | "En mora" | "Pagada";

export type MedioPago =
	| "Tarjeta de crédito"
	| "Tarjeta de débito"
	| "Transferencia QR"
	| "Efectivo"
	| "Otro";

export interface Pago {
	id: string;
	alquilerId: string;
	numeroCuota: number;
	periodo: string; // "2026-03"
	montoBase: number;
	recargoMora: number;
	monto: number; // total
	fechaVencimiento: string; // ISO date
	fechaPago: string | null; // ISO date
	medioPago: MedioPago | null;
	estado: EstadoCuota;
	comprobante: string | null;
	registradoPor: string | null;
}

export interface Testimonio {
	id: string;
	nombre: string;
	rol: string;
	texto: string;
	avatarUrl: string;
}

export interface FranjaHoraria {
	id: string;
	hora: string;
	disponible: boolean;
}
