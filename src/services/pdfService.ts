import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asset, User, Location, Stats, computeStats, PhoneLine, Contract, License } from './api';

export const exportAssetListToPDF = (
  assets: Asset[], 
  users: User[], 
  locations: Location[], 
  title: string = "Inventaire des Assets"
) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Titre
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 22);

  // Sous-titre / Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le : ${dateStr}`, 14, 30);
  doc.text(`Nombre total d'éléments : ${assets.length}`, 14, 35);

  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(14, 42, 196, 42);

  // Préparation des données pour le tableau
  const tableData = assets.map(asset => {
    const assignedUser = users.find(u => String(u.id) === String(asset.assigned_user_id));
    const location = locations.find(l => String(l.id) === String(asset.location_id));
    
    return [
      asset.label || '-',
      asset.type || '-',
      asset.inventory_number || '-',
      asset.serial || '-',
      assignedUser?.name || 'Non assigné',
      location?.name || 'Bureau Central',
      asset.status || '-'
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [['Nom', 'Type', 'N° Inventaire', 'S/N', 'Utilisateur', 'Site', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue-500
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85] // Slate-700
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { top: 50 },
    didDrawPage: (data: any) => {
      // Footer
      const str = 'Page ' + doc.getNumberOfPages();
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`inventaire_parc_it_${new Date().getTime()}.pdf`);
};

export const exportFleetSummaryToPDF = (
  assets: Asset[],
  phoneLines: PhoneLine[],
  users: User[],
  locations: Location[],
  contracts: Contract[],
  licenses: License[]
) => {
  const stats = computeStats(assets, phoneLines, users, locations, contracts, licenses);
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Styles
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
  const secondaryColor: [number, number, number] = [71, 85, 105]; // slate-600

  // Header 
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59);
  doc.text('Bilan Synthétique du Parc IT', 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Rapport annuel de situation au ${dateStr}`, 14, 32);

  // Chiffres Clés (Grid layout simulation)
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 45, 196, 45);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Chiffres Clés', 14, 55);

  const keyFacts = [
    ['Total Assets', stats.counts.assets.toString()],
    ['Utilisateurs', stats.counts.users.toString()],
    ['Sites', stats.counts.locations.toString()],
    ['Matériels en Panne', stats.counts.broken.toString()],
    ['Contrats Actifs', stats.counts.contracts.toString()],
    ['Valeur estimée du parc', `${stats.counts.totalValue.toLocaleString('fr-FR')} €`],
    ['Garantie active', `${stats.counts.warrantyPercent.toFixed(1)} %`],
    ['Âge moyen du parc', `${stats.counts.averageAgeYears.toFixed(1)} ans`]
  ];

  autoTable(doc, {
    startY: 60,
    body: keyFacts,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', textColor: secondaryColor, cellWidth: 100 },
      1: { halign: 'right', fontStyle: 'bold', textColor: primaryColor }
    },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  // Répartition par Type
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Répartition par Type de Matériel', 14, currentY);

  const typeData = stats.charts.categories.map(c => [c.name, c.value.toString()]);
  autoTable(doc, {
    startY: currentY + 5,
    head: [['Catégorie', 'Nombre']],
    body: typeData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    styles: { fontSize: 9 }
  });

  // Répartition par Statut
  const statusY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Situation par État / Statut', 14, statusY);

  const statusData = stats.charts.statuses.map(s => [s.name, s.value.toString()]);
  autoTable(doc, {
    startY: statusY + 5,
    head: [['Statut', 'Nombre']],
    body: statusData,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110] }, // Teal-700
    styles: { fontSize: 9 }
  });

  // Expirations à venir
  if (stats.upcomingExpirations.length > 0) {
    const expireY = (doc as any).lastAutoTable.finalY + 15;
    if (expireY > 240) doc.addPage();
    const finalExpireY = expireY > 240 ? 25 : expireY;
    
    doc.setFontSize(12);
    doc.text('Expirations critiques à venir (60 jours)', 14, finalExpireY);

    const expireData = stats.upcomingExpirations.map(e => [e.name, e.type, new Date(e.date).toLocaleDateString('fr-FR')]);
    autoTable(doc, {
      startY: finalExpireY + 5,
      head: [['Désignation', 'Type', 'Date Échéance']],
      body: expireData,
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28] }, // Red-700
      styles: { fontSize: 9 }
    });
  }

  doc.save(`bilan_parc_it_${new Date().getTime()}.pdf`);
};
