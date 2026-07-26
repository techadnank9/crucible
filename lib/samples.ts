// Synthetic test fixtures — fictional patient, fictional findings.
// Not sourced from any real report; written to match standard
// BI-RADS / surgical pathology report structure for demo/testing only.

export const SAMPLE_REPORTS = [
  {
    label: "Mammogram (BI-RADS)",
    question: "Is this BI-RADS category correct given the described findings?",
    text: `MAMMOGRAPHY REPORT (Diagnostic, Bilateral)
Clinical history: 52-year-old female, palpable lump left breast. Family history of breast cancer (mother, diagnosed age 58).
Comparison: None available.

Findings: Breasts are heterogeneously dense (ACR category C). Right breast: no significant abnormality. Left breast, upper outer quadrant: 9mm irregular mass with indistinct margins, corresponding to the palpable finding. No associated suspicious calcifications. No skin thickening or nipple retraction.

Impression: Left breast irregular mass with indistinct margins.
BI-RADS Category: 3 — Probably benign.
Recommendation: Short-interval follow-up mammogram in 6 months.`,
  },
  {
    label: "Biopsy pathology",
    question: "Does this diagnosis account for everything in the report, including the comment line?",
    text: `SURGICAL PATHOLOGY REPORT
Specimen: Left breast, core needle biopsy.
Clinical history: 9mm irregular mass, left breast, BI-RADS 4.

Gross description: Three cores of tan-white tissue, aggregate length 1.8 cm.

Microscopic description: Sections show invasive ductal carcinoma, moderately differentiated, with associated ductal carcinoma in situ (DCIS), intermediate nuclear grade. Lymphovascular invasion: indeterminate due to crush artifact. Margins: not applicable (core biopsy).

Diagnosis: Invasive ductal carcinoma, grade 2.
Comment: Recommend clinical correlation and surgical excision for definitive margin assessment.`,
  },
] as const;
