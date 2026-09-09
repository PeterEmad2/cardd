"use client";

import { ChangeEvent, useRef, useState } from "react";

import { Activity, ArrowRight } from "lucide-react";

import Header from "./components/Header";
import UploadCard from "./components/UploadCard";
import AnalysisResults from "./components/AnalysisResults";
import DamageReport from "./components/DamageReport";
import jsPDF from "jspdf";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const demoImage =
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=85";

  const [image, setImage] = useState<string | null>(demoImage);
  const [originalImage, setOriginalImage] = useState<string | null>(demoImage);

  const [fileName, setFileName] = useState("demo-vehicle.jpg");

  const [view, setView] = useState<"original" | "detection">("original");

  const [analyzing, setAnalyzing] = useState(false);

  // Separate copy states
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Backend results
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [detections, setDetections] = useState<any[]>([
    {
      type: "Dent",
      location: "Front door",
      percentage: 94,
      level: "High",
      tone: "red",
    },
    {
      type: "Scratch",
      location: "Front-right panel",
      percentage: 89,
      level: "Medium",
      tone: "orange",
    },
    {
      type: "Paint Damage",
      location: "Rear bumper",
      percentage: 81,
      level: "Medium",
      tone: "yellow",
    },
  ]);

  const [report, setReport] = useState<any>({
    notes:
      "Demo analysis: visible damage is concentrated around the front-right side of the vehicle. A significant dent and surface scratches are visible.",
    estimated_repair_time_hours: 2,

    technician_service_cost_egp: {
      min: 2000,
      max: 3500,
    },

    equipment_and_parts_cost_egp: {
      min: 2500,
      max: 4500,
    },

    total_estimated_cost_egp: {
      min: 4500,
      max: 8000,
    },
    damage_assessment: [
      {
        damage_type: "Dent",
        location_on_vehicle: "Front door",
        severity: "moderate",
        description: "Visible deformation across the front door panel.",
      },
      {
        damage_type: "Scratch",
        location_on_vehicle: "Front-right panel",
        severity: "moderate",
        description: "Surface scratches are visible on the exterior panel.",
      },
      {
        damage_type: "Paint Damage",
        location_on_vehicle: "Rear bumper",
        severity: "minor",
        description: "Minor paint damage is visible on the rear bumper.",
      },
    ],

    repair_steps: [
      "Inspect the damaged body panels.",
      "Repair the front door deformation.",
      "Evaluate scratches for repainting.",
      "Inspect the rear bumper paint damage.",
    ],
    tools_and_equipment_needed: [
      "PDR dent repair tools",
      "Body hammer and dolly",
      "Sanding tools",
      "Automotive polishing machine",
      "Paint spray equipment",
    ],
  });

  const [severity, setSeverity] = useState("Moderate");
  const [error, setError] = useState("");

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setOriginalImage(imageUrl);

    setFileName(file.name);

    // Reset previous AI result
    setResultImage(null);
    setDetections([]);
    setReport(null);
    setSeverity("");
    setError("");

    // Reset copy animations
    setCopiedImage(false);
    setCopiedReport(false);

    // Show uploaded image first
    setView("original");
  }

  const analyze = async () => {
    const file = inputRef.current?.files?.[0];

    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      // =================================
      // 1. GET ANNOTATED IMAGE
      // =================================

      const imageFormData = new FormData();
      imageFormData.append("file", file);

      const imageResponse = await fetch("http://localhost:8000/analyze-image", {
        method: "POST",
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        throw new Error(`Image analysis failed: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();

      const imageUrl = URL.createObjectURL(imageBlob);

      setResultImage(imageUrl);

      // =================================
      // 2. GET JSON REPORT
      // =================================

      const reportFormData = new FormData();
      reportFormData.append("file", file);

      const reportResponse = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: reportFormData,
      });

      if (!reportResponse.ok) {
        throw new Error(`Report analysis failed: ${reportResponse.status}`);
      }

      const data = await reportResponse.json();

      console.log("BACKEND DATA:", data);

      // =================================
      // 3. SET REPORT
      // =================================

      setReport(data.report);

      // =================================
      // 4. SET SEVERITY
      // =================================

      const severities =
        data.report?.damage_assessment?.map((item: any) => item.severity) || [];

      const overallSeverity = severities.includes("severe")
        ? "Severe"
        : severities.includes("moderate")
          ? "Moderate"
          : severities.includes("minor")
            ? "Minor"
            : "Unknown";

      setSeverity(overallSeverity);

      // =================================
      // 5. SET DETECTIONS
      // =================================

      setDetections(
        (data.findings || []).map((finding: any) => ({
          type: finding.damage_type,
          location: "Detected area",
          percentage: finding.area_pct_of_image,
          level: "Detected",
          tone: "red",
          bbox: finding.bbox,
        })),
      );

      // =================================
      // 6. SHOW AI DETECTION
      // =================================

      setView("detection");
    } catch (error) {
      console.error("ANALYSIS ERROR:", error);

      setError("Could not connect to the AI backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReportPdf = async () => {
    if (!report) {
      setError("Analyze the image first.");
      return;
    }

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let y = 20;

      // =========================
      // TITLE
      // =========================

      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text("Car Damage Assessment Report", 20, y);

      y += 10;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated by CarDD AI`, 20, y);

      y += 12;

      // =========================
      // ANNOTATED IMAGE
      // =========================

      if (resultImage) {
        const image = new Image();

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = resultImage;
        });

        const maxWidth = pageWidth - 40;
        const maxHeight = 90;

        let imgWidth = image.naturalWidth;
        let imgHeight = image.naturalHeight;

        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

        imgWidth *= ratio;
        imgHeight *= ratio;

        const x = (pageWidth - imgWidth) / 2;

        pdf.addImage(image, "JPEG", x, y, imgWidth, imgHeight);

        y += imgHeight + 12;
      }

      // =========================
      // OVERALL SEVERITY
      // =========================

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Overall Severity", 20, y);

      y += 8;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(severity || "Unknown", 20, y);

      y += 12;

      // =========================
      // DAMAGE ASSESSMENT
      // =========================

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Damage Assessment", 20, y);

      y += 9;

      for (const damage of report.damage_assessment || []) {
        if (y > pageHeight - 45) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");

        pdf.text(damage.damage_type, 20, y);

        y += 6;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");

        pdf.text(`Location: ${damage.location_on_vehicle}`, 20, y);

        y += 5;

        pdf.text(`Severity: ${damage.severity}`, 20, y);

        y += 6;

        const descriptionLines = pdf.splitTextToSize(
          damage.description,
          pageWidth - 40,
        );

        pdf.text(descriptionLines, 20, y);

        y += descriptionLines.length * 5 + 8;
      }

      // =========================
      // REPAIR STEPS
      // =========================

      if (y > pageHeight - 50) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Repair Steps", 20, y);

      y += 9;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      for (let i = 0; i < (report.repair_steps || []).length; i++) {
        const step = report.repair_steps[i];

        const lines = pdf.splitTextToSize(`${i + 1}. ${step}`, pageWidth - 40);

        if (y + lines.length * 5 > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(lines, 20, y);

        y += lines.length * 5 + 3;
      }

      // =========================
      // TOOLS & EQUIPMENT
      // =========================

      if (y > pageHeight - 50) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Tools & Equipment", 20, y);

      y += 9;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      for (const tool of report.tools_and_equipment_needed || []) {
        pdf.text(`• ${tool}`, 20, y);
        y += 6;
      }

      y += 5;

      // =========================
      // ESTIMATED COST
      // =========================

      if (y > pageHeight - 60) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Estimated Cost", 20, y);

      y += 9;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(
        `Repair Time: ${report.estimated_repair_time_hours} hours`,
        20,
        y,
      );

      y += 6;

      pdf.text(
        `Technician Service: ${report.technician_service_cost_egp?.toLocaleString()} EGP`,
        20,
        y,
      );

      y += 6;

      pdf.text(
        `Parts & Equipment: ${report.equipment_and_parts_cost_egp?.toLocaleString()} EGP`,
        20,
        y,
      );

      y += 8;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);

      pdf.text(
        `Total Estimated Cost: ${report.total_estimated_cost_egp?.toLocaleString()} EGP`,
        20,
        y,
      );

      y += 12;

      // =========================
      // NOTES
      // =========================

      if (report.notes) {
        if (y > pageHeight - 45) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("Notes", 20, y);

        y += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");

        const noteLines = pdf.splitTextToSize(report.notes, pageWidth - 40);

        pdf.text(noteLines, 20, y);
      }

      // =========================
      // SAVE
      // =========================

      pdf.save(`CarDD-Damage-Report-${fileName || "vehicle"}.pdf`);
    } catch (error) {
      console.error("PDF ERROR:", error);
      setError("Could not generate the PDF report.");
    }
  };

  async function copyReport() {
    if (!report) return;

    const reportText = `
Vehicle Damage Assessment

Overall Severity: ${severity || "Unknown"}

Detailed Findings
${(report.damage_assessment || [])
  .map(
    (damage: any) =>
      `• ${damage.damage_type}
  Location: ${damage.location_on_vehicle}
  Severity: ${damage.severity}
  ${damage.description}`,
  )
  .join("\n\n")}

Recommended Repair Steps
${(report.repair_steps || [])
  .map((step: string, index: number) => `${index + 1}. ${step}`)
  .join("\n")}

Repair Time:
${report.estimated_repair_time_hours ?? "--"} hours

Estimated Cost:
Technician Service: ${
      report.technician_service_cost_egp?.toLocaleString() ?? "--"
    } EGP

Parts & Equipment: ${
      report.equipment_and_parts_cost_egp?.toLocaleString() ?? "--"
    } EGP

Total Estimated Cost: ${
      report.total_estimated_cost_egp?.toLocaleString() ?? "--"
    } EGP

Notes:
${report.notes || "No additional notes."}
`;

    await navigator.clipboard?.writeText(reportText);

    // ONLY Report button animates
    setCopiedReport(true);

    setTimeout(() => {
      setCopiedReport(false);
    }, 1600);
  }

  function downloadImage() {
    if (!resultImage) {
      setError("Analyze the image first.");
      return;
    }

    const a = document.createElement("a");

    a.href = resultImage;

    a.download = `cardd-${fileName || "annotated-image"}`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
  }

  return (
    <main className="min-h-screen bg-[#07090b]">
      <Header />

      <section className="mx-auto max-w-[1450px] px-6 pb-10 pt-10 lg:px-10">
        {/* =========================
            HERO
        ========================= */}

        <div className="relative overflow-hidden pb-10">
          {/* Car background */}

          <div
            className="absolute right-0 top-[-20px] h-[280px] w-[60%] bg-cover bg-center opacity-50"
            style={{
              backgroundImage: "url('/car-hero.png')",
            }}
          />

          {/* Dark gradient */}

          <div className="absolute inset-0 bg-gradient-to-r from-[#07090b] via-[#07090b]/90 to-transparent" />

          {/* Red glow */}

          <div className="absolute right-[15%] top-10 h-[220px] w-[500px] rounded-full bg-[#ff4d36]/[.06] blur-[100px]" />

          <div className="relative z-10">
            <div className="mb-3 text-[10px] font-medium tracking-[.3em] text-white/60">
              TURN IMAGES INTO INSIGHTS
            </div>

            <h1 className="max-w-[700px] text-5xl font-semibold leading-[.98] tracking-[-.045em] md:text-6xl">
              See the damage.
              <br />
              <span className="text-[#ff5d48]">Know what&apos;s next.</span>
            </h1>

            <p className="mt-5 max-w-[660px] text-sm leading-6 text-white/45">
              Advanced computer vision for faster, clearer, and more accurate
              vehicle damage assessment.
            </p>
          </div>
        </div>

        {/* =========================
            MAIN
        ========================= */}

        <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
          {/* =========================
              LEFT
          ========================= */}

          <div>
            <UploadCard
              inputRef={inputRef}
              image={originalImage}
              fileName={fileName}
              onFileChange={handleFile}
              onRemove={() => {
                setImage(null);
                setOriginalImage(null);
                setResultImage(null);
                setFileName("");
                setDetections([]);
                setReport(null);
                setSeverity("");
                setError("");

                setCopiedImage(false);
                setCopiedReport(false);

                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
            />

            <button
              type="button"
              onClick={analyze}
              disabled={analyzing || !originalImage}
              className="btn mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff5b45] font-semibold text-white shadow-[0_8px_30px_rgba(255,91,69,.18)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Activity size={17} className="animate-pulse" />
                  Analyzing damage...
                </>
              ) : (
                <>
                  Analyze Damage
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>

          {/* =========================
              RIGHT
          ========================= */}

          <div className="space-y-5">
            <AnalysisResults
              originalImage={originalImage}
              resultImage={resultImage}
              view={view}
              setView={setView}
              analyzing={analyzing}
              detections={detections}
              // IMPORTANT:
              // Only Copy Image uses this state
              copied={copiedImage}
              image={view === "detection" ? resultImage : originalImage}
              onCopyImage={async () => {
                if (!resultImage) return;

                const img = new Image();

                img.onload = async () => {
                  const canvas = document.createElement("canvas");

                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;

                  const ctx = canvas.getContext("2d");

                  if (!ctx) return;

                  ctx.drawImage(img, 0, 0);

                  canvas.toBlob(async (blob) => {
                    if (!blob) return;

                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          "image/png": blob,
                        }),
                      ]);

                      // ONLY Image button animates
                      setCopiedImage(true);

                      setTimeout(() => {
                        setCopiedImage(false);
                      }, 1600);
                    } catch (error) {
                      console.error("COPY IMAGE ERROR:", error);
                    }
                  }, "image/png");
                };

                img.src = resultImage;
              }}
              onDownload={downloadImage}
            />

            <DamageReport
              report={report}
              severity={severity}
              // IMPORTANT:
              // Only Copy Report uses this state
              copied={copiedReport}
              onCopyReport={copyReport}
              onDownloadPdf={downloadReportPdf}
            />
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="mx-auto flex max-w-[1450px] items-center justify-between border-t border-white/[.07] px-6 py-5 text-[10px] text-white/25 lg:px-10">
        <div>
          CarDD
          <span className="mx-2">·</span>
          AI Vehicle Damage Assessment
        </div>

        <div className="hidden items-center gap-5 sm:flex">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
          <span>Built for safer roads.</span>
        </div>
      </footer>
    </main>
  );
}
