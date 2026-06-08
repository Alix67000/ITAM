export const theme = {
  // Conteneurs & Layout
  pageContainer: "max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20",
  pageHeader: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm",
  pageTitleBox: "flex items-center gap-3",
  pageTitleIcon: "w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl",
  pageTitleText: "text-xl lg:text-2xl font-bold text-slate-900 tracking-tight",
  pageSubtitle: "text-sm text-slate-500 ml-[52px]",
  
  // Cartes & Panels
  card: "bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden",
  cardHeader: "px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50",
  cardTitle: "text-lg font-bold text-slate-800",
  
  // Boutons
  btnPrimary: "flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-200 hover:shadow-md disabled:opacity-50 disabled:grayscale whitespace-nowrap",
  btnSecondary: "flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:grayscale whitespace-nowrap",
  btnDanger: "flex items-center justify-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:grayscale whitespace-nowrap",
  btnIconGhost: "p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-0",
  btnIconDanger: "p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-0",
  
  // Inputs & Recherche
  inputBase: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400",
  searchInput: "w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400",
  searchIcon: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors",

  // Badges (base)
  badge: "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest w-max border",
  badgePrimary: "bg-indigo-50 text-indigo-700 border-indigo-100/50",
  badgeSuccess: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
  badgeWarning: "bg-amber-50 text-amber-700 border-amber-100/50",
  badgeDanger: "bg-red-50 text-red-700 border-red-100/50",
  badgeNeutral: "bg-slate-50 text-slate-600 border-slate-200/60",
  
  // Listes (Rows)
  listWrapper: "divide-y divide-slate-100",
  listRow: "flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 lg:py-3 hover:bg-slate-50/60 transition-colors items-start lg:items-center group",
  listHeaderRow: "hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none",

  // États
  loadingPanel: "p-16 text-center text-slate-400 text-sm font-medium flex flex-col items-center",
  loadingSpinner: "w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4",
  // État vide
  emptyPanel: "p-16 flex flex-col items-center justify-center text-center",
  emptyIconBox: "w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4",
  emptyText: "text-slate-500 font-medium text-sm",

  // Vues Détail (Detail Views)
  detailHeader: "bg-white border-b border-slate-200 sticky top-0 z-[50] px-4 md:px-6 py-3 flex items-center justify-between shadow-sm",
  detailHeaderIconBox: "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm border",
  detailMainGrid: "flex flex-col lg:grid lg:grid-cols-12 gap-5",
  detailContent: "lg:col-span-8 space-y-5 order-2 lg:order-1",
  detailSidebar: "lg:col-span-4 space-y-5 order-1 lg:order-2",
  detailSection: "bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4",
  detailSectionHeader: "flex items-center justify-between border-b border-slate-50 pb-3",
  detailSectionTitle: "text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2",
  detailMetaLabel: "text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] block",
  detailMetaValue: "font-bold text-slate-900 text-sm",
  // Formulaires
  formLabel: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block",
  formSection: "bg-slate-50/50 p-6 rounded-2xl border border-slate-100/60 space-y-5",
  formSectionTitle: "text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-5",
  
  // Modales
  modalBackdrop: "fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6",
  modalOverlay: "absolute inset-0 bg-slate-900/40 backdrop-blur-sm",
  modalPanel: "relative bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200",
  modalHeader: "flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shadow-sm z-10",
  modalTitleBox: "flex flex-col",
  modalTitle: "text-xl font-black text-slate-900 tracking-tight flex items-center gap-3",
  modalSubtitle: "text-xs font-semibold text-slate-500 tracking-wider uppercase mt-1",
  modalCloseBtn: "p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors",
  modalBody: "p-6 overflow-y-auto space-y-6 bg-white",
  modalFooter: "px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex gap-3 justify-end z-10",
};
