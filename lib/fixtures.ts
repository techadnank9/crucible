/**
 * Demo fixtures for report mode.
 *
 * All text here is synthetic. It was composed to follow the shape of standard
 * ACR BI-RADS and surgical pathology reporting. It is not real, is not derived
 * from a real report, and contains no patient data.
 *
 * Each fixture plants an *internal contradiction*: the report's own stated
 * conclusion does not follow from the findings written elsewhere in the same
 * report. That is the failure mode Crucible is built to catch, and it is
 * checkable from the document alone without outside clinical knowledge.
 */

export type ReportFixture = {
  id: string;
  /** Chip label. */
  label: string;
  /** Question pre-filled alongside the report. */
  question: string;
  report: string;
  /** What the Attacker is expected to surface. Not shown in the UI. */
  plantedError: string;
};

export const REPORT_FIXTURES: readonly ReportFixture[] = [
  {
    id: "birads",
    label: "Mammogram — BI-RADS category",
    question: "Is this BI-RADS category correct given the described findings?",
    plantedError:
      "The report describes an irregular mass with indistinct margins in a patient with a first-degree family history, then assigns Category 3 (probably benign) and a six-month watch. Irregular shape plus indistinct margins is suspicious morphology, which does not sit with a probably-benign category.",
    report: `MAMMOGRAPHY REPORT (Diagnostic, Bilateral)
Clinical history: 52-year-old female, palpable lump left breast. Family history of breast cancer (mother, diagnosed age 58).
Comparison: None available.

Findings: Breasts are heterogeneously dense (ACR category C). Right breast: no significant abnormality. Left breast, upper outer quadrant: 9mm irregular mass with indistinct margins, corresponding to the palpable finding. No associated suspicious calcifications. No skin thickening or nipple retraction.

Impression: Left breast irregular mass with indistinct margins.
BI-RADS Category: 3 — Probably benign.
Recommendation: Short-interval follow-up mammogram in 6 months.`,
  },
  {
    id: "pathology",
    label: "Pathology — margin status",
    question:
      "Does the diagnosis line accurately summarise the microscopic findings?",
    plantedError:
      'The microscopic description places DCIS focally within 0.1 cm of the inferior margin, yet the diagnosis line states "margins negative". Lymphovascular invasion and extranodal extension are also described in the microscopic section but dropped from the summary.',
    report: `SURGICAL PATHOLOGY REPORT
Specimen: Left breast, lumpectomy with wire localisation; left axillary sentinel lymph nodes (2).
Clinical history: 58-year-old female, screen-detected mass. Core biopsy positive for invasive carcinoma.

Gross description: Lumpectomy specimen 4.2 x 3.5 x 2.8 cm, oriented with sutures. Sectioning reveals a firm tan-white mass measuring 1.8 cm, located 0.1 cm from the inferior margin and 1.9 cm or greater from all other margins.

Microscopic description: Invasive ductal carcinoma, Nottingham grade 2 (tubule 3, nuclear 2, mitotic 1). Associated ductal carcinoma in situ, intermediate grade, comprising approximately 25% of tumour volume and extending focally to within 0.1 cm of the inferior margin. Lymphovascular invasion is present. Two sentinel lymph nodes examined; one contains a 0.4 cm metastatic deposit with extranodal extension.

Immunohistochemistry: ER 95% positive, PR 60% positive, HER2 negative (IHC 1+). Ki-67 18%.

DIAGNOSIS:
Invasive ductal carcinoma, 1.8 cm, Nottingham grade 2. Margins negative. One of two sentinel lymph nodes positive.`,
  },
];

/** Upper bound on a pasted report, mirrored by the /api/solve validator. */
export const MAX_REPORT_CHARS = 20000;
