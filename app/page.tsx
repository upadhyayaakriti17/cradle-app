"use client";

import React, { useEffect, useState } from "react";

interface MachineSpec {
  id: string;
  nameKey: string;
  tonnage: number;
  max_shot_weight_grams: number;
  rated_reference_resin: string;
  rated_reference_density_g_cc: number;
  tie_bar_spacing_mm: number;
}

interface PlasticGrade {
  id: string;
  short_name: string;
  full_label: string;
  category: "baseline" | "bio";
  bio_type: "fossil" | "bio_based_non_compostable" | "compostable";
  density_g_cc: number;
  shrinkage_min_pct: number;
  shrinkage_max_pct: number;
  melt_temp_min: number;
  melt_temp_max: number;
  mold_temp_min: number;
  mold_temp_max: number;
  drying_required: boolean;
  drying_temp_c: number;
  drying_time_hrs: number;
  moisture_target_pct: number;
  max_residence_time_sec: number;
  price_per_kg_inr: number;
  heat_deflection_temp_c: number;
  ul94_rating: "HB" | "V-2" | "V-0";
  food_contact_suitable: boolean;
  compostable: boolean;
  availability_note: string;
  brittleness_flow_notes: string;
  source_note: string;
}

type TierNumber = 1 | 2 | 3 | 4;
type TierLabel = "TIER 1 DROP-IN" | "TIER 2 PROCESS-ONLY" | "TIER 3 TOOLING REWORK" | "TIER 4 MAJOR";
type VerdictCode = "DROP_IN_READY" | "FEASIBLE_WITH_CONDITIONS" | "FEASIBLE WITH TOOLING REWORK" | "NOT_SUITABLE";

interface RuleEvaluation {
  rule: string;
  status: "PASS" | "CONDITIONAL" | "FAIL";
  detail: string;
  isHardDisqualifier?: boolean;
}

interface EvaluatedResin {
  grade: PlasticGrade;
  tier: TierNumber;
  tierLabel: TierLabel;
  score: number;
  verdictCode: VerdictCode;
  excluded: boolean;
  exclusionReasons: string[];
  modificationsNeeded: string[];
  processConditions: string[];
  nominalDevMm: number;
  uncertaintyMm: number;
  fitStatus: "Within tolerance" | "Marginal" | "Exceeds tolerance";
  isOversize: boolean;
  hdtMarginC: number;
  hotFillOk: boolean;
  flameOk: boolean;
  foodOk: boolean;
  compostableGoalMet: boolean;
  actualSinglePartWeightG: number;
  actualTotalShotWeightG: number;
  machineRatedCapacityInResinG: number;
  barrelUtilizationPct: number;
  doubledCavityUtilizationPct: number;
  doubledCavityClampTonsNeeded: number;
  doubledCavityClampFeasible: boolean;
  estimatedResidenceTimeSec: number;
  residenceOk: boolean;
  costPer1000Inr: number;
  baselineCostPer1000Inr: number;
  costDeltaPer1000Inr: number;
  costMultiple: number;
  rules: RuleEvaluation[];
  oneLineReasonVsBaseline: string;
}

const PLASTIC_DATABASE: PlasticGrade[] = [
  {
    id: "grd_pp",
    short_name: "PP",
    full_label: "Standard Polypropylene (PP)",
    category: "baseline",
    bio_type: "fossil",
    density_g_cc: 0.91,
    shrinkage_min_pct: 1.5,
    shrinkage_max_pct: 2.0,
    melt_temp_min: 210,
    melt_temp_max: 250,
    mold_temp_min: 20,
    mold_temp_max: 50,
    drying_required: false,
    drying_temp_c: 0,
    drying_time_hrs: 0,
    moisture_target_pct: 0.2,
    max_residence_time_sec: 480,
    price_per_kg_inr: 110,
    heat_deflection_temp_c: 100,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: false,
    availability_note: "Widely available domestic commodity resin",
    brittleness_flow_notes: "High fatigue resistance, live-hinge capable, high crystalline shrinkage.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_hdpe",
    short_name: "HDPE",
    full_label: "High-Density Polyethylene (HDPE)",
    category: "baseline",
    bio_type: "fossil",
    density_g_cc: 0.95,
    shrinkage_min_pct: 2.0,
    shrinkage_max_pct: 3.0,
    melt_temp_min: 200,
    melt_temp_max: 260,
    mold_temp_min: 20,
    mold_temp_max: 60,
    drying_required: false,
    drying_temp_c: 0,
    drying_time_hrs: 0,
    moisture_target_pct: 0.1,
    max_residence_time_sec: 480,
    price_per_kg_inr: 115,
    heat_deflection_temp_c: 85,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: false,
    availability_note: "Widely available domestic commodity resin",
    brittleness_flow_notes: "Tough, chemical resistant, high crystalline mold shrinkage.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_abs",
    short_name: "ABS",
    full_label: "Standard ABS",
    category: "baseline",
    bio_type: "fossil",
    density_g_cc: 1.04,
    shrinkage_min_pct: 0.4,
    shrinkage_max_pct: 0.7,
    melt_temp_min: 220,
    melt_temp_max: 250,
    mold_temp_min: 50,
    mold_temp_max: 80,
    drying_required: true,
    drying_temp_c: 80,
    drying_time_hrs: 3,
    moisture_target_pct: 0.1,
    max_residence_time_sec: 420,
    price_per_kg_inr: 155,
    heat_deflection_temp_c: 90,
    ul94_rating: "HB",
    food_contact_suitable: false,
    compostable: false,
    availability_note: "Standard engineering enclosure grade",
    brittleness_flow_notes: "Amorphous, low isotropic shrinkage, good impact strength.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_pc",
    short_name: "PC",
    full_label: "Standard Polycarbonate (PC)",
    category: "baseline",
    bio_type: "fossil",
    density_g_cc: 1.2,
    shrinkage_min_pct: 0.5,
    shrinkage_max_pct: 0.7,
    melt_temp_min: 280,
    melt_temp_max: 320,
    mold_temp_min: 80,
    mold_temp_max: 110,
    drying_required: true,
    drying_temp_c: 120,
    drying_time_hrs: 4,
    moisture_target_pct: 0.02,
    max_residence_time_sec: 360,
    price_per_kg_inr: 280,
    heat_deflection_temp_c: 135,
    ul94_rating: "V-2",
    food_contact_suitable: true,
    compostable: false,
    availability_note: "Standard engineering resin",
    brittleness_flow_notes: "High impact, high heat deflection, high melt viscosity.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_bio_pp",
    short_name: "Bio-PP",
    full_label: "Bio-based PP (drop-in, chemically PP — bio-based, not biodegradable or compostable)",
    category: "bio",
    bio_type: "bio_based_non_compostable",
    density_g_cc: 0.91,
    shrinkage_min_pct: 1.5,
    shrinkage_max_pct: 2.0,
    melt_temp_min: 200,
    melt_temp_max: 240,
    mold_temp_min: 25,
    mold_temp_max: 50,
    drying_required: false,
    drying_temp_c: 0,
    drying_time_hrs: 0,
    moisture_target_pct: 0.1,
    max_residence_time_sec: 480,
    price_per_kg_inr: 295,
    heat_deflection_temp_c: 100,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: false,
    availability_note: "Imported via Indian distributors (2–4 week lead time); bio-based, not biodegradable or compostable",
    brittleness_flow_notes: "Chemically identical to fossil PP; matches PP shrinkage, live-hinge and cap torque performance.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_bio_pe",
    short_name: "Bio-PE",
    full_label: "Bio-based HDPE (drop-in, chemically HDPE — bio-based, not biodegradable or compostable)",
    category: "bio",
    bio_type: "bio_based_non_compostable",
    density_g_cc: 0.95,
    shrinkage_min_pct: 2.0,
    shrinkage_max_pct: 3.0,
    melt_temp_min: 200,
    melt_temp_max: 250,
    mold_temp_min: 20,
    mold_temp_max: 50,
    drying_required: false,
    drying_temp_c: 0,
    drying_time_hrs: 0,
    moisture_target_pct: 0.05,
    max_residence_time_sec: 480,
    price_per_kg_inr: 260,
    heat_deflection_temp_c: 82,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: false,
    availability_note: "Available via sugarcane-PE importers; bio-based, not biodegradable or compostable",
    brittleness_flow_notes: "Drop-in replacement for HDPE molds; higher shrinkage than PP.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_pla_3251d",
    short_name: "Neat PLA (3251D)",
    full_label: "Neat PLA Injection Grade (Compostable under industrial conditions)",
    category: "bio",
    bio_type: "compostable",
    density_g_cc: 1.24,
    shrinkage_min_pct: 0.2,
    shrinkage_max_pct: 0.4,
    melt_temp_min: 185,
    melt_temp_max: 205,
    mold_temp_min: 25,
    mold_temp_max: 40,
    drying_required: true,
    drying_temp_c: 45,
    drying_time_hrs: 4,
    moisture_target_pct: 0.025,
    max_residence_time_sec: 300,
    price_per_kg_inr: 340,
    heat_deflection_temp_c: 55,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: true,
    availability_note: "Stocked by Indian biopolymer compounders; requires desiccant dryer",
    brittleness_flow_notes: "Low shrinkage (0.2–0.4%), rigid/brittle, softens above 55°C, creeps under sustained thread torque.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_ht_pla",
    short_name: "Heat-Resistant PLA Blend",
    full_label: "Nucleated High-Heat PLA Compound (Compostable, nucleated for hot-mold crystallization)",
    category: "bio",
    bio_type: "compostable",
    density_g_cc: 1.28,
    shrinkage_min_pct: 0.5,
    shrinkage_max_pct: 0.9,
    melt_temp_min: 190,
    melt_temp_max: 215,
    mold_temp_min: 95,
    mold_temp_max: 110,
    drying_required: true,
    drying_temp_c: 60,
    drying_time_hrs: 4,
    moisture_target_pct: 0.025,
    max_residence_time_sec: 300,
    price_per_kg_inr: 410,
    heat_deflection_temp_c: 95,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: true,
    availability_note: "Specialty compound; requires pressurized hot-water/oil mold heater (95–110°C)",
    brittleness_flow_notes: "Achieves 95°C HDT only when crystallized in a 95–110°C mold (+10–15s cycle time).",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_pbs",
    short_name: "Bio-PBS",
    full_label: "Polybutylene Succinate (Bio-PBS — ductile compostable polyester)",
    category: "bio",
    bio_type: "compostable",
    density_g_cc: 1.26,
    shrinkage_min_pct: 1.2,
    shrinkage_max_pct: 1.7,
    melt_temp_min: 170,
    melt_temp_max: 195,
    mold_temp_min: 25,
    mold_temp_max: 45,
    drying_required: true,
    drying_temp_c: 65,
    drying_time_hrs: 4,
    moisture_target_pct: 0.05,
    max_residence_time_sec: 330,
    price_per_kg_inr: 440,
    heat_deflection_temp_c: 88,
    ul94_rating: "HB",
    food_contact_suitable: true,
    compostable: true,
    availability_note: "Imported specialty compostable resin; closer shrinkage to PP than PLA",
    brittleness_flow_notes: "Flexible, tougher than PLA, moderate shrinkage (1.2–1.7%), HDT 88°C.",
    source_note: "Typical values from supplier TDS, verify current revision."
  },
  {
    id: "grd_pc_pla_fr",
    short_name: "Bio-PC/PLA FR (V-0)",
    full_label: "Flame-Retardant Bio-PC/PLA Alloy (UL94 V-0, non-compostable engineering bio-blend)",
    category: "bio",
    bio_type: "bio_based_non_compostable",
    density_g_cc: 1.23,
    shrinkage_min_pct: 0.4,
    shrinkage_max_pct: 0.7,
    melt_temp_min: 230,
    melt_temp_max: 255,
    mold_temp_min: 60,
    mold_temp_max: 80,
    drying_required: true,
    drying_temp_c: 85,
    drying_time_hrs: 4,
    moisture_target_pct: 0.02,
    max_residence_time_sec: 330,
    price_per_kg_inr: 485,
    heat_deflection_temp_c: 105,
    ul94_rating: "V-0",
    food_contact_suitable: false,
    compostable: false,
    availability_note: "Specialty electronics bio-alloy (~35–45% bio-carbon, not compostable); import order",
    brittleness_flow_notes: "Matches ABS/PC shrinkage (0.4–0.7%), UL94 V-0 flame rated, HDT 105°C.",
    source_note: "Typical values from supplier TDS, verify current revision."
  }
];

const BASELINE_PLASTICS = PLASTIC_DATABASE.filter((p) => p.category === "baseline");
const BIO_MATERIALS = PLASTIC_DATABASE.filter((p) => p.category === "bio");

const RAMESH_MACHINES: MachineSpec[] = [
  {
    id: "mach_small_50t",
    nameKey: "Small Press (50T)",
    tonnage: 50,
    max_shot_weight_grams: 80,
    rated_reference_resin: "GPPS",
    rated_reference_density_g_cc: 1.05,
    tie_bar_spacing_mm: 320
  },
  {
    id: "mach_work_90t",
    nameKey: "Workhorse Press (90T)",
    tonnage: 90,
    max_shot_weight_grams: 150,
    rated_reference_resin: "GPPS",
    rated_reference_density_g_cc: 1.05,
    tie_bar_spacing_mm: 410
  },
  {
    id: "mach_heavy_250t",
    nameKey: "Heavy Press (250T)",
    tonnage: 250,
    max_shot_weight_grams: 600,
    rated_reference_resin: "GPPS",
    rated_reference_density_g_cc: 1.05,
    tie_bar_spacing_mm: 630
  }
];

const PRODUCT_TYPES = [
  { id: "packaging_closure", label: "Packaging Closure / Bottle Cap" },
  { id: "food_container", label: "Food Container / Jar / Tub" },
  { id: "electronics_enclosure", label: "Electronics / Battery Enclosure" },
  { id: "toy", label: "Toy / Rigid Consumer Item" },
  { id: "automotive_part", label: "Automotive Interior / Trim Part" },
  { id: "medical", label: "Medical / Labware Component" },
  { id: "household", label: "Household Utility Item" },
  { id: "consumer_general", label: "General Molded Part (Unclassified)" }
];

export default function Home() {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("mach_small_50t");
  const [baselineGradeId, setBaselineGradeId] = useState<string>("grd_pp");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("grd_pla_3251d");
  const [buyerGoal, setBuyerGoal] = useState<"lowest_change" | "compostable_mandatory">("lowest_change");
  const [manualProductType, setManualProductType] = useState<string>("");
  const [partWeight, setPartWeight] = useState<string>("3");
  const [cavityCount, setCavityCount] = useState<string>("4");
  const [referenceDimMm, setReferenceDimMm] = useState<string>("28");
  const [toleranceMm, setToleranceMm] = useState<string>("0.15");
  const [serviceTempC, setServiceTempC] = useState<string>("50");
  const [cycleTimeSec, setCycleTimeSec] = useState<string>("22");
  const [foodContact, setFoodContact] = useState<boolean>(true);
  const [hasBatteryOrMains, setHasBatteryOrMains] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [inputChangedSinceRun, setInputChangedSinceRun] = useState<boolean>(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const res = typeof reader.result === "string" ? reader.result : "";
      setPreviewUrl(res);
      setImageBase64(res);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setImageBase64(null);
    setResult(null);
  };

  const markInputChanged = () => {
    if (result) {
      setInputChangedSinceRun(true);
    }
  };

  const callGeminiDirectly = async (base64Image: string) => {
    const apiKey = "AQ.Ab8RN6KpiOG4Llp7seoGlGD-KDn0mB8j4yLBhyWhUrWvizlJXA";
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an industrial injection molding vision classifier.
Inspect the uploaded product image and return ONLY valid JSON with these exact keys:
{
  "product_name": "Physical object name ONLY, e.g. 'Bottle Cap / Closure' or 'Earphone Charging Case'. Do NOT include any resin or material name.",
  "product_type": "Choose strictly from: packaging_closure | food_container | electronics_enclosure | toy | automotive_part | medical | household | consumer_general",
  "confidence": "high | medium | low",
  "visible_features": ["List 2 to 4 features directly observable in the photo, e.g. threads, knurling, hinge pocket, tamper band. NEVER infer wall thickness uniformity, draft angles, or hidden seal liners."]
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return JSON.parse(rawText);
    } catch {
      return null;
    }
  };

  const evaluateCandidateResin = (
    base: PlasticGrade,
    candidate: PlasticGrade,
    machine: MachineSpec,
    singleWeightBaseG: number,
    cavities: number,
    refDim: number,
    tol: number,
    sTemp: number,
    cycSec: number,
    fContact: boolean,
    batteryOrElectronics: boolean,
    pType: string,
    goal: "lowest_change" | "compostable_mandatory"
  ): EvaluatedResin => {
    const baseMid = (base.shrinkage_min_pct + base.shrinkage_max_pct) / 2;
    const baseHalfSpread = (base.shrinkage_max_pct - base.shrinkage_min_pct) / 2;

    const candMid = (candidate.shrinkage_min_pct + candidate.shrinkage_max_pct) / 2;
    const candHalfSpread = (candidate.shrinkage_max_pct - candidate.shrinkage_min_pct) / 2;

    const isSameGradeOrShrink =
      base.id === candidate.id ||
      (base.shrinkage_min_pct === candidate.shrinkage_min_pct &&
        base.shrinkage_max_pct === candidate.shrinkage_max_pct);

    const nominalDevMm = isSameGradeOrShrink
      ? 0
      : Number((((baseMid - candMid) * refDim) / 100).toFixed(2));
    const uncertaintyMm = isSameGradeOrShrink
      ? 0
      : Number((((baseHalfSpread + candHalfSpread) * refDim) / 100).toFixed(2));

    const absNominal = Math.abs(nominalDevMm);
    let fitStatus: "Within tolerance" | "Marginal" | "Exceeds tolerance" = "Within tolerance";
    if (isSameGradeOrShrink || absNominal <= tol) {
      if (!isSameGradeOrShrink && absNominal + uncertaintyMm > tol) {
        fitStatus = "Marginal";
      } else {
        fitStatus = "Within tolerance";
      }
    } else {
      fitStatus = "Exceeds tolerance";
    }

    const isOversize = nominalDevMm > 0;

    const actualSinglePartWeightG = Number(
      (singleWeightBaseG * (candidate.density_g_cc / base.density_g_cc)).toFixed(3)
    );
    const actualTotalShotWeightG = Number((actualSinglePartWeightG * cavities).toFixed(2));

    const machineRatedCapacityInResinG = Number(
      (
        machine.max_shot_weight_grams *
        (candidate.density_g_cc / machine.rated_reference_density_g_cc)
      ).toFixed(1)
    );

    const barrelUtilizationPct = Number(
      ((actualTotalShotWeightG / machineRatedCapacityInResinG) * 100).toFixed(1)
    );
    const doubledCavityUtilizationPct = Number((barrelUtilizationPct * 2).toFixed(1));

    const estProjectedAreaCm2 = Math.pow(refDim / 10, 2) * 0.85;
    const clampTonsPerCavity = (estProjectedAreaCm2 * 0.45) / 10;
    const doubledCavityClampTonsNeeded = Number((clampTonsPerCavity * cavities * 2).toFixed(1));
    const doubledCavityClampFeasible = doubledCavityClampTonsNeeded <= machine.tonnage * 0.85;

    const estimatedResidenceTimeSec = Math.round(
      (machineRatedCapacityInResinG / Math.max(actualTotalShotWeightG, 0.1)) * cycSec
    );
    const residenceOk = estimatedResidenceTimeSec <= candidate.max_residence_time_sec;

    const hdtMarginC = Number((candidate.heat_deflection_temp_c - sTemp).toFixed(1));
    const hdtOk = hdtMarginC >= 15;

    const isClosureOrFood = pType === "packaging_closure" || pType === "food_container";
    const hotFillOk = !isClosureOrFood || candidate.heat_deflection_temp_c >= 70;

    const needsFlameV0 = pType === "electronics_enclosure" || batteryOrElectronics;
    const flameOk = !needsFlameV0 || candidate.ul94_rating === "V-0" || candidate.ul94_rating === "V-2";

    const foodOk = !fContact || candidate.food_contact_suitable;
    const compostableGoalMet = goal !== "compostable_mandatory" || candidate.compostable;

    const baselineCostPer1000Inr = Math.round(singleWeightBaseG * base.price_per_kg_inr);
    const costPer1000Inr = Math.round(actualSinglePartWeightG * candidate.price_per_kg_inr);
    const costDeltaPer1000Inr = costPer1000Inr - baselineCostPer1000Inr;
    const costMultiple = Number((costPer1000Inr / Math.max(baselineCostPer1000Inr, 1)).toFixed(2));

    const rules: RuleEvaluation[] = [];
    const exclusionReasons: string[] = [];
    const modificationsNeeded: string[] = [];
    const processConditions: string[] = [];

    if (pType !== "electronics_enclosure") {
      if (fitStatus === "Within tolerance") {
        rules.push({
          rule: "Shrinkage Deviation vs Tolerance",
          status: "PASS",
          detail: `Nominal ${nominalDevMm >= 0 ? "+" : ""}${nominalDevMm} mm vs ±${tol} mm tolerance: PASS`
        });
      } else if (fitStatus === "Marginal") {
        rules.push({
          rule: "Shrinkage Deviation vs Tolerance",
          status: "CONDITIONAL",
          detail: `Nominal ${nominalDevMm >= 0 ? "+" : ""}${nominalDevMm} mm vs ±${tol} mm tolerance: CONDITIONAL (Marginal)`
        });
        processConditions.push(`Hold pressure & cooling time tuning needed to control marginal spread`);
      } else {
        rules.push({
          rule: "Shrinkage Deviation vs Tolerance",
          status: "FAIL",
          detail: `Nominal ${nominalDevMm >= 0 ? "+" : ""}${nominalDevMm} mm exceeds ±${tol} mm tolerance: FAIL`
        });
        if (isOversize) {
          modificationsNeeded.push(`Tooling rework required: part is oversized by nominal +${nominalDevMm} mm. Enlarge mold core for inner dimensions or reduce cavity steel for outer dimensions.`);
        } else {
          modificationsNeeded.push(`Tooling rework required: part is undersized by nominal ${nominalDevMm} mm. Reduce mold core steel for inner dimensions or enlarge cavity for outer dimensions.`);
        }
      }
    }

    if (hdtOk) {
      rules.push({
        rule: "HDT vs Service Temperature (≥15°C margin)",
        status: "PASS",
        detail: `HDT ${candidate.heat_deflection_temp_c}°C vs service ${sTemp}°C: margin +${hdtMarginC}°C, PASS (≥15°C)`
      });
    } else {
      const msg = `HDT ${candidate.heat_deflection_temp_c}°C vs service ${sTemp}°C: margin ${hdtMarginC}°C, FAIL (<15°C minimum margin — creep and warpage risk)`;
      rules.push({
        rule: "HDT vs Service Temperature (≥15°C margin)",
        status: "FAIL",
        detail: msg,
        isHardDisqualifier: true
      });
      exclusionReasons.push(msg);
      modificationsNeeded.push(`Switch to a higher-HDT grade or nucleated compound (current HDT ${candidate.heat_deflection_temp_c}°C gives only ${hdtMarginC}°C margin over ${sTemp}°C service temp)`);
    }

    if (isClosureOrFood) {
      if (hotFillOk) {
        rules.push({
          rule: "Hot-Fill Thermal Threshold (≥70°C)",
          status: "PASS",
          detail: `HDT ${candidate.heat_deflection_temp_c}°C ≥ 70°C: PASS`
        });
      } else {
        rules.push({
          rule: "Hot-Fill Thermal Threshold (≥70°C)",
          status: "CONDITIONAL",
          detail: `Unsuitable for hot-fill (HDT ${candidate.heat_deflection_temp_c}°C < 70°C): ambient/cold-fill only`
        });
        processConditions.push(`Restrict end-use to ambient/cold-fill only (Unsuitable for hot-fill at HDT ${candidate.heat_deflection_temp_c}°C)`);
      }
    }

    if (needsFlameV0) {
      if (flameOk) {
        rules.push({
          rule: "Flame Retardancy (UL94 V-0 required)",
          status: "PASS",
          detail: `UL94 ${candidate.ul94_rating} meets V-0 requirement: PASS`
        });
      } else {
        const msg = `UL94 ${candidate.ul94_rating} fails required V-0 flame rating for electronics/battery enclosure`;
        rules.push({
          rule: "Flame Retardancy (UL94 V-0 required)",
          status: "FAIL",
          detail: msg,
          isHardDisqualifier: true
        });
        exclusionReasons.push(msg);
        modificationsNeeded.push(`Requires flame-retardant (FR) compounding to achieve UL94 V-0`);
      }
    }

    if (fContact && !isClosureOrFood) {
      if (foodOk) {
        rules.push({
          rule: "Food Contact Suitability",
          status: "PASS",
          detail: `${candidate.short_name} is food contact approved: PASS`
        });
      } else {
        const msg = `${candidate.short_name} is not food-contact approved`;
        rules.push({
          rule: "Food Contact Suitability",
          status: "FAIL",
          detail: msg,
          isHardDisqualifier: true
        });
        exclusionReasons.push(msg);
      }
    }

    if (goal === "compostable_mandatory") {
      if (candidate.compostable) {
        rules.push({
          rule: "Buyer Compostability Mandate",
          status: "PASS",
          detail: `${candidate.short_name} is industrially compostable: PASS`
        });
      } else {
        const msg = `${candidate.short_name} is bio-based, NOT biodegradable or compostable`;
        rules.push({
          rule: "Buyer Compostability Mandate",
          status: "FAIL",
          detail: msg,
          isHardDisqualifier: true
        });
        exclusionReasons.push(msg);
      }
    }

    if (residenceOk) {
      rules.push({
        rule: "Barrel Residence Time",
        status: "PASS",
        detail: `Estimated ${estimatedResidenceTimeSec}s vs limit ${candidate.max_residence_time_sec}s: PASS`
      });
    } else {
      rules.push({
        rule: "Barrel Residence Time",
        status: "FAIL",
        detail: `Estimated ${estimatedResidenceTimeSec}s vs limit ${candidate.max_residence_time_sec}s: FAIL (Thermal degradation risk)`
      });
      modificationsNeeded.push(`Barrel residence time exceeds limit: move mold to smaller barrel press or higher-cavity mold.`);
    }

    const needsHighTempMoldOil = candidate.mold_temp_min >= 90;
    if (!candidate.drying_required && !needsHighTempMoldOil) {
      rules.push({
        rule: "Drying & Auxiliary Equipment",
        status: "PASS",
        detail: `No desiccant drying or high-temp mold heater needed: PASS`
      });
    } else {
      const equipList: string[] = [];
      if (candidate.drying_required) equipList.push(`Pre-dry at ${candidate.drying_temp_c}°C for ${candidate.drying_time_hrs}h`);
      if (needsHighTempMoldOil) equipList.push(`Requires 95–110°C mold heater`);
      rules.push({
        rule: "Drying & Auxiliary Equipment",
        status: "CONDITIONAL",
        detail: equipList.join("; ")
      });
      processConditions.push(...equipList);
    }

    const excluded = exclusionReasons.length > 0;
    let tier: TierNumber = 1;
    let tierLabel: TierLabel = "TIER 1 DROP-IN";
    let verdictCode: VerdictCode = "DROP_IN_READY";

    if (excluded || !residenceOk) {
      tier = 4;
      tierLabel = "TIER 4 MAJOR";
      verdictCode = "NOT_SUITABLE";
    } else if (fitStatus === "Exceeds tolerance") {
      tier = 3;
      tierLabel = "TIER 3 TOOLING REWORK";
      verdictCode = "FEASIBLE WITH TOOLING REWORK";
    } else if (candidate.drying_required || needsHighTempMoldOil || fitStatus === "Marginal") {
      tier = 2;
      tierLabel = "TIER 2 PROCESS-ONLY";
      verdictCode = "FEASIBLE_WITH_CONDITIONS";
    } else {
      tier = 1;
      tierLabel = "TIER 1 DROP-IN";
      verdictCode = costMultiple > 2.0 ? "FEASIBLE_WITH_CONDITIONS" : "DROP_IN_READY";
    }

    let score = 100;
    score -= Math.min(40, Math.round((absNominal / Math.max(tol, 0.05)) * 18));
    if (fitStatus === "Exceeds tolerance") score -= 25;
    if (candidate.drying_required) score -= 8;
    if (needsHighTempMoldOil) score -= 12;
    if (!hdtOk) score -= 30;
    if (!flameOk) score -= 35;
    if (!foodOk) score -= 35;
    if (!compostableGoalMet) score -= 30;
    if (!residenceOk) score -= 20;
    score -= Math.min(10, Math.max(0, Math.round((costMultiple - 1) * 3)));
    score = Math.max(5, Math.min(100, score));

    const reasonParts: string[] = [];
    reasonParts.push(`shrinkage ${candidate.shrinkage_min_pct}–{candidate.shrinkage_max_pct}% vs ${base.short_name} (nominal ${nominalDevMm >= 0 ? "+" : ""}${nominalDevMm} mm)`);
    reasonParts.push(`HDT ${candidate.heat_deflection_temp_c}°C vs service ${sTemp}°C (margin ${hdtMarginC >= 0 ? "+" : ""}${hdtMarginC}°C)`);
    if (!flameOk) reasonParts.push(`UL94 ${candidate.ul94_rating} fails required V-0`);

    return {
      grade: candidate,
      tier,
      tierLabel,
      score,
      verdictCode,
      excluded,
      exclusionReasons,
      modificationsNeeded,
      processConditions,
      nominalDevMm,
      uncertaintyMm,
      fitStatus,
      isOversize,
      hdtMarginC,
      hotFillOk,
      flameOk,
      foodOk,
      compostableGoalMet,
      actualSinglePartWeightG,
      actualTotalShotWeightG,
      machineRatedCapacityInResinG,
      barrelUtilizationPct,
      doubledCavityUtilizationPct,
      doubledCavityClampTonsNeeded,
      doubledCavityClampFeasible,
      estimatedResidenceTimeSec,
      residenceOk,
      costPer1000Inr,
      baselineCostPer1000Inr,
      costDeltaPer1000Inr,
      costMultiple,
      rules,
      oneLineReasonVsBaseline: reasonParts.join(", ")
    };
  };

  const runAnalysis = async (overrideGradeId?: string) => {
    const activeTargetId = overrideGradeId !== undefined ? overrideGradeId : selectedGradeId;
    if (overrideGradeId !== undefined) {
      setSelectedGradeId(overrideGradeId);
    }

    if (!selectedMachineId || !baselineGradeId || !partWeight) {
      setError("Please select a machine, baseline plastic, and part weight.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setInputChangedSinceRun(false);

    try {
      const machine = RAMESH_MACHINES.find((m) => m.id === selectedMachineId) || RAMESH_MACHINES[0];
      const baseGrade = PLASTIC_DATABASE.find((p) => p.id === baselineGradeId) || PLASTIC_DATABASE[0];

      const singleWeightG = Math.max(0.1, Number(partWeight) || 3);
      const cavities = Math.max(1, Number(cavityCount) || 4);
      const refDim = Math.max(1, Number(referenceDimMm) || 28);
      const tol = Math.max(0.02, Number(toleranceMm) || 0.15);
      const sTemp = Number(serviceTempC) || 50;
      const cycSec = Math.max(3, Number(cycleTimeSec) || 22);

      let geminiData: any = null;
      if (imageBase64) {
        geminiData = await callGeminiDirectly(imageBase64);
      }

      const inferredTypeFromInputs =
        manualProductType ||
        geminiData?.product_type ||
        (baseGrade.id === "grd_abs" || hasBatteryOrMains
          ? "electronics_enclosure"
          : singleWeightG <= 10
          ? "packaging_closure"
          : "food_container");

      const inferredNameFromInputs =
        geminiData?.product_name &&
        !geminiData.product_name.toLowerCase().includes("pla") &&
        !geminiData.product_name.toLowerCase().includes("enclosure")
          ? geminiData.product_name
          : inferredTypeFromInputs === "packaging_closure"
          ? "Bottle Cap / Closure"
          : inferredTypeFromInputs === "electronics_enclosure"
          ? "Electronics / Earphone Charging Case"
          : inferredTypeFromInputs === "food_container"
          ? "Thin-Wall Food Container"
          : "Molded Plastic Component";

      const observableFeatures: string[] =
        Array.isArray(geminiData?.visible_features) && geminiData.visible_features.length > 0
          ? geminiData.visible_features.filter(
              (f: string) =>
                !f.toLowerCase().includes("uniform") &&
                !f.toLowerCase().includes("draft") &&
                !f.toLowerCase().includes("seal liner")
            )
          : inferredTypeFromInputs === "packaging_closure"
          ? ["Internal thread helix", "External grip knurling", "Tamper-evident ring"]
          : inferredTypeFromInputs === "electronics_enclosure"
          ? ["Clamshell parting line", "Hinge pocket", "Charging port cutout"]
          : ["Rim flange", "Sidewall geometry"];

      let effectiveBatteryOrElectronics = hasBatteryOrMains;
      let batteryLikelihoodNotice = "";
      if (inferredTypeFromInputs === "electronics_enclosure") {
        if (!hasBatteryOrMains) {
          batteryLikelihoodNotice = "Product likely contains a battery. Tick the battery box to apply the V-0 check.";
        }
        effectiveBatteryOrElectronics = true;
      }

      let inputSanityWarning = "";
      if (inferredTypeFromInputs === "electronics_enclosure" && baseGrade.category === "baseline" && baseGrade.id === "grd_pp" && singleWeightG < 5) {
        inputSanityWarning = "Inputs may not match the photo. Typical earphone case: ABS or PC baseline, 15–30 g, 2 cavities.";
      }

      const candidatePool = [...BIO_MATERIALS];
      if (activeTargetId && !candidatePool.some((c) => c.id === activeTargetId)) {
        const foundBase = PLASTIC_DATABASE.find((p) => p.id === activeTargetId);
        if (foundBase) candidatePool.push(foundBase);
      }

      const allEvaluated: EvaluatedResin[] = candidatePool.map((cand) =>
        evaluateCandidateResin(
          baseGrade,
          cand,
          machine,
          singleWeightG,
          cavities,
          refDim,
          tol,
          sTemp,
          cycSec,
          foodContact,
          effectiveBatteryOrElectronics,
          inferredTypeFromInputs,
          buyerGoal
        )
      );

      const baseMidShrink = (baseGrade.shrinkage_min_pct + baseGrade.shrinkage_max_pct) / 2;
      allEvaluated.forEach((ev) => {
        const candMidShrink = (ev.grade.shrinkage_min_pct + ev.grade.shrinkage_max_pct) / 2;
        if (
          baseMidShrink >= 1.5 &&
          candMidShrink > baseMidShrink + 0.3 &&
          ev.grade.id !== baseGrade.id
        ) {
          ev.excluded = true;
          const msg = `${ev.grade.short_name} has higher shrinkage than baseline, causing undersize parts`;
          if (!ev.exclusionReasons.includes(msg)) ev.exclusionReasons.push(msg);
          ev.tier = 4;
          ev.tierLabel = "TIER 4 MAJOR";
          ev.verdictCode = "NOT_SUITABLE";
        }
      });

      const rankedCandidates = [...allEvaluated].sort((a, b) => {
        if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
        if (a.tier !== b.tier) return a.tier - b.tier;
        if (b.score !== a.score) return b.score - a.score;
        return a.costMultiple - b.costMultiple;
      });

      const topRecommended = rankedCandidates[0];
      const hasTier1Or2 = rankedCandidates.some((c) => !c.excluded && (c.tier === 1 || c.tier === 2));

      const activeEval =
        allEvaluated.find((e) => e.grade.id === activeTargetId) || topRecommended;

      let bannerMode: "GOOD_CHOICE" | "BETTER_MATCH_EXISTS" | "NO_DROP_IN" = "GOOD_CHOICE";
      if (!hasTier1Or2) {
        bannerMode = "NO_DROP_IN";
      } else if (
        activeEval.grade.id !== topRecommended.grade.id &&
        (activeEval.tier > topRecommended.tier ||
          activeEval.excluded ||
          activeEval.score + 5 < topRecommended.score)
      ) {
        bannerMode = "BETTER_MATCH_EXISTS";
      } else if (activeEval.tier <= 2 && !activeEval.excluded) {
        bannerMode = "GOOD_CHOICE";
      } else {
        bannerMode = "BETTER_MATCH_EXISTS";
      }

      let regulatoryList: string[] = [];
      if (inferredTypeFromInputs === "electronics_enclosure") {
        regulatoryList = [
          "E-Waste (Management) Rules, 2022 (RoHS substance restrictions & producer take-back targets).",
          ...(effectiveBatteryOrElectronics
            ? ["Battery Waste Management Rules, 2022 & BIS CRS safety compliance (IS 13252 / IEC 62368) for enclosures housing lithium cells."]
            : [])
        ];
      } else {
        regulatoryList = [
          "Plastic Waste Management (PWM) Rules & CPCB Extended Producer Responsibility (EPR) registration for plastic packaging.",
          activeEval.grade.compostable
            ? "CPCB certification under IS/ISO 17088 required before making any 'compostable' marketing claim in India."
            : "Note: Resin is bio-based, NOT biodegradable or compostable — do not label as compostable; standard recycling EPR applies.",
          ...(foodContact
            ? [`applicable IS standard for food contact (e.g. IS 10910 for PP; verify) and FSSAI migration compliance.`]
            : [])
        ];
      }

      const smallerPresses = RAMESH_MACHINES.filter(
        (m) => m.max_shot_weight_grams < machine.max_shot_weight_grams
      ).sort((a, b) => a.max_shot_weight_grams - b.max_shot_weight_grams);

      let pressAdviceText = "";
      const fittingSmaller = smallerPresses.find((m) => {
        const capInResin =
          m.max_shot_weight_grams *
          (activeEval.grade.density_g_cc / m.rated_reference_density_g_cc);
        const util = (activeEval.actualTotalShotWeightG / capInResin) * 100;
        return util >= 20 && util <= 80;
      });

      if (fittingSmaller) {
        const capInResin = Number(
          (
            fittingSmaller.max_shot_weight_grams *
            (activeEval.grade.density_g_cc / fittingSmaller.rated_reference_density_g_cc)
          ).toFixed(1)
        );
        const newUtil = Number(
          ((activeEval.actualTotalShotWeightG / capInResin) * 100).toFixed(1)
        );
        pressAdviceText = `Move from ${machine.nameKey} to ${fittingSmaller.nameKey} (${capInResin}g capacity in ${activeEval.grade.short_name}) to raise barrel utilization from ${activeEval.barrelUtilizationPct}% to ${newUtil}%.`;
      } else {
        pressAdviceText = `Selected ${machine.nameKey} operates at ${activeEval.barrelUtilizationPct}% shot utilization. Estimated clamp tonnage needed for ${cavities} cavities (~${activeEval.doubledCavityClampTonsNeeded}T projected area basis).`;
      }

      let productRisks: string[] = [];
      if (inferredTypeFromInputs === "packaging_closure") {
        productRisks = [
          activeEval.grade.heat_deflection_temp_c < 70
            ? `Unsuitable for hot-fill (HDT ${activeEval.grade.heat_deflection_temp_c}°C < 70°C) and prone to thread creep under sustained cap torque.`
            : `Adequate thermal resistance (HDT ${activeEval.grade.heat_deflection_temp_c}°C) for standard closure torque retention.`,
          activeEval.fitStatus === "Exceeds tolerance"
            ? activeEval.isOversize
              ? `Oversize thread ID (+${activeEval.nominalDevMm} mm) causes loose engagement, back-off, and liquid/CO2 seal leakage.`
              : `Undersize thread ID (${activeEval.nominalDevMm} mm) causes high application torque and stress-cracking on bottle neck.`
            : `Thread engagement dimension matches baseline mold tolerance (±${tol} mm).`
        ];
      } else if (inferredTypeFromInputs === "electronics_enclosure") {
        productRisks = [
          !activeEval.flameOk
            ? `UL94 ${activeEval.grade.ul94_rating} rating is insufficient for battery/electronics enclosures during charging fault heating.`
            : `UL94 ${activeEval.grade.ul94_rating} flame rating meets enclosure safety threshold.`,
          activeEval.grade.id.includes("pla")
            ? `Low notched impact strength on thin snap-fit tabs and drop-test corners.`
            : `Good housing dimensional stability.`
        ];
      } else {
        productRisks = [activeEval.grade.brittleness_flow_notes];
      }

      const hardFails = activeEval.rules.filter((r) => r.status === "FAIL");
      let overallVerdictText = "";
      if (hardFails.length > 0) {
        overallVerdictText = `NOT SUITABLE AS-IS (${activeEval.tierLabel}): ${hardFails
          .map((f, i) => `(${i + 1})${f.detail}`)
          .join(" | ")}`;
      } else if (activeEval.verdictCode === "FEASIBLE WITH TOOLING REWORK") {
        overallVerdictText = `FEASIBLE WITH TOOLING REWORK (${activeEval.tierLabel}, Score ${activeEval.score}/100): Core/cavity steel change required for fit.`;
      } else if (activeEval.verdictCode === "FEASIBLE_WITH_CONDITIONS") {
        overallVerdictText = `FEASIBLE WITH PROCESS CONDITIONS (${activeEval.tierLabel}, Score ${activeEval.score}/100): No mold steel rework needed. Apply listed drying/temperature settings.`;
      } else {
        overallVerdictText = `DROP-IN READY (${activeEval.tierLabel}, Score ${activeEval.score}/100): Matches ${baseGrade.short_name} mold shrinkage and thermal requirements with zero tooling changes.`;
      }

      setResult({
        productName: inferredNameFromInputs,
        productType: inferredTypeFromInputs,
        observableFeatures,
        confidence: geminiData?.confidence || (!imageBase64 ? "template_fallback" : "medium"),
        geminiFailed: !imageBase64 || !geminiData,
        machine,
        baseGrade,
        buyerGoal,
        activeEval,
        topRecommended,
        rankedCandidates,
        excludedCandidates: allEvaluated.filter((e) => e.excluded),
        bannerMode,
        hasTier1Or2,
        overallVerdictText,
        regulatoryList,
        pressAdviceText,
        productRisks,
        batteryLikelihoodNotice,
        inputSanityWarning,
        assumptions: {
          singleWeightG,
          cavities,
          refDim,
          tol,
          sTemp,
          cycSec,
          foodContact,
          effectiveBatteryOrElectronics
        },
        rawGemini:
          geminiData || {
            mode: "client_side_gemini_direct",
            gemini_called: Boolean(imageBase64)
          }
      });
    } catch (err: any) {
      setError(err?.message || "Unexpected calculation error");
    } finally {
      setAnalyzing(false);
    }
  };

  const tierBadgeColor = (tier: TierNumber) => {
    if (tier === 1) return "bg-emerald-600 text-white";
    if (tier === 2) return "bg-teal-600 text-white";
    if (tier === 3) return "bg-amber-600 text-white";
    return "bg-red-600 text-white";
  };

  const verdictBadgeColor = (v: VerdictCode) => {
    if (v === "DROP_IN_READY") return "bg-emerald-600 text-white";
    if (v === "FEASIBLE_WITH_CONDITIONS") return "bg-amber-500 text-white";
    if (v === "FEASIBLE WITH TOOLING REWORK") return "bg-amber-600 text-white";
    return "bg-red-600 text-white";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* TOP BAR */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Cradle to Cradle Logo (increased size w-16 h-16, clean object-contain without background) */}
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/cradle-logo.png" alt="Cradle to Cradle Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold block">
                Cradle to Cradle — MSME Checker + Bio-Resin Recommender
              </span>
              <h1 className="text-lg font-extrabold">
                MSME Bioplastic Mold & Machine Calibrator
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {result && (
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow"
              >
                📥 Print PDF Report
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANE */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 print:hidden">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  1. Upload Part Photo, Mold Sample, or Drawing
                </h2>
                <p className="text-xs text-slate-500">
                  Supports all formats with instant visual preview.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500 w-full">Try an example:</span>
              <button
                type="button"
                onClick={() => {
                  setBaselineGradeId("grd_pp");
                  setSelectedGradeId("grd_pla_3251d");
                  setManualProductType("packaging_closure");
                  setPartWeight("3");
                  setCavityCount("4");
                  setReferenceDimMm("28");
                  setToleranceMm("0.15");
                  setServiceTempC("50");
                  setFoodContact(true);
                  setHasBatteryOrMains(false);
                  setBuyerGoal("lowest_change");
                  setTimeout(() => runAnalysis("grd_pla_3251d"), 50);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-full font-bold cursor-pointer"
              >
                Preset A: PP Cap → PLA
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaselineGradeId("grd_pp");
                  setSelectedGradeId("grd_bio_pp");
                  setManualProductType("packaging_closure");
                  setPartWeight("3");
                  setCavityCount("4");
                  setReferenceDimMm("28");
                  setToleranceMm("0.15");
                  setServiceTempC("50");
                  setFoodContact(true);
                  setHasBatteryOrMains(false);
                  setBuyerGoal("lowest_change");
                  setTimeout(() => runAnalysis("grd_bio_pp"), 50);
                }}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full font-bold cursor-pointer"
              >
                Preset B: PP Cap → Bio-PP
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaselineGradeId("grd_abs");
                  setSelectedGradeId("grd_pla_3251d");
                  setManualProductType("electronics_enclosure");
                  setPartWeight("18");
                  setCavityCount("2");
                  setReferenceDimMm("60");
                  setToleranceMm("0.15");
                  setServiceTempC("55");
                  setFoodContact(false);
                  setHasBatteryOrMains(true);
                  setBuyerGoal("lowest_change");
                  setTimeout(() => runAnalysis("grd_pla_3251d"), 50);
                }}
                className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full font-bold cursor-pointer"
              >
                Preset C: ABS Earphone Case → PLA
              </button>
            </div>

            {/* SECTION 1: Your part */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">1. Your part</h3>
              <div className="relative h-40 bg-slate-900 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <img src={previewUrl} alt="Part" className="max-h-full max-w-full object-contain p-2" />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold cursor-pointer"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-3 text-white pointer-events-none">
                    <div className="text-2xl mb-1">📷</div>
                    <p className="font-bold text-xs">Tap Here to Upload Any Image (.JPG, .PNG, .HEIC)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">AI Vision & Gemini API inspect part features and product context</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              {previewUrl && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-bold">Photo loaded successfully</span>
                  <label className="text-blue-600 font-bold cursor-pointer underline">
                    Replace photo
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Product Type Override</label>
                <select
                  value={manualProductType}
                  onChange={(e) => { setManualProductType(e.target.value); markInputChanged(); }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  <option value="">Auto-detect via AI (Recommended)</option>
                  {PRODUCT_TYPES.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTION 2: Your mold */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">2. Your mold</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Baseline plastic</label>
                  <select
                    value={baselineGradeId}
                    onChange={(e) => { setBaselineGradeId(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    {BASELINE_PLASTICS.map((b) => (
                      <option key={b.id} value={b.id}>{b.short_name} ({b.shrinkage_min_pct}–{b.shrinkage_max_pct}% shrink)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Press</label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => { setSelectedMachineId(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    {RAMESH_MACHINES.map((m) => (
                      <option key={m.id} value={m.id}>{m.nameKey} ({m.max_shot_weight_grams}g max)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shot weight (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={partWeight}
                    onChange={(e) => { setPartWeight(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cavities</label>
                  <input
                    type="number"
                    value={cavityCount}
                    onChange={(e) => { setCavityCount(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reference dim (mm)</label>
                  <input
                    type="number"
                    value={referenceDimMm}
                    onChange={(e) => { setReferenceDimMm(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tolerance (±mm)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={toleranceMm}
                    onChange={(e) => { setToleranceMm(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Your goal */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">3. Your goal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bio-material requested (Optional)</label>
                  <select
                    value={selectedGradeId}
                    onChange={(e) => { setSelectedGradeId(e.target.value); markInputChanged(); }}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    <option value="">-- Blank: Auto-recommend best --</option>
                    {BIO_MATERIALS.map((g) => (
                      <option key={g.id} value={g.id}>{g.short_name} ({g.shrinkage_min_pct}–{g.shrinkage_max_pct}%)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sustainability goal</label>
                  <select
                    value={buyerGoal}
                    onChange={(e) => { setBuyerGoal(e.target.value as any); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    <option value="lowest_change">Bio-based OR Compostable (Min tooling)</option>
                    <option value="compostable_mandatory">Strictly Industrial Compostable Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service temp (°C)</label>
                  <input
                    type="number"
                    value={serviceTempC}
                    onChange={(e) => { setServiceTempC(e.target.value); markInputChanged(); }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foodContact}
                    onChange={(e) => { setFoodContact(e.target.checked); markInputChanged(); }}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  Food / beverage contact required (FSSAI)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBatteryOrMains}
                    onChange={(e) => { setHasBatteryOrMains(e.target.checked); markInputChanged(); }}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  Houses lithium battery / mains electronics (UL94 V-0 required)
                </label>
              </div>
            </div>

            {/* ADVANCED SETTINGS ACCORDION */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {advancedOpen ? "▼ Hide Advanced Settings" : "▶ Advanced Settings (Cycle time, Press details)"}
              </button>
              {advancedOpen && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cycle time (s)</label>
                    <input
                      type="number"
                      value={cycleTimeSec}
                      onChange={(e) => { setCycleTimeSec(e.target.value); markInputChanged(); }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {inputChangedSinceRun && result && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-bold flex justify-between items-center">
                <span>⚠️ Inputs have changed since last run. Report is outdated.</span>
                <button
                  onClick={() => runAnalysis()}
                  className="bg-amber-600 text-white px-3 py-1 rounded-lg text-xs cursor-pointer"
                >
                  Re-run
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xl text-xs font-bold">
                ⚠️ {error}
              </div>
            )}

            {/* STICKY RUN BUTTON */}
            <div className="pt-4 sticky bottom-0 bg-white pb-2">
              <button
                onClick={() => runAnalysis()}
                disabled={analyzing}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-sm shadow cursor-pointer min-h-[44px]"
              >
                {analyzing ? "Running Check & Recommending..." : "Run Checker + Recommender ⚡"}
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 space-y-6">
          {analyzing ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-6 animate-pulse">
              <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
              <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="h-40 bg-slate-200 rounded-xl w-full"></div>
            </div>
          ) : !result ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center space-y-4 min-h-[500px]">
              <div className="text-5xl">🧪</div>
              <p className="text-slate-600 font-medium text-base">
                Upload a part photo and run the check to see your report
              </p>
            </div>
          ) : (
            <div id="formal-report" className="space-y-5">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page { size: A4 portrait; margin: 12mm; }
                  body { background: #ffffff !important; color: #0f172a !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
                  header, .print\\:hidden { display: none !important; }
                  #formal-report { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
                  .card-box { break-inside: avoid; page-break-inside: avoid; }
                  details[open] summary ~ * { display: block; }
                }
              `}} />

              {/* LEVEL 1: VERDICT HERO CARD */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 card-box">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    {/* Cradle to Cradle Logo (increased to w-16 h-16) */}
                    <div className="w-16 h-16 flex items-center justify-center overflow-hidden shrink-0">
                      <img src="/cradle-logo.png" alt="Cradle to Cradle Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold block">
                        Bio-Resin Feasibility Report
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                        {result.productName}
                      </h2>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        Evaluated: {result.activeEval.grade.full_label} vs {result.baseGrade.short_name}
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider ${verdictBadgeColor(result.activeEval.verdictCode)}`}>
                    {result.activeEval.verdictCode}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {result.overallVerdictText}
                  </p>
                </div>

                {result.bannerMode === "BETTER_MATCH_EXISTS" && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-amber-900 block">
                        Better match: {result.topRecommended.grade.short_name} ({result.topRecommended.tierLabel}, Score {result.topRecommended.score}/100)
                      </span>
                      <p className="text-xs text-amber-950 mt-0.5">
                        {result.topRecommended.oneLineReasonVsBaseline}
                      </p>
                    </div>
                    <button
                      onClick={() => runAnalysis(result.topRecommended.grade.id)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg font-bold text-xs cursor-pointer shadow print:hidden"
                    >
                      Analyse {result.topRecommended.grade.short_name}
                    </button>
                  </div>
                )}
              </div>

              {/* LEVEL 2: FOUR METRIC CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 card-box">
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Tier & Score</span>
                  <span className="text-lg font-black text-slate-900 block">{result.activeEval.tierLabel.split(' ')[0]} {result.activeEval.tierLabel.split(' ')[1]}</span>
                  <span className="text-xs font-bold text-emerald-700 block">{result.activeEval.score}/100</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cost / 1,000</span>
                  <span className="text-lg font-black text-slate-900 block">₹{result.activeEval.costPer1000Inr.toLocaleString("en-IN")}</span>
                  <span className="text-xs font-bold text-amber-800 block">{result.activeEval.costMultiple}× baseline</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Shrinkage Deviation</span>
                  <span className="text-lg font-black text-slate-900 block">{result.activeEval.nominalDevMm >= 0 ? "+" : ""}{result.activeEval.nominalDevMm} mm</span>
                  <span className="text-[10px] text-slate-600 block">±{result.activeEval.uncertaintyMm} mm spread</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Heat Margin</span>
                  <span className={`text-lg font-black block ${result.activeEval.hdtMarginC >= 15 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.activeEval.hdtMarginC >= 0 ? "+" : ""}{result.activeEval.hdtMarginC}°C
                  </span>
                  <span className="text-[10px] text-slate-600 block">HDT {result.activeEval.grade.heat_deflection_temp_c}°C</span>
                </div>
              </div>

              {/* LEVEL 3: WHAT TO CHANGE */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3 card-box">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">What to Change</h3>
                {result.activeEval.modificationsNeeded.length === 0 && result.activeEval.processConditions.length === 0 ? (
                  <p className="text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    ✨ Nothing to change — existing mold steel and press can be used as-is.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {result.activeEval.modificationsNeeded.map((mod: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 bg-red-50/60 p-3 rounded-xl border border-red-200">
                        <span className="text-red-600 font-bold">🔧 Tooling:</span>
                        <span>{mod}</span>
                      </div>
                    ))}
                    {result.activeEval.processConditions.map((cond: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                        <span className="text-amber-700 font-bold">⚙️ Process:</span>
                        <span>{cond}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LEVEL 4: ACCORDIONS */}
              <div className="space-y-3 card-box">
                <details className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group">
                  <summary className="font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer flex justify-between items-center">
                    <span>Ranked Alternatives Table</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] border-b border-slate-300">
                          <th className="p-2.5">Resin</th>
                          <th className="p-2.5">Tier & Score</th>
                          <th className="p-2.5">Deviation</th>
                          <th className="p-2.5">HDT Margin</th>
                          <th className="p-2.5">Cost / 1,000</th>
                          <th className="p-2.5 print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.rankedCandidates.map((cand: EvaluatedResin) => (
                          <tr key={cand.grade.id} className={cand.grade.id === result.activeEval.grade.id ? "bg-emerald-50/70 font-semibold" : ""}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{cand.grade.short_name}</div>
                              <div className="text-[10px] text-slate-600">
                                {cand.grade.compostable ? "Compostable" : "Bio-based (non-compostable)"}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${tierBadgeColor(cand.tier)}`}>
                                {cand.tierLabel}
                              </span>
                              <div className="text-[11px] font-bold mt-1">{cand.score}/100</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold">nominal {cand.nominalDevMm >= 0 ? "+" : ""}{cand.nominalDevMm} mm</div>
                            </td>
                            <td className="p-2.5">
                              <div className={`font-bold ${cand.hdtMarginC >= 15 ? "text-emerald-700" : "text-red-700"}`}>
                                {cand.hdtMarginC >= 0 ? "+" : ""}{cand.hdtMarginC}°C
                              </div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold">₹{cand.costPer1000Inr.toLocaleString("en-IN")} ({cand.costMultiple}×)</div>
                            </td>
                            <td className="p-2.5 print:hidden">
                              <button
                                onClick={() => runAnalysis(cand.grade.id)}
                                className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                {cand.grade.id === result.activeEval.grade.id ? "Viewing" : "Analyse"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                <details className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group">
                  <summary className="font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer flex justify-between items-center">
                    <span>Shop-Floor Operator Guidance</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-800">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong>1. Granule Drying:</strong> {result.activeEval.grade.drying_required ? `Desiccant dryer at ${result.activeEval.grade.drying_temp_c}°C for ${result.activeEval.grade.drying_time_hrs}h (≤${result.activeEval.grade.moisture_target_pct}% moisture).` : "No pre-drying needed."}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong>2. Melt & Mold Temperatures:</strong> Melt {result.activeEval.grade.melt_temp_min}–{result.activeEval.grade.melt_temp_max}°C; Mold {result.activeEval.grade.mold_temp_min}–{result.activeEval.grade.mold_temp_max}°C.
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong>3. First-Shot Checks:</strong> Measure reference dimension ({result.assumptions.refDim} ± {result.assumptions.tol} mm), check fit and parting line.
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong>4. Stop Condition:</strong> Stop press immediately if residence exceeds {result.activeEval.grade.max_residence_time_sec}s or if thermal degradation occurs.
                    </div>
                  </div>
                </details>

                <details className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group">
                  <summary className="font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer flex justify-between items-center">
                    <span>Regulatory Information</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 text-xs text-slate-800 space-y-1">
                    <ul className="list-disc pl-4 space-y-1">
                      {result.regulatoryList.map((reg: string, idx: number) => (
                        <li key={idx}>{reg}</li>
                      ))}
                    </ul>
                  </div>
                </details>

                <details className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group">
                  <summary className="font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer flex justify-between items-center">
                    <span>Product-Specific Risks</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 text-xs text-slate-800 space-y-1">
                    <ul className="list-disc pl-4 space-y-1">
                      {result.productRisks.map((risk: string, idx: number) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </details>

                <details className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group">
                  <summary className="font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer flex justify-between items-center">
                    <span>Rule-by-Rule Audit Breakdown</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 divide-y divide-slate-200 text-xs">
                    {result.activeEval.rules.map((r: RuleEvaluation, idx: number) => (
                      <div key={idx} className="py-2 flex justify-between items-center gap-4">
                        <div>
                          <strong className="text-slate-900">{r.rule}:</strong> <span className="text-slate-700">{r.detail}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${r.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : r.status === 'CONDITIONAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 group">
                  <summary className="font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer flex justify-between items-center">
                    <span>Debug JSON & Engine Numbers</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3">
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify({
                        product_name: result.productName,
                        product_type: result.productType,
                        confidence: result.confidence,
                        active_resin: result.activeEval.grade.short_name,
                        rule_evaluations: result.activeEval.rules,
                        raw_gemini_json: result.rawGemini
                      }, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>

              {/* DATASHEET SOURCING & DISCLAIMER FOOTER */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between gap-2 card-box">
                <span><strong>Datasheet Sourcing:</strong> Typical values from supplier TDS, verify current revision.</span>
                <span>Indicative engineering estimate. Verify against supplier TDS and trial molding before production.</span>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}