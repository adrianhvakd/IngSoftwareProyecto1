export { alquileres } from "./alquileres";
export { clienteActual, clientes } from "./clientes";
export { inmuebles } from "./inmuebles";
export { franjasVisita, oficina } from "./oficina";
export { pagos } from "./pagos";
export { proveedores } from "./proveedores";
export { testimonios } from "./testimonios";
export * from "./types";
export { usuarioActual, usuarios } from "./usuarios";
export { vendedorActual, vendedores } from "./vendedores";
export { visitas } from "./visitas";

import { alquileres } from "./alquileres";
import { clientes } from "./clientes";
import { inmuebles } from "./inmuebles";
import { pagos } from "./pagos";
import { proveedores } from "./proveedores";
import type {
	Alquiler,
	Cliente,
	Inmueble,
	Pago,
	Proveedor,
	Usuario,
	Vendedor,
	Visita,
} from "./types";
import { usuarios } from "./usuarios";
import { vendedores } from "./vendedores";
import { visitas } from "./visitas";

/* ------------------------------- Búsquedas ------------------------------- */

export const getInmueble = (id: string) => inmuebles.find((i) => i.id === id);
export const getVendedor = (id: string | null) =>
	id ? vendedores.find((v) => v.id === id) : undefined;
export const getCliente = (id: string) => clientes.find((c) => c.id === id);
export const getProveedor = (id: string) =>
	proveedores.find((p) => p.id === id);
export const getUsuario = (id: string) => usuarios.find((u) => u.id === id);
export const getAlquiler = (id: string) => alquileres.find((a) => a.id === id);

export const getAlquileresDe = (inmuebleId: string) =>
	alquileres.filter((a) => a.inmuebleId === inmuebleId);

export const getPagosDeAlquiler = (alquilerId: string) =>
	pagos
		.filter((p) => p.alquilerId === alquilerId)
		.sort((a, b) => a.numeroCuota - b.numeroCuota);

export const getVisitasDeCliente = (clienteId: string) =>
	visitas.filter((v) => v.clienteId === clienteId);

export const getAlquileresDeCliente = (clienteId: string) =>
	alquileres.filter((a) => a.clienteId === clienteId);

export function getInmueblesSimilares(
	inmueble: Inmueble,
	limite = 3,
): Inmueble[] {
	return inmuebles
		.filter((i) => i.id !== inmueble.id)
		.map((i) => {
			let score = 0;
			if (i.tipo === inmueble.tipo) score += 3;
			if (i.zona === inmueble.zona) score += 2;
			score -= Math.abs(i.precio - inmueble.precio) / 1000;
			return { i, score };
		})
		.sort((a, b) => b.score - a.score)
		.slice(0, limite)
		.map((entry) => entry.i);
}

/* ------------------------------ Vistas unidas ---------------------------- */

export interface VisitaDetalle extends Visita {
	cliente: Cliente;
	inmueble: Inmueble;
	vendedor: Vendedor | undefined;
}

export function getVisitasDetalle(): VisitaDetalle[] {
	return visitas
		.map((v) => {
			const cliente = getCliente(v.clienteId);
			const inmueble = getInmueble(v.inmuebleId);
			if (!cliente || !inmueble) return null;
			return { ...v, cliente, inmueble, vendedor: getVendedor(v.vendedorId) };
		})
		.filter((v): v is VisitaDetalle => v !== null)
		.sort(
			(a, b) =>
				new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
		);
}

export interface AlquilerDetalle extends Alquiler {
	inmueble: Inmueble;
	cliente: Cliente;
	vendedor: Vendedor | undefined;
	cuotaActual: Pago | undefined;
	pagos: Pago[];
}

export function getPagoActual(alquilerId: string): Pago | undefined {
	const cuotas = getPagosDeAlquiler(alquilerId);
	return (
		cuotas.find((c) => c.estado === "En mora") ??
		cuotas.find((c) => c.estado === "Por vencer") ??
		cuotas.find((c) => c.estado === "Al día") ??
		cuotas[cuotas.length - 1]
	);
}

export function getAlquileresDetalle(): AlquilerDetalle[] {
	return alquileres
		.map((a) => {
			const inmueble = getInmueble(a.inmuebleId);
			const cliente = getCliente(a.clienteId);
			if (!inmueble || !cliente) return null;
			return {
				...a,
				inmueble,
				cliente,
				vendedor: getVendedor(a.vendedorId),
				cuotaActual: getPagoActual(a.id),
				pagos: getPagosDeAlquiler(a.id),
			};
		})
		.filter((a): a is AlquilerDetalle => a !== null);
}

/* ------------------------------- Métricas -------------------------------- */

export interface ResumenAdministrador {
	inmueblesActivos: number;
	visitasSemana: number;
	alquileresVigentes: number;
	cobrosDelMes: number;
	moraTotal: number;
	cuotasEnMora: number;
	cuotasPorVencer: number;
	morosidadPorcentaje: number;
}

export function getResumenAdministrador(): ResumenAdministrador {
	const vigentes = alquileres.filter((a) => a.estado === "Vigente");
	const cuotasEnMora = pagos.filter((p) => p.estado === "En mora");
	const cuotasPorVencer = pagos.filter((p) => p.estado === "Por vencer");
	const cobrosDelMes = pagos
		.filter((p) => p.fechaPago?.startsWith("2026-10"))
		.reduce((acc, p) => acc + p.monto, 0);
	const esperadoMes = vigentes.reduce((acc, a) => acc + a.montoMensual, 0);
	const moraTotal = cuotasEnMora.reduce((acc, p) => acc + p.monto, 0);

	const inicioSemana = new Date("2026-10-12T00:00:00").getTime();
	const finSemana = new Date("2026-10-19T00:00:00").getTime();
	const visitasSemana = visitas.filter((v) => {
		const t = new Date(v.fechaHora).getTime();
		return t >= inicioSemana && t < finSemana;
	}).length;

	return {
		inmueblesActivos: inmuebles.filter((i) => i.estado !== "En alquiler")
			.length,
		visitasSemana,
		alquileresVigentes: vigentes.length,
		cobrosDelMes,
		moraTotal,
		cuotasEnMora: cuotasEnMora.length,
		cuotasPorVencer: cuotasPorVencer.length,
		morosidadPorcentaje: esperadoMes
			? Math.round((moraTotal / esperadoMes) * 100)
			: 0,
	};
}

export function getComisionesVendedor(vendedorId: string): number {
	return alquileres
		.filter((a) => a.vendedorId === vendedorId)
		.reduce((acc, a) => acc + a.comisionFija, 0);
}

export type {
	Alquiler,
	Cliente,
	Inmueble,
	Pago,
	Proveedor,
	Usuario,
	Vendedor,
	Visita,
};
