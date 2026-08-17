import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InventoryItem } from './InventoryTypes';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const generateInventoryPDF = (items: InventoryItem[]) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  // Metadata calculations
  const totalItems = items.length;
  const totalStock = items.reduce((acc, item) => acc + item.quantity, 0);
  const generationDate = new Date().toLocaleString('es-VE', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });

  // --- Header ---
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 26); // #1A1A1A
  doc.text('Inventario Actual de Cauchos / Reporte de Stock', 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de generación: ${generationDate}`, 40, 60);
  doc.text(`Total de referencias: ${totalItems}`, 40, 75);
  doc.text(`Total de unidades en stock: ${totalStock}`, 40, 90);

  // --- Table ---
  const tableColumn = ["#", "Medida", "Marca / Modelo", "Precio Lista", "Stock"];
  const tableRows: any[] = [];

  items.forEach((item, index) => {
    const row = [
      index + 1,
      item.size,
      item.brand,
      formatCurrency(item.sellingPrice),
      item.quantity.toString()
    ];
    tableRows.push(row);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 110,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [26, 26, 26],
      lineColor: [229, 231, 235], // #E5E7EB
      lineWidth: 1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [209, 213, 219], // #D1D5DB
      lineWidth: 1,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // pure white, no zebra
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 },
      1: { fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 70, fontSize: 8, textColor: [100, 100, 100] },
      4: { halign: 'center', fontStyle: 'bold', fontSize: 13, cellWidth: 80, textColor: [0, 0, 0] },
    },
    didDrawPage: (data) => {
      // --- Footer ---
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Line
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);
      
      doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }
  });

  // Save the PDF
  doc.save('inventario_rio_de_oro.pdf');
};
