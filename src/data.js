const getLocalToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const todayStr = getLocalToday();

export const initialVentas = [
  {
    id: 1, time: '09:00', date: todayStr, item: 'Menú del Día', customer: 'Juan',
    amount: 8500, method: 'Transferencia', isAlmuerzo: true,
    conEnvio: true, envioAmount: 1500, envioPagoCliente: 'Transferencia', envioPagoNosotros: 'Efectivo',
    status: 'Completado'
  },
  {
    id: 2, time: '11:30', date: todayStr, item: 'Batido Proteico', customer: 'Maria',
    amount: 4200, method: 'Transferencia', isAlmuerzo: false,
    conEnvio: false, envioAmount: 0, envioPagoCliente: '', envioPagoNosotros: '',
    status: 'Completado'
  },
  {
    id: 3, time: '13:00', date: todayStr, item: 'Menú del Día + Ensalada', customer: 'Leo',
    amount: 10000, method: 'Efectivo', isAlmuerzo: true,
    conEnvio: true, envioAmount: 1500, envioPagoCliente: 'Transferencia', envioPagoNosotros: 'Efectivo',
    status: 'Completado'
  },
  {
    id: 4, time: '15:00', date: todayStr, item: 'Café + Tostado', customer: 'Carlos',
    amount: 2500, method: 'Efectivo', isAlmuerzo: false,
    conEnvio: false, envioAmount: 0, envioPagoCliente: '', envioPagoNosotros: '',
    status: 'Completado'
  },
];

export const initialConfig = {
  whatsappNumbers: ['543876373665']
};
export const initialGastos = [
  { id: 1, date: todayStr, concept: 'Compra de leche y café', amount: 2500, category: 'Insumos' },
  { id: 2, date: todayStr, concept: 'Gas para cocina', amount: 1800, category: 'Servicios' },
  { id: 3, date: todayStr, concept: 'Vasos descartables', amount: 900, category: 'Descartables' },
];

export const initialPlanes = [
  { 
    id: 1, 
    cliente: 'Martina Rojas', 
    telefono: '123456789',
    cantidadTotal: 20, 
    consumidos: 2,
    historial: [
      { fecha: todayStr, notas: 'Menú de pollo' }
    ]
  },
  { 
    id: 2, 
    cliente: 'Esteban Quito', 
    telefono: '987654321',
    cantidadTotal: 15, 
    consumidos: 0,
    historial: []
  }
];

export const catalogProducts = [
  { name: 'PAN INTEGRAL CON SEMILLAS', price: 6000 },
  { name: 'COMBO STRONG', price: 8500 },
  { name: 'AVOCADO TOAST', price: 6500 },
  { name: 'BOWL DE YOGURT GRIEGO', price: 6500 },
  { name: 'MENÚ DIARIO SALUDABLE', price: 9000, isAlmuerzo: true },
  { name: 'BARRITAS PROTEICAS', price: 2500 },
  { name: 'GALLETAS DE AVENA CON CHIPS', price: 3000 },
  { name: 'BUDÍN DE NARANJA AVENA Y COCO', price: 2000 }
];
