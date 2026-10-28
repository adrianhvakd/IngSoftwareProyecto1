/**
 * Tipos de la base de datos Supabase.
 *
 * ⚠️ Archivo escrito a mano porque en este entorno no hay Supabase CLI.
 * Regenerar con `pnpm db:types` cuando el proyecto esté enlazado:
 *   supabase gen types typescript --linked --schema public > src/types/database.types.ts
 *
 * Se mantiene la forma estándar de los tipos generados por Supabase
 * (`Database["public"]["Tables"][...]`, `Views`, `Functions` y `Enums`).
 */

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

type Table<Row> = {
	Row: Row;
	Insert: Partial<Row>;
	Update: Partial<Row>;
	Relationships: [];
};

type View<Row> = {
	Row: Row;
	Relationships: [];
};

export type Database = {
	public: {
		Tables: {
			zonas: Table<{
				id: string;
				nombre: string;
				sector: string;
				slug: string;
				activo: boolean;
				created_at: string;
				updated_at: string;
			}>;
			perfiles: Table<{
				id: string;
				nombres: string;
				apellidos: string;
				ci: string | null;
				telefono: string | null;
				correo: string;
				rol: Database["public"]["Enums"]["rol_usuario"];
				activo: boolean;
				debe_cambiar_password: boolean;
				avatar_url: string | null;
				created_at: string;
				updated_at: string;
			}>;
			vendedores: Table<{
				perfil_id: string;
				comision_fija: number;
				fecha_alta: string;
				activo: boolean;
				cargo: string | null;
				zona_principal_id: string | null;
				created_at: string;
				updated_at: string;
			}>;
			clientes: Table<{
				perfil_id: string;
				telefono_contacto: string | null;
				direccion: string | null;
				created_at: string;
				updated_at: string;
			}>;
			proveedores: Table<{
				id: string;
				nombre: string;
				telefono: string | null;
				correo: string | null;
				tipo: Database["public"]["Enums"]["tipo_proveedor"];
				ciudad: string;
				zona_principal_id: string | null;
				activo: boolean;
				created_at: string;
				updated_at: string;
			}>;
			inmuebles: Table<{
				id: string;
				codigo: string;
				titulo: string;
				tipo: Database["public"]["Enums"]["tipo_inmueble"];
				estado: Database["public"]["Enums"]["estado_inmueble"];
				destacado: boolean;
				descripcion: string;
				precio: number;
				m2: number;
				habitaciones: number | null;
				banos: number;
				estacionamientos: number;
				piso: number | null;
				amoblado: boolean;
				caracteristicas: Json;
				direccion: string;
				zona_id: string;
				proveedor_id: string;
				fecha_disponibilidad: string;
				costo_publicacion: number;
				agente_id: string | null;
				publicado_el: string;
				visitas_mes: number;
				created_at: string;
				updated_at: string;
			}>;
			inmueble_imagenes: Table<{
				id: string;
				inmueble_id: string;
				path: string | null;
				url: string | null;
				alt: string | null;
				orden: number;
				es_portada: boolean;
				created_at: string;
				updated_at: string;
			}>;
			visitas: Table<{
				id: string;
				inmueble_id: string;
				cliente_id: string | null;
				nombre_contacto: string | null;
				telefono_contacto: string | null;
				correo_contacto: string | null;
				vendedor_id: string | null;
				fecha_hora: string;
				estado: Database["public"]["Enums"]["estado_visita"];
				canal: Database["public"]["Enums"]["canal_visita"];
				notas: string;
				created_at: string;
				updated_at: string;
			}>;
			alquileres: Table<{
				id: string;
				numero_contrato: string;
				inmueble_id: string;
				cliente_id: string;
				vendedor_id: string;
				fecha_inicio: string;
				fecha_fin: string;
				duracion_meses: number;
				monto_mensual: number;
				dia_cobro: number;
				deposito: number;
				estado: Database["public"]["Enums"]["estado_alquiler"];
				contrato_path: string | null;
				created_at: string;
				updated_at: string;
			}>;
			cuotas: Table<{
				id: string;
				alquiler_id: string;
				numero: number;
				fecha_vencimiento: string;
				monto: number;
				recargo_mora: number;
				estado: Database["public"]["Enums"]["estado_cuota"];
				created_at: string;
				updated_at: string;
			}>;
			pagos: Table<{
				id: string;
				alquiler_id: string;
				cuota_id: string | null;
				tipo: Database["public"]["Enums"]["tipo_pago"];
				monto: number;
				medio: Database["public"]["Enums"]["medio_pago"];
				fecha_pago: string;
				comprobante_path: string | null;
				registrado_por: string | null;
				validado: boolean;
				created_at: string;
				updated_at: string;
			}>;
			comisiones: Table<{
				id: string;
				vendedor_id: string;
				alquiler_id: string;
				monto: number;
				fecha: string;
				estado: Database["public"]["Enums"]["estado_comision"];
				created_at: string;
				updated_at: string;
			}>;
			notificaciones: Table<{
				id: string;
				perfil_id: string;
				tipo: Database["public"]["Enums"]["tipo_notificacion"];
				titulo: string;
				mensaje: string;
				leida: boolean;
				referencia: string | null;
				created_at: string;
				updated_at: string;
			}>;
			configuracion: Table<{
				id: number;
				recargo_mora_porcentaje: number;
				dias_gracia: number;
				dias_aviso_previo: number;
				created_at: string;
				updated_at: string;
			}>;
			auditoria: Table<{
				id: string;
				tabla: string;
				registro_id: string;
				accion: string;
				datos_anteriores: Json | null;
				datos_nuevos: Json | null;
				actor_id: string | null;
				fecha: string;
				created_at: string;
				updated_at: string;
			}>;
			contador_contratos: Table<{
				anio: number;
				ultimo: number;
				created_at: string;
				updated_at: string;
			}>;
		};
		Views: {
			v_inmuebles_catalogo: View<{
				id: string;
				codigo: string;
				titulo: string;
				tipo: Database["public"]["Enums"]["tipo_inmueble"];
				estado: Database["public"]["Enums"]["estado_inmueble"];
				destacado: boolean;
				descripcion: string;
				precio: number;
				m2: number;
				habitaciones: number | null;
				banos: number;
				estacionamientos: number;
				piso: number | null;
				amoblado: boolean;
				caracteristicas: Json;
				direccion: string;
				zona_id: string;
				zona_nombre: string | null;
				zona_sector: string | null;
				zona_slug: string | null;
				proveedor_id: string;
				proveedor_nombre: string | null;
				agente_id: string | null;
				agente_nombre: string | null;
				fecha_disponibilidad: string;
				costo_publicacion: number;
				publicado_el: string;
				visitas_mes: number;
				portada_url: string | null;
				portada_path: string | null;
				portada_alt: string | null;
				imagenes: Json | null;
				created_at: string;
				updated_at: string;
			}>;
			v_zonas_con_conteo: View<{
				id: string;
				nombre: string;
				sector: string;
				slug: string;
				activo: boolean;
				total_inmuebles: number;
				disponibles: number;
				en_alquiler: number;
				reservados: number;
			}>;
			v_cuotas_estado: View<{
				id: string;
				alquiler_id: string;
				numero: number;
				fecha_vencimiento: string;
				monto: number;
				recargo_mora: number;
				monto_total: number;
				estado_tabla: Database["public"]["Enums"]["estado_cuota"];
				estado_codigo: string;
				estado: string;
				dias_para_vencer: number;
				numero_contrato: string;
				cliente_id: string;
				vendedor_id: string;
				inmueble_id: string;
				alquiler_estado: Database["public"]["Enums"]["estado_alquiler"];
				cliente_nombre: string | null;
				inmueble_codigo: string;
				inmueble_titulo: string;
				created_at: string;
				updated_at: string;
			}>;
			v_alquileres_detalle: View<{
				id: string;
				numero_contrato: string;
				inmueble_id: string;
				inmueble_codigo: string;
				inmueble_titulo: string;
				inmueble_direccion: string;
				zona_nombre: string | null;
				inmueble_portada_url: string | null;
				inmueble_portada_path: string | null;
				cliente_id: string;
				cliente_nombre: string;
				cliente_correo: string;
				cliente_telefono: string | null;
				vendedor_id: string;
				vendedor_nombre: string | null;
				fecha_inicio: string;
				fecha_fin: string;
				duracion_meses: number;
				monto_mensual: number;
				dia_cobro: number;
				deposito: number;
				estado: Database["public"]["Enums"]["estado_alquiler"];
				contrato_path: string | null;
				proxima_cuota_id: string | null;
				proxima_cuota_numero: number | null;
				proxima_cuota_vencimiento: string | null;
				proxima_cuota_monto: number | null;
				proxima_cuota_total: number | null;
				proxima_cuota_estado: string | null;
				proxima_cuota_estado_codigo: string | null;
				estado_cobro: string;
				total_pendiente: number;
				total_pagado: number;
				comision_monto: number;
				created_at: string;
				updated_at: string;
			}>;
			v_comisiones_vendedor: View<{
				id: string;
				vendedor_id: string;
				vendedor_nombre: string | null;
				alquiler_id: string;
				numero_contrato: string;
				inmueble_id: string;
				inmueble_codigo: string;
				inmueble_titulo: string;
				cliente_nombre: string | null;
				monto: number;
				fecha: string;
				estado: Database["public"]["Enums"]["estado_comision"];
				created_at: string;
				updated_at: string;
			}>;
			v_dashboard_admin: View<{
				inmuebles_activos: number;
				visitas_semana: number;
				alquileres_vigentes: number;
				cobros_del_mes: number;
				cuotas_en_mora: number;
				mora_total: number;
				cuotas_por_vencer: number;
				morosidad_porcentaje: number;
			}>;
		};
		Functions: {
			current_rol: {
				Args: Record<PropertyKey, never>;
				Returns: Database["public"]["Enums"]["rol_usuario"];
			};
			is_admin: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			is_vendedor: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			es_cliente_de_alquiler: {
				Args: { p_alquiler_id: string };
				Returns: boolean;
			};
			es_vendedor_de_alquiler: {
				Args: { p_alquiler_id: string };
				Returns: boolean;
			};
			es_agente_de_inmueble: {
				Args: { p_inmueble_id: string };
				Returns: boolean;
			};
			nombre_persona: {
				Args: { p_perfil_id: string | null };
				Returns: string | null;
			};
			agendar_visita: {
				Args: {
					p_inmueble_id: string;
					p_fecha_hora: string;
					p_nombre?: string | null;
					p_telefono?: string | null;
					p_correo?: string | null;
					p_notas?: string | null;
					p_canal?: Database["public"]["Enums"]["canal_visita"];
					p_cliente_id?: string | null;
					p_vendedor_id?: string | null;
				};
				Returns: string;
			};
			calcular_recargo_mora: {
				Args: { p_cuota_id: string };
				Returns: number;
			};
			promover_a_vendedor: {
				Args: {
					p_perfil_id: string;
					p_comision: number;
					p_cargo?: string | null;
					p_zona_principal_id?: string | null;
				};
				Returns: undefined;
			};
			registrar_alquiler: {
				Args: {
					p_alquiler_id: string;
					p_cliente_id: string;
					p_vendedor_id: string;
					p_inmueble_id: string;
					p_monto_mensual: number;
					p_fecha_inicio: string;
					p_duracion_meses: number;
					p_contrato_path: string | null;
					p_pago_cierre: Json;
					p_deposito?: number;
					p_dia_cobro?: number | null;
				};
				Returns: string;
			};
			registrar_pago_cuota: {
				Args: {
					p_alquiler_id: string;
					p_cuota_id: string;
					p_monto: number;
					p_medio: Database["public"]["Enums"]["medio_pago"];
					p_comprobante_path?: string | null;
					p_fecha_pago?: string;
					p_registrado_por?: string | null;
				};
				Returns: string;
			};
			cambiar_estado_inmueble: {
				Args: {
					p_id: string;
					p_estado: Database["public"]["Enums"]["estado_inmueble"];
				};
				Returns: undefined;
			};
			actualizar_estado_cuotas: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			siguiente_numero_contrato: {
				Args: { p_anio?: number | null };
				Returns: string;
			};
			puede_ver_alquiler: {
				Args: { p_alquiler_id: string };
				Returns: boolean;
			};
			puede_ver_inmueble: {
				Args: { p_inmueble_id: string };
				Returns: boolean;
			};
			nombre_agente: {
				Args: { p_vendedor_id: string | null };
				Returns: string | null;
			};
			nombre_proveedor: {
				Args: { p_proveedor_id: string | null };
				Returns: string | null;
			};
			alquiler_id_de_archivo: {
				Args: { p_name: string };
				Returns: string | null;
			};
			puede_ver_archivo_alquiler: {
				Args: { p_name: string };
				Returns: boolean;
			};
			puede_editar_archivo_alquiler: {
				Args: { p_name: string };
				Returns: boolean;
			};
			puede_subir_archivo_alquiler: {
				Args: { p_name: string };
				Returns: boolean;
			};
			marcar_password_actualizada: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			listar_agentes_publicos: {
				Args: Record<PropertyKey, never>;
				Returns: Array<{
					id: string;
					nombre: string;
					cargo: string;
					zona: string;
					telefono: string;
					avatar_url: string;
					alquileres_gestionados: number;
				}>;
			};
			resumen_publico: {
				Args: Record<PropertyKey, never>;
				Returns: Array<{
					inmuebles_disponibles: number;
					agentes_activos: number;
					zonas_activas: number;
					contratos_gestionados: number;
				}>;
			};
		};
		Enums: {
			rol_usuario: "administrador" | "vendedor" | "cliente";
			tipo_inmueble: "casa" | "departamento" | "local";
			estado_inmueble: "disponible" | "reservado" | "en_alquiler" | "inactivo";
			estado_visita: "pendiente" | "realizada" | "cancelada";
			canal_visita: "web" | "telefono" | "presencial";
			estado_alquiler: "vigente" | "finalizado" | "suspendido" | "cancelado";
			estado_cuota: "pendiente" | "pagada" | "en_mora" | "anulada";
			tipo_pago: "cierre" | "cuota";
			medio_pago: "tarjeta" | "qr" | "efectivo" | "otro";
			estado_comision: "pendiente" | "pagada" | "anulada";
			tipo_notificacion:
				| "visita_agendada"
				| "visita_asignada"
				| "cuota_por_vencer"
				| "cuota_en_mora"
				| "pago_registrado"
				| "alquiler_cerrado"
				| "sistema";
			tipo_proveedor: "persona" | "empresa";
		};
		CompositeTypes: Record<PropertyKey, never>;
	};
};
