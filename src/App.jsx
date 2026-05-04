import React, { useState, useEffect } from 'react';
import { initialConfig } from './data';
import { API_URL } from './config';
import { 
  DollarSign, Coffee, PieChart, Save, Activity, Calendar, Truck, BarChart2, Home, Settings, Users, Menu, X
} from 'lucide-react';
import Resumen from './pages/Resumen';
import VentasHoy from './pages/VentasHoy';
import Gastos from './pages/Gastos';
import Envios from './pages/Envios';
import Productos from './pages/Productos';
import Calendario from './pages/Calendario';
import Estadisticas from './pages/Estadisticas';
import CerrarCaja from './pages/CerrarCaja';
import Configuracion from './pages/Configuracion';
import PlanesMensuales from './pages/PlanesMensuales';
import Reservas from './pages/Reservas';

function App() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [autoOpen, setAutoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // GLOBAL STATE
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('mk_config');
    return saved ? JSON.parse(saved) : initialConfig;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('mk_config', JSON.stringify(config));
  }, [config]);

  // Load data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resVentas, resGastos, resPlanes, resReservas] = await Promise.all([
          fetch(`${API_URL}/ventas`),
          fetch(`${API_URL}/gastos`),
          fetch(`${API_URL}/planes`),
          fetch(`${API_URL}/reservas`)
        ]);
        
        if (resVentas.ok) setVentas(await resVentas.json());
        if (resGastos.ok) setGastos(await resGastos.json());
        if (resPlanes.ok) setPlanes(await resPlanes.json());
        if (resReservas.ok) setReservas(await resReservas.json());
      } catch (error) {
        console.error("Error cargando datos del servidor", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNavigate = (tab) => {
    setAutoOpen(true);
    setActiveTab(tab);
  };

  const handleSidebarClick = (tab) => {
    setAutoOpen(false);
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const tabs = [
    { key: 'resumen', label: 'Resumen', icon: Home, section: 'RESUMEN' },
    { key: 'ventas', label: 'Ventas de Hoy', icon: DollarSign, section: 'CAJA DIARIA' },
    { key: 'planes', label: 'Planes Mensuales', icon: Users, section: 'CAJA DIARIA' },
    { key: 'cierre', label: 'Cerrar Caja', icon: Save, section: 'CAJA DIARIA' },
    { key: 'gastos', label: 'Gastos', icon: Activity, section: 'CAJA DIARIA' },
    { key: 'reservas', label: 'Reservas', icon: DollarSign, section: 'CAJA DIARIA' },
    { key: 'envios', label: 'Envíos', icon: Truck, section: 'CAJA DIARIA' },
    { key: 'productos', label: 'Productos', icon: Coffee, section: 'NEGOCIO' },
    { key: 'calendario', label: 'Calendario', icon: Calendar, section: 'NEGOCIO' },
    { key: 'estadisticas', label: 'Estadísticas', icon: BarChart2, section: 'NEGOCIO' },
    { key: 'configuracion', label: 'Configuración', icon: Settings, section: 'NEGOCIO' },
  ];

  const sections = [...new Set(tabs.map(t => t.section))];

  const subtitleMap = {
    resumen: 'Resumen general del negocio.',
    ventas: 'Registro de ventas del día.',
    cierre: 'Cierre y balance de caja.',
    gastos: 'Control de gastos diarios.',
    reservas: 'Gestión de efectivo apartado.',
    envios: 'Gestión de envíos y compensaciones.',
    productos: 'Catálogo de productos y menús.',
    calendario: 'Historial de ganancias por día.',
    estadisticas: 'Estadísticas y rendimiento.',
    planes: 'Gestión de suscripciones y consumos.',
    configuracion: 'Ajustes del sistema y WhatsApp.',
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'resumen': return <Resumen onNavigate={handleNavigate} ventas={ventas} setVentas={setVentas} gastos={gastos} setGastos={setGastos} reservas={reservas} setReservas={setReservas} />;
      case 'ventas': return <VentasHoy autoOpen={autoOpen} onAutoOpenDone={() => setAutoOpen(false)} ventas={ventas} setVentas={setVentas} />;
      case 'cierre': return <CerrarCaja ventas={ventas} gastos={gastos} reservas={reservas} config={config} />;
      case 'gastos': return <Gastos autoOpen={autoOpen} onAutoOpenDone={() => setAutoOpen(false)} gastos={gastos} setGastos={setGastos} />;
      case 'envios': return <Envios ventas={ventas} setVentas={setVentas} />;
      case 'productos': return <Productos />;
      case 'calendario': return <Calendario ventas={ventas} gastos={gastos} />;
      case 'estadisticas': return <Estadisticas ventas={ventas} gastos={gastos} />;
      case 'planes': return <PlanesMensuales planes={planes} setPlanes={setPlanes} />;
      case 'configuracion': return <Configuracion config={config} setConfig={setConfig} />;
      case 'reservas': return <Reservas reservas={reservas} setReservas={setReservas} />;
      default: return <Resumen onNavigate={handleNavigate} ventas={ventas} setVentas={setVentas} gastos={gastos} setGastos={setGastos} reservas={reservas} setReservas={setReservas} />;
    }
  };

  return (
    <div className="app-container">
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <div className="logo-circle">MK</div>
          <div className="logo-text">FOOD AND GYM</div>
        </div>

        {sections.map(section => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {tabs.filter(t => t.section === section).map(tab => (
              <a
                key={tab.key}
                href="#"
                className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleSidebarClick(tab.key); }}
              >
                <tab.icon className="nav-icon" />
                {tab.label}
              </a>
            ))}
          </div>
        ))}
      </aside>

      <main className="main-content">
        <div className="header">
          <div className="greeting-wrapper">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={24} />
            </button>
            <div className="greeting">
              <h1>Hola, <span>Admin</span></h1>
              <p>{subtitleMap[activeTab]}</p>
            </div>
          </div>
          <div className="date-badge">{today}</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Cargando sistema desde el servidor...</div>
        ) : (
          renderPage()
        )}
      </main>
    </div>
  );
}

export default App;
