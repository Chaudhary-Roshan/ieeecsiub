// Team Certification Formatting & Statement Utilities
// IEEE Computer Society Student Branch Chapter, UCET - IUB

export function formatTeamMembersProse(members: string[]): string {
  const filtered = (members || []).map((m) => m?.trim()).filter(Boolean);
  if (filtered.length === 0) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
}

export function formatTeamMembersBullets(members: string[]): string {
  return (members || []).map((m) => m?.trim()).filter(Boolean).join("  •  ");
}

export function generateTeamIssuerStatement(
  teamName: string,
  members: string[],
  projectTitle: string,
  eventTitle: string
): string {
  const cleanTeam = (teamName || "").trim();
  const teamLabel = cleanTeam.toLowerCase().startsWith("team ") ? cleanTeam : `Team ${cleanTeam}`;
  const membersProse = formatTeamMembersProse(members);
  const membersPart = membersProse ? `, comprising ${membersProse},` : "";
  const cleanProject = (projectTitle || "").trim();
  const projectPart = cleanProject ? ` '${cleanProject}'` : " their technical project";
  const cleanEvent = (eventTitle || "IEEE DigitalFest 2026 Projects Expo").trim();

  return `This certificate validates that ${teamLabel}${membersPart} successfully demonstrated their technical project${projectPart} at the ${cleanEvent}, exhibiting outstanding teamwork, technical competence, and dedication.`;
}

