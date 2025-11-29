const buildAggregates = (lowStock, overrides = {}) => {
  const criticalAlerts = overrides.criticalAlerts ?? lowStock.filter((item) => item.qty <= item.reorderLevel / 2).length;
  const avgStockGapPct =
    overrides.avgStockGapPct ??
    (lowStock.length
      ? Math.round(
          (lowStock.reduce((acc, item) => acc + (item.reorderLevel ? Math.max(0, 1 - item.qty / item.reorderLevel) : 0), 0) /
            lowStock.length) *
            100,
        )
      : 0);
  const projectedMonthlySpend = overrides.projectedMonthlySpend ?? 146000;

  return { criticalAlerts, avgStockGapPct, projectedMonthlySpend };
};

const registerMedicationsMockServer = (backendConnector) => {
  if (!backendConnector) return;

  let lowStock = [
    { id: "MED-101", name: "Amoxicillin 500mg", hospital: "Rabat Central", qty: 42, reorderLevel: 100, unit: "boxes", class: "Antibiotic" },
    { id: "MED-088", name: "Insulin Regular", hospital: "Casablanca General", qty: 20, reorderLevel: 80, unit: "vials", class: "Endocrine" },
    { id: "MED-215", name: "Aspirin 81mg", hospital: "Tangier Med", qty: 65, reorderLevel: 120, unit: "packs", class: "Analgesic" },
    { id: "MED-330", name: "Atorvastatin 20mg", hospital: "Fes Regional", qty: 18, reorderLevel: 60, unit: "packs", class: "Cardio" },
  ];

  let pricingSummary = [
    { hospital: "Rabat Central", medication: "Amoxicillin 500mg", avg: 34.5, min: 31.0, max: 37.8, updatedAt: "2025-11-26T10:30:00Z" },
    { hospital: "Casablanca General", medication: "Insulin Regular", avg: 128.0, min: 120.0, max: 134.0, updatedAt: "2025-11-25T09:10:00Z" },
    { hospital: "Tangier Med", medication: "Aspirin 81mg", avg: 9.5, min: 8.9, max: 10.1, updatedAt: "2025-11-27T14:45:00Z" },
    { hospital: "Fes Regional", medication: "Atorvastatin 20mg", avg: 52.0, min: 50.0, max: 56.0, updatedAt: "2025-11-24T16:20:00Z" },
  ];

  let priceSeries = [
    { hospital: "Rabat Central", avgUnitPrice: 34.5 },
    { hospital: "Casablanca General", avgUnitPrice: 128.0 },
    { hospital: "Tangier Med", avgUnitPrice: 9.5 },
    { hospital: "Fes Regional", avgUnitPrice: 52.0 },
    { hospital: "Marrakech Health", avgUnitPrice: 62.0 },
  ];

  let replenishmentTrend = [
    { month: "Jun", qty: 540, cost: 12200 },
    { month: "Jul", qty: 610, cost: 13100 },
    { month: "Aug", qty: 500, cost: 11800 },
    { month: "Sep", qty: 650, cost: 13750 },
    { month: "Oct", qty: 700, cost: 14200 },
    { month: "Nov", qty: 720, cost: 14600 },
  ];

  backendConnector.registerResource(
    "medications",
    async () => ({
      lowStock,
      pricingSummary,
      priceSeries,
      replenishmentTrend,
      aggregates: buildAggregates(lowStock),
      lastSyncedAt: new Date().toISOString(),
    }),
    { method: "GET" },
  );

  backendConnector.registerResource(
    "medications",
    async (_params, body = {}) => {
      const requiredFields = ["id", "name", "hospital", "qty", "reorderLevel", "unit", "class"];
      const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === "");
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const nextRecord = {
        id: String(body.id).trim(),
        name: String(body.name).trim(),
        hospital: String(body.hospital).trim(),
        qty: Number(body.qty) || 0,
        reorderLevel: Number(body.reorderLevel) || 0,
        unit: String(body.unit).trim(),
        class: String(body.class || "General").trim(),
      };

      lowStock = [nextRecord, ...lowStock];

      return {
        medication: nextRecord,
        message: "Medication registered via mock endpoint",
      };
    },
    { method: "POST" },
  );

  backendConnector.registerResource(
    "medications/stock",
    async (_params, body = {}) => {
      const requiredFields = ["medicationId", "hospital", "qtyReceived", "unitPrice"];
      const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === "");
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const qtyReceived = Number(body.qtyReceived) || 0;
      const unitPrice = Number(body.unitPrice) || 0;
      const medicationName = body.medicationName || body.medicationId;

      lowStock = lowStock.map((record) => {
        if (record.id === body.medicationId && record.hospital === body.hospital) {
          return { ...record, qty: record.qty + qtyReceived };
        }
        return record;
      });

      priceSeries = priceSeries.map((entry) =>
        entry.hospital === body.hospital ? { ...entry, avgUnitPrice: unitPrice } : entry,
      );

      replenishmentTrend = [...replenishmentTrend.slice(1), { month: "Now", qty: qtyReceived, cost: qtyReceived * unitPrice }];

      pricingSummary = pricingSummary.map((entry) =>
        entry.medication === medicationName && entry.hospital === body.hospital
          ? {
              ...entry,
              avg: unitPrice,
              min: Math.min(entry.min, unitPrice),
              max: Math.max(entry.max, unitPrice),
              updatedAt: new Date().toISOString(),
            }
          : entry,
      );

      return {
        stockEntry: {
          medicationId: body.medicationId,
          medicationName,
          hospital: body.hospital,
          qtyReceived,
          unitPrice,
        },
        message: "Stock entry added via mock endpoint",
      };
    },
    { method: "POST" },
  );
};

export { registerMedicationsMockServer };
