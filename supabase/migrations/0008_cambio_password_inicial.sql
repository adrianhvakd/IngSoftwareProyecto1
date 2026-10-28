-- ---------------------------------------------------------------------------
-- 0008 · Cambio de contraseña obligatorio
-- ---------------------------------------------------------------------------
-- Las cuentas creadas por backend nacen con `debe_cambiar_password = true`.
-- El trigger `perfiles_proteger_campos` impide que el propio usuario limpie esa
-- bandera con un UPDATE directo. Se agrega una RPC que solo autoriza al dueño
-- de la sesión y marca la limpieza dentro de la misma transacción.
-- ---------------------------------------------------------------------------

-- Se conserva la protección de `activo` y `correo`; se permite únicamente el
-- paso `true → false` de la bandera, y solo cuando lo hace la RPC de abajo
-- (marca local `app.password_actualizada`).
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if auth.uid() is not null
		and old.id = auth.uid()
		and not public.is_admin()
	then
		if new.activo is distinct from old.activo
			or new.correo is distinct from old.correo
		then
			raise exception 'Solo un administrador puede cambiar el estado o el correo del perfil.'
				using errcode = '42501';
		end if;

		if new.debe_cambiar_password is distinct from old.debe_cambiar_password
			and not (
				old.debe_cambiar_password
				and not new.debe_cambiar_password
				and coalesce(current_setting('app.password_actualizada', true), '') = 'on'
			)
		then
			raise exception 'La bandera de contraseña temporal solo la puede limpiar la RPC de cambio.'
				using errcode = '42501';
		end if;
	end if;
	return new;
end;
$$;

comment on function public.proteger_campos_perfil() is
	'Protege activo/correo y la bandera de contraseña temporal; permite limpiarla solo vía marcar_password_actualizada().';

-- Limpia la bandera del perfil autenticado. La contraseña se cambia antes con
-- Supabase Auth (`auth.updateUser`) desde la server function.
create or replace function public.marcar_password_actualizada()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
	if auth.uid() is null then
		raise exception 'Debes iniciar sesión para actualizar la contraseña.'
			using errcode = '42501';
	end if;

	perform set_config('app.password_actualizada', 'on', true);

	update public.perfiles
	set debe_cambiar_password = false
	where id = auth.uid();
end;
$$;

comment on function public.marcar_password_actualizada() is
	'Marca la contraseña temporal como actualizada para el usuario autenticado.';

revoke all on function public.marcar_password_actualizada() from public;
revoke all on function public.marcar_password_actualizada() from anon;
grant execute on function public.marcar_password_actualizada() to authenticated;
