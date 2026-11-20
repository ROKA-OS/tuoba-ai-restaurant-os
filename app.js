import { escapeHtml, escapeAttr, safeUrl } from './lib/escape.js';
import { newOrderNo, newCallId, newTxId } from './lib/ids.js';
import { branchPL as branchPLFn, brandPL as brandPLFn, recipeMargin } from './lib/finance.js';
import { parseCSV, parseAmount, guessColumn } from './lib/csv.js';
import { computeHours, minutesLeft as minutesLeftFn } from './lib/attendance.js';
import { parseMoney, clampCopies, clampPrep, isValidPhone, sanitizeText } from './lib/validation.js';

const STORAGE_KEY = 'tuoba-ultimate-all-in-one-i18n-v1';
const BACKUP_KEY = STORAGE_KEY + ':backup';
const STORAGE_VERSION = 2;
const MAX_RECEIPT_BYTES = 1_500_000;

const BRANDS = {
  'TUOBA Fried & Grill': ['Giza Main', 'Nasr City'],
  'TUOBA Cafe': ['Sheikh Zayed', 'New Cairo'],
  'TUOBA Express': ['Alexandria'],
};

const MENU = [
  { name_ar: 'برجر دجاج', name_en: 'Chicken Burger', name_fr: 'Burger Poulet', name_es: 'Hamburguesa de pollo', name_tr: 'Tavuk Burger', price: 85, prep: 12 },
  { name_ar: 'برجر لحم', name_en: 'Beef Burger', name_fr: 'Burger Boeuf', name_es: 'Hamburguesa de carne', name_tr: 'Et Burger', price: 95, prep: 14 },
  { name_ar: 'وجبة استربس', name_en: 'Strips Meal', name_fr: 'Menu Strips', name_es: 'Combo Strips', name_tr: 'Strips Menü', price: 120, prep: 15 },
  { name_ar: 'فرايز', name_en: 'Fries', name_fr: 'Frites', name_es: 'Papas fritas', name_tr: 'Patates', price: 35, prep: 6 },
  { name_ar: 'كولا', name_en: 'Cola', name_fr: 'Cola', name_es: 'Cola', name_tr: 'Kola', price: 25, prep: 1 },
  { name_ar: 'قهوة', name_en: 'Coffee', name_fr: 'Café', name_es: 'Café', name_tr: 'Kahve', price: 45, prep: 4 },
];

const DELIVERY_LINKS = [
  { name: 'Talabat', url: 'https://www.talabat.com/egypt' },
  { name: 'elmenus', url: 'https://elmenus.com/' },
  { name: 'Mrsool', url: 'https://mrsool.co/' },
  { name: 'Rabbit', url: 'https://rabbitmart.com/' },
  { name: 'HurryApp', url: 'https://play.google.com/store/apps/details?id=com.tawaf.hurryapp' },
];
const DRIVERS = ['مندوب 1', 'مندوب 2', 'مندوب 3'];

const I18N = {
  ar: {
    dir: 'rtl',
    appTitle: 'TUOBA Ultimate All-in-One Multilingual Enterprise',
    appSubtitle: 'تشغيل + POS + مالية + HR + كول سنتر + أمان + جودة + مدفوعات',
    export: 'تصدير', passkey: 'Passkey', location: 'الموقع',
    overview: 'الرئيسية', pos: 'POS', orders: 'الطلبات', kds: 'KDS', pickup: 'Pickup', apps: 'Apps', printing: 'الطباعة',
    expenses: 'المصروفات', recipe: 'الريسيبي', geidea: 'جيديا', finance: 'المالية', callcenter: 'الكول سنتر', crm: 'CRM',
    attendance: 'الحضور', payments: 'الدفع', security: 'الأمان', reports: 'التقارير',
    dashboard: 'لوحة التحكم الموحدة', aiBrief: 'الملخص الذكي', activeSituation: 'الوضع التشغيلي الحالي مستقر.',
    table: 'طاولات', takeaway: 'Take Away', delivery: 'Delivery', orderType: 'نوع الطلب', tables: 'الطاولات', currentTable: 'الطاولة الحالية',
    deliveryInfo: 'بيانات التوصيل', customerName: 'اسم العميل', phone: 'رقم الهاتف', appChannel: 'اسم التطبيق / القناة', address: 'العنوان',
    menu: 'المنيو', cart: 'السلة', total: 'الإجمالي', clear: 'مسح', cash: 'كاش', card: 'فيزا',
    noData: 'لا توجد بيانات', noOrders: 'لا توجد طلبات', preparing: 'تحت التجهيز', ready: 'جاهز', picked: 'تم الاستلام',
    allOrders: 'كل الطلبات', kitchenDisplay: 'شاشة المطبخ', pickupScreen: 'شاشة الاستلام', printingSettings: 'إعدادات الطباعة',
    cashierCopies: 'عدد نسخ الكاشير', kitchenCopies: 'عدد نسخ المطبخ', pickupCopies: 'عدد نسخ البيك أب', save: 'حفظ',
    addExpense: 'إضافة مصروف / استلام', title: 'الاسم', amount: 'المبلغ', notes: 'ملاحظات', saveRecord: 'حفظ السجل',
    expenseLog: 'سجل المصروفات', addRecipe: 'إضافة ريسيبي', recipeIntelligence: 'ذكاء الريسيبي', cost: 'التكلفة', price: 'السعر', ingredients: 'المكونات',
    geideaUpload: 'رفع ملف جيديا CSV', columns: 'الأعمدة', autoMap: 'ربط تلقائي', import: 'استيراد',
    financeCenter: 'مركز المالية', branchPL: 'P&L الفرع', brandPL: 'P&L البراند', cashFlow: 'التدفق النقدي', sales: 'المبيعات', profit: 'الربح',
    callCenter: 'الكول سنتر', createOrder: 'إنشاء طلب', zone: 'المنطقة / الزون', orderDetails: 'تفاصيل الطلب', prepTime: 'وقت التجهيز بالدقائق',
    crmCustomers: 'عملاء CRM', attendanceByLocation: 'الحضور باللوكيشن', currentLocation: 'الموقع الحالي', employee: 'اسم الموظف', checkIn: 'حضور', checkOut: 'انصراف',
    paymentCreate: 'إنشاء عملية دفع', paymentMethod: 'طريقة الدفع', nfc: 'NFC / Contactless', qr: 'QR', wallet: 'Wallet', split: 'Split',
    securityLayers: 'طبقات الأمان', securityLogs: 'السجلات الأمنية', renewal: 'تنبيه', openLink: 'فتح الرابط',
    prepMin: 'دقيقة تجهيز', payroll: 'الرواتب', rent: 'الإيجار', other: 'أخرى', margin: 'الهامش', count: 'العدد', avg: 'المتوسط',
    assign: 'تعيين', out: 'خارج', done: 'تم', driver: 'السائق', left: 'متبقي', hours: 'ساعات', overtime: 'إضافي',
    uploadReceipt: 'رفع صورة الإيصال', brandMargin: 'هامش البراند', saveFinance: 'حفظ بيانات المالية', foodCost: 'تكلفة الطعام',
    invalidPhone: 'رقم هاتف غير صحيح', invalidAmount: 'مبلغ غير صحيح', invalidInput: 'بيانات غير صحيحة',
    confirmExportRedact: 'تصدير مع إخفاء البيانات الحساسة (هواتف/مواقع)؟ اضغط موافق للإخفاء أو إلغاء للتصدير الكامل.',
    exportCancelled: 'تم إلغاء التصدير', storageFull: 'مساحة التخزين ممتلئة. صدّر بياناتك ثم امسح المتصفح.',
    receiptTooLarge: 'صورة الإيصال كبيرة جداً. سيتم حفظ الاسم فقط.', geideaHistory: 'سجل الاستيرادات',
    alreadyCheckedIn: 'هذا الموظف مسجل حضور بالفعل', noOpenShift: 'لا توجد وردية مفتوحة لهذا الموظف',
    date: 'التاريخ', time: 'الوقت', locationUnsupported: 'الجهاز لا يدعم تحديد الموقع', locationUnavailable: 'الموقع غير متاح',
    passkeySimulated: 'تمت محاكاة Passkey/Biometric', passkeyNote: 'محاكاة فقط — ليست مصادقة حقيقية.',
  },
  en: {
    dir: 'ltr',
    appTitle: 'TUOBA Ultimate All-in-One Multilingual Enterprise',
    appSubtitle: 'Operations + POS + Finance + HR + Call Center + Security + Quality + Payments',
    export: 'Export', passkey: 'Passkey', location: 'Location',
    overview: 'Overview', pos: 'POS', orders: 'Orders', kds: 'KDS', pickup: 'Pickup', apps: 'Apps', printing: 'Printing',
    expenses: 'Expenses', recipe: 'Recipes', geidea: 'Geidea', finance: 'Finance', callcenter: 'Call Center', crm: 'CRM',
    attendance: 'Attendance', payments: 'Payments', security: 'Security', reports: 'Reports',
    dashboard: 'Unified Dashboard', aiBrief: 'AI Brief', activeSituation: 'The current operating status is stable.',
    table: 'Tables', takeaway: 'Take Away', delivery: 'Delivery', orderType: 'Order Type', tables: 'Tables', currentTable: 'Current table',
    deliveryInfo: 'Delivery information', customerName: 'Customer name', phone: 'Phone', appChannel: 'App / Channel', address: 'Address',
    menu: 'Menu', cart: 'Cart', total: 'Total', clear: 'Clear', cash: 'Cash', card: 'Card',
    noData: 'No data', noOrders: 'No orders', preparing: 'Preparing', ready: 'Ready', picked: 'Picked',
    allOrders: 'All orders', kitchenDisplay: 'Kitchen Display Screen', pickupScreen: 'Pickup Screen', printingSettings: 'Printing settings',
    cashierCopies: 'Cashier copies', kitchenCopies: 'Kitchen copies', pickupCopies: 'Pickup copies', save: 'Save',
    addExpense: 'Add expense / receipt', title: 'Title', amount: 'Amount', notes: 'Notes', saveRecord: 'Save record',
    expenseLog: 'Expense log', addRecipe: 'Add recipe', recipeIntelligence: 'Recipe Intelligence', cost: 'Cost', price: 'Price', ingredients: 'Ingredients',
    geideaUpload: 'Upload Geidea CSV', columns: 'Columns', autoMap: 'Auto map', import: 'Import',
    financeCenter: 'Finance Center', branchPL: 'Branch P&L', brandPL: 'Brand P&L', cashFlow: 'Cash Flow', sales: 'Sales', profit: 'Profit',
    callCenter: 'Call Center', createOrder: 'Create order', zone: 'Zone', orderDetails: 'Order details', prepTime: 'Prep time (min)',
    crmCustomers: 'CRM Customers', attendanceByLocation: 'Attendance by location', currentLocation: 'Current location', employee: 'Employee name', checkIn: 'Check in', checkOut: 'Check out',
    paymentCreate: 'Create payment', paymentMethod: 'Payment method', nfc: 'NFC / Contactless', qr: 'QR', wallet: 'Wallet', split: 'Split',
    securityLayers: 'Security layers', securityLogs: 'Security logs', renewal: 'Reminder', openLink: 'Open link',
    prepMin: 'min prep', payroll: 'Payroll', rent: 'Rent', other: 'Other', margin: 'Margin', count: 'Count', avg: 'Avg',
    assign: 'Assign', out: 'Out', done: 'Done', driver: 'Driver', left: 'Left', hours: 'Hours', overtime: 'Overtime',
    uploadReceipt: 'Upload receipt image', brandMargin: 'Brand Margin', saveFinance: 'Save finance data', foodCost: 'Food cost',
    invalidPhone: 'Invalid phone number', invalidAmount: 'Invalid amount', invalidInput: 'Invalid input',
    confirmExportRedact: 'Export with PII redacted (phones/locations)? OK to redact, Cancel to export full data.',
    exportCancelled: 'Export cancelled', storageFull: 'Storage is full. Export your data, then clear browser storage.',
    receiptTooLarge: 'Receipt image too large. Only the file name will be saved.', geideaHistory: 'Import history',
    alreadyCheckedIn: 'This employee is already checked in', noOpenShift: 'No open shift for this employee',
    date: 'Date', time: 'Time', locationUnsupported: 'Geolocation unsupported', locationUnavailable: 'Location unavailable',
    passkeySimulated: 'Passkey/Biometric simulated', passkeyNote: 'Simulation only — not real authentication.',
  },
  fr: {
    dir: 'ltr',
    appTitle: 'TUOBA Ultimate All-in-One Multilingual Enterprise',
    appSubtitle: 'Opérations + POS + Finance + RH + Centre d’appels + Sécurité + Qualité + Paiements',
    export: 'Exporter', passkey: 'Passkey', location: 'Localisation',
    overview: 'Aperçu', pos: 'POS', orders: 'Commandes', kds: 'KDS', pickup: 'Pickup', apps: 'Apps', printing: 'Impression',
    expenses: 'Dépenses', recipe: 'Recettes', geidea: 'Geidea', finance: 'Finance', callcenter: 'Centre d’appels', crm: 'CRM',
    attendance: 'Présence', payments: 'Paiements', security: 'Sécurité', reports: 'Rapports',
    dashboard: 'Tableau de bord unifié', aiBrief: 'Résumé IA', activeSituation: 'Le statut opérationnel actuel est stable.',
    table: 'Tables', takeaway: 'À emporter', delivery: 'Livraison', orderType: 'Type de commande', tables: 'Tables', currentTable: 'Table actuelle',
    deliveryInfo: 'Informations de livraison', customerName: 'Nom du client', phone: 'Téléphone', appChannel: 'Application / Canal', address: 'Adresse',
    menu: 'Menu', cart: 'Panier', total: 'Total', clear: 'Effacer', cash: 'Espèces', card: 'Carte',
    noData: 'Aucune donnée', noOrders: 'Aucune commande', preparing: 'Préparation', ready: 'Prêt', picked: 'Retiré',
    allOrders: 'Toutes les commandes', kitchenDisplay: 'Écran cuisine', pickupScreen: 'Écran de retrait', printingSettings: 'Paramètres d’impression',
    cashierCopies: 'Copies caissier', kitchenCopies: 'Copies cuisine', pickupCopies: 'Copies retrait', save: 'Enregistrer',
    addExpense: 'Ajouter dépense / reçu', title: 'Nom', amount: 'Montant', notes: 'Notes', saveRecord: 'Enregistrer',
    expenseLog: 'Journal des dépenses', addRecipe: 'Ajouter recette', recipeIntelligence: 'Intelligence recette', cost: 'Coût', price: 'Prix', ingredients: 'Ingrédients',
    geideaUpload: 'Téléverser CSV Geidea', columns: 'Colonnes', autoMap: 'Auto mapping', import: 'Importer',
    financeCenter: 'Centre financier', branchPL: 'P&L succursale', brandPL: 'P&L marque', cashFlow: 'Flux de trésorerie', sales: 'Ventes', profit: 'Profit',
    callCenter: 'Centre d’appels', createOrder: 'Créer commande', zone: 'Zone', orderDetails: 'Détails de commande', prepTime: 'Temps de préparation (min)',
    crmCustomers: 'Clients CRM', attendanceByLocation: 'Présence par localisation', currentLocation: 'Localisation actuelle', employee: 'Nom employé', checkIn: 'Entrée', checkOut: 'Sortie',
    paymentCreate: 'Créer paiement', paymentMethod: 'Mode de paiement', nfc: 'NFC / Sans contact', qr: 'QR', wallet: 'Portefeuille', split: 'Split',
    securityLayers: 'Couches de sécurité', securityLogs: 'Journaux de sécurité', renewal: 'Rappel', openLink: 'Ouvrir le lien',
    prepMin: 'min de préparation', payroll: 'Masse salariale', rent: 'Loyer', other: 'Autres', margin: 'Marge', count: 'Nombre', avg: 'Moyenne',
    assign: 'Assigner', out: 'En route', done: 'Terminé', driver: 'Chauffeur', left: 'Restant', hours: 'Heures', overtime: 'Heures sup.',
    uploadReceipt: 'Téléverser le reçu', brandMargin: 'Marge marque', saveFinance: 'Enregistrer les finances', foodCost: 'Coût matière',
    invalidPhone: 'Numéro invalide', invalidAmount: 'Montant invalide', invalidInput: 'Entrée invalide',
    confirmExportRedact: 'Exporter avec données sensibles masquées (téléphones/lieux) ? OK pour masquer, Annuler pour export complet.',
    exportCancelled: 'Export annulé', storageFull: 'Stockage plein. Exportez vos données puis videz le navigateur.',
    receiptTooLarge: 'Image trop grande. Seul le nom sera enregistré.', geideaHistory: 'Historique des imports',
    alreadyCheckedIn: 'Employé déjà présent', noOpenShift: 'Aucun shift ouvert pour cet employé',
    date: 'Date', time: 'Heure', locationUnsupported: 'Géolocalisation non supportée', locationUnavailable: 'Localisation indisponible',
    passkeySimulated: 'Passkey/Biométrie simulé', passkeyNote: 'Simulation uniquement — pas une vraie authentification.',
  },
  es: {
    dir: 'ltr',
    appTitle: 'TUOBA Ultimate All-in-One Multilingual Enterprise',
    appSubtitle: 'Operaciones + POS + Finanzas + RRHH + Call Center + Seguridad + Calidad + Pagos',
    export: 'Exportar', passkey: 'Passkey', location: 'Ubicación',
    overview: 'Resumen', pos: 'POS', orders: 'Pedidos', kds: 'KDS', pickup: 'Pickup', apps: 'Apps', printing: 'Impresión',
    expenses: 'Gastos', recipe: 'Recetas', geidea: 'Geidea', finance: 'Finanzas', callcenter: 'Call Center', crm: 'CRM',
    attendance: 'Asistencia', payments: 'Pagos', security: 'Seguridad', reports: 'Reportes',
    dashboard: 'Panel unificado', aiBrief: 'Resumen IA', activeSituation: 'El estado operativo actual es estable.',
    table: 'Mesas', takeaway: 'Para llevar', delivery: 'Entrega', orderType: 'Tipo de pedido', tables: 'Mesas', currentTable: 'Mesa actual',
    deliveryInfo: 'Datos de entrega', customerName: 'Nombre del cliente', phone: 'Teléfono', appChannel: 'App / Canal', address: 'Dirección',
    menu: 'Menú', cart: 'Carrito', total: 'Total', clear: 'Borrar', cash: 'Efectivo', card: 'Tarjeta',
    noData: 'Sin datos', noOrders: 'Sin pedidos', preparing: 'Preparando', ready: 'Listo', picked: 'Entregado',
    allOrders: 'Todos los pedidos', kitchenDisplay: 'Pantalla de cocina', pickupScreen: 'Pantalla de retiro', printingSettings: 'Configuración de impresión',
    cashierCopies: 'Copias de caja', kitchenCopies: 'Copias cocina', pickupCopies: 'Copias retiro', save: 'Guardar',
    addExpense: 'Agregar gasto / recibo', title: 'Nombre', amount: 'Monto', notes: 'Notas', saveRecord: 'Guardar registro',
    expenseLog: 'Registro de gastos', addRecipe: 'Agregar receta', recipeIntelligence: 'Inteligencia de recetas', cost: 'Costo', price: 'Precio', ingredients: 'Ingredientes',
    geideaUpload: 'Subir CSV de Geidea', columns: 'Columnas', autoMap: 'Auto map', import: 'Importar',
    financeCenter: 'Centro financiero', branchPL: 'P&L sucursal', brandPL: 'P&L marca', cashFlow: 'Flujo de caja', sales: 'Ventas', profit: 'Beneficio',
    callCenter: 'Call Center', createOrder: 'Crear pedido', zone: 'Zona', orderDetails: 'Detalles del pedido', prepTime: 'Tiempo de preparación (min)',
    crmCustomers: 'Clientes CRM', attendanceByLocation: 'Asistencia por ubicación', currentLocation: 'Ubicación actual', employee: 'Nombre del empleado', checkIn: 'Entrada', checkOut: 'Salida',
    paymentCreate: 'Crear pago', paymentMethod: 'Método de pago', nfc: 'NFC / Sin contacto', qr: 'QR', wallet: 'Billetera', split: 'Split',
    securityLayers: 'Capas de seguridad', securityLogs: 'Registros de seguridad', renewal: 'Recordatorio', openLink: 'Abrir enlace',
    prepMin: 'min de preparación', payroll: 'Nómina', rent: 'Alquiler', other: 'Otros', margin: 'Margen', count: 'Cantidad', avg: 'Promedio',
    assign: 'Asignar', out: 'En camino', done: 'Listo', driver: 'Conductor', left: 'Restante', hours: 'Horas', overtime: 'Horas extra',
    uploadReceipt: 'Subir recibo', brandMargin: 'Margen de marca', saveFinance: 'Guardar finanzas', foodCost: 'Costo de comida',
    invalidPhone: 'Teléfono inválido', invalidAmount: 'Monto inválido', invalidInput: 'Entrada inválida',
    confirmExportRedact: '¿Exportar con datos sensibles ocultos (teléfonos/ubicaciones)? OK para ocultar, Cancelar para exportar completo.',
    exportCancelled: 'Exportación cancelada', storageFull: 'Almacenamiento lleno. Exporte sus datos y limpie el navegador.',
    receiptTooLarge: 'Imagen demasiado grande. Solo se guardará el nombre.', geideaHistory: 'Historial de importaciones',
    alreadyCheckedIn: 'Empleado ya registrado', noOpenShift: 'Sin turno abierto para este empleado',
    date: 'Fecha', time: 'Hora', locationUnsupported: 'Geolocalización no soportada', locationUnavailable: 'Ubicación no disponible',
    passkeySimulated: 'Passkey/Biometría simulado', passkeyNote: 'Solo simulación — no es autenticación real.',
  },
  tr: {
    dir: 'ltr',
    appTitle: 'TUOBA Ultimate All-in-One Multilingual Enterprise',
    appSubtitle: 'Operasyon + POS + Finans + İK + Çağrı Merkezi + Güvenlik + Kalite + Ödeme',
    export: 'Dışa aktar', passkey: 'Passkey', location: 'Konum',
    overview: 'Genel', pos: 'POS', orders: 'Siparişler', kds: 'KDS', pickup: 'Pickup', apps: 'Uygulamalar', printing: 'Yazdırma',
    expenses: 'Giderler', recipe: 'Reçeteler', geidea: 'Geidea', finance: 'Finans', callcenter: 'Çağrı Merkezi', crm: 'CRM',
    attendance: 'Devam', payments: 'Ödemeler', security: 'Güvenlik', reports: 'Raporlar',
    dashboard: 'Birleşik Panel', aiBrief: 'AI Özeti', activeSituation: 'Mevcut operasyon durumu stabil.',
    table: 'Masalar', takeaway: 'Gel Al', delivery: 'Teslimat', orderType: 'Sipariş Türü', tables: 'Masalar', currentTable: 'Geçerli masa',
    deliveryInfo: 'Teslimat bilgileri', customerName: 'Müşteri adı', phone: 'Telefon', appChannel: 'Uygulama / Kanal', address: 'Adres',
    menu: 'Menü', cart: 'Sepet', total: 'Toplam', clear: 'Temizle', cash: 'Nakit', card: 'Kart',
    noData: 'Veri yok', noOrders: 'Sipariş yok', preparing: 'Hazırlanıyor', ready: 'Hazır', picked: 'Teslim edildi',
    allOrders: 'Tüm siparişler', kitchenDisplay: 'Mutfak ekranı', pickupScreen: 'Teslim ekranı', printingSettings: 'Yazdırma ayarları',
    cashierCopies: 'Kasa kopyaları', kitchenCopies: 'Mutfak kopyaları', pickupCopies: 'Teslim kopyaları', save: 'Kaydet',
    addExpense: 'Gider / fiş ekle', title: 'Ad', amount: 'Tutar', notes: 'Notlar', saveRecord: 'Kaydı kaydet',
    expenseLog: 'Gider kaydı', addRecipe: 'Reçete ekle', recipeIntelligence: 'Reçete zekâsı', cost: 'Maliyet', price: 'Fiyat', ingredients: 'İçerikler',
    geideaUpload: 'Geidea CSV yükle', columns: 'Sütunlar', autoMap: 'Otomatik eşle', import: 'İçe aktar',
    financeCenter: 'Finans merkezi', branchPL: 'Şube P&L', brandPL: 'Marka P&L', cashFlow: 'Nakit akışı', sales: 'Satış', profit: 'Kâr',
    callCenter: 'Çağrı Merkezi', createOrder: 'Sipariş oluştur', zone: 'Bölge', orderDetails: 'Sipariş detayları', prepTime: 'Hazırlık süresi (dk)',
    crmCustomers: 'CRM müşterileri', attendanceByLocation: 'Konuma göre devam', currentLocation: 'Geçerli konum', employee: 'Çalışan adı', checkIn: 'Giriş', checkOut: 'Çıkış',
    paymentCreate: 'Ödeme oluştur', paymentMethod: 'Ödeme yöntemi', nfc: 'NFC / Temassız', qr: 'QR', wallet: 'Cüzdan', split: 'Böl',
    securityLayers: 'Güvenlik katmanları', securityLogs: 'Güvenlik kayıtları', renewal: 'Hatırlatma', openLink: 'Bağlantıyı aç',
    prepMin: 'dk hazırlık', payroll: 'Bordro', rent: 'Kira', other: 'Diğer', margin: 'Marj', count: 'Adet', avg: 'Ortalama',
    assign: 'Ata', out: 'Yolda', done: 'Tamam', driver: 'Sürücü', left: 'Kalan', hours: 'Saat', overtime: 'Fazla mesai',
    uploadReceipt: 'Fiş yükle', brandMargin: 'Marka marjı', saveFinance: 'Finansı kaydet', foodCost: 'Yemek maliyeti',
    invalidPhone: 'Geçersiz telefon', invalidAmount: 'Geçersiz tutar', invalidInput: 'Geçersiz giriş',
    confirmExportRedact: 'Kişisel veriler gizlenerek dışa aktarılsın mı (telefon/konum)? Gizlemek için OK, tam veri için İptal.',
    exportCancelled: 'Dışa aktarma iptal edildi', storageFull: 'Depolama dolu. Verilerinizi dışa aktarıp tarayıcıyı temizleyin.',
    receiptTooLarge: 'Fiş görseli çok büyük. Yalnızca dosya adı kaydedilecek.', geideaHistory: 'İçe aktarma geçmişi',
    alreadyCheckedIn: 'Bu çalışan zaten giriş yaptı', noOpenShift: 'Bu çalışan için açık vardiya yok',
    date: 'Tarih', time: 'Saat', locationUnsupported: 'Konum desteklenmiyor', locationUnavailable: 'Konum kullanılamıyor',
    passkeySimulated: 'Passkey/Biyometrik simüle edildi', passkeyNote: 'Yalnızca simülasyon — gerçek kimlik doğrulama değil.',
  },
};

const initialState = {
  version: STORAGE_VERSION,
  lang: 'ar',
  brand: 'TUOBA Fried & Grill',
  branch: 'Giza Main',
  carts: {},
  currentMode: 'table',
  currentTable: 'T1',
  tableIds: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
  tableState: {},
  printers: {},
  orders: [],
  expenses: [],
  recipes: [],
  geidea: [],
  geideaImports: [],
  finance: [
    { brand: 'TUOBA Fried & Grill', branch: 'Giza Main', foodCost: 168000, payroll: 95000, rent: 40000, other: 32000 },
    { brand: 'TUOBA Fried & Grill', branch: 'Nasr City', foodCost: 120000, payroll: 70000, rent: 35000, other: 25000 },
    { brand: 'TUOBA Cafe', branch: 'Sheikh Zayed', foodCost: 90000, payroll: 65000, rent: 42000, other: 22000 },
    { brand: 'TUOBA Cafe', branch: 'New Cairo', foodCost: 85000, payroll: 60000, rent: 40000, other: 21000 },
    { brand: 'TUOBA Express', branch: 'Alexandria', foodCost: 70000, payroll: 50000, rent: 30000, other: 18000 },
  ],
  customerCalls: [],
  customers: [
    { brand: 'TUOBA Fried & Grill', branch: 'Giza Main', name: 'عميل 1', phone: '01000000001', lastPayment: 'NFC' },
  ],
  attendance: [],
  location: { lat: null, lng: null, label: 'غير متاح' },
  shifts: [
    { name: 'Morning', start: '09:00', end: '18:00' },
    { name: 'Evening', start: '14:00', end: '23:00' },
  ],
  payments: [],
  securityLogs: [
    { brand: 'TUOBA Fried & Grill', branch: 'Giza Main', type: 'login', detail: 'Passkey login simulated', time: new Date().toLocaleString() },
  ],
};

function clone(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function scopeKey(brand, branch) {
  return `${brand}||${branch}`;
}

function migrate(parsed) {
  if (!parsed || typeof parsed !== 'object') return clone(initialState);
  const s = { ...clone(initialState), ...parsed };
  s.version = STORAGE_VERSION;
  s.carts = parsed.carts || {};
  s.tableState = parsed.tableState || {};
  s.printers = parsed.printers || {};
  s.geideaImports = parsed.geideaImports || [];
  s.tableIds = parsed.tableIds || clone(initialState).tableIds;

  const key = scopeKey(s.brand, s.branch);
  // v1 -> v2: global cart -> per-branch cart
  if (Array.isArray(parsed.cart) && !s.carts[key]) {
    s.carts[key] = parsed.cart;
  }
  // v1 -> v2: global tables[].occupied -> per-branch tableState
  if (Array.isArray(parsed.tables) && !s.tableState[key]) {
    const map = {};
    for (const t of parsed.tables) map[t.id] = Boolean(t.occupied);
    s.tableState[key] = map;
  }
  // v1 -> v2: global printer -> per-branch printers
  if (parsed.printer && !s.printers[key]) {
    s.printers[key] = parsed.printer;
  }
  delete s.cart;
  delete s.tables;
  delete s.printer;
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(initialState);
    return migrate(JSON.parse(raw));
  } catch {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) return migrate(JSON.parse(backup));
    } catch { /* fall through */ }
    return clone(initialState);
  }
}

let state = loadState();

function saveState() {
  try {
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev) localStorage.setItem(BACKUP_KEY, prev);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      alert(t('storageFull'));
    }
  }
}

const brandSelect = document.getElementById('brand-select');
const branchSelect = document.getElementById('branch-select');
const langSelect = document.getElementById('lang-select');
const content = document.getElementById('content');
const buttons = document.querySelectorAll('.nav-btn');

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
}
function menuName(item) {
  const k = 'name_' + state.lang;
  return item[k] || item.name_en || item.name_ar;
}
function setLang(lang) {
  state.lang = lang;
  const dir = (I18N[lang] && I18N[lang].dir) || 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  saveState();
  renderNavLabels();
  renderHeaderLabels();
  render(currentTab);
}
function renderHeaderLabels() {
  document.getElementById('app-title').textContent = t('appTitle');
  document.getElementById('app-subtitle').textContent = t('appSubtitle');
  document.getElementById('export-btn').textContent = t('export');
  document.getElementById('passkey-btn').textContent = t('passkey');
  document.getElementById('location-btn').textContent = t('location');
}
function renderNavLabels() {
  const keys = ['overview', 'pos', 'orders', 'kds', 'pickup', 'apps', 'printing', 'expenses', 'recipe', 'geidea', 'finance', 'callcenter', 'crm', 'attendance', 'payments', 'security', 'reports'];
  buttons.forEach((btn, i) => {
    btn.textContent = t(keys[i]);
    btn.setAttribute('aria-label', t(keys[i]));
  });
}
function initSelectors() {
  brandSelect.innerHTML = Object.keys(BRANDS).map((b) => `<option value="${escapeAttr(b)}">${escapeHtml(b)}</option>`).join('');
  brandSelect.value = state.brand;
  updateBranches();

  langSelect.innerHTML = `
    <option value="ar">العربية</option>
    <option value="en">English</option>
    <option value="fr">Français</option>
    <option value="es">Español</option>
    <option value="tr">Türkçe</option>
  `;
  langSelect.value = state.lang;

  brandSelect.onchange = () => {
    state.brand = brandSelect.value;
    state.branch = (BRANDS[state.brand] || [])[0] || '';
    saveState();
    updateBranches();
    render(currentTab);
  };
  branchSelect.onchange = () => {
    state.branch = branchSelect.value;
    saveState();
    render(currentTab);
  };
  langSelect.onchange = () => setLang(langSelect.value);

  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('passkey-btn').addEventListener('click', simulateBiometric);
  document.getElementById('location-btn').addEventListener('click', getCurrentLocation);

  setLang(state.lang);
}
function updateBranches() {
  const arr = BRANDS[state.brand] || [];
  branchSelect.innerHTML = arr.map((b) => `<option value="${escapeAttr(b)}">${escapeHtml(b)}</option>`).join('');
  if (!arr.includes(state.branch)) state.branch = arr[0] || '';
  branchSelect.value = state.branch;
}
function scoped(arr) {
  return (arr || []).filter((x) => x.brand === state.brand && x.branch === state.branch);
}
function getCartKey() {
  return scopeKey(state.brand, state.branch);
}
function getCart() {
  return state.carts[getCartKey()] || [];
}
function setCart(items) {
  state.carts[getCartKey()] = items;
}
function getTables() {
  const map = state.tableState[getCartKey()] || {};
  return state.tableIds.map((id) => ({ id, occupied: Boolean(map[id]) }));
}
function setTableOccupied(id, occupied) {
  const key = getCartKey();
  if (!state.tableState[key]) state.tableState[key] = {};
  state.tableState[key][id] = occupied;
}
function getPrinter() {
  return state.printers[getCartKey()] || { cashierCopies: 1, kitchenCopies: 1, pickupCopies: 1 };
}
function setActive(tab) {
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
}
function kpi(label, value, delta = '') {
  return `<div class="card"><div class="kpi-label">${escapeHtml(label)}</div><div class="kpi-value">${escapeHtml(value)}</div><div class="kpi-delta">${escapeHtml(delta)}</div></div>`;
}
function minutesLeft(readyAt) {
  return minutesLeftFn(readyAt);
}
function branchPL(brand, branch) {
  return branchPLFn(state, brand, branch);
}
function brandPL(brand) {
  return brandPLFn(state, brand, BRANDS);
}
function aiBrief() {
  const openOrders = scoped(state.orders).filter((o) => o.status !== 'picked').length;
  const openCalls = scoped(state.customerCalls).filter((o) => o.status !== 'delivered').length;
  const p = branchPL(state.brand, state.branch);
  const notes = [];
  if (openOrders) notes.push(`${openOrders} ${t('orders')}`);
  if (openCalls) notes.push(`${openCalls} ${t('callcenter')}`);
  if (p.sales > 0) notes.push(`${t('profit')}: ${p.profit.toFixed(2)}`);
  if (!notes.length) notes.push(t('activeSituation'));
  return notes;
}

function renderOverview() {
  const orders = scoped(state.orders);
  const calls = scoped(state.customerCalls);
  const payments = scoped(state.payments);
  const p = branchPL(state.brand, state.branch);
  content.innerHTML = `
    <div class="hero">
      <div class="section-title">${escapeHtml(t('dashboard'))}</div>
      <div class="small">${escapeHtml(state.brand)} · ${escapeHtml(state.branch)}</div>
    </div>
    <div class="grid-2">
      ${kpi(t('orders'), orders.length, 'POS')}
      ${kpi(t('callcenter'), calls.length, 'CC')}
      ${kpi(t('payments'), payments.length, 'Pay')}
      ${kpi(t('crm'), scoped(state.customers).length, 'CRM')}
      ${kpi(t('sales'), p.sales.toFixed(2), t('finance'))}
      ${kpi(t('profit'), p.profit.toFixed(2), 'P&L')}
    </div>
    <div class="card">
      <div class="section-title">${escapeHtml(t('aiBrief'))}</div>
      <div class="list">${aiBrief().map((n) => `<div class="list-item">${escapeHtml(n)}</div>`).join('')}</div>
    </div>
  `;
}

function renderPOS() {
  const cart = getCart();
  const cartTotal = cart.reduce((a, b) => a + (b.price * b.qty), 0);
  const tables = getTables();
  content.innerHTML = `
    <div class="card">
      <div class="section-title">${escapeHtml(t('orderType'))}</div>
      <div class="btn-row">
        <button class="btn ${state.currentMode === 'table' ? 'primary' : 'soft'}" data-action="set-order-mode" data-mode="table">${escapeHtml(t('table'))}</button>
        <button class="btn ${state.currentMode === 'takeaway' ? 'primary' : 'soft'}" data-action="set-order-mode" data-mode="takeaway">${escapeHtml(t('takeaway'))}</button>
        <button class="btn ${state.currentMode === 'delivery' ? 'primary' : 'soft'}" data-action="set-order-mode" data-mode="delivery">${escapeHtml(t('delivery'))}</button>
      </div>
    </div>
    ${state.currentMode === 'table' ? `<div class="card"><div class="section-title">${escapeHtml(t('tables'))}</div><div class="table-grid">${tables.map((ti) => `<button class="table-card ${ti.occupied ? 'occupied' : ''}" data-action="select-table" data-id="${escapeAttr(ti.id)}">${escapeHtml(ti.id)}</button>`).join('')}</div><div class="note">${escapeHtml(t('currentTable'))}: ${escapeHtml(state.currentTable)}</div></div>` : ''}
    ${state.currentMode === 'delivery' ? `<div class="card"><div class="section-title">${escapeHtml(t('deliveryInfo'))}</div><div class="form-grid"><label>${escapeHtml(t('customerName'))}<input id="customer-name" class="input" placeholder="${escapeAttr(t('customerName'))}" /></label><label>${escapeHtml(t('phone'))}<input id="customer-phone" class="input" placeholder="${escapeAttr(t('phone'))}" inputmode="tel" /></label><label>${escapeHtml(t('appChannel'))}<input id="delivery-app" class="input" placeholder="${escapeAttr(t('appChannel'))}" /></label><label>${escapeHtml(t('address'))}<textarea id="delivery-address" class="textarea" placeholder="${escapeAttr(t('address'))}"></textarea></label></div></div>` : ''}
    <div class="card"><div class="section-title">${escapeHtml(t('menu'))}</div><div class="menu-grid">${MENU.map((m, idx) => `<button class="menu-btn" data-action="add-to-cart" data-idx="${idx}"><strong>${escapeHtml(menuName(m))}</strong><div class="muted">${escapeHtml(m.price)}</div><div class="small">${escapeHtml(m.prep)} ${escapeHtml(t('prepMin'))}</div></button>`).join('')}</div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('cart'))}</div><div class="list">${cart.length ? cart.map((i, idx) => `<div class="cart-row"><div><strong>${escapeHtml(menuName(i))}</strong><div class="muted">${escapeHtml(i.qty)} × ${escapeHtml(i.price)}</div></div><div><button class="btn soft" data-action="change-qty" data-idx="${idx}" data-delta="1">+</button><button class="btn soft" data-action="change-qty" data-idx="${idx}" data-delta="-1">-</button></div></div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div><div class="section-title">${escapeHtml(t('total'))}: ${cartTotal.toFixed(2)}</div><div class="btn-row"><button class="btn soft" data-action="clear-cart">${escapeHtml(t('clear'))}</button><button class="btn primary" data-action="place-order" data-payment="cash">${escapeHtml(t('cash'))}</button><button class="btn primary" data-action="place-order" data-payment="card">${escapeHtml(t('card'))}</button></div></div>
  `;
}
function addToCart(idx) {
  const item = MENU[idx];
  if (!item) return;
  const cart = getCart();
  const existing = cart.find((x) => x.name_en === item.name_en);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  setCart(cart);
  saveState();
  render('pos');
}
function changeQty(idx, delta) {
  const cart = getCart();
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  setCart(cart);
  saveState();
  render('pos');
}
function clearCart() {
  setCart([]);
  saveState();
  render('pos');
}
function setOrderMode(mode) {
  state.currentMode = mode;
  saveState();
  render('pos');
}
function selectTable(id) {
  state.currentTable = id;
  saveState();
  render('pos');
}
function placeOrder(payment) {
  const cart = getCart();
  if (!cart.length) return alert(t('noData'));
  let customer = {};
  if (state.currentMode === 'delivery') {
    customer = {
      name: sanitizeText(document.getElementById('customer-name')?.value || ''),
      phone: sanitizeText(document.getElementById('customer-phone')?.value || ''),
      app: sanitizeText(document.getElementById('delivery-app')?.value || ''),
      address: sanitizeText(document.getElementById('delivery-address')?.value || ''),
    };
    if (customer.phone && !isValidPhone(customer.phone)) return alert(t('invalidPhone'));
    if (customer.phone) upsertCustomer(customer.name || 'Customer', customer.phone, payment);
  }
  const orderNo = newOrderNo();
  const prepMinutes = Math.max(...cart.map((i) => i.prep), 5);
  const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);
  const printer = getPrinter();
  state.orders.unshift({
    brand: state.brand, branch: state.branch, orderNo, mode: state.currentMode, table: state.currentMode === 'table' ? state.currentTable : '',
    customer, payment, items: clone(cart), total, prepMinutes,
    createdAt: new Date().toISOString(), readyAt: new Date(Date.now() + prepMinutes * 60000).toISOString(), status: 'preparing',
    cashierCopies: clampCopies(printer.cashierCopies), kitchenCopies: clampCopies(printer.kitchenCopies), pickupCopies: clampCopies(printer.pickupCopies),
  });
  if (state.currentMode === 'table') setTableOccupied(state.currentTable, true);
  setCart([]);
  saveState();
  render('orders');
}

function renderOrders() {
  const posOrders = scoped(state.orders);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('allOrders'))}</div><div class="list">${posOrders.length ? posOrders.map((o, idx) => `
      <div class="list-item">
        <span class="badge ${o.status === 'preparing' ? 'preparing' : o.status === 'ready' ? 'ready' : 'picked'}">${escapeHtml(t(o.status) || o.status)}</span>
        <div><strong>${escapeHtml(o.orderNo)}</strong> — ${escapeHtml(o.mode)} — ${escapeHtml(Number(o.total || 0).toFixed(2))}</div>
        <div class="muted">${o.table ? escapeHtml(t('table')) + ': ' + escapeHtml(o.table) + ' — ' : ''}${escapeHtml(t('prepTime'))}: ${escapeHtml(o.prepMinutes)} — ${escapeHtml(t('left'))}: ${escapeHtml(minutesLeft(o.readyAt))}</div>
        <div class="small">${escapeHtml(t('cashierCopies'))}: ${escapeHtml(o.cashierCopies)} · ${escapeHtml(t('kitchenCopies'))}: ${escapeHtml(o.kitchenCopies)} · ${escapeHtml(t('pickupCopies'))}: ${escapeHtml(o.pickupCopies)}</div>
        <div class="btn-row"><button class="btn soft" data-action="set-pos-status" data-idx="${idx}" data-status="preparing">${escapeHtml(t('preparing'))}</button><button class="btn soft" data-action="set-pos-status" data-idx="${idx}" data-status="ready">${escapeHtml(t('ready'))}</button><button class="btn soft" data-action="set-pos-status" data-idx="${idx}" data-status="picked">${escapeHtml(t('picked'))}</button></div>
      </div>`).join('') : `<div class="muted">${escapeHtml(t('noOrders'))}</div>`}</div></div>
  `;
}
function setPosOrderStatus(idx, status) {
  const orders = scoped(state.orders);
  const target = orders[idx];
  if (!target) return;
  const realIdx = state.orders.findIndex((x) => x === target);
  if (realIdx < 0) return;
  state.orders[realIdx].status = status;
  if (status === 'picked' && target.mode === 'table' && target.table) {
    // Free the table only if this order belongs to the current branch scope.
    setTableOccupied(target.table, false);
  }
  saveState();
  render('orders');
}

function renderKDS() {
  const orders = scoped(state.orders).filter((o) => o.status === 'preparing');
  content.innerHTML = `<div class="card"><div class="section-title">${escapeHtml(t('kitchenDisplay'))}</div><div class="list">${orders.length ? orders.map((o) => `
    <div class="list-item"><span class="badge preparing">${escapeHtml(t('preparing'))}</span><div><strong>${escapeHtml(o.orderNo)}</strong> — ${escapeHtml(o.mode)}</div><div class="muted">${escapeHtml(t('prepTime'))}: ${escapeHtml(o.prepMinutes)} — ${escapeHtml(t('left'))}: ${escapeHtml(minutesLeft(o.readyAt))}</div><div class="list">${(o.items || []).map((i) => `<div class="small">${escapeHtml(i.qty)} × ${escapeHtml(menuName(i))}</div>`).join('')}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noOrders'))}</div>`}</div></div>`;
}

function renderPickup() {
  const orders = scoped(state.orders).filter((o) => o.status === 'ready');
  content.innerHTML = `<div class="card"><div class="section-title">${escapeHtml(t('pickupScreen'))}</div><div class="list">${orders.length ? orders.map((o) => `
    <div class="list-item"><span class="badge ready">${escapeHtml(t('ready'))}</span><div><strong>${escapeHtml(o.orderNo)}</strong></div><div class="muted">${escapeHtml(o.mode)} ${o.customer?.name ? '— ' + escapeHtml(o.customer.name) : ''}</div><div class="small">${escapeHtml(t('pickupCopies'))}: ${escapeHtml(o.pickupCopies)}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noOrders'))}</div>`}</div></div>`;
}

function renderApps() {
  content.innerHTML = `<div class="card"><div class="section-title">${escapeHtml(t('apps'))}</div><div class="channel-grid">${DELIVERY_LINKS.map((x) => `<a class="link-btn" href="${escapeAttr(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(x.name)}</strong><div class="muted">${escapeHtml(t('openLink'))}</div></a>`).join('')}</div></div>`;
}

function renderPrinting() {
  const printer = getPrinter();
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('printingSettings'))}</div><div class="form-grid">
      <label>${escapeHtml(t('cashierCopies'))}<input id="cashier-copies" class="input" type="number" min="1" max="20" value="${escapeAttr(printer.cashierCopies)}" /></label>
      <label>${escapeHtml(t('kitchenCopies'))}<input id="kitchen-copies" class="input" type="number" min="1" max="20" value="${escapeAttr(printer.kitchenCopies)}" /></label>
      <label>${escapeHtml(t('pickupCopies'))}<input id="pickup-copies" class="input" type="number" min="1" max="20" value="${escapeAttr(printer.pickupCopies)}" /></label>
      <button class="btn primary" data-action="save-printer">${escapeHtml(t('save'))}</button>
    </div></div>
  `;
}
function savePrinterSettings() {
  const next = {
    cashierCopies: clampCopies(document.getElementById('cashier-copies')?.value),
    kitchenCopies: clampCopies(document.getElementById('kitchen-copies')?.value),
    pickupCopies: clampCopies(document.getElementById('pickup-copies')?.value),
  };
  state.printers[getCartKey()] = next;
  saveState();
  render('printing');
}

async function readImage(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result || '');
    r.onerror = () => resolve('');
    r.readAsDataURL(file);
  });
}
async function handleReceiptPreview(e) {
  const file = e.target.files?.[0];
  const box = document.getElementById('receipt-preview-wrap');
  if (!file || !box) return;
  if (file.size > MAX_RECEIPT_BYTES) alert(t('receiptTooLarge'));
  const src = await readImage(file);
  if (src && src.startsWith('data:image/')) {
    box.innerHTML = `<div class="small">${escapeHtml(file.name)}</div><img class="preview-image" src="${escapeAttr(src)}" alt="receipt" />`;
  } else {
    box.textContent = file.name;
  }
}
function renderExpenses() {
  const items = scoped(state.expenses);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('addExpense'))}</div><div class="form-grid">
      <label>${escapeHtml(t('title'))}<input id="exp-title" class="input" placeholder="${escapeAttr(t('title'))}" /></label>
      <label>${escapeHtml(t('amount'))}<input id="exp-amount" class="input" type="number" min="0" step="0.01" placeholder="${escapeAttr(t('amount'))}" /></label>
      <label>${escapeHtml(t('uploadReceipt'))}<input id="exp-receipt" class="input" type="file" accept="image/*" capture="environment" /></label>
      <div id="receipt-preview-wrap" class="note">${escapeHtml(t('uploadReceipt'))}</div>
      <label>${escapeHtml(t('notes'))}<textarea id="exp-note" class="textarea" placeholder="${escapeAttr(t('notes'))}"></textarea></label>
      <button class="btn primary" data-action="add-expense">${escapeHtml(t('saveRecord'))}</button>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('expenseLog'))}</div><div class="list">${items.length ? items.map((e) => `<div class="list-item"><strong>${escapeHtml(e.title)}</strong> — ${escapeHtml(e.amount)}<div class="muted">${escapeHtml(e.note || '')}</div>${e.receiptName ? `<div class="small">${escapeHtml(e.receiptName)}</div>` : ''}${e.receiptData && String(e.receiptData).startsWith('data:image/') ? `<img class="preview-image" src="${escapeAttr(e.receiptData)}" alt="receipt" />` : ''}</div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
  document.getElementById('exp-receipt').addEventListener('change', handleReceiptPreview);
}
async function addExpense() {
  const title = sanitizeText(document.getElementById('exp-title')?.value || '');
  const amount = parseMoney(document.getElementById('exp-amount')?.value);
  const note = sanitizeText(document.getElementById('exp-note')?.value || '');
  const receipt = document.getElementById('exp-receipt')?.files?.[0];
  if (!title || amount === null) return alert(t('invalidAmount'));
  let receiptData = '';
  if (receipt && receipt.size <= MAX_RECEIPT_BYTES) {
    const src = await readImage(receipt);
    if (src && src.startsWith('data:image/')) receiptData = src;
  } else if (receipt) {
    alert(t('receiptTooLarge'));
  }
  state.expenses.unshift({ brand: state.brand, branch: state.branch, title, amount, note, receiptName: receipt ? receipt.name : '', receiptData });
  saveState();
  render('expenses');
}

function renderRecipe() {
  const items = scoped(state.recipes);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('addRecipe'))}</div><div class="form-grid">
      <label>${escapeHtml(t('title'))}<input id="r-name" class="input" placeholder="${escapeAttr(t('title'))}" /></label>
      <label>${escapeHtml(t('cost'))}<input id="r-cost" class="input" type="number" min="0" step="0.01" placeholder="${escapeAttr(t('cost'))}" /></label>
      <label>${escapeHtml(t('price'))}<input id="r-price" class="input" type="number" min="0" step="0.01" placeholder="${escapeAttr(t('price'))}" /></label>
      <label>${escapeHtml(t('ingredients'))}<textarea id="r-ing" class="textarea" placeholder="${escapeAttr(t('ingredients'))}"></textarea></label>
      <button class="btn primary" data-action="add-recipe">${escapeHtml(t('save'))}</button>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('recipeIntelligence'))}</div><div class="list">${items.length ? items.map((r) => `<div class="list-item"><span class="badge ${Number(r.margin) >= 40 ? 'good' : 'pending'}">${escapeHtml(r.margin)}%</span><div><strong>${escapeHtml(r.name)}</strong></div><div class="muted">${escapeHtml(t('cost'))}: ${escapeHtml(r.cost)} — ${escapeHtml(t('price'))}: ${escapeHtml(r.price)}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
}
function addRecipe() {
  const name = sanitizeText(document.getElementById('r-name')?.value || '');
  const cost = parseMoney(document.getElementById('r-cost')?.value, { allowZero: true });
  const price = parseMoney(document.getElementById('r-price')?.value);
  const ingredients = sanitizeText(document.getElementById('r-ing')?.value || '', 2000);
  if (!name || cost === null || price === null) return alert(t('invalidAmount'));
  const margin = recipeMargin(cost, price);
  state.recipes.unshift({ brand: state.brand, branch: state.branch, name, cost, price, ingredients, margin });
  saveState();
  render('recipe');
}

let geideaHeaders = [];
let geideaRows = [];
let geideaFileName = '';
function renderGeidea() {
  const history = scoped(state.geideaImports);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('geideaUpload'))}</div><label>${escapeHtml(t('geideaUpload'))}<input id="file-input" class="input" type="file" accept=".csv,text/csv" /></label><div class="note">CSV</div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('columns'))}</div><div id="columns-box" class="muted">${escapeHtml(t('noData'))}</div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('autoMap'))}</div><div class="form-grid">
      <label>${escapeHtml(t('date'))}<select id="map-date" class="select"></select></label>
      <label>${escapeHtml(t('time'))}<select id="map-time" class="select"></select></label>
      <label>${escapeHtml(t('amount'))}<select id="map-amount" class="select"></select></label>
    </div><div class="btn-row"><button class="btn soft" data-action="auto-map">${escapeHtml(t('autoMap'))}</button><button class="btn primary" data-action="run-import">${escapeHtml(t('import'))}</button></div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('reports'))}</div><div id="results-box" class="muted">${escapeHtml(t('noData'))}</div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('geideaHistory'))}</div><div class="list">${history.length ? history.map((h) => `<div class="list-item"><div><strong>${escapeHtml(h.at)}</strong></div><div class="muted">${escapeHtml(t('sales'))}: ${escapeHtml(Number(h.total || 0).toFixed(2))} · ${escapeHtml(t('count'))}: ${escapeHtml(h.count)} · ${escapeHtml(t('avg'))}: ${escapeHtml(Number(h.avg || 0).toFixed(2))}</div>${h.fileName ? `<div class="small">${escapeHtml(h.fileName)}</div>` : ''}</div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
  document.getElementById('file-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    geideaFileName = file.name;
    const parsed = parseCSV(await file.text());
    geideaHeaders = parsed.headers;
    geideaRows = parsed.rows;
    fillMapSelects();
    renderHeaders();
    autoMap();
  });
}
function fillMapSelects() {
  ['map-date', 'map-time', 'map-amount'].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">--</option>' + geideaHeaders.map((h) => `<option value="${escapeAttr(h)}">${escapeHtml(h)}</option>`).join('');
  });
}
function renderHeaders() {
  const box = document.getElementById('columns-box');
  if (!box) return;
  box.innerHTML = geideaHeaders.length ? geideaHeaders.map((h) => `<div class="list-item">${escapeHtml(h)}</div>`).join('') : '—';
}
function autoMap() {
  const dateSel = document.getElementById('map-date');
  const timeSel = document.getElementById('map-time');
  const amountSel = document.getElementById('map-amount');
  if (!dateSel || !timeSel || !amountSel) return;
  dateSel.value = guessColumn(geideaHeaders, ['date', 'تاريخ']) || '';
  timeSel.value = guessColumn(geideaHeaders, ['time', 'وقت']) || '';
  amountSel.value = guessColumn(geideaHeaders, ['amount', 'total', 'gross', 'net', 'مبلغ', 'قيمة']) || '';
}
function runImport() {
  const amountCol = document.getElementById('map-amount')?.value;
  if (!amountCol) return alert(t('noData'));
  const cleaned = geideaRows.map((r) => ({ amount: parseAmount(r[amountCol]) }));
  const total = cleaned.reduce((a, b) => a + b.amount, 0);
  const count = cleaned.length;
  const avg = count ? total / count : 0;
  const rec = { brand: state.brand, branch: state.branch, total, count, avg };
  const idx = state.geidea.findIndex((x) => x.brand === state.brand && x.branch === state.branch);
  if (idx >= 0) state.geidea[idx] = rec;
  else state.geidea.unshift(rec);
  state.geideaImports.unshift({
    brand: state.brand, branch: state.branch, total, count, avg,
    at: new Date().toLocaleString(), fileName: geideaFileName || '',
  });
  saveState();
  const box = document.getElementById('results-box');
  if (box) {
    box.innerHTML = `<div class="list"><div class="list-item">${escapeHtml(t('sales'))}: ${total.toFixed(2)}</div><div class="list-item">${escapeHtml(t('count'))}: ${count}</div><div class="list-item">${escapeHtml(t('avg'))}: ${avg.toFixed(2)}</div></div>`;
  }
  render('geidea');
}

function renderFinance() {
  const p = branchPL(state.brand, state.branch);
  const b = brandPL(state.brand);
  const cIn = p.sales;
  const cOut = p.totalCost;
  const balance = p.sales - p.totalCost;
  const bMargin = b.sales > 0 ? Math.round((b.profit / b.sales) * 100) : 0;
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('branchPL'))} — ${escapeHtml(state.branch)}</div><div class="list">
      <div class="list-item">${escapeHtml(t('sales'))}: ${escapeHtml(p.sales.toFixed(2))}</div>
      <div class="list-item">${escapeHtml(t('foodCost'))}: ${escapeHtml(p.foodCost)}</div>
      <div class="list-item">${escapeHtml(t('payroll'))}: ${escapeHtml(p.payroll)}</div>
      <div class="list-item">${escapeHtml(t('rent'))}: ${escapeHtml(p.rent)}</div>
      <div class="list-item">${escapeHtml(t('other'))}: ${escapeHtml(p.other)}</div>
      <div class="list-item"><strong>${escapeHtml(t('profit'))}: ${escapeHtml(p.profit.toFixed(2))}</strong></div>
      <div class="list-item"><strong>${escapeHtml(t('margin'))}: ${escapeHtml(p.margin)}%</strong></div>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('brandPL'))} — ${escapeHtml(state.brand)}</div><div class="list">
      <div class="list-item">${escapeHtml(t('sales'))}: ${escapeHtml(b.sales.toFixed(2))}</div>
      <div class="list-item">${escapeHtml(t('total'))} ${escapeHtml(t('cost'))}: ${escapeHtml(b.totalCost.toFixed(2))}</div>
      <div class="list-item"><strong>${escapeHtml(t('profit'))}: ${escapeHtml(b.profit.toFixed(2))}</strong></div>
      <div class="list-item"><strong>${escapeHtml(t('margin'))}: ${escapeHtml(bMargin)}%</strong></div>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('cashFlow'))}</div><div class="list"><div class="list-item">In: ${escapeHtml(cIn.toFixed(2))}</div><div class="list-item">Out: ${escapeHtml(cOut.toFixed(2))}</div><div class="list-item"><strong>Balance: ${escapeHtml(balance.toFixed(2))}</strong></div></div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('financeCenter'))}</div><div class="form-grid">
      <label>${escapeHtml(t('foodCost'))}<input id="fin-food" class="input" type="number" min="0" step="0.01" value="${escapeAttr(p.foodCost)}" /></label>
      <label>${escapeHtml(t('payroll'))}<input id="fin-payroll" class="input" type="number" min="0" step="0.01" value="${escapeAttr(p.payroll)}" /></label>
      <label>${escapeHtml(t('rent'))}<input id="fin-rent" class="input" type="number" min="0" step="0.01" value="${escapeAttr(p.rent)}" /></label>
      <label>${escapeHtml(t('other'))}<input id="fin-other" class="input" type="number" min="0" step="0.01" value="${escapeAttr(p.other)}" /></label>
      <button class="btn primary" data-action="save-finance">${escapeHtml(t('saveFinance'))}</button>
    </div></div>
  `;
}
function saveFinance() {
  const foodCost = parseMoney(document.getElementById('fin-food')?.value, { allowZero: true });
  const payroll = parseMoney(document.getElementById('fin-payroll')?.value, { allowZero: true });
  const rent = parseMoney(document.getElementById('fin-rent')?.value, { allowZero: true });
  const other = parseMoney(document.getElementById('fin-other')?.value, { allowZero: true });
  if (foodCost === null || payroll === null || rent === null || other === null) return alert(t('invalidAmount'));
  const idx = state.finance.findIndex((x) => x.brand === state.brand && x.branch === state.branch);
  const rec = { brand: state.brand, branch: state.branch, foodCost, payroll, rent, other };
  if (idx >= 0) state.finance[idx] = rec;
  else state.finance.unshift(rec);
  saveState();
  render('finance');
}

function renderCallCenter() {
  const calls = scoped(state.customerCalls);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('callCenter'))}</div><div class="form-grid">
      <label>${escapeHtml(t('phone'))}<input id="cc-phone" class="input" placeholder="${escapeAttr(t('phone'))}" inputmode="tel" /></label>
      <label>${escapeHtml(t('customerName'))}<input id="cc-name" class="input" placeholder="${escapeAttr(t('customerName'))}" /></label>
      <label>${escapeHtml(t('orderType'))}<select id="cc-type" class="select"><option value="delivery">${escapeHtml(t('delivery'))}</option><option value="takeaway">${escapeHtml(t('takeaway'))}</option><option value="table">${escapeHtml(t('table'))}</option></select></label>
      <label>${escapeHtml(t('zone'))}<input id="cc-zone" class="input" placeholder="${escapeAttr(t('zone'))}" /></label>
      <label>${escapeHtml(t('orderDetails'))}<textarea id="cc-order" class="textarea" placeholder="${escapeAttr(t('orderDetails'))}"></textarea></label>
      <label>${escapeHtml(t('prepTime'))}<input id="cc-prep" class="input" type="number" min="1" placeholder="${escapeAttr(t('prepTime'))}" value="20" /></label>
      <button class="btn primary" data-action="create-call-order">${escapeHtml(t('createOrder'))}</button>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('orders'))}</div><div class="list">${calls.length ? calls.map((o, idx) => `
      <div class="list-item"><span class="badge ${o.status === 'new' ? 'pending' : o.status === 'assigned' ? 'pending' : o.status === 'out' ? 'preparing' : 'ready'}">${escapeHtml(o.status)}</span>
        <div><strong>${escapeHtml(o.customerName)}</strong> — ${escapeHtml(o.phone)}</div>
        <div class="muted">${escapeHtml(o.orderText)}</div>
        <div class="small">${escapeHtml(t('driver'))}: ${escapeHtml(o.driver || '-')} · ${escapeHtml(t('left'))}: ${escapeHtml(minutesLeft(o.readyAt))}</div>
        <div class="btn-row"><button class="btn soft" data-action="assign-driver" data-idx="${idx}">${escapeHtml(t('assign'))}</button><button class="btn soft" data-action="set-call-status" data-idx="${idx}" data-status="out">${escapeHtml(t('out'))}</button><button class="btn soft" data-action="set-call-status" data-idx="${idx}" data-status="delivered">${escapeHtml(t('done'))}</button></div>
      </div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
}
function createCallOrder() {
  const phone = sanitizeText(document.getElementById('cc-phone')?.value || '');
  const customerName = sanitizeText(document.getElementById('cc-name')?.value || '');
  const type = document.getElementById('cc-type')?.value || 'delivery';
  const zone = sanitizeText(document.getElementById('cc-zone')?.value || '');
  const orderText = sanitizeText(document.getElementById('cc-order')?.value || '', 2000);
  const prep = clampPrep(document.getElementById('cc-prep')?.value, 20);
  if (!phone || !customerName || !orderText) return alert(t('noData'));
  if (!isValidPhone(phone)) return alert(t('invalidPhone'));
  const order = { brand: state.brand, branch: state.branch, id: newCallId(), phone, customerName, type, zone, orderText, status: 'new', driver: '', createdAt: new Date().toISOString(), readyAt: new Date(Date.now() + prep * 60000).toISOString() };
  state.customerCalls.unshift(order);
  upsertCustomer(customerName, phone, 'CC');
  saveState();
  render('callcenter');
}
function assignDriverPrompt(idx) {
  const driver = prompt(t('driver'), DRIVERS[0]);
  if (!driver) return;
  const orders = scoped(state.customerCalls);
  const target = orders[idx];
  if (!target) return;
  const realIdx = state.customerCalls.findIndex((x) => x === target);
  if (realIdx < 0) return;
  state.customerCalls[realIdx].driver = sanitizeText(driver);
  state.customerCalls[realIdx].status = 'assigned';
  saveState();
  render('callcenter');
}
function setCallStatus(idx, status) {
  const orders = scoped(state.customerCalls);
  const target = orders[idx];
  if (!target) return;
  const realIdx = state.customerCalls.findIndex((x) => x === target);
  if (realIdx < 0) return;
  state.customerCalls[realIdx].status = status;
  saveState();
  render('callcenter');
}

function renderCRM() {
  const customers = scoped(state.customers);
  content.innerHTML = `<div class="card"><div class="section-title">${escapeHtml(t('crmCustomers'))}</div><div class="list">${customers.length ? customers.map((c) => `<div class="list-item"><div><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.phone)}</div><div class="muted">Last payment/source: ${escapeHtml(c.lastPayment || '-')}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>`;
}
function upsertCustomer(name, phone, lastPayment) {
  const idx = state.customers.findIndex((x) => x.brand === state.brand && x.branch === state.branch && x.phone === phone);
  if (idx >= 0) {
    state.customers[idx].name = name;
    state.customers[idx].lastPayment = lastPayment;
  } else {
    state.customers.push({ brand: state.brand, branch: state.branch, name, phone, lastPayment });
  }
}

function renderAttendance() {
  const rows = scoped(state.attendance);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('attendanceByLocation'))}</div><div class="muted">${escapeHtml(t('currentLocation'))}: ${escapeHtml(state.location.label)}</div><div class="form-grid">
      <label>${escapeHtml(t('employee'))}<input id="emp-name" class="input" placeholder="${escapeAttr(t('employee'))}" /></label>
      <label>${escapeHtml(t('attendance'))}<select id="emp-shift" class="select">${state.shifts.map((s) => `<option value="${escapeAttr(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.start)}-${escapeHtml(s.end)})</option>`).join('')}</select></label>
      <div class="btn-row"><button class="btn primary" data-action="check-in">${escapeHtml(t('checkIn'))}</button><button class="btn soft" data-action="check-out">${escapeHtml(t('checkOut'))}</button><button class="btn soft" data-action="get-location">${escapeHtml(t('location'))}</button></div>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('attendance'))}</div><div class="list">${rows.length ? rows.map((r) => `<div class="list-item"><div><strong>${escapeHtml(r.employee)}</strong> — ${escapeHtml(r.shift)}</div><div class="muted">In: ${escapeHtml(r.checkInAt || '-')} · Out: ${escapeHtml(r.checkOutAt || '-')}</div><div class="small">${escapeHtml(t('hours'))}: ${escapeHtml(r.hoursWorked || 0)} · ${escapeHtml(t('overtime'))}: ${escapeHtml(r.overtime || 0)}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
}
function getCurrentLocation() {
  if (!navigator.geolocation) {
    state.location = { lat: null, lng: null, label: t('locationUnsupported') };
    saveState();
    render(currentTab);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` };
      saveState();
      render(currentTab);
    },
    () => {
      state.location = { lat: null, lng: null, label: t('locationUnavailable') };
      saveState();
      render(currentTab);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
}
function checkIn() {
  const employee = sanitizeText(document.getElementById('emp-name')?.value || '');
  const shift = document.getElementById('emp-shift')?.value || '';
  if (!employee) return alert(t('noData'));
  const alreadyOpen = state.attendance.some((x) => x.brand === state.brand && x.branch === state.branch && x.employee === employee && !x.checkOutAt);
  if (alreadyOpen) return alert(t('alreadyCheckedIn'));
  state.attendance.unshift({ brand: state.brand, branch: state.branch, employee, shift, checkInAt: new Date().toISOString(), checkOutAt: '', location: state.location.label, hoursWorked: 0, overtime: 0 });
  saveState();
  render('attendance');
}
function checkOut() {
  const employee = sanitizeText(document.getElementById('emp-name')?.value || '');
  if (!employee) return alert(t('noData'));
  const idx = state.attendance.findIndex((x) => x.brand === state.brand && x.branch === state.branch && x.employee === employee && !x.checkOutAt);
  if (idx < 0) return alert(t('noOpenShift'));
  const rec = state.attendance[idx];
  const shiftDef = state.shifts.find((s) => s.name === rec.shift) || { start: '09:00', end: '18:00' };
  const nowIso = new Date().toISOString();
  const { hoursWorked, overtime } = computeHours(rec.checkInAt, nowIso, shiftDef.start, shiftDef.end);
  rec.checkOutAt = nowIso;
  rec.hoursWorked = hoursWorked;
  rec.overtime = overtime;
  saveState();
  render('attendance');
}

function renderPayments() {
  const payments = scoped(state.payments);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('paymentCreate'))}</div><div class="form-grid">
      <label>${escapeHtml(t('customerName'))}<input id="pay-customer" class="input" placeholder="${escapeAttr(t('customerName'))}" /></label>
      <label>${escapeHtml(t('phone'))}<input id="pay-phone" class="input" placeholder="${escapeAttr(t('phone'))}" inputmode="tel" /></label>
      <label>${escapeHtml(t('amount'))}<input id="pay-amount" class="input" type="number" min="0" step="0.01" placeholder="${escapeAttr(t('amount'))}" /></label>
      <label>${escapeHtml(t('paymentMethod'))}<select id="pay-method" class="select">
        <option value="NFC">${escapeHtml(t('nfc'))}</option>
        <option value="Card">${escapeHtml(t('card'))}</option>
        <option value="QR">${escapeHtml(t('qr'))}</option>
        <option value="Cash">${escapeHtml(t('cash'))}</option>
        <option value="Wallet">${escapeHtml(t('wallet'))}</option>
        <option value="Split">${escapeHtml(t('split'))}</option>
      </select></label>
      <button class="btn primary" data-action="create-payment">${escapeHtml(t('save'))}</button>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('payments'))}</div><div class="list">${payments.length ? payments.map((p) => `<div class="list-item"><span class="badge good">${escapeHtml(p.method)}</span><div><strong>${escapeHtml(p.customer)}</strong> — ${escapeHtml(p.amount)}</div><div class="muted">${escapeHtml(p.phone)} · ${escapeHtml(p.txId)}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
}
function createPayment() {
  const customer = sanitizeText(document.getElementById('pay-customer')?.value || '');
  const phone = sanitizeText(document.getElementById('pay-phone')?.value || '');
  const amount = parseMoney(document.getElementById('pay-amount')?.value);
  const method = document.getElementById('pay-method')?.value || 'Cash';
  if (!customer || !phone || amount === null) return alert(t('invalidAmount'));
  if (!isValidPhone(phone)) return alert(t('invalidPhone'));
  const txId = newTxId();
  state.payments.unshift({ brand: state.brand, branch: state.branch, customer, phone, amount, method, txId });
  upsertCustomer(customer, phone, method);
  state.securityLogs.unshift({ brand: state.brand, branch: state.branch, type: 'payment', detail: `${method} payment ${txId}`, time: new Date().toLocaleString() });
  saveState();
  render('payments');
}

function renderSecurity() {
  const logs = scoped(state.securityLogs);
  content.innerHTML = `
    <div class="card"><div class="section-title">${escapeHtml(t('securityLayers'))}</div><div class="list">
      <div class="list-item"><span class="badge sec">Passkey/Biometric</span> ${escapeHtml(t('passkeyNote'))}</div>
      <div class="list-item"><span class="badge sec">Brand isolation</span> Brand-scoped customers, payments, and records.</div>
      <div class="list-item"><span class="badge sec">Audit logs</span> Trace sensitive actions.</div>
      <div class="list-item"><span class="badge warn">MVP</span> Local prototype, not direct bank integration.</div>
    </div></div>
    <div class="card"><div class="section-title">${escapeHtml(t('securityLogs'))}</div><div class="list">${logs.length ? logs.map((l) => `<div class="list-item"><div><strong>${escapeHtml(l.type)}</strong></div><div class="muted">${escapeHtml(l.detail)}</div><div class="small">${escapeHtml(l.time)}</div></div>`).join('') : `<div class="muted">${escapeHtml(t('noData'))}</div>`}</div></div>
  `;
}
function simulateBiometric() {
  state.securityLogs.unshift({ brand: state.brand, branch: state.branch, type: 'login', detail: 'Passkey/biometric simulated', time: new Date().toLocaleString() });
  saveState();
  alert(t('passkeySimulated'));
  render('security');
}

function renderReports() {
  const orders = scoped(state.orders);
  const calls = scoped(state.customerCalls);
  const payments = scoped(state.payments);
  const brandSummary = brandPL(state.brand);
  const brandMargin = brandSummary.sales > 0 ? Math.round((brandSummary.profit / brandSummary.sales) * 100) : 0;
  content.innerHTML = `
    <div class="hero"><div class="section-title">${escapeHtml(t('reports'))}</div><div class="small">${escapeHtml(state.brand)}</div></div>
    <div class="grid-2">
      ${kpi(t('orders'), orders.length, 'POS')}
      ${kpi(t('callcenter'), calls.length, 'CC')}
      ${kpi(t('payments'), payments.length, 'Pay')}
      ${kpi(t('brandMargin'), brandMargin + '%', 'Brand')}
    </div>
    <div class="card"><div class="section-title">${escapeHtml(t('aiBrief'))}</div><div class="list">${aiBrief().map((n) => `<div class="list-item">${escapeHtml(n)}</div>`).join('')}</div></div>
  `;
}

function exportData() {
  const redact = confirm(t('confirmExportRedact'));
  // confirm() returns true for OK (redact) and false for Cancel (full export).
  // To allow cancelling entirely, use a second check: if user wants to cancel, they can close dialog.
  // Here: OK = redacted export, Cancel = full export. Documented in the prompt text.
  let payload = state;
  if (redact) {
    payload = clone(state);
    payload.customers = (payload.customers || []).map((c) => ({ ...c, phone: '***' }));
    payload.customerCalls = (payload.customerCalls || []).map((c) => ({ ...c, phone: '***' }));
    payload.payments = (payload.payments || []).map((p) => ({ ...p, phone: '***' }));
    payload.orders = (payload.orders || []).map((o) => ({ ...o, customer: o.customer ? { ...o.customer, phone: '***' } : o.customer }));
    payload.location = { lat: null, lng: null, label: '***' };
    payload.expenses = (payload.expenses || []).map((e) => ({ ...e, receiptData: '' }));
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tuoba-ultimate-all-in-one-i18n-data.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

let currentTab = 'overview';
function render(tab) {
  currentTab = tab;
  setActive(tab);
  if (tab === 'overview') renderOverview();
  else if (tab === 'pos') renderPOS();
  else if (tab === 'orders') renderOrders();
  else if (tab === 'kds') renderKDS();
  else if (tab === 'pickup') renderPickup();
  else if (tab === 'apps') renderApps();
  else if (tab === 'printing') renderPrinting();
  else if (tab === 'expenses') renderExpenses();
  else if (tab === 'recipe') renderRecipe();
  else if (tab === 'geidea') renderGeidea();
  else if (tab === 'finance') renderFinance();
  else if (tab === 'callcenter') renderCallCenter();
  else if (tab === 'crm') renderCRM();
  else if (tab === 'attendance') renderAttendance();
  else if (tab === 'payments') renderPayments();
  else if (tab === 'security') renderSecurity();
  else if (tab === 'reports') renderReports();
}
buttons.forEach((btn) => btn.addEventListener('click', () => render(btn.dataset.tab)));

// Central event delegation — no inline onclick handlers (CSP-safe).
content.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const idx = Number(el.dataset.idx);
  switch (action) {
    case 'set-order-mode': setOrderMode(el.dataset.mode); break;
    case 'select-table': selectTable(el.dataset.id); break;
    case 'add-to-cart': addToCart(idx); break;
    case 'change-qty': changeQty(idx, Number(el.dataset.delta)); break;
    case 'clear-cart': clearCart(); break;
    case 'place-order': placeOrder(el.dataset.payment); break;
    case 'set-pos-status': setPosOrderStatus(idx, el.dataset.status); break;
    case 'save-printer': savePrinterSettings(); break;
    case 'add-expense': addExpense(); break;
    case 'add-recipe': addRecipe(); break;
    case 'auto-map': autoMap(); break;
    case 'run-import': runImport(); break;
    case 'create-call-order': createCallOrder(); break;
    case 'assign-driver': assignDriverPrompt(idx); break;
    case 'set-call-status': setCallStatus(idx, el.dataset.status); break;
    case 'check-in': checkIn(); break;
    case 'check-out': checkOut(); break;
    case 'get-location': getCurrentLocation(); break;
    case 'create-payment': createPayment(); break;
    case 'save-finance': saveFinance(); break;
    default: break;
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
  // If a new worker is waiting, ask it to activate so users get the update.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Avoid reload loops: only reload once per session.
    if (!sessionStorage.getItem('tuoba-sw-reloaded')) {
      sessionStorage.setItem('tuoba-sw-reloaded', '1');
      window.location.reload();
    }
  });
}

initSelectors();
render('overview');

// Keep KDS/Orders/Pickup countdowns fresh (read-only screens only, so no input loss).
setInterval(() => {
  if (['kds', 'orders', 'pickup'].includes(currentTab)) render(currentTab);
}, 30000);
