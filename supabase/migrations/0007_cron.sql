-- ============================================================================
-- RE/MAX Potosí · 0007 · pg_cron
-- ============================================================================
-- Este archivo se numera 0007 para reservar 0004 (RLS), 0005 (Storage) y
-- 0006 (vistas) a los entregables siguientes. Puede ejecutarse antes o después
-- de esas migraciones: solo depende de la función actualizar_estado_cuotas().
--
-- 04:05 UTC = 00:05 America/La_Paz (UTC-4, sin horario de verano).
-- ============================================================================

create extension if not exists pg_cron;

-- Re-crear el job de forma idempotente si ya existía.
do $$
begin
	if exists (
		select 1
		from cron.job
		where jobname = 'remax-actualizar-cuotas'
	) then
		perform cron.unschedule('remax-actualizar-cuotas');
	end if;
end
$$;

select cron.schedule(
	'remax-actualizar-cuotas',
	'5 4 * * *',
	$$select public.actualizar_estado_cuotas();$$
);

comment on extension pg_cron is
	'Programa el job diario de mora y avisos de cuotas de RE/MAX Potosí.';
