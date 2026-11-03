import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { Entorno } from "../src/lib/types";
export function basePrueba() {
  const db = new DatabaseSync(":memory:");
  for (const archivo of ["0001_inicial.sql", "0002_fotos_360.sql"])
    db.exec(
      readFileSync(
        new URL("../migrations/" + archivo, import.meta.url),
        "utf8",
      ),
    );
  const prepare = (sql: string) => {
    let valores: any[] = [];
    const consulta = {
      bind: (...args: any[]) => {
        valores = args;
        return consulta;
      },
      first: async (columna?: string) => {
        const fila = db.prepare(sql).get(...valores);
        return fila ? (columna ? fila[columna] : fila) : null;
      },
      all: async () => ({
        results: db.prepare(sql).all(...valores),
        success: true,
      }),
      run: async () => {
        const r = db.prepare(sql).run(...valores);
        return { success: true, meta: { changes: Number(r.changes) } };
      },
    };
    return consulta;
  };
  const env = {
    DATOS: { prepare },
    ENTORNO: "pruebas",
    CORREO_ADMIN: "iremosenbici@gmail.com",
    CORREO_DESTINO: "destino@example.com",
    CORREO_REMITENTE: "Prueba <web@example.com>",
    SECRETO_SITIO: "secreto-exclusivo-de-pruebas",
    ORIGEN_SITIO: "https://www.iremosenbici.com",
  } as unknown as Entorno;
  return { db, env };
}
