/* ============================================================
   FORMATO — funciones compartidas por la UI y por los reportes
   (PDF / Excel). Vivían antes dentro de ControlDeObras.jsx; se
   movieron aquí para poder reutilizarlas desde src/lib/reports.js
   sin crear una dependencia circular entre ambos archivos.
   ============================================================ */

export const money = (n) =>
  "Bs " +
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Igual que money() pero sin el prefijo "Bs" — para cantidades, horas, porcentajes, etc.
// Formato: coma (,) como separador de miles y punto (.) como separador decimal — ej. 1,234.56
export const num2 = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const expenseCategories = ["Materiales", "Mano de Obra", "Maquinaria", "Gastos de Operación", "Impuestos", "Utilidades", "Otros"];

// Costo de un registro de mano de obra (igual criterio que ControlFinancieroTab)
export const laborCost = (l) => {
  if (l.payType === "mensual") {
    return l.daysWorked > 0 ? (l.monthlySalary / 30) * l.daysWorked : l.monthlySalary;
  }
  return (l.hours / 8) * l.wage;
};

// Costo de un registro de maquinaria
export const machineCost = (m) => m.hours * m.rate;
