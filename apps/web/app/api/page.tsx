import type { Metadata } from "next";
import { ApiReference } from "../../components/api-reference";

export const metadata: Metadata = {
  title: "API de sismos de Perú y Colombia",
  description:
    "Referencia OpenAPI 3.1 para consultar sismos oficiales de Perú y Colombia con datos del IGP y el SGC.",
  alternates: { canonical: "/api" },
};

export default function ApiDocsPage() {
  return (
    <div className="-mx-4 -my-5 flex-1" data-testid="api-reference">
      <ApiReference />
    </div>
  );
}
