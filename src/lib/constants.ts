export const CHAPTER_INFO = {
  fullName: "IEEE Computer Society Student Branch Chapter, UCET – The Islamia University of Bahawalpur",
  shortName: "IEEE CS UCET-IUB",
  affiliation: "University College of Engineering & Technology (UCET), The Islamia University of Bahawalpur (IUB)",
  parentBranch: "IEEE UCET-IUB Student Branch",
  parentBranchUrl: "https://edu.ieee.org/pk-ucetiub",
  hierarchy: [
    { name: "UCET-IUB Student Branch Chapter", level: "Local Chapter" },
    { name: "Bahawalpur Subsection", level: "Subsection" },
    { name: "Lahore Section", level: "Section (Pakistan)" },
    { name: "Region 10 (Asia-Pacific)", level: "Region" },
    { name: "IEEE & IEEE Computer Society", level: "Global Entity" },
  ],
  contacts: {
    general: "cs.ucet@iub.edu.pk",
    verify: "verify.cs@ucet-iub.ieee.org",
    location: "Department of Computer Science & Engineering, UCET, Baghdad-ul-Jadeed Campus, Bahawalpur, Punjab, Pakistan",
  },
  socials: {
    linkedin: "https://www.linkedin.com/company/ieee-cs-ucet-iub",
    facebook: "https://www.facebook.com/ieeecsucetiub",
    instagram: "https://www.instagram.com/ieeecsucetiub",
    github: "https://github.com/ieee-cs-ucet-iub",
    whatsapp: "https://chat.whatsapp.com/sample-ieee-cs-ucet-iub",
  },
  issuerStatementDefault: "This is a chapter recognition, not an IEEE credential.",
  credentialDisclaimer: "IEEE CEU/PDH credentials are issued solely through the central IEEE Credentialing Program. Chapter certificates acknowledge participation and local project achievements.",
};

export const BRAND_COLORS = {
  ieeeBlue: "#00629B", // PMS 3015 Main
  csOrange: "#FFA300", // PMS 137 C Accent (~10%)
  navy: "#002855", // PMS 295 Dark
  processCyan: "#00B5E2", // Process Cyan
  statusActive: "#00843D", // Green (PMS 348 C)
  statusRevoked: "#BA0C2F", // Red (PMS 200 C)
  statusReplaced: "#E87722", // Dark orange (PMS 158 C)
  statusNotFound: "#75787B", // Cool Gray 9 C
  surfaceTint: "#CCE0EB", // Blue 20% tint
  borderGray: "#E3E4E5", // Gray 20% tint
};

export const INITIAL_STAFF_USERS = [
  {
    id: "staff-1",
    email: "roshan.ashraf@ieee.org",
    name: "Muhammad Roshan Ashraf",
    role: "SITE_ADMIN" as const,
    twoFactorEnabled: true,
    tenureStart: "2026-01-01",
    tenureEnd: "2026-12-31",
  },
  {
    id: "staff-2",
    email: "aoun.muhammad@iub.edu.pk",
    name: "Dr. Aoun Muhammad",
    role: "CERTIFICATE_APPROVER" as const,
    twoFactorEnabled: true,
    tenureStart: "2026-01-01",
    tenureEnd: "2027-12-31",
  },
  {
    id: "staff-3",
    email: "treasurer.cs@ucet-iub.ieee.org",
    name: "Hamza Tariq",
    role: "TREASURER" as const,
    twoFactorEnabled: true,
    tenureStart: "2026-01-01",
    tenureEnd: "2026-12-31",
  },
  {
    id: "staff-4",
    email: "events.cs@ucet-iub.ieee.org",
    name: "Fatima Noor",
    role: "CONTENT_MANAGER" as const,
    twoFactorEnabled: true,
    tenureStart: "2026-01-01",
    tenureEnd: "2026-12-31",
  },
  {
    id: "staff-5",
    email: "checkin.cs@ucet-iub.ieee.org",
    name: "Ali Raza",
    role: "CHECKIN_STAFF" as const,
    twoFactorEnabled: true,
    tenureStart: "2026-01-01",
    tenureEnd: "2026-12-31",
  },
];
