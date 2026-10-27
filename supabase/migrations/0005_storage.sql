-- ============================================================================
-- RE/MAX Potosí · 0005 · Storage
-- ============================================================================
-- Buckets:
--   * inmuebles    → público (fotos del catálogo)             8 MB, imágenes
--   * contratos    → privado (PDF firmado)                   15 MB, PDF
--   * comprobantes → privado (foto/PDF del pago)             10 MB, imágenes/PDF
--
-- Convención para los buckets privados: `{alquiler_id}/archivo`. La primera
-- carpeta debe ser el UUID del alquiler; las políticas lo validan antes de
-- permitir la lectura/escritura.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets y límites
-- ---------------------------------------------------------------------------
insert into storage.buckets (
	id,
	name,
	public,
	file_size_limit,
	allowed_mime_types
)
values
	(
		'inmuebles',
		'inmuebles',
		true,
		8388608,
		array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
	),
	(
		'contratos',
		'contratos',
		false,
		15728640,
		array['application/pdf']
	),
	(
		'comprobantes',
		'comprobantes',
		false,
		10485760,
		array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
	)
on conflict (id) do update
set name = excluded.name,
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Helpers de ruta
-- ---------------------------------------------------------------------------
create or replace function public.alquiler_id_de_archivo(p_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
	v_primer_segmento text;
	v_id uuid;
begin
	v_primer_segmento := split_part(coalesce(p_name, ''), '/', 1);

	if v_primer_segmento = '' then
		return null;
	end if;

	begin
		v_id := v_primer_segmento::uuid;
	exception
		when invalid_text_representation then
			return null;
	end;

	return v_id;
end;
$$;

create or replace function public.puede_ver_archivo_alquiler(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.puede_ver_alquiler(public.alquiler_id_de_archivo(p_name));
$$;

create or replace function public.puede_editar_archivo_alquiler(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.is_admin()
		or public.es_vendedor_de_alquiler(public.alquiler_id_de_archivo(p_name));
$$;

-- Para el wizard de cierre, el vendedor sube el contrato antes de que exista
-- la fila de `alquileres` (el UUID se genera en el cliente). Se permite crear
-- el objeto si el alquiler aún no existe; si ya existe, solo su vendedor.
create or replace function public.puede_subir_archivo_alquiler(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
	v_alquiler_id uuid := public.alquiler_id_de_archivo(p_name);
begin
	if v_alquiler_id is null then
		return false;
	end if;

	return public.is_admin()
		or (
			public.is_vendedor()
			and (
				not exists (
					select 1
					from public.alquileres a
					where a.id = v_alquiler_id
				)
				or public.es_vendedor_de_alquiler(v_alquiler_id)
			)
		);
end;
$$;

comment on function public.alquiler_id_de_archivo(text) is
	'Extrae el UUID de la primera carpeta de una ruta Storage; NULL si no es válida.';
comment on function public.puede_ver_archivo_alquiler(text) is
	'Lectura de contratos/comprobantes: admin, vendedor o cliente del alquiler.';
comment on function public.puede_editar_archivo_alquiler(text) is
	'Edición/borrado de contratos/comprobantes: admin o vendedor del alquiler.';
comment on function public.puede_subir_archivo_alquiler(text) is
	'Alta de contratos/comprobantes: admin, o vendedor si el alquiler es suyo o aún no existe (wizard).';

-- ---------------------------------------------------------------------------
-- 3. Políticas de Storage
-- ---------------------------------------------------------------------------
-- Bucket público del catálogo. La lectura por URL pública no requiere política,
-- pero sí para listar y para las operaciones autenticadas.
drop policy if exists remax_inmuebles_lectura on storage.objects;
create policy remax_inmuebles_lectura on storage.objects
	for select to anon, authenticated
	using (bucket_id = 'inmuebles');

drop policy if exists remax_inmuebles_escritura on storage.objects;
create policy remax_inmuebles_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	);

drop policy if exists remax_inmuebles_actualizacion on storage.objects;
create policy remax_inmuebles_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	)
	with check (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	);

drop policy if exists remax_inmuebles_borrado on storage.objects;
create policy remax_inmuebles_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	);

-- Contratos: lectura para admin, vendedor del alquiler y cliente del alquiler.
drop policy if exists remax_contratos_lectura on storage.objects;
create policy remax_contratos_lectura on storage.objects
	for select to authenticated
	using (
		bucket_id = 'contratos'
		and public.puede_ver_archivo_alquiler(name)
	);

drop policy if exists remax_contratos_escritura on storage.objects;
create policy remax_contratos_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'contratos'
		and public.puede_subir_archivo_alquiler(name)
	);

drop policy if exists remax_contratos_actualizacion on storage.objects;
create policy remax_contratos_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'contratos'
		and public.puede_editar_archivo_alquiler(name)
	)
	with check (
		bucket_id = 'contratos'
		and public.puede_editar_archivo_alquiler(name)
	);

drop policy if exists remax_contratos_borrado on storage.objects;
create policy remax_contratos_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'contratos'
		and public.puede_editar_archivo_alquiler(name)
	);

-- Comprobantes: mismas reglas que contratos.
drop policy if exists remax_comprobantes_lectura on storage.objects;
create policy remax_comprobantes_lectura on storage.objects
	for select to authenticated
	using (
		bucket_id = 'comprobantes'
		and public.puede_ver_archivo_alquiler(name)
	);

drop policy if exists remax_comprobantes_escritura on storage.objects;
create policy remax_comprobantes_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'comprobantes'
		and public.puede_subir_archivo_alquiler(name)
	);

drop policy if exists remax_comprobantes_actualizacion on storage.objects;
create policy remax_comprobantes_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'comprobantes'
		and public.puede_editar_archivo_alquiler(name)
	)
	with check (
		bucket_id = 'comprobantes'
		and public.puede_editar_archivo_alquiler(name)
	);

drop policy if exists remax_comprobantes_borrado on storage.objects;
create policy remax_comprobantes_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'comprobantes'
		and public.puede_editar_archivo_alquiler(name)
	);

-- ---------------------------------------------------------------------------
-- 4. Permisos de ejecución
-- ---------------------------------------------------------------------------
revoke all on function public.alquiler_id_de_archivo(text) from public;
revoke all on function public.puede_ver_archivo_alquiler(text) from public;
revoke all on function public.puede_editar_archivo_alquiler(text) from public;
revoke all on function public.puede_subir_archivo_alquiler(text) from public;

grant execute on function public.alquiler_id_de_archivo(text) to authenticated, service_role;
grant execute on function public.puede_ver_archivo_alquiler(text) to authenticated, service_role;
grant execute on function public.puede_editar_archivo_alquiler(text) to authenticated, service_role;
grant execute on function public.puede_subir_archivo_alquiler(text) to authenticated, service_role;
