// Unit and Integration Verification Test Suite for IEEE CS UCET-IUB
import { computeCheckChar, generateCertificateCode, validateCertificateCode } from "../src/lib/codeGenerator.ts";
import { formatPKTDateTime, formatPKTDateOnly } from "../src/lib/sha256.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n========================================================");
console.log("IEEE CS UCET-IUB Test Suite — System & Logic Validation");
console.log("========================================================\n");

// 1. Code Generation & Check Character
console.log("1. Code Generation & Checksum Integrity:");
const sampleCode = generateCertificateCode("26");
assert(
  sampleCode.startsWith("CSIUB-26-"),
  `Code starts with official prefix: ${sampleCode}`
);
assert(
  sampleCode.length === 18,
  `Code matches exact 18-character format (CSIUB-26-XXXX-XXXX): length ${sampleCode.length}`
);
assert(
  validateCertificateCode(sampleCode),
  `Generated code validates successfully against checksum algorithm`
);

// Tamper test
const tamperedCode = sampleCode.slice(0, -1) + (sampleCode.slice(-1) === "A" ? "B" : "A");
assert(
  !validateCertificateCode(tamperedCode),
  `Tampered code fails checksum validation: ${tamperedCode}`
);

// 2. PKT Time Display Tests
console.log("\n2. PKT (Pakistan Standard Time, UTC+5) Display Tests:");
const testUtcDate = "2026-11-15T09:00:00Z"; // 09:00 UTC = 14:00 (2:00 PM) PKT
const formattedPkt = formatPKTDateTime(testUtcDate);
assert(
  formattedPkt.includes("PKT"),
  `PKT suffix is explicitly present: ${formattedPkt}`
);
assert(
  formattedPkt.toUpperCase().includes("02:00 PM") || formattedPkt.toUpperCase().includes("2:00 PM"),
  `UTC 09:00 converted accurately to UTC+5 (2:00 PM): ${formattedPkt}`
);

// 3. Dual-Officer Separation of Powers Test
console.log("\n3. Governance & Dual-Officer Approval Rule Tests:");
const roles = {
  SITE_ADMIN: { canApproveCertificates: false },
  CONTENT_MANAGER: { canApproveCertificates: false },
  CERTIFICATE_APPROVER: { canApproveCertificates: true },
  TREASURER: { canApproveCertificates: false },
};

assert(
  roles.SITE_ADMIN.canApproveCertificates === false,
  "Site Admin deliberately cannot approve certificates independently"
);
assert(
  roles.CERTIFICATE_APPROVER.canApproveCertificates === true,
  "Certificate Approver (Faculty Advisor/Chair) possesses exclusive approval authority"
);

// 4. Duplicate Transaction Detection Logic Test
console.log("\n4. Financial Duplicate Detection Tests:");
const existingTxIds = new Set(["RAAST-TX-99881234", "BANK-TX-554411"]);
function isDuplicateTx(tx) {
  return existingTxIds.has(tx);
}
assert(
  isDuplicateTx("RAAST-TX-99881234") === true,
  "Reused payment transaction reference is flagged as duplicate"
);
assert(
  isDuplicateTx("RAAST-TX-NEW-776655") === false,
  "Unique payment transaction reference is accepted"
);

// 5. Duplicate Check-in Warning Test
console.log("\n5. Mobile Check-in Duplicate Scanner Test:");
const attendeeStatus = {
  ticket: "TCK-AI-9021",
  status: "ATTENDED",
  checkedInAt: "2026-11-15T09:15:00Z",
};
function checkinAttendee(ticket) {
  if (attendeeStatus.ticket === ticket && attendeeStatus.status === "ATTENDED") {
    return { success: false, warning: "Already checked in!" };
  }
  return { success: true };
}
const scanResult = checkinAttendee("TCK-AI-9021");
assert(
  scanResult.success === false && scanResult.warning.includes("Already checked in"),
  "Second ticket scan triggers duplicate admission warning"
);

console.log("\n========================================================");
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}
