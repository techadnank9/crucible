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
    label: "Mammogram + US — BI-RADS category",
    question: "Is this BI-RADS category correct given the described findings?",
    plantedError:
      "The report stacks up suspicious descriptors — irregular shape, indistinct margins, taller-than-wide sonographic orientation, posterior acoustic shadowing, a palpable finding, and a first-degree family history — then assigns Category 3 (probably benign) with a six-month watch. Category 3 also carries a stated ceiling of roughly 2% malignancy, and the report offers no prior comparison to support stability. Every one of those findings is quotable straight from the document.",
    report: `DIAGNOSTIC MAMMOGRAPHY AND TARGETED ULTRASOUND
Accession: SYN-4417-B   |   Exam date: 12 March   |   Modality: FFDM + US
Referring clinician: Family Medicine   |   Reading radiologist: [redacted]

CLINICAL HISTORY
52-year-old female presenting with a self-detected palpable lump in the left
breast, first noticed approximately six weeks ago and reported as persistent
and non-tender. No nipple discharge. No prior breast surgery or biopsy. No
hormone replacement therapy. Family history: mother diagnosed with breast
carcinoma at age 58; no known genetic testing in the family.

COMPARISON
None available. No prior imaging in this system.

TECHNIQUE
Bilateral full-field digital mammography performed in standard CC and MLO
projections. Spot compression magnification views of the left upper outer
quadrant obtained. Targeted ultrasound of the left breast performed with a
12-5 MHz linear transducer over the area of palpable concern, marked with a
radiopaque skin marker.

FINDINGS
Breast composition: ACR category C — heterogeneously dense, which may obscure
small masses.

Right breast: No mass, architectural distortion, or suspicious calcification.
Scattered benign-appearing calcifications noted in the lower inner quadrant,
stable in morphology and unchanged in distribution.

Left breast: In the upper outer quadrant, corresponding to the palpable
finding and the skin marker, there is a 9mm mass. On spot compression the
mass demonstrates an irregular shape with indistinct margins. No associated
suspicious calcifications are identified. No architectural distortion in the
surrounding parenchyma. No skin thickening, nipple retraction, or trabecular
coarsening.

Targeted ultrasound: At the 2 o'clock position, 4cm from the nipple, a
hypoechoic mass measuring 9 x 8 x 6mm is identified, corresponding to the
mammographic finding. The mass is taller-than-wide in orientation. Margins
are indistinct with a suggestion of angularity along the posterior aspect.
Mild posterior acoustic shadowing is present. No internal vascularity
demonstrated on colour Doppler.

Axilla: Left axillary survey demonstrates two lymph nodes with preserved
fatty hila and cortical thickness measuring up to 2mm. No rounded or
cortically thickened nodes identified.

IMPRESSION
Left breast irregular mass with indistinct margins in the upper outer
quadrant, corresponding to the palpable area of concern, with sonographic
correlate demonstrating taller-than-wide orientation and posterior acoustic
shadowing. Normal-appearing left axillary lymph nodes.

BI-RADS CATEGORY: 3 — Probably benign.

RECOMMENDATION
Short-interval follow-up diagnostic mammogram and targeted ultrasound of the
left breast in 6 months. Patient advised to return sooner if the palpable
finding enlarges or changes in character. Routine screening of the right
breast to continue at the standard interval.`,
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
