import XLSX from "xlsx";
import { db } from "../db";
import { clinics, networkDoctors } from "../../shared/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCTOR_MASTER_FILE = path.resolve(
  __dirname,
  "../../attached_assets/Doctor_and_Clinic_Master-_USE_THIS_ONE!!!_(2)_1770777858872.xlsx"
);
const SIGNNOW_FILE = path.resolve(
  __dirname,
  "../../attached_assets/ClinicsSignNOwupdated_1770777940919.xlsx"
);

const MOTHER_PMA_ID = "mother-pma-forgotten-formula";

interface DoctorRow {
  drName: string;
  clinicName: string;
  phone: string;
  onboardingDate: string | null;
  onboardedBy: string | null;
  practiceType: string | null;
  address: string | null;
  onMap: string | null;
  email: string | null;
  signupLink: string | null;
}

interface SignNowRow {
  clinic: string;
  url: string | null;
  signNowLink: string | null;
  contactName: string | null;
  pmaCallStatus: string | null;
}

function parseAddress(rawAddress: string | null): {
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
} {
  if (!rawAddress || rawAddress === "-") {
    return { address: null, city: null, state: null, zipCode: null };
  }

  const cleaned = rawAddress.replace(/\n/g, " ").trim();

  const zipMatch = cleaned.match(/(\d{5})(-\d{4})?$/);
  const zipCode = zipMatch ? zipMatch[1] : null;

  const stateAbbrevs =
    /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|Tx|Ca|Ne|Co|Mo|Nv|tx|ca|ne|co|mo|nv)\b/;
  const stateMatch = cleaned.match(stateAbbrevs);
  const state = stateMatch ? stateMatch[1].toUpperCase() : null;

  const parts = cleaned.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    const streetAddress = parts.slice(0, -2).join(", ");
    const city = parts[parts.length - 2];
    return {
      address: streetAddress || null,
      city: city || null,
      state,
      zipCode,
    };
  }

  if (parts.length === 2) {
    return {
      address: parts[0] || null,
      city: null,
      state,
      zipCode,
    };
  }

  if (state) {
    const stateIdx = cleaned.search(stateAbbrevs);
    const beforeState = cleaned.substring(0, stateIdx).trim();
    const lastSpace = beforeState.lastIndexOf(" ");
    if (lastSpace > 0) {
      return {
        address: beforeState.substring(0, lastSpace).trim() || null,
        city: beforeState.substring(lastSpace + 1).trim() || null,
        state,
        zipCode,
      };
    }
  }

  return { address: cleaned, city: null, state, zipCode };
}

function extractClinicId(url: string | null): number | null {
  if (!url) return null;
  const match = url.match(/clinic_id=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function readDoctorMaster(): DoctorRow[] {
  const wb = XLSX.readFile(DOCTOR_MASTER_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
  const results: DoctorRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const drName = String(row[0] || "").trim();
    const clinicName = String(row[1] || "").trim();
    if (!drName && !clinicName) continue;

    results.push({
      drName,
      clinicName: clinicName || drName,
      phone: String(row[2] || "").trim(),
      onboardingDate: row[3] ? String(row[3]).trim() : null,
      onboardedBy: row[4] ? String(row[4]).trim() : null,
      practiceType: row[5] ? String(row[5]).trim() : null,
      address: row[6] ? String(row[6]).trim() : null,
      onMap: row[7] ? String(row[7]).trim() : null,
      email: row[9] ? String(row[9]).trim() : null,
      signupLink: row[10] ? String(row[10]).trim() : null,
    });
  }

  return results;
}

function readSignNowFile(): SignNowRow[] {
  const wb = XLSX.readFile(SIGNNOW_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
  const results: SignNowRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    results.push({
      clinic: String(row[0] || "").trim(),
      url: row[1] ? String(row[1]).trim() : null,
      signNowLink: row[2] ? String(row[2]).trim() : null,
      contactName: row[3] ? String(row[3]).trim() : null,
      pmaCallStatus: row[4] ? String(row[4]).trim() : null,
    });
  }

  return results;
}

function findSignNowMatch(
  clinicName: string,
  signNowData: SignNowRow[]
): SignNowRow | null {
  for (const sn of signNowData) {
    if (fuzzyMatch(clinicName, sn.clinic)) {
      return sn;
    }
  }
  return null;
}

function determinePmaAndContactStatus(
  hasSignNowLink: boolean,
  onBothLists: boolean,
  pmaCallStatus: string | null,
  notes: string | null
): { pmaStatus: string; contactStatus: string } {
  if (notes && notes.toLowerCase().includes("no signed contracts")) {
    return { pmaStatus: "pending", contactStatus: "no_contract" };
  }
  if (notes && notes.toLowerCase().includes("no payment")) {
    return { pmaStatus: "pending", contactStatus: "no_contract" };
  }

  if (hasSignNowLink && onBothLists) {
    return { pmaStatus: "active", contactStatus: "confirmed" };
  }

  if (pmaCallStatus) {
    const status = pmaCallStatus.toLowerCase().trim();
    if (status === "yes" || status.includes("already talked")) {
      return { pmaStatus: "active", contactStatus: "confirmed" };
    }
    if (status.includes("waiting")) {
      return { pmaStatus: "pending", contactStatus: "waiting" };
    }
  }

  return { pmaStatus: "pending", contactStatus: "pending" };
}

async function syncClinics() {
  console.log("=== Clinic & PMA Data Sync ===");
  console.log("Reading Doctor/Clinic Master spreadsheet...");
  const doctorRows = readDoctorMaster();
  console.log(`  Found ${doctorRows.length} doctor/clinic rows`);

  console.log("Reading SignNow spreadsheet...");
  const signNowRows = readSignNowFile();
  console.log(`  Found ${signNowRows.length} SignNow rows`);

  let insertedClinics = 0;
  let updatedClinics = 0;
  let insertedDoctors = 0;
  let updatedDoctors = 0;

  const processedClinicNames = new Set<string>();

  for (const doc of doctorRows) {
    const clinicKey = normalize(doc.clinicName);
    if (processedClinicNames.has(clinicKey)) {
      continue;
    }
    processedClinicNames.add(clinicKey);

    const isMother =
      doc.clinicName.toLowerCase().includes("forgotten formula clinic");

    const signNowMatch = findSignNowMatch(doc.clinicName, signNowRows);
    const hasSignNowLink = !!(signNowMatch && signNowMatch.signNowLink);
    const onBothLists = !!signNowMatch;

    const { pmaStatus, contactStatus } = isMother
      ? { pmaStatus: "active", contactStatus: "confirmed" }
      : determinePmaAndContactStatus(
          hasSignNowLink,
          onBothLists,
          signNowMatch?.pmaCallStatus || null,
          null
        );

    const signupUrl = doc.signupLink || signNowMatch?.url || null;
    const wpClinicId = extractClinicId(signupUrl);
    const parsed = parseAddress(doc.address);

    const onMapValue =
      doc.onMap &&
      (doc.onMap.toLowerCase() === "yes" || doc.onMap.toLowerCase() === "y");

    const clinicData = {
      name: doc.clinicName,
      slug: slugify(doc.clinicName),
      wpClinicId,
      doctorName: doc.drName,
      phone: doc.phone || null,
      email: doc.email || null,
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zipCode: parsed.zipCode,
      practiceType: doc.practiceType || null,
      onboardedBy: doc.onboardedBy || null,
      onboardingDate: doc.onboardingDate || null,
      onMap: onMapValue || false,
      signupUrl: signupUrl || null,
      signNowMemberLink: signNowMatch?.signNowLink || null,
      pmaName: isMother
        ? "Forgotten Formula Mother PMA"
        : `${doc.clinicName} Division PMA`,
      pmaStatus,
      pmaType: isMother ? "mother" : "child",
      parentPmaId: isMother ? null : MOTHER_PMA_ID,
      contactStatus,
      isActive: true,
    };

    console.log(`Processing clinic: ${doc.clinicName}...`);

    const existing = await db
      .select()
      .from(clinics)
      .where(eq(clinics.name, doc.clinicName))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(clinics)
        .set(clinicData)
        .where(eq(clinics.id, existing[0].id));
      updatedClinics++;
    } else {
      let existingByEmail = null;
      if (doc.email) {
        const found = await db
          .select()
          .from(clinics)
          .where(eq(clinics.email, doc.email))
          .limit(1);
        if (found.length > 0) existingByEmail = found[0];
      }

      if (existingByEmail) {
        await db
          .update(clinics)
          .set(clinicData)
          .where(eq(clinics.id, existingByEmail.id));
        updatedClinics++;
      } else {
        await db.insert(clinics).values(clinicData);
        insertedClinics++;
      }
    }
  }

  const processedSignNowClinics = new Set<string>();
  for (const sn of signNowRows) {
    const snKey = normalize(sn.clinic);
    if (processedClinicNames.has(snKey) || processedSignNowClinics.has(snKey)) {
      continue;
    }
    processedSignNowClinics.add(snKey);

    const signupUrl = sn.url || null;
    const wpClinicId = extractClinicId(signupUrl || sn.signNowLink);
    const { pmaStatus, contactStatus } = determinePmaAndContactStatus(
      !!sn.signNowLink,
      false,
      sn.pmaCallStatus,
      null
    );

    const clinicData = {
      name: sn.clinic,
      slug: slugify(sn.clinic),
      wpClinicId,
      doctorName: sn.contactName || null,
      signupUrl,
      signNowMemberLink: sn.signNowLink || null,
      pmaName: `${sn.clinic} Division PMA`,
      pmaStatus,
      pmaType: "child" as const,
      parentPmaId: MOTHER_PMA_ID,
      contactStatus,
      isActive: true,
    };

    console.log(`Processing SignNow-only clinic: ${sn.clinic}...`);

    const existing = await db
      .select()
      .from(clinics)
      .where(eq(clinics.name, sn.clinic))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(clinics)
        .set(clinicData)
        .where(eq(clinics.id, existing[0].id));
      updatedClinics++;
    } else {
      await db.insert(clinics).values(clinicData);
      insertedClinics++;
    }
  }

  console.log("\n--- Syncing Network Doctors ---");

  for (const doc of doctorRows) {
    if (!doc.drName) continue;

    const parsed = parseAddress(doc.address);
    const onMapValue =
      doc.onMap &&
      (doc.onMap.toLowerCase() === "yes" || doc.onMap.toLowerCase() === "y");

    const doctorData = {
      drName: doc.drName,
      clinicName: doc.clinicName || null,
      phoneNumber: doc.phone || null,
      onboardingDate: doc.onboardingDate || null,
      onboardedBy: doc.onboardedBy || null,
      practiceType: doc.practiceType || null,
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zipCode: parsed.zipCode,
      onMap: onMapValue || false,
      email: doc.email || null,
      signupLink: doc.signupLink || null,
      isActive: true,
    };

    console.log(`Processing doctor: ${doc.drName}...`);

    const existing = await db
      .select()
      .from(networkDoctors)
      .where(eq(networkDoctors.drName, doc.drName))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(networkDoctors)
        .set(doctorData)
        .where(eq(networkDoctors.id, existing[0].id));
      updatedDoctors++;
    } else {
      await db.insert(networkDoctors).values(doctorData);
      insertedDoctors++;
    }
  }

  console.log("\n=== Sync Complete ===");
  console.log(
    `Clinics: ${insertedClinics} inserted, ${updatedClinics} updated`
  );
  console.log(
    `Doctors: ${insertedDoctors} inserted, ${updatedDoctors} updated`
  );
  console.log(
    `Total clinics processed: ${processedClinicNames.size + processedSignNowClinics.size}`
  );
  console.log(`Total doctors processed: ${doctorRows.length}`);
}

syncClinics()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
