import {
  INGEMMET_ATTRIBUTION,
  INGEMMET_DISCLAIMER,
  queryPoint,
} from "@sismo/terrain";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseCoordinate(
  raw: string | null,
  min: number,
  max: number,
): number | null {
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  if (Number.isNaN(value) || value < min || value > max) return null;
  return value;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lonRaw = params.get("lon");
  const latRaw = params.get("lat");
  const lon = parseCoordinate(lonRaw, -180, 180);
  const lat = parseCoordinate(latRaw, -90, 90);

  if (lonRaw === null || latRaw === null) {
    return NextResponse.json(
      { error: "Faltan los parámetros 'lon' y 'lat' en la consulta." },
      { status: 400 },
    );
  }
  if (lon === null) {
    return NextResponse.json(
      {
        error:
          "El parámetro 'lon' debe ser un número entre -180 y 180 grados decimales.",
      },
      { status: 400 },
    );
  }
  if (lat === null) {
    return NextResponse.json(
      {
        error:
          "El parámetro 'lat' debe ser un número entre -90 y 90 grados decimales.",
      },
      { status: 400 },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error:
          "El servicio de terreno no está configurado (falta DATABASE_URL).",
      },
      { status: 503 },
    );
  }

  const point = await queryPoint(lon, lat);

  return NextResponse.json(
    {
      ...point,
      attribution: INGEMMET_ATTRIBUTION,
      disclaimer: INGEMMET_DISCLAIMER,
    },
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        // Consulta por punto arbitrario (infinitos lon/lat posibles): no cacheable
        // por URL, pero el dato subyacente solo cambia al re-ingerir (ver refresh.ts).
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
