export class ErrorHttp extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}
export function json(datos: unknown, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function cuerpo(request: Request, maximo = 524288) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ErrorHttp(415, "Se requiere JSON.");
  const lector = request.body?.getReader();
  if (!lector) throw new ErrorHttp(400, "La solicitud está vacía.");
  const trozos: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > maximo) {
      await lector.cancel();
      throw new ErrorHttp(413, "El contenido supera el límite permitido.");
    }
    trozos.push(value);
  }
  const contenido = new Uint8Array(total);
  let posicion = 0;
  for (const trozo of trozos) {
    contenido.set(trozo, posicion);
    posicion += trozo.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(contenido));
  } catch {
    throw new ErrorHttp(400, "El contenido no es JSON válido.");
  }
}
export function responderError(error: unknown) {
  if (error instanceof ErrorHttp)
    return json({ error: error.message }, error.estado);
  if (error && typeof error === "object" && "issues" in error)
    return json(
      { error: "Revisa los campos: hay datos incompletos o inválidos." },
      400,
    );
  console.error(
    "Operacion fallida",
    error instanceof Error ? error.name : "Error",
  );
  return json(
    { error: "No pudimos completar la operación. Inténtalo de nuevo." },
    500,
  );
}
