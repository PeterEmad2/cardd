"use client";

type DamageReportProps = {
  report: any;
  severity: string;
  copied: boolean;
  onCopyReport: () => void;
  onDownloadPdf: () => void;
};

export default function DamageReport({
  report,
  severity,
  copied,
  onCopyReport,
  onDownloadPdf,
}: DamageReportProps) {
  if (!report) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-zinc-500">Report will appear after analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Damage Report</h2>

          <p className="mt-1 text-sm text-zinc-400">
            AI-generated vehicle damage assessment
          </p>
        </div>

        <div className="flex gap-2">
          {/* Copy */}
          <button
            type="button"
            onClick={onCopyReport}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            {copied ? "Copied!" : "Copy Report"}
          </button>

          {/* PDF */}
          <button
            type="button"
            onClick={onDownloadPdf}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Severity */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-zinc-400">Overall Severity</p>

        <p className="mt-1 text-lg font-semibold capitalize text-white">
          {severity || "Unknown"}
        </p>
      </div>

      {/* Damage Assessment */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Damage Assessment
        </h3>

        <div className="space-y-4">
          {report.damage_assessment?.map((damage: any, index: number) => (
            <div key={index} className="rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize text-white">
                  {damage.damage_type}
                </h4>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-zinc-300">
                  {damage.severity}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-400">
                {damage.location_on_vehicle}
              </p>

              <p className="mt-2 text-sm text-zinc-300">{damage.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Repair Steps */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">Repair Steps</h3>

        <ol className="space-y-3">
          {report.repair_steps?.map((step: string, index: number) => (
            <li key={index} className="flex gap-3 text-sm text-zinc-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white">
                {index + 1}
              </span>

              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tools */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Tools & Equipment
        </h3>

        <div className="space-y-2">
          {report.tools_and_equipment_needed?.map(
            (tool: string, index: number) => (
              <div key={index} className="text-sm text-zinc-300">
                • {tool}
              </div>
            ),
          )}
        </div>
      </div>

      {/* Estimated Cost */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Estimated Cost
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Repair Time</span>

            <span className="text-white">
              {report.estimated_repair_time_hours} hours
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Technician Service</span>

            <span className="text-white">
              {report.technician_service_cost_egp?.toLocaleString()} EGP
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Parts & Equipment</span>

            <span className="text-white">
              {report.equipment_and_parts_cost_egp?.toLocaleString()} EGP
            </span>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-white">
                Total Estimated Cost
              </span>

              <span className="text-lg font-bold text-white">
                {report.total_estimated_cost_egp?.toLocaleString()} EGP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-3 text-lg font-semibold text-white">Notes</h3>

        <p className="text-sm leading-6 text-zinc-300">{report.notes}</p>
      </div>
    </div>
  );
}
