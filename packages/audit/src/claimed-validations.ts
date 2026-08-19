import type { ClaimedValidation } from "@sismo/contracts";
import claimedValidationsJson from "../../../data/predictions/claimed-validations.json";

const ASSESSMENTS: ClaimedValidation["assessment"][] = [
  "OUTSIDE_FROZEN_MAGNITUDE",
  "OUTSIDE_FROZEN_GEOGRAPHY",
  "UNVERIFIABLE_IN_OFFICIAL_SOURCES",
  "SOURCE_DISAGREEMENT_ON_MAGNITUDE",
  "MATCHES_FROZEN_CLAIM",
];

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
    (claim.claimedMagnitude === null ||
      typeof claim.claimedMagnitude === "number") &&
    (claim.claimedMagnitudeScale === null ||
      typeof claim.claimedMagnitudeScale === "string") &&
    (claim.claimedSourceCited === null ||
      typeof claim.claimedSourceCited === "string") &&
    Array.isArray(claim.sources) &&
    claim.sources.length > 0 &&
    ASSESSMENTS.includes(claim.assessment as ClaimedValidation["assessment"])
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
