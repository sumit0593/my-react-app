import React, { useState } from "react";
import * as XLSX from "xlsx";

function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

const INITIAL_ROWS = [
  { day: "MONDAY", min: 9.011, max: 10.111 },
  { day: "TUESDAY", min: 7.011, max: 8.111 },
  { day: "WEDNESDAY", min: 6.011, max: 7.111 },
  { day: "THURSDAY", min: 6.111, max: 7.11 },
  { day: "FRIDAY", min: 6.115, max: 7.015 },
  { day: "SATURDAY", min: 6.011, max: 7.111 },
  { day: "SUNDAY", min: 6.095, max: 7.066 },
];

export default function GenerateTable() {
  const [rows, setRows] = useState(
    INITIAL_ROWS.map((r) => ({
      day: r.day,
      morning: 0,
      evening: 0,
      total: 0,
      min: r.min,
      max: r.max,
    }))
  );
  const [message, setMessage] = useState("");

  const computeTotals = (arr) => {
    const totals = arr.map((r) => ({ ...r, total: r.morning + r.evening }));
    const grand = totals.reduce((s, r) => s + r.total, 0);
    return { totals, grand };
  };

  const handleGenerate = () => {
    setMessage("Generating...");
    const generated = rows.map((r) => {
      const min = r.min;
      const max = r.max;
      const morning = randBetween(min, max);
      const evening = randBetween(min, max);
      return { ...r, morning, evening, total: morning + evening };
    });

    let { totals: withTotals, grand } = computeTotals(generated);

    if (grand === 0) {
      setMessage("Generation produced zero total (unexpected).");
      return;
    }

    const factor = 100 / grand;
    let scaled = withTotals.map((r) => {
      const m = r.morning * factor;
      const e = r.evening * factor;
      return { ...r, morning: m, evening: e, total: m + e };
    });

    const scaledTh = scaled.map((r) => ({
      day: r.day,
      morningTh: Math.round(r.morning * 1000),
      eveningTh: Math.round(r.evening * 1000),
      min: r.min,
      max: r.max,
    }));

    let totalTh = scaledTh.reduce((s, r) => s + (r.morningTh + r.eveningTh), 0);
    const targetTh = 100 * 1000;
    let diffTh = targetTh - totalTh;

    if (diffTh !== 0) {
      let maxIdx = 0;
      let maxVal = -Infinity;
      scaledTh.forEach((r, i) => {
        const v = r.morningTh + r.eveningTh;
        if (v > maxVal) {
          maxVal = v;
          maxIdx = i;
        }
      });

      scaledTh[maxIdx].morningTh += diffTh;

      if (scaledTh[maxIdx].morningTh < 0) {
        const deficit = -scaledTh[maxIdx].morningTh;
        scaledTh[maxIdx].morningTh = 0;
        let nextIdx = scaledTh.findIndex((_, i) => i !== maxIdx);
        if (nextIdx >= 0) scaledTh[nextIdx].morningTh -= deficit;
      }
    }

    const final = scaledTh.map((r) => {
      const morning = r.morningTh / 1000;
      const evening = r.eveningTh / 1000;
      return {
        day: r.day,
        morning: morning,
        evening: evening,
        total: round3(morning + evening),
        min: r.min,
        max: r.max,
      };
    });

    const finalGrand = round3(final.reduce((s, r) => s + r.total, 0));

    setRows(
      final.map((r) => ({
        day: r.day,
        morning: r.morning,
        evening: r.evening,
        total: r.total,
        min: r.min,
        max: r.max,
      }))
    );

    setMessage(`Generated table (grand total ${finalGrand.toFixed(3)})`);
  };

  const handleExport = () => {
    if (!rows || rows.length === 0) {
      alert("No rows to export");
      return;
    }

    const data = rows.map((r) => ({
      Day: r.day,
      Morning: r.morning,
      Evening: r.evening,
      Total: r.total,
    }));

    const grandM = round3(rows.reduce((s, r) => s + (r.morning || 0), 0));
    const grandE = round3(rows.reduce((s, r) => s + (r.evening || 0), 0));
    const grandT = round3(rows.reduce((s, r) => s + (r.total || 0), 0));

    data.push({
      Day: "TOTAL",
      Morning: grandM,
      Evening: grandE,
      Total: grandT,
    });

    const ws = XLSX.utils.json_to_sheet(data, {
      header: ["Day", "Morning", "Evening", "Total"],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    XLSX.writeFile(wb, `generated_table_${ts}.xlsx`);
  };

  const grandMorning = round3(rows.reduce((s, r) => s + (r.morning || 0), 0));
  const grandEvening = round3(rows.reduce((s, r) => s + (r.evening || 0), 0));
  const grandTotal = round3(rows.reduce((s, r) => s + (r.total || 0), 0));

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6">
      <div className="w-full max-w-[1400px] mx-auto px-4">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Generate Table
              </h1>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Values are generated inside each row range and then scaled to
                sum to 100.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow hover:from-green-700 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-300"
                aria-label="Generate"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Generate</span>
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-200"
                aria-label="Export"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M3 3a2 2 0 012-2h6a2 2 0 012 2v4h-2V3H5v14h6v-4h2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" />
                  <path d="M13 7l4 4m0 0l-4 4m4-4H9" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500 sm:hidden">
            Values are generated randomly within each row range then scaled to
            sum to 100.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow p-4 overflow-hidden">
            {message && (
              <div className="mb-4 text-sm text-gray-700">{message}</div>
            )}

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Day
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Morning
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Evening
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rows.map((r, idx) => (
                    <tr
                      key={r.day + idx}
                      className={
                        idx % 2 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"
                      }
                    >
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {r.day}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {(r.morning || 0).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {(r.evening || 0).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold font-mono">
                        {(r.total || 0).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.min.toFixed(3)} — {r.max.toFixed(3)}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {grandMorning.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {grandEvening.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {grandTotal.toFixed(3)}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {rows.map((r, idx) => (
                <div
                  key={r.day + idx}
                  className="bg-gray-50 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">
                      {r.day}
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: {r.min.toFixed(3)} — {r.max.toFixed(3)}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                    <div className="col-span-1 text-center">
                      <div className="text-[13px] font-mono">
                        {(r.morning || 0).toFixed(3)}
                      </div>
                      <div className="text-gray-400">Morning</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="text-[13px] font-mono">
                        {(r.evening || 0).toFixed(3)}
                      </div>
                      <div className="text-gray-400">Evening</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="text-[13px] font-semibold font-mono">
                        {(r.total || 0).toFixed(3)}
                      </div>
                      <div className="text-gray-400">Total</div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">TOTAL</div>
                  <div className="text-sm font-mono">
                    {grandTotal.toFixed(3)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Morning: {grandMorning.toFixed(3)} • Evening:{" "}
                  {grandEvening.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
            <div>
              <h3 className="text-sm text-gray-500">Grand Total</h3>
              <div className="text-2xl font-bold text-gray-900">
                {grandTotal.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Morning: {grandMorning.toFixed(3)} • Evening:{" "}
                {grandEvening.toFixed(3)}
              </div>
            </div>

            <div className="pt-2 border-t">
              <h4 className="text-sm text-gray-600 mb-2">Quick actions</h4>
              <button
                onClick={() => {
                  setRows(
                    INITIAL_ROWS.map((r) => ({
                      day: r.day,
                      morning: 0,
                      evening: 0,
                      total: 0,
                      min: r.min,
                      max: r.max,
                    }))
                  );
                  setMessage("Reset to initial values");
                }}
                className="w-full px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-200"
              >
                Reset
              </button>
            </div>

            <div className="pt-2 border-t">
              <h4 className="text-sm text-gray-600 mb-2">Notes</h4>
              <p className="text-xs text-gray-500">
                Values are generated randomly within each row range then scaled
                to sum to 100. Small rounding adjustments are made.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-3 px-4 sm:hidden pointer-events-auto">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-3 flex gap-3 items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-gray-500">Actions</div>
              <div className="text-sm font-semibold">
                {grandTotal.toFixed(3)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-300"
                aria-label="Generate (mobile)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Generate</span>
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-3 py-2 border rounded-md bg-white hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-200"
                aria-label="Export (mobile)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M3 3a2 2 0 012-2h6a2 2 0 012 2v4h-2V3H5v14h6v-4h2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" />
                  <path d="M13 7l4 4m0 0l-4 4m4-4H9" />
                </svg>
                <span className="text-sm">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
