import type { ClaimedValidation } from "@sismo/contracts";
import claimedValidationsJson from "../../../data/predictions/claimed-validations.json";

function isClaimedValidation(value: unknown): value is ClaimedValidation {
  if (!value || typeof value !== "object") return false;
  const claim = value as Partial<ClaimedValidation>;
  return (
    typeof claim.predictionId === "string" &&
    typeof claim.claimText === "string" &&
    typeof claim.sourcePublishedAtLima === "string" &&
    !Number.isNaN(Date.parse(claim.sourcePublishedAtLima)) &&
    typeof claim.eventTimeUtc === "string" &&
    !Number.isNaN(Date.parse(claim.eventTimeUtc)) &&
    Array.isArray(claim.sources) &&
    claim.sources.length > 0 &&
    claim.assessment === "OUTSIDE_FROZEN_MAGNITUDE"
  );
}

export function parseClaimedValidations(claims: unknown): ClaimedValidation[] {
  if (!Array.isArray(claims) || !claims.every(isClaimedValidation)) {
    throw new Error(
      "El registro de validaciones reclamadas no tiene el formato esperado",
    );
  }
  return claims;
}

export async function loadClaimedValidations(): Promise<ClaimedValidation[]> {
  return parseClaimedValidations(claimedValidationsJson);
}

export async function findClaimedValidation(
  predictionId: string,
): Promise<ClaimedValidation | null> {
  const claims = await loadClaimedValidations();
  return claims.find((claim) => claim.predictionId === predictionId) ?? null;
}
