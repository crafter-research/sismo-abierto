import Link from "next/link";

function ArrowLeft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <path
        d="M10.5 3 5.5 8l5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <path
        d="m5.5 3 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ReportNavigation({
  previous,
  next,
}: {
  previous: number | null;
  next: number | null;
}) {
  return (
    <nav
      aria-label="Navegación entre informes"
      className="grid grid-cols-2 gap-3"
      data-testid="report-navigation"
    >
      {previous ? (
        <Link
          href={`/verifica/informes/${previous}`}
          className="flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 hover:border-gray-600 hover:text-gray-1000"
        >
          <ArrowLeft />
          <span>
            <span className="block text-[11px] text-gray-800">Anterior</span>
            Informe {previous}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/verifica/informes/${next}`}
          className="flex items-center justify-end gap-2 rounded border border-gray-300 px-3 py-2 text-right text-sm text-gray-900 hover:border-gray-600 hover:text-gray-1000"
        >
          <span>
            <span className="block text-[11px] text-gray-800">Siguiente</span>
            Informe {next}
          </span>
          <ArrowRight />
        </Link>
      ) : null}
    </nav>
  );
}
