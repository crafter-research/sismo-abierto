import { isSourceError } from "@sismo/data";

export function SourceErrorState({
  error,
  context,
}: {
  error: unknown;
  context: string;
}) {
  const detail = isSourceError(error)
    ? `Nuestro consumidor no pudo validar la fuente ${error.sourceId} (${error.kind}${error.httpStatus ? `, HTTP ${error.httpStatus}` : ""}).`
    : "Ocurrió un error inesperado en este proyecto.";
  return (
    <div
      role="alert"
      className="rounded-lg border border-loaderror bg-loaderror-soft p-4 text-sm text-loaderror"
      data-testid="source-error"
    >
      <p className="font-semibold">{context}</p>
      <p className="mt-1">{detail}</p>
      <p className="mt-1 text-xs">
        Esto describe lo que observó este proyecto al consultar una fuente
        pública. No afirma nada sobre los sistemas internos del IGP.
      </p>
    </div>
  );
}
