-- ---------------------------------------------------------------------------
-- 0010 · Fase 5 · Fotos de inmuebles limitadas al agente asignado
-- ---------------------------------------------------------------------------
-- La política original permitía a cualquier vendedor subir, reemplazar o borrar
-- cualquier objeto del bucket público `inmuebles`. Se restringe la escritura al
-- administrador o al vendedor asignado al inmueble de la primera carpeta.
--
-- La carpeta es `{inmueble_id}/archivo`. Como el bucket es público, la lectura
-- sigue abierta; solo cambian INSERT/UPDATE/DELETE autenticados.
-- ---------------------------------------------------------------------------

create or replace function public.inmueble_id_de_archivo(p_name text)
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

create or replace function public.es_agente_de_archivo_inmueble(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.es_agente_de_inmueble(public.inmueble_id_de_archivo(p_name));
$$;

comment on function public.inmueble_id_de_archivo(text) is
	'Extrae el UUID del inmueble de la primera carpeta de un objeto de Storage.';
comment on function public.es_agente_de_archivo_inmueble(text) is
	'Verdadero si la sesión es el agente asignado al inmueble de la ruta.';

drop policy if exists remax_inmuebles_escritura on storage.objects;
create policy remax_inmuebles_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	);

drop policy if exists remax_inmuebles_actualizacion on storage.objects;
create policy remax_inmuebles_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	)
	with check (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	);

drop policy if exists remax_inmuebles_borrado on storage.objects;
create policy remax_inmuebles_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	);

revoke all on function public.inmueble_id_de_archivo(text) from public;
revoke all on function public.es_agente_de_archivo_inmueble(text) from public;
grant execute on function public.inmueble_id_de_archivo(text) to authenticated, service_role;
grant execute on function public.es_agente_de_archivo_inmueble(text) to authenticated, service_role;
