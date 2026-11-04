import { ChapterSettings } from "@/types";

export const DEFAULT_CHAPTER_SETTINGS: ChapterSettings = {
  id: "current",
  emailGeneral: "ieeecsiub.contact@gmail.com",
  emailVerify: "ieeecsiub.contact@gmail.com",
  whatsappGroupUrl: "https://chat.whatsapp.com/sample-ieee-cs-ucet-iub",
  whatsappChatNumber: "923000000000",
  linkedinUrl: "https://www.linkedin.com/company/ieee-cs-ucet-iub",
  instagramUrl: "https://www.instagram.com/ieeecsucetiub",
  facebookUrl: "https://www.facebook.com/ieeecsucetiub",
  githubUrl: "https://github.com/ieee-cs-ucet-iub",
  parentBranchUrl: "https://edu.ieee.org/pk-ucetiub",
  sectionUrl: "https://ieeebahawalpurssection.org/",
  addressRoom1: "Room No. 1.25, Department of Information and Communication Engineering, Old Engineering Building, UCET",
  addressRoom2: "Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan.",
};

export const CHAPTER_INFO = {
  fullName: "IEEE Computer Society Student Branch Chapter, UCET – The Islamia University of Bahawalpur",
  shortName: "IEEE CS UCET-IUB",
  logoUrl: "/ieee-cs-logo.png",
  logoWhiteUrl: "/ieee-cs-logo-white.png",
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
    general: "ieeecsiub.contact@gmail.com",
    verify: "ieeecsiub.contact@gmail.com",
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
    id: "admin-1",
    email: "roshan.ashraf@ieee.org",
    name: "Muhammad Roshan Ashraf",
    role: "ADMIN" as const,
    twoFactorEnabled: true,
    tenureStart: "2026-01-01",
    tenureEnd: "2030-12-31",
  },
];
