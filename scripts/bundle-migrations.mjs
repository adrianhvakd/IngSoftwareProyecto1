/**
 * Concatena las migraciones de supabase/migrations en supabase/full_setup.sql.
 *
 * Sirve para pegar un único archivo en el editor SQL de Supabase cuando no se
 * tiene Docker ni la CLI. No incluye el seed (es data de desarrollo).
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, "..");
const MIGRACIONES = resolve(RAIZ, "supabase/migrations");
const SALIDA = resolve(RAIZ, "supabase/full_setup.sql");

const archivos = (await readdir(MIGRACIONES))
	.filter((archivo) => archivo.endsWith(".sql"))
	.sort();

if (archivos.length === 0) {
	throw new Error("No hay migraciones en supabase/migrations.");
}

const partes = [
	"-- ============================================================================",
	"-- RE/MAX Potosí · full_setup.sql",
	"-- ============================================================================",
	"-- Archivo generado por `pnpm db:bundle`. No lo edites a mano.",
	"-- Pega su contenido completo en el editor SQL de un proyecto Supabase vacío.",
	"-- Después de las migraciones, ejecuta supabase/seed.sql si quieres datos demo.",
	"-- ============================================================================",
	"",
];

for (const archivo of archivos) {
	const contenido = await readFile(join(MIGRACIONES, archivo), "utf8");
	partes.push(
		"-- ----------------------------------------------------------------------------",
		`-- ${archivo}`,
		"-- ----------------------------------------------------------------------------",
		contenido.trimEnd(),
		"",
	);
}

await writeFile(SALIDA, `${partes.join("\n")}\n`, "utf8");
console.info(`Generado supabase/full_setup.sql con ${archivos.length} migraciones:`);
for (const archivo of archivos) console.info(`  - ${archivo}`);
