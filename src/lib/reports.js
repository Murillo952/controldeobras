import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { money, num2, expenseCategories, laborCost, machineCost } from "./format.js";

/* ============================================================
   REPORTES — construcción de datos + exportación real a PDF/Excel

   Todo corre en el navegador (jsPDF + jspdf-autotable + SheetJS),
   no se llama a ningún servidor: la generación funciona incluso
   sin conexión a internet, siempre que la página ya esté cargada.
   ============================================================ */

export const REPORTS = [
  "Reporte financiero completo",
  "Ingresos",
  "Egresos por categoría",
  "Ítems y avance",
  "Ejecución diaria",
  "Materiales",
  "Materiales asignados por ítem",
  "Mano de obra",
  "Maquinaria",
  "Gastos de operación",
  "Curva S",
  "Reporte completo del proyecto",
];

/* ---------------------------------------------------------
   Secciones individuales (una por bloque de datos). Cada una
   devuelve { title, columns, rows, note? }. "rows" ya viene
   formateado como texto (listo para tabla), no números crudos.
--------------------------------------------------------- */

function sectionResumen(project, inRange) {
  const income = project.income.filter((i) => inRange(i.date));
  const expenses = project.expenses.filter((e) => inRange(e.date));
  const ingresos = income.reduce((a, b) => a + b.amount, 0);
  const egresos = expenses.reduce((a, b) => a + b.amount, 0);
  const itemsTotal = project.items.reduce((a, it) => a + it.qty * it.pu, 0);
  const execByItem = {};
  project.executions.forEach((ex) => {
    execByItem[ex.itemId] = (execByItem[ex.itemId] || 0) + ex.qty;
  });
  const executedValue = project.items.reduce((a, it) => a + (execByItem[it.id] || 0) * it.pu, 0);
  const avanceFisico = itemsTotal ? (executedValue / itemsTotal) * 100 : 0;
  const avanceFinanciero = project.budget ? (egresos / project.budget) * 100 : 0;

  return {
    title: "Resumen del proyecto",
    columns: ["Indicador", "Valor"],
    rows: [
      ["Cliente", project.client || "—"],
      ["Ubicación", project.location || "—"],
      ["Residente", project.resident || "—"],
      ["Estado", project.status || "—"],
      ["Presupuesto contratado", money(project.budget)],
      ["Ingresos del periodo", money(ingresos)],
      ["Egresos del periodo", money(egresos)],
      ["Saldo disponible (periodo)", money(ingresos - egresos)],
      ["Avance físico (acumulado)", `${num2(avanceFisico)}%`],
      ["Avance financiero (acumulado)", `${num2(avanceFinanciero)}%`],
      ["Costo ejecutado (acumulado)", money(executedValue)],
      ["Saldo por ejecutar (acumulado)", money(Math.max(itemsTotal - executedValue, 0))],
    ],
  };
}

function sectionIngresos(project, inRange) {
  const rows = project.income
    .filter((i) => inRange(i.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = rows.reduce((a, b) => a + b.amount, 0);
  return {
    title: "Ingresos",
    columns: ["Fecha", "Tipo", "Documento", "Descripción", "Monto"],
    rows: rows.map((i) => [i.date || "—", i.type || "—", i.doc || "—", i.desc || "—", money(i.amount)]),
    totalsRow: ["", "", "", "Total", money(total)],
    emptyNote: "No hay ingresos registrados en el periodo seleccionado.",
  };
}

function sectionEgresosResumen(project, inRange) {
  const expenses = project.expenses.filter((e) => inRange(e.date));
  const total = expenses.reduce((a, b) => a + b.amount, 0);
  const rows = expenseCategories.map((cat) => {
    const monto = expenses.filter((e) => e.category === cat).reduce((a, b) => a + b.amount, 0);
    const pct = total ? (monto / total) * 100 : 0;
    return [cat, money(monto), `${num2(pct)}%`];
  });
  return {
    title: "Egresos por categoría — resumen",
    columns: ["Categoría", "Monto", "% del total"],
    rows,
    totalsRow: ["Total", money(total), "100.00%"],
  };
}

function sectionEgresosDetalle(project, inRange) {
  const rows = project.expenses
    .filter((e) => inRange(e.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = rows.reduce((a, b) => a + b.amount, 0);
  return {
    title: "Egresos — detalle",
    columns: ["Fecha", "Categoría", "Documento", "Proveedor", "Forma de pago", "Descripción", "Monto"],
    rows: rows.map((e) => [e.date || "—", e.category || "—", e.doc || "—", e.provider || "—", e.pay || "—", e.desc || "—", money(e.amount)]),
    totalsRow: ["", "", "", "", "", "Total", money(total)],
    emptyNote: "No hay egresos registrados en el periodo seleccionado.",
  };
}

function sectionItemsAvance(project) {
  const execByItem = {};
  project.executions.forEach((ex) => {
    execByItem[ex.itemId] = (execByItem[ex.itemId] || 0) + ex.qty;
  });
  const rows = project.items.map((it) => {
    const execQty = execByItem[it.id] || 0;
    const totalContratado = it.qty * it.pu;
    const valorEjecutado = execQty * it.pu;
    const avance = it.qty ? (execQty / it.qty) * 100 : 0;
    return [
      it.id,
      it.desc,
      it.unit,
      num2(it.qty),
      money(it.pu),
      money(totalContratado),
      num2(execQty),
      `${num2(avance)}%`,
      money(valorEjecutado),
    ];
  });
  const totalContratado = project.items.reduce((a, it) => a + it.qty * it.pu, 0);
  const totalEjecutado = project.items.reduce((a, it) => a + (execByItem[it.id] || 0) * it.pu, 0);
  return {
    title: "Ítems y avance (acumulado, todo el proyecto)",
    columns: ["Código", "Descripción", "Unidad", "Cant. contratada", "P. unitario", "Total contratado", "Cant. ejecutada", "Avance %", "Valor ejecutado"],
    rows,
    totalsRow: ["", "", "", "", "Total", money(totalContratado), "", "", money(totalEjecutado)],
    emptyNote: "Este proyecto todavía no tiene ítems cargados.",
  };
}

function sectionEjecucionDiaria(project, inRange) {
  const rows = project.executions
    .filter((ex) => inRange(ex.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  let total = 0;
  const out = rows.map((ex) => {
    const it = project.items.find((i) => i.id === ex.itemId);
    const valor = ex.qty * (it?.pu || 0);
    total += valor;
    return [ex.date || "—", ex.itemId || "—", it?.desc || "—", num2(ex.qty), it?.unit || "—", money(it?.pu || 0), money(valor)];
  });
  return {
    title: "Ejecución diaria",
    columns: ["Fecha", "Ítem", "Descripción", "Cantidad ejecutada", "Unidad", "P. unitario", "Valor ejecutado"],
    rows: out,
    totalsRow: ["", "", "", "", "", "Total", money(total)],
    emptyNote: "No hay ejecuciones registradas en el periodo seleccionado.",
  };
}

function sectionMateriales(project, inRange) {
  const rows = project.materials
    .filter((m) => inRange(m.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = rows.reduce((a, m) => a + m.qty * m.pu, 0);
  return {
    title: "Materiales",
    columns: ["Fecha", "Material", "Ítem", "Unidad", "Cantidad", "P. unitario", "P. total", "Forma de pago", "Proveedor"],
    rows: rows.map((m) => [m.date || "—", m.material || "—", m.itemId || "—", m.unit || "—", num2(m.qty), money(m.pu), money(m.qty * m.pu), m.pay || "—", m.provider || "—"]),
    totalsRow: ["", "", "", "", "", "Total", money(total), "", ""],
    emptyNote: "No hay materiales registrados en el periodo seleccionado.",
  };
}

function sectionsMaterialesPorItem(project, inRange) {
  if (project.items.length === 0) {
    return [{ title: "Materiales asignados por ítem", columns: ["—"], rows: [], emptyNote: "Este proyecto todavía no tiene ítems cargados." }];
  }
  return project.items.map((it) => {
    const mats = project.materials.filter((m) => m.itemId === it.id && inRange(m.date));
    const subtotal = mats.reduce((a, m) => a + m.qty * m.pu, 0);
    return {
      title: `${it.id} — ${it.desc}`,
      columns: ["Material", "Cantidad", "P. unitario", "P. total"],
      rows: mats.map((m) => [m.material || "—", `${num2(m.qty)} ${m.unit}`, money(m.pu), money(m.qty * m.pu)]),
      totalsRow: mats.length ? ["", "", "Subtotal", money(subtotal)] : undefined,
      emptyNote: "Sin materiales asignados a este ítem en el periodo seleccionado.",
    };
  });
}

function sectionManoDeObra(project, inRange) {
  const rows = project.laborDaily
    .filter((l) => inRange(l.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = rows.reduce((a, l) => a + laborCost(l), 0);
  return {
    title: "Mano de obra",
    columns: ["Fecha", "Trabajador", "Categoría", "Tipo de pago", "Turno", "Horas", "Jornal", "Días trabajados", "Salario mensual", "Costo"],
    rows: rows.map((l) => [
      l.date || "—",
      l.worker || "—",
      l.category || "—",
      l.payType === "mensual" ? "Mensual" : "Jornal",
      l.shift || "—",
      l.payType === "mensual" ? "—" : num2(l.hours),
      l.payType === "mensual" ? "—" : money(l.wage),
      l.payType === "mensual" ? num2(l.daysWorked) : "—",
      l.payType === "mensual" ? money(l.monthlySalary) : "—",
      money(laborCost(l)),
    ]),
    totalsRow: ["", "", "", "", "", "", "", "", "Total", money(total)],
    emptyNote: "No hay registros de mano de obra en el periodo seleccionado.",
  };
}

function sectionMaquinaria(project, inRange) {
  const rows = project.machinery
    .filter((m) => inRange(m.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = rows.reduce((a, m) => a + machineCost(m), 0);
  return {
    title: "Maquinaria",
    columns: ["Fecha", "Máquina", "Ítem", "Turno", "Hor. inicial", "Hor. final", "Horas", "Tarifa/hora", "Costo"],
    rows: rows.map((m) => [
      m.date || "—",
      m.machine || "—",
      m.itemId || "—",
      m.shift || "—",
      m.horIni !== "" && m.horIni != null ? num2(m.horIni) : "—",
      m.horFin !== "" && m.horFin != null ? num2(m.horFin) : "—",
      num2(m.hours),
      money(m.rate),
      money(machineCost(m)),
    ]),
    totalsRow: ["", "", "", "", "", "", "", "Total", money(total)],
    emptyNote: "No hay registros de maquinaria en el periodo seleccionado.",
  };
}

function sectionOperacion(project, inRange) {
  const rows = project.operating
    .filter((o) => inRange(o.date))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = rows.reduce((a, o) => a + o.amount, 0);
  return {
    title: "Gastos de operación",
    columns: ["Fecha", "Categoría", "Descripción", "Monto"],
    rows: rows.map((o) => [o.date || "—", o.category || "—", o.desc || "—", money(o.amount)]),
    totalsRow: ["", "", "Total", money(total)],
    emptyNote: "No hay gastos de operación en el periodo seleccionado.",
  };
}

function sectionCurvaS(project) {
  const schedule = (project.schedule || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const itemsTotal = project.items.reduce((a, it) => a + it.qty * it.pu, 0);
  if (schedule.length === 0) {
    return {
      title: "Curva S — Programado vs. Ejecutado",
      columns: ["Fecha", "Programado %", "Ejecutado %", "Diferencia %"],
      rows: [],
      emptyNote: "Este proyecto todavía no tiene una programación de obra (Curva S) cargada.",
    };
  }
  const rows = schedule.map((s) => {
    const execUpTo = project.executions.filter((ex) => ex.date <= s.date);
    const execValue = execUpTo.reduce((acc, ex) => {
      const it = project.items.find((i) => i.id === ex.itemId);
      return acc + ex.qty * (it?.pu || 0);
    }, 0);
    const execPct = itemsTotal ? Math.min(100, (execValue / itemsTotal) * 100) : 0;
    const diff = execPct - Number(s.plannedPct);
    return [s.date, `${num2(s.plannedPct)}%`, `${num2(execPct)}%`, `${diff >= 0 ? "+" : ""}${num2(diff)}%`];
  });
  return { title: "Curva S — Programado vs. Ejecutado", columns: ["Fecha", "Programado %", "Ejecutado %", "Diferencia %"], rows };
}

/* ---------------------------------------------------------
   Arma la lista de secciones para un reporte dado
--------------------------------------------------------- */
export function buildReportSections(reportName, project, inRange) {
  switch (reportName) {
    case "Ingresos":
      return [sectionIngresos(project, inRange)];
    case "Egresos por categoría":
      return [sectionEgresosResumen(project, inRange), sectionEgresosDetalle(project, inRange)];
    case "Ítems y avance":
      return [sectionItemsAvance(project)];
    case "Ejecución diaria":
      return [sectionEjecucionDiaria(project, inRange)];
    case "Materiales":
      return [sectionMateriales(project, inRange)];
    case "Materiales asignados por ítem":
      return sectionsMaterialesPorItem(project, inRange);
    case "Mano de obra":
      return [sectionManoDeObra(project, inRange)];
    case "Maquinaria":
      return [sectionMaquinaria(project, inRange)];
    case "Gastos de operación":
      return [sectionOperacion(project, inRange)];
    case "Curva S":
      return [sectionCurvaS(project)];
    case "Reporte financiero completo":
      return [
        sectionResumen(project, inRange),
        sectionIngresos(project, inRange),
        sectionEgresosResumen(project, inRange),
        sectionEgresosDetalle(project, inRange),
        sectionManoDeObra(project, inRange),
        sectionMaquinaria(project, inRange),
        sectionMateriales(project, inRange),
        sectionOperacion(project, inRange),
      ];
    case "Reporte completo del proyecto":
      return [
        sectionResumen(project, inRange),
        sectionItemsAvance(project),
        sectionEjecucionDiaria(project, inRange),
        sectionIngresos(project, inRange),
        sectionEgresosResumen(project, inRange),
        sectionEgresosDetalle(project, inRange),
        sectionManoDeObra(project, inRange),
        sectionMaquinaria(project, inRange),
        sectionMateriales(project, inRange),
        ...sectionsMaterialesPorItem(project, inRange),
        sectionOperacion(project, inRange),
        sectionCurvaS(project),
      ];
    default:
      return [];
  }
}

/* ---------------------------------------------------------
   Nombre de archivo seguro (sin tildes/espacios raros)
--------------------------------------------------------- */
function safeFileName(project, reportName) {
  const clean = (s) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  return `${clean(project.code || project.name)}_${clean(reportName)}`;
}

/* ---------------------------------------------------------
   EXPORTAR A PDF (jsPDF + autoTable) — corre 100% en el navegador
--------------------------------------------------------- */
export function exportReportToPDF(reportName, project, periodLabel, inRange) {
  const sections = buildReportSections(reportName, project, inRange);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 32;

  doc.setFontSize(14);
  doc.setTextColor(27, 42, 60); // #1B2A3C
  doc.text(`${project.name}${project.code ? ` (${project.code})` : ""}`, margin, 36);
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(reportName, margin, 54);
  doc.setFontSize(9);
  doc.text(`Periodo: ${periodLabel}`, margin, 70);
  doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, pageWidth - margin, 70, { align: "right" });

  let cursorY = 88;

  sections.forEach((sec) => {
    if (cursorY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      cursorY = 40;
    }
    doc.setFontSize(11);
    doc.setTextColor(27, 42, 60);
    doc.text(sec.title, margin, cursorY);
    cursorY += 8;

    const body = sec.rows.length ? sec.rows : [];
    if (body.length === 0) {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        head: [sec.columns],
        body: [[{ content: sec.emptyNote || "Sin datos en el periodo seleccionado.", colSpan: sec.columns.length, styles: { halign: "center", textColor: 140 } }]],
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [27, 42, 60], textColor: 255, fontSize: 8 },
      });
    } else {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        head: [sec.columns],
        body: sec.totalsRow ? [...body, sec.totalsRow] : body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [27, 42, 60], textColor: 255, fontSize: 8 },
        didParseCell: (data) => {
          if (sec.totalsRow && data.row.index === body.length && data.section === "body") {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [244, 243, 239];
          }
        },
      });
    }
    cursorY = doc.lastAutoTable.finalY + 22;
  });

  doc.save(`${safeFileName(project, reportName)}.pdf`);
}

/* ---------------------------------------------------------
   EXPORTAR A EXCEL (SheetJS / xlsx) — corre 100% en el navegador
--------------------------------------------------------- */
export function exportReportToExcel(reportName, project, periodLabel, inRange) {
  const sections = buildReportSections(reportName, project, inRange);
  const wb = XLSX.utils.book_new();

  const usedNames = new Set();
  const sheetName = (base) => {
    let name = base.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Hoja";
    let i = 2;
    while (usedNames.has(name)) {
      const suffix = ` (${i++})`;
      name = base.slice(0, 31 - suffix.length) + suffix;
    }
    usedNames.add(name);
    return name;
  };

  sections.forEach((sec) => {
    const header = [
      [project.name + (project.code ? ` (${project.code})` : "")],
      [sec.title],
      [`Periodo: ${periodLabel}`],
      [],
      sec.columns,
    ];
    const body = sec.rows.length ? sec.rows : [[sec.emptyNote || "Sin datos en el periodo seleccionado."]];
    const aoa = [...header, ...body];
    if (sec.totalsRow) aoa.push(sec.totalsRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = sec.columns.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName(sec.title));
  });

  XLSX.writeFile(wb, `${safeFileName(project, reportName)}.xlsx`);
}
