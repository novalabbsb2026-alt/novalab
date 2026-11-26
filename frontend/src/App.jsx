import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import axios from 'axios';
import { Grid, FileUp, ShieldAlert, Smartphone, FileText, Activity, BarChart2, Store, Key, Layers, DollarSign, Percent, Keyboard, Bell } from 'lucide-react';
import Login from './components/Login';
import api, { getBaseUrl } from './services/api';
import GlobalSearch from './components/GlobalSearch';
import SmartMenuBar from './components/SmartMenu';
import { maskCNPJ, maskPhone, maskCEP, maskIE } from './utils/maskHelper';
import { TrendingUp, Users, ChevronDown, Plus, Wrench, Settings, Building2, BarChart3, Lock, Sparkles, Menu, X, LogOut, Package } from 'lucide-react';

// Code-splitting sob demanda (React.lazy) — reduz drasticamente o bundle inicial
const UsbScanner = lazy(() => import('./components/UsbScanner'));
const GradeOptica = lazy(() => import('./components/GradeOptica'));
const GradeBlocos = lazy(() => import('./components/GradeBlocos'));
const GradeLentes167 = lazy(() => import('./components/GradeLentes167'));
const GradeMultifocalAcabado = lazy(() => import('./components/GradeMultifocalAcabado'));
const UnifiedLensRegister = lazy(() => import('./components/UnifiedLensRegister'));
const MatrizVisaoSimples = lazy(() => import('./components/MatrizVisaoSimples'));
const XMLUpload = lazy(() => import('./components/XMLUpload'));
const DashboardAlerts = lazy(() => import('./components/DashboardAlerts'));
const FallbackModal = lazy(() => import('./components/FallbackModal'));
const OSUpload = lazy(() => import('./components/OSUpload'));
const OSWorkflow = lazy(() => import('./components/OSWorkflow'));
const OSDashboard = lazy(() => import('./components/OSDashboard'));
const AdminLentes = lazy(() => import('./components/AdminLentes'));
const CadastroOticas = lazy(() => import('./components/CadastroOticas'));
const CatalogoFinanceiro = lazy(() => import('./components/CatalogoFinanceiro'));
const TabelaPrecos = lazy(() => import('./components/TabelaPrecos'));
const FechamentoFinanceiro = lazy(() => import('./components/FechamentoFinanceiro'));
const DashboardGerencial = lazy(() => import('./components/DashboardGerencial'));
const GerenciamentoUsuarios = lazy(() => import('./components/GerenciamentoUsuarios'));
const DashboardExecutivo = lazy(() => import('./components/DashboardExecutivo'));
const ParametrosSistema = lazy(() => import('./components/ParametrosSistema'));
const GestaoPedidosFornecedor = lazy(() => import('./components/GestaoPedidosFornecedor'));
const CentralAlertasFinanceiros = lazy(() => import('./components/CentralAlertasFinanceiros'));
const OSRegistrationForm = lazy(() => import('./components/OSRegistrationForm'));
const OSDetail = lazy(() => import('./components/OSDetail'));
const FilaOrdensBloqueadas = lazy(() => import('./components/FilaOrdensBloqueadas'));
const DashboardDRE = lazy(() => import('./components/DashboardDRE'));
const RelatoriosHub = lazy(() => import('./pages/reports/RelatoriosHub'));
const TenantManagementModal = lazy(() => import('./components/TenantManagementModal'));
const PainelLaboratorios = lazy(() => import('./pages/PainelLaboratorios'));
const EntradaMalote = lazy(() => import('./components/EntradaMalote'));

const LazyFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', color: 'hsl(var(--text-muted))', fontSize: '0.9rem', fontWeight: 600 }}>
    Carregando módulo...
  </div>
);




class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Erro na renderização da aba:", error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', margin: '30px auto', maxWidth: '650px', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ color: '#ef4444', marginBottom: '14px', fontSize: '2.4rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 10px 0', color: 'hsl(var(--text-primary))', fontSize: '1.2rem', fontWeight: 800 }}>Ocorreu um erro ao carregar esta tela</h3>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.88rem', marginBottom: '18px', lineHeight: 1.5 }}>
            {this.state.error?.message || "Erro inesperado de renderização no componente."}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => this.setState({ hasError: false, error: null })}>
              Tentar Novamente
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => this.props.onReset?.()}>
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const isSuper = localStorage.getItem('factory_is_superadmin') === 'true';
    return isSuper ? 'painel-laboratorios' : 'relatorios-bi';
  });
  const [selectedOSIdForModal, setSelectedOSIdForModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState('estoque');

  
  // Estado para controle do modal de fallback global
  const [fallbackData, setFallbackData] = useState(null); // { barcode, quantity }

  const [openDropdown, setOpenDropdown] = useState(null); // 'estoque', 'os', 'comercial', 'sistema' ou null

  // Estado de autenticação do operador da fábrica com suporte Multi-Tenant
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('factory_token');
    const role = localStorage.getItem('factory_user_role');
    const name = localStorage.getItem('factory_user_name');
    const tenant_id = localStorage.getItem('factory_tenant_id');
    const tenant_name = localStorage.getItem('factory_tenant_name') || 'Nova LAB Matriz';
    const tenant_slug = localStorage.getItem('factory_tenant_slug') || 'matriz';
    const is_superadmin = localStorage.getItem('factory_is_superadmin') === 'true';
    const active_tenant_id = localStorage.getItem('factory_active_tenant_id') || tenant_id;
    if (token && role && name) {
      return { token, role, name, tenant_id, tenant_name, tenant_slug, is_superadmin, active_tenant_id };
    }
    return null;
  });

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Estados de Comunicados Globais (Broadcasts) entregues pelo SuperAdmin aos laboratórios
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!currentUser) return;
    const fetchBroadcasts = async () => {
      try {
        const res = await api.get('/tenants/broadcasts');
        const list = res.data || [];
        setActiveBroadcasts(list.filter(b => b.is_active));
      } catch (err) {
        // Silencioso se não houver ou erro
      }
    };
    fetchBroadcasts();
    const interval = setInterval(fetchBroadcasts, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleDismissBroadcast = (id) => {
    setDismissedBroadcastIds(prev => {
      const updated = [...prev, id];
      localStorage.setItem('dismissed_broadcasts', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'Administrador') {
      setShowAlertsModal(true);
    }
  }, [currentUser]);


  // Escuta o evento global de logout disparado pelo interceptor do axios (ex: 401 token expirado)
  useEffect(() => {
    const handleAuthLogout = (e) => {
      setCurrentUser(null);
      const reason = e.detail?.reason;
      if (reason && reason !== 'logout_manual') {
        showToast(`Sessão encerrada: ${reason}`, 'error');
      }
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);


  // Estado para os dados cadastrais dinâmicos do laboratório
  const [laboratory, setLaboratory] = useState({
    name: 'Nova LAB',
    cep: '71572-302',
    telephone: '61 99266-7281',
    cnpj: '58.032.958/0001-44',
    ie: '',
    address: 'Avenida transversal quadra 23 conjunto B lote 27 apartamento 201'
  });
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labForm, setLabForm] = useState({
    name: '',
    cep: '',
    telephone: '',
    cnpj: '',
    ie: '',
    address: ''
  });

  // Busca dados do laboratório do backend ao carregar
  useEffect(() => {
    if (currentUser) {
      const fetchLab = async () => {
        try {
          const response = await api.get('/laboratory/');
          setLaboratory(response.data);
        } catch (err) {
          console.error("Erro ao carregar dados do laboratório:", err);
        }
      };
      fetchLab();
    }
  }, [currentUser]);

  const handleOpenLabModal = () => {
    if (!currentUser) return;
    setLabForm({
      name: laboratory.name || '',
      cep: maskCEP(laboratory.cep || ''),
      telephone: maskPhone(laboratory.telephone || ''),
      cnpj: maskCNPJ(laboratory.cnpj || ''),
      ie: maskIE(laboratory.ie || ''),
      address: laboratory.address || ''
    });
    setIsLabModalOpen(true);
  };

  const handleSaveLab = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/laboratory/', labForm);
      setLaboratory(response.data);
      setIsLabModalOpen(false);
      showToast("Dados do laboratório atualizados com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Erro ao salvar dados do laboratório.", "error");
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    if (userData && userData.is_superadmin) {
      setActiveTab('painel-laboratorios');
    } else {
      setActiveTab('relatorios-bi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('factory_token');
    localStorage.removeItem('factory_user_role');
    localStorage.removeItem('factory_user_name');
    localStorage.removeItem('factory_tenant_id');
    localStorage.removeItem('factory_tenant_name');
    localStorage.removeItem('factory_tenant_slug');
    localStorage.removeItem('factory_is_superadmin');
    localStorage.removeItem('factory_active_tenant_id');
    setCurrentUser(null);
    setActiveTab('relatorios-bi');
  };

  // Configura interceptores do axios para injetar o JWT e tratar 401
  useEffect(() => {
    // Interceptor da instância personalizada de api
    const interceptor = api.interceptors.request.use((config) => {
      if (currentUser) {
        config.headers['Authorization'] = `Bearer ${currentUser.token}`;
        if (currentUser.active_tenant_id) {
          config.headers['X-Tenant-ID'] = currentUser.active_tenant_id;
        }
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Interceptor do axios global (fallback para chamadas diretas)
    const globalInterceptor = axios.interceptors.request.use((config) => {
      if (currentUser) {
        config.headers['Authorization'] = `Bearer ${currentUser.token}`;
        if (currentUser.active_tenant_id) {
          config.headers['X-Tenant-ID'] = currentUser.active_tenant_id;
        }
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Interceptor de resposta para api
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta para axios global
    const globalResponseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(interceptor);
      axios.interceptors.request.eject(globalInterceptor);
      api.interceptors.response.eject(responseInterceptor);
      axios.interceptors.response.eject(globalResponseInterceptor);
    };
  }, [currentUser]);


  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = async (e) => {
      const currentTime = Date.now();
      
      // Se passar mais de 50ms entre teclas, limpa o buffer (evita digitação humana lenta)
      if (currentTime - lastKeyTime > 50) {
        buffer = "";
      }
      
      lastKeyTime = currentTime;

      // Se pressionar Enter, processa o buffer
      if (e.key === 'Enter') {
        if (buffer.length >= 4 && buffer.startsWith('OS-')) {
          console.log("Scanner detectou código de OS:", buffer);
          e.preventDefault();
          
          try {
            const response = await axios.post(`${getBaseUrl()}/factory/os/bip-bancada`, {
              os_number: buffer
            });
            showToast(`OS ${buffer} bipada e transicionada para ${response.data.status} com sucesso!`, 'success');
          } catch (err) {
            console.error(err);
            showToast(`Falha ao bipar OS ${buffer}: ${err.response?.data?.detail || err.message}`, 'error');
          }
        }
        buffer = "";
        return;
      }

      // Apenas acumula caracteres imprimíveis
      if (e && e.key && e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleIneditoBarcode = (barcode, initialQty = 1) => {
    setFallbackData({ barcode, quantity: initialQty });
    setActiveTab('unified-lens-register');
  };

  const handleOpenUnifiedRegister = (initialData = null) => {
    setFallbackData(initialData || { barcode: '', quantity: 1 });
    setActiveTab('unified-lens-register');
  };

  const handleFallbackSuccess = (newItem) => {
    setFallbackData(null);
    // Vibe de sucesso
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    // Opcionalmente força recarga da aba ativa se necessário
    if (activeTab === 'grid') {
      setActiveTab('scanner');
      setTimeout(() => setActiveTab('grid'), 50);
    } else if (activeTab === 'alerts') {
      setActiveTab('scanner');
      setTimeout(() => setActiveTab('alerts'), 50);
    } else {
      setActiveTab('grid'); // Navega para a grade para ver o item cadastrado
    }
  };

  // Se não estiver logado na fábrica, exibe o Login
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Banner de Aviso de Modo Impersonate Ativo */}
      {localStorage.getItem('factory_is_impersonating') === 'true' && (
        <div style={{
          backgroundColor: '#E2A336',
          color: '#000000',
          padding: '8px 20px',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 99999,
          position: 'sticky',
          top: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} />
            <span>MODO IMPERSONATE ATIVO: Você está acessando a fábrica como <strong>{laboratory.name}</strong>. Todas as ações simulam o ambiente do cliente.</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('factory_is_impersonating');
              setActiveTab('painel-laboratorios');
              window.location.reload();
            }}
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '5px',
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Encerrar Acesso & Voltar ao Painel Master
          </button>
        </div>
      )}
      {/* Overlay invisível para fechar dropdown ao clicar fora */}
      {openDropdown && (
        <div 
          onClick={() => setOpenDropdown(null)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 140,
            background: 'transparent',
          }}
        />
      )}
      {/* Cabeçalho Premium (Oculto no Painel Executivo com Barra Lateral) */}
      {activeTab !== 'painel-laboratorios' && (
        <header className="app-header">
        <div className="header-brand-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            className="logo-container" 
            onClick={() => {
              if (currentUser?.is_superadmin) {
                setActiveTab('painel-laboratorios');
              } else {
                handleOpenLabModal();
              }
            }} 
            style={{ cursor: 'pointer' }} 
            title={currentUser?.is_superadmin ? "Ir para o Painel de Laboratórios" : "Clique para editar dados do laboratório"}
          >
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser?.is_superadmin ? 'Opti' : laboratory.name.split(' ')[0]}
              <span style={{ color: 'hsl(var(--secondary))' }}>
                {currentUser?.is_superadmin ? 'Mind' : (laboratory.name.split(' ').slice(1).join(' ') || '')}
              </span>
            </span>
            <span 
              className="logo-badge" 
              style={{
                background: currentUser?.is_superadmin ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : undefined,
                color: '#ffffff',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}
            >
              {currentUser?.is_superadmin ? 'SUPERADMIN' : 'Fábrica'}
            </span>
          </div>
          {/* Pesquisa Global Desktop */}
          <div className="desktop-search-wrapper">
            <GlobalSearch onNavigate={(tab, result) => {
              if (tab) setActiveTab(tab);
              if (result && result.type === 'os' && result.id) {
                setSelectedOSIdForModal(result.id);
              }
            }} />
          </div>
        </div>

        <nav className="nav-tabs nav-desktop-tabs" style={{ gap: '8px', background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}>

          {/* DESTAQUE PRINCIPAL: Painel de Laboratórios (Exclusivo SuperAdmin) */}
          {currentUser?.is_superadmin && (
            <div className="header-dropdown">
              <button 
                type="button"
                className={`dropdown-trigger ${activeTab === 'painel-laboratorios' ? 'active' : ''}`}
                onClick={() => { setActiveTab('painel-laboratorios'); setOpenDropdown(null); }}
                title="Administração global de laboratórios cadastrados"
              >
                <Building2 size={16} /> Laboratórios
              </button>
            </div>
          )}

          {/* GRUPO 1: Estoque & Grade */}
          <div className="header-dropdown">
            <button 
              type="button"
              className={`dropdown-trigger ${['scanner', 'grid', 'grid-blocos', 'grid-167', 'grid-multifocal-acabado', 'matriz-visao-simples', 'nfe', 'alerts', 'admin-lentes'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'estoque' ? null : 'estoque')}
            >
              <Layers size={16} /> Estoque & Grade <ChevronDown size={14} />
            </button>
            {openDropdown === 'estoque' && (
              <div className="dropdown-menu">
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'unified-lens-register' || activeTab === 'scanner' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('unified-lens-register'); setOpenDropdown(null); }}
                >
                  <Plus size={14} style={{ color: 'hsl(var(--primary))' }} /> Cadastrador Unificado & Bipador USB
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'grid' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('grid'); setOpenDropdown(null); }}
                >
                  <Grid size={14} /> Visão Simples LP
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'grid-167' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('grid-167'); setOpenDropdown(null); }}
                >
                  <Sparkles size={14} style={{ color: '#a855f7' }} /> 1.67 Lentes Prontas
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'grid-multifocal-acabado' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('grid-multifocal-acabado'); setOpenDropdown(null); }}
                >
                  <Sparkles size={14} style={{ color: '#06b6d4' }} /> Multifocal Acabado
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'grid-blocos' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('grid-blocos'); setOpenDropdown(null); }}
                >
                  <Layers size={14} /> Multifocal
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'matriz-visao-simples' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('matriz-visao-simples'); setOpenDropdown(null); }}
                >
                  <Layers size={14} style={{ color: 'hsl(var(--secondary))' }} /> Bloco Visão Simples
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'nfe' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('nfe'); setOpenDropdown(null); }}
                >
                  <FileUp size={14} /> Importar NF-e
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'alerts' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('alerts'); setOpenDropdown(null); }}
                >
                  <ShieldAlert size={14} /> Motor Preditivo
                </button>
              </div>
            )}
          </div>

          {/* GRUPO 2: Bancada OS */}
          <div className="header-dropdown">
            <button 
              type="button"
              className={`dropdown-trigger ${['os-upload', 'os-workflow', 'os-dashboard', 'os-factory-register', 'os-malote', 'financial-blocked-orders'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'os' ? null : 'os')}
            >
              <Activity size={16} /> Bancada OS <ChevronDown size={14} />
            </button>
            {openDropdown === 'os' && (
              <div className="dropdown-menu">
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'os-malote' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('os-malote'); setOpenDropdown(null); }}
                >
                  <Package size={14} style={{ color: 'hsl(var(--primary))' }} /> Entrada por Malote / Lote
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'os-factory-register' || activeTab === 'os-upload' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('os-factory-register'); setOpenDropdown(null); }}
                >
                  <Plus size={14} style={{ color: 'hsl(var(--primary))' }} /> Nova OS de Fábrica (Com OCR & Manual)
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'os-workflow' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('os-workflow'); setOpenDropdown(null); }}
                >
                  <Activity size={14} /> Bancada OS
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'os-dashboard' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('os-dashboard'); setOpenDropdown(null); }}
                >
                  <BarChart2 size={14} /> Indicadores
                </button>
                {currentUser.role === 'Administrador' && (
                  <button 
                    type="button"
                    className={`dropdown-item ${activeTab === 'financial-blocked-orders' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('financial-blocked-orders'); setOpenDropdown(null); }}
                  >
                    <Lock size={14} /> Ordens Retidas por Inadimplência
                  </button>
                )}
              </div>
            )}


          </div>

          {/* GRUPO 3: Comercial & Finanças */}
          <div className="header-dropdown">
            <button 
              type="button"
              className={`dropdown-trigger ${['crm-pipeline', 'catalog', 'price-tables', 'billing', 'dashboard-gerencial'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'comercial' ? null : 'comercial')}
            >
              <DollarSign size={16} /> Comercial & Finanças <ChevronDown size={14} />
            </button>
            {openDropdown === 'comercial' && (
              <div className="dropdown-menu">
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'catalog' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('catalog'); setOpenDropdown(null); }}
                >
                  <DollarSign size={14} /> Catálogo Financeiro
                </button>

                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'price-tables' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('price-tables'); setOpenDropdown(null); }}
                >
                  <Percent size={14} /> Tabela de Preços
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('billing'); setOpenDropdown(null); }}
                >
                  <DollarSign size={14} /> Financeiro (Fechamento)
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'supplier-orders' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('supplier-orders'); setOpenDropdown(null); }}
                >
                  <DollarSign size={14} /> Pedidos no Fornecedor (Compras)
                </button>
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'dashboard-gerencial' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('dashboard-gerencial'); setOpenDropdown(null); }}
                >
                  <TrendingUp size={14} /> Dashboard Gerencial
                </button>

                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'dre-consolidado' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('dre-consolidado'); setOpenDropdown(null); }}
                >
                  <BarChart3 size={14} style={{ color: '#22c55e' }} /> DRE Consolidado
                </button>

                {currentUser.role === 'Administrador' && (
                  <button 
                    type="button"
                    className={`dropdown-item ${['executive-dashboard', 'finance-corp'].includes(activeTab) ? 'active' : ''}`}
                    onClick={() => { setActiveTab('executive-dashboard'); setOpenDropdown(null); }}
                  >
                    <BarChart3 size={14} /> Dashboard Executivo Aprimorado
                  </button>
                )}
              </div>
            )}
          </div>

          {/* GRUPO 4: Sistema */}
          <div className="header-dropdown">
            <button 
              type="button"
              className={`dropdown-trigger ${['admin-users', 'cadastro-oticas', 'system-parameters'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'sistema' ? null : 'sistema')}
            >
              <Settings size={16} /> Sistema <ChevronDown size={14} />
            </button>
            {openDropdown === 'sistema' && (
              <div className="dropdown-menu">
                <button 
                  type="button"
                  className={`dropdown-item ${activeTab === 'cadastro-oticas' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('cadastro-oticas'); setOpenDropdown(null); }}
                >
                  <Store size={14} /> Cadastro Óticas
                </button>
                {currentUser.role === 'Administrador' && (
                  <>
                    <button 
                      type="button"
                      className={`dropdown-item ${activeTab === 'admin-users' ? 'active' : ''}`}
                      onClick={() => { setActiveTab('admin-users'); setOpenDropdown(null); }}
                    >
                      <Users size={14} /> Gerenciar Usuários
                    </button>
                    <button 
                      type="button"
                      className={`dropdown-item ${activeTab === 'system-parameters' ? 'active' : ''}`}
                      onClick={() => { setActiveTab('system-parameters'); setOpenDropdown(null); }}
                    >
                      <Settings size={14} /> Parâmetros do Sistema
                    </button>
                    {currentUser?.is_superadmin && (
                      <button 
                        type="button"
                        className={`dropdown-item ${activeTab === 'painel-laboratorios' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('painel-laboratorios'); setOpenDropdown(null); }}
                        style={{ color: '#6366f1', fontWeight: 700 }}
                      >
                        <Building2 size={14} /> Painel de Laboratórios (Multi-Tenant)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* GRUPO 5: Central de Relatórios & BI */}
          <div className="header-dropdown">
            <button 
              type="button"
              className={`dropdown-trigger ${activeTab === 'relatorios-bi' ? 'active' : ''}`}
              style={{
                background: activeTab === 'relatorios-bi' ? 'rgba(14, 165, 233, 0.25)' : 'transparent',
                borderColor: activeTab === 'relatorios-bi' ? '#38bdf8' : undefined,
                color: activeTab === 'relatorios-bi' ? '#38bdf8' : undefined,
                fontWeight: 700
              }}
              onClick={() => { setActiveTab('relatorios-bi'); setOpenDropdown(null); }}
            >
              <BarChart3 size={16} style={{ color: '#38bdf8' }} /> Relatórios & BI
            </button>
          </div>

        </nav>

        {/* Informações do usuário logado & Seletor de Laboratório Multi-Tenant (Desktop) */}
        <div className="user-desktop-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {/* Badge / Seletor do Tenant Ativo */}
          <button
            type="button"
            onClick={() => currentUser.is_superadmin && setShowTenantModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              cursor: currentUser.is_superadmin ? 'pointer' : 'default',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title={currentUser.is_superadmin ? "Clique para alternar o laboratório ativo" : "Laboratório Ativo"}
          >
            <Building2 size={14} style={{ color: currentUser.is_superadmin ? '#4f46e5' : 'hsl(var(--primary))' }} />
            <span>{currentUser.tenant_name || 'Nova LAB Matriz'}</span>
            {currentUser.is_superadmin && (
              <span style={{ fontSize: '0.65rem', color: '#6366f1', marginLeft: '2px' }}>▾</span>
            )}
          </button>

          <div style={{ textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))', display: 'block' }}>{currentUser.name}</span>
            <span style={{ fontSize: '0.68rem', color: 'hsl(var(--secondary))', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{currentUser.role}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn btn-outline" 
            style={{ 
              padding: '5px 10px', 
              fontSize: '0.8rem', 
              color: 'hsl(var(--danger))', 
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'transparent',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Sair
          </button>
        </div>

        {/* Botão Mobile Hamburguer (Apenas mobile/tablet) */}
        <div className="mobile-header-actions">
          <button 
            type="button" 
            className="mobile-hamburger-btn" 
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Abrir menu mobile"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
      )}

      {/* Banner de Comunicados Globais / Avisos Disparados aos Clientes */}
      {activeTab !== 'painel-laboratorios' && activeBroadcasts
        .filter(b => !dismissedBroadcastIds.includes(b.id))
        .map(b => (
          <div 
            key={b.id}
            style={{
              background: b.type === 'urgent' ? 'linear-gradient(90deg, #fef2f2, #fee2e2)' : b.type === 'warning' ? 'linear-gradient(90deg, #fffbeb, #fef3c7)' : 'linear-gradient(90deg, #eff6ff, #dbeafe)',
              borderBottom: `1px solid ${b.type === 'urgent' ? '#fca5a5' : b.type === 'warning' ? '#fcd34d' : '#bfdbfe'}`,
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              color: b.type === 'urgent' ? '#991b1b' : b.type === 'warning' ? '#92400e' : '#1e40af',
              fontSize: '0.88rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              zIndex: 90
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={18} style={{ color: b.type === 'urgent' ? '#dc2626' : b.type === 'warning' ? '#d97706' : '#2563eb', flexShrink: 0 }} />
              <div>
                <strong style={{ fontWeight: 800 }}>{b.title}:</strong>{' '}
                <span style={{ fontWeight: 500 }}>{b.message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDismissBroadcast(b.id)}
              style={{
                background: 'rgba(0,0,0,0.07)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                color: 'inherit',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Dispensar aviso"
            >
              Entendido ✕
            </button>
          </div>
        ))}

      {/* Barra de Pesquisa Rápida Mobile */}
      {activeTab !== 'painel-laboratorios' && (
        <div className="mobile-search-bar">
          <GlobalSearch onNavigate={(tab, result) => {
            if (tab) setActiveTab(tab);
            if (result && result.type === 'os' && result.id) {
              setSelectedOSIdForModal(result.id);
            }
          }} />
        </div>
      )}

      {/* Drawer Lateral Mobile */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Topo do Drawer */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'hsl(var(--text-primary))' }}>
                  {laboratory.name.split(' ')[0]} <span style={{ color: 'hsl(var(--secondary))' }}>{laboratory.name.split(' ').slice(1).join(' ') || ''}</span>
                </span>
                <span className="logo-badge" style={{ fontSize: '0.65rem' }}>Fábrica</span>
              </div>
              <button 
                type="button" 
                className="mobile-drawer-close"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Usuário Logado */}
            <div className="mobile-drawer-user">
              <div className="mobile-drawer-user-avatar">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className="mobile-drawer-user-name">{currentUser.name}</span>
                <span className="mobile-drawer-user-role">{currentUser.role}</span>
              </div>
            </div>

            {/* Grupos de Navegação Mobile */}
            <nav className="mobile-drawer-nav">
              {/* Grupo 1: Estoque & Grade */}
              <div className="mobile-nav-group">
                <button 
                  type="button" 
                  className={`mobile-nav-group-title ${['scanner', 'grid', 'grid-blocos', 'grid-167', 'grid-multifocal-acabado', 'matriz-visao-simples', 'nfe', 'alerts', 'admin-lentes', 'unified-lens-register'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setMobileExpandedGroup(mobileExpandedGroup === 'estoque' ? null : 'estoque')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Layers size={18} /> Estoque & Grade</span>
                  <ChevronDown size={16} style={{ transform: mobileExpandedGroup === 'estoque' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {mobileExpandedGroup === 'estoque' && (
                  <div className="mobile-nav-subitems">
                    <button type="button" className={`mobile-nav-item ${activeTab === 'unified-lens-register' || activeTab === 'scanner' ? 'active' : ''}`} onClick={() => { setActiveTab('unified-lens-register'); setMobileDrawerOpen(false); }}>
                      <Plus size={16} /> Cadastrador Unificado & Bipador
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'grid' ? 'active' : ''}`} onClick={() => { setActiveTab('grid'); setMobileDrawerOpen(false); }}>
                      <Grid size={16} /> Visão Simples LP
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'grid-167' ? 'active' : ''}`} onClick={() => { setActiveTab('grid-167'); setMobileDrawerOpen(false); }}>
                      <Sparkles size={16} style={{ color: '#a855f7' }} /> 1.67 Lentes Prontas
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'grid-multifocal-acabado' ? 'active' : ''}`} onClick={() => { setActiveTab('grid-multifocal-acabado'); setMobileDrawerOpen(false); }}>
                      <Sparkles size={16} style={{ color: '#06b6d4' }} /> Multifocal Acabado
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'grid-blocos' ? 'active' : ''}`} onClick={() => { setActiveTab('grid-blocos'); setMobileDrawerOpen(false); }}>
                      <Layers size={16} /> Multifocal
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'matriz-visao-simples' ? 'active' : ''}`} onClick={() => { setActiveTab('matriz-visao-simples'); setMobileDrawerOpen(false); }}>
                      <Layers size={16} style={{ color: 'hsl(var(--secondary))' }} /> Bloco Visão Simples
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'nfe' ? 'active' : ''}`} onClick={() => { setActiveTab('nfe'); setMobileDrawerOpen(false); }}>
                      <FileUp size={16} /> Importar NF-e
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => { setActiveTab('alerts'); setMobileDrawerOpen(false); }}>
                      <ShieldAlert size={16} /> Motor Preditivo
                    </button>
                  </div>
                )}
              </div>

              {/* Grupo 2: Bancada OS */}
              <div className="mobile-nav-group">
                <button 
                  type="button" 
                  className={`mobile-nav-group-title ${['os-upload', 'os-workflow', 'os-dashboard', 'os-factory-register', 'financial-blocked-orders'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setMobileExpandedGroup(mobileExpandedGroup === 'os' ? null : 'os')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={18} /> Bancada OS</span>
                  <ChevronDown size={16} style={{ transform: mobileExpandedGroup === 'os' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {mobileExpandedGroup === 'os' && (
                  <div className="mobile-nav-subitems">
                    <button type="button" className={`mobile-nav-item ${activeTab === 'os-malote' ? 'active' : ''}`} onClick={() => { setActiveTab('os-malote'); setMobileDrawerOpen(false); }}>
                      <Package size={16} /> Entrada por Malote / Lote
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'os-factory-register' || activeTab === 'os-upload' ? 'active' : ''}`} onClick={() => { setActiveTab('os-factory-register'); setMobileDrawerOpen(false); }}>
                      <Plus size={16} /> Nova OS de Fábrica
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'os-workflow' ? 'active' : ''}`} onClick={() => { setActiveTab('os-workflow'); setMobileDrawerOpen(false); }}>
                      <Activity size={16} /> Bancada OS
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'os-dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('os-dashboard'); setMobileDrawerOpen(false); }}>
                      <BarChart2 size={16} /> Indicadores
                    </button>
                    {currentUser.role === 'Administrador' && (
                      <button type="button" className={`mobile-nav-item ${activeTab === 'financial-blocked-orders' ? 'active' : ''}`} onClick={() => { setActiveTab('financial-blocked-orders'); setMobileDrawerOpen(false); }}>
                        <Lock size={16} /> Ordens Retidas
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Grupo 3: Comercial & Finanças */}
              <div className="mobile-nav-group">
                <button 
                  type="button" 
                  className={`mobile-nav-group-title ${['crm-pipeline', 'catalog', 'price-tables', 'billing', 'dashboard-gerencial', 'supplier-orders', 'dre-consolidado', 'executive-dashboard', 'finance-corp'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setMobileExpandedGroup(mobileExpandedGroup === 'comercial' ? null : 'comercial')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={18} /> Comercial & Finanças</span>
                  <ChevronDown size={16} style={{ transform: mobileExpandedGroup === 'comercial' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {mobileExpandedGroup === 'comercial' && (
                  <div className="mobile-nav-subitems">
                    <button type="button" className={`mobile-nav-item ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => { setActiveTab('catalog'); setMobileDrawerOpen(false); }}>
                      <DollarSign size={16} /> Catálogo Financeiro
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'price-tables' ? 'active' : ''}`} onClick={() => { setActiveTab('price-tables'); setMobileDrawerOpen(false); }}>
                      <Percent size={16} /> Tabela de Preços
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => { setActiveTab('billing'); setMobileDrawerOpen(false); }}>
                      <DollarSign size={16} /> Financeiro (Fechamento)
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'supplier-orders' ? 'active' : ''}`} onClick={() => { setActiveTab('supplier-orders'); setMobileDrawerOpen(false); }}>
                      <DollarSign size={16} /> Pedidos Fornecedor
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'dashboard-gerencial' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard-gerencial'); setMobileDrawerOpen(false); }}>
                      <TrendingUp size={16} /> Dashboard Gerencial
                    </button>
                    <button type="button" className={`mobile-nav-item ${activeTab === 'dre-consolidado' ? 'active' : ''}`} onClick={() => { setActiveTab('dre-consolidado'); setMobileDrawerOpen(false); }}>
                      <BarChart3 size={16} style={{ color: '#22c55e' }} /> DRE Consolidado
                    </button>
                    {currentUser.role === 'Administrador' && (
                      <button type="button" className={`mobile-nav-item ${['executive-dashboard', 'finance-corp'].includes(activeTab) ? 'active' : ''}`} onClick={() => { setActiveTab('executive-dashboard'); setMobileDrawerOpen(false); }}>
                        <BarChart3 size={16} /> Dashboard Executivo
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Grupo 4: Relatórios & BI */}
              <div className="mobile-nav-group">
                <button 
                  type="button" 
                  className={`mobile-nav-group-title ${activeTab === 'relatorios-bi' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('relatorios-bi'); setMobileDrawerOpen(false); }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={18} style={{ color: '#38bdf8' }} /> Relatórios & BI</span>
                </button>
              </div>

              {/* Grupo 5: Sistema */}
              <div className="mobile-nav-group">
                <button 
                  type="button" 
                  className={`mobile-nav-group-title ${['admin-users', 'cadastro-oticas', 'system-parameters'].includes(activeTab) ? 'active' : ''}`}
                  onClick={() => setMobileExpandedGroup(mobileExpandedGroup === 'sistema' ? null : 'sistema')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={18} /> Sistema</span>
                  <ChevronDown size={16} style={{ transform: mobileExpandedGroup === 'sistema' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {mobileExpandedGroup === 'sistema' && (
                  <div className="mobile-nav-subitems">
                    <button type="button" className={`mobile-nav-item ${activeTab === 'cadastro-oticas' ? 'active' : ''}`} onClick={() => { setActiveTab('cadastro-oticas'); setMobileDrawerOpen(false); }}>
                      <Store size={16} /> Cadastro Óticas
                    </button>
                    {currentUser.role === 'Administrador' && (
                      <>
                        <button type="button" className={`mobile-nav-item ${activeTab === 'admin-users' ? 'active' : ''}`} onClick={() => { setActiveTab('admin-users'); setMobileDrawerOpen(false); }}>
                          <Users size={16} /> Gerenciar Usuários
                        </button>
                        <button type="button" className={`mobile-nav-item ${activeTab === 'system-parameters' ? 'active' : ''}`} onClick={() => { setActiveTab('system-parameters'); setMobileDrawerOpen(false); }}>
                          <Settings size={16} /> Parâmetros do Sistema
                        </button>
                        {currentUser?.is_superadmin && (
                          <button type="button" className={`mobile-nav-item ${activeTab === 'painel-laboratorios' ? 'active' : ''}`} onClick={() => { setActiveTab('painel-laboratorios'); setMobileDrawerOpen(false); }} style={{ color: '#818cf8', fontWeight: 700 }}>
                            <Building2 size={16} /> Painel Laboratórios
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </nav>

            {/* Rodapé do Drawer: Logout */}
            <div className="mobile-drawer-footer">
              <button 
                type="button"
                className="mobile-drawer-logout-btn"
                onClick={() => { setMobileDrawerOpen(false); handleLogout(); }}
              >
                <LogOut size={18} /> Sair do Sistema
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Barra de Menu Inteligente: Favoritos + Recentes */}
      <SmartMenuBar
        userId={currentUser?.name}
        onNavigate={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Conteúdo Dinâmico */}
      <main className="app-container">
        <TabErrorBoundary activeTab={activeTab} onReset={() => setActiveTab('grid')}>
        <Suspense fallback={<LazyFallback />}>
        {activeTab === 'scanner' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
            <UsbScanner 
              onInedito={(barcode) => handleIneditoBarcode(barcode, 1)} 
              onScanSuccess={(item) => console.log("Bipagem bem-sucedida:", item)}
            />
          </div>
        )}

        {activeTab === 'grid' && (
          <GradeOptica 
            onOpenManualInsert={(initialData) => handleOpenUnifiedRegister(initialData)}
          />
        )}

        {activeTab === 'grid-167' && (
          <GradeLentes167 
            onOpenManualInsert={(initialData) => handleOpenUnifiedRegister({ ...(initialData || {}), matrixType: 'GRADE_167' })}
          />
        )}

        {activeTab === 'grid-blocos' && (
          <GradeBlocos onOpenManualInsert={(initialData) => handleOpenUnifiedRegister({ ...(initialData || {}), matrixType: 'MF_BLOCO' })} />
        )}

        {activeTab === 'grid-multifocal-acabado' && (
          <GradeMultifocalAcabado onOpenManualInsert={(initialData) => handleOpenUnifiedRegister({ ...(initialData || {}), matrixType: 'MF_ACB' })} />
        )}

        {activeTab === 'matriz-visao-simples' && (
          <MatrizVisaoSimples onOpenManualInsert={(initialData) => handleOpenUnifiedRegister({ ...(initialData || {}), matrixType: 'BLOCO_VS' })} />
        )}

        {activeTab === 'unified-lens-register' && (
          <UnifiedLensRegister 
            initialData={fallbackData}
            onComplete={() => setFallbackData(null)}
          />
        )}

        {activeTab === 'nfe' && (
          <XMLUpload />
        )}

        {activeTab === 'alerts' && (
          <DashboardAlerts />
        )}

        {activeTab === 'admin-lentes' && (
          <AdminLentes />
        )}

        {activeTab === 'os-factory-register' && (
          <OSRegistrationForm onOSCreated={() => setActiveTab('os-workflow')} />
        )}

        {activeTab === 'os-malote' && (
          <TabErrorBoundary tabName="Entrada por Malote">
            <EntradaMalote onNavigateToWorkflow={() => setActiveTab('os-workflow')} />
          </TabErrorBoundary>
        )}

        {activeTab === 'os-upload' && (
          <OSUpload onOSCreated={() => setActiveTab('os-workflow')} />
        )}

        {activeTab === 'os-workflow' && (
          <OSWorkflow onOpenMalote={() => setActiveTab('os-malote')} />
        )}

        {activeTab === 'os-dashboard' && (
          <OSDashboard />
        )}

        {activeTab === 'cadastro-oticas' && (
          <CadastroOticas />
        )}

        {activeTab === 'catalog' && (
          <CatalogoFinanceiro 
            onOpenManualLensInsert={(initialData) => setFallbackData(initialData || { barcode: '', quantity: 1 })} 
          />
        )}

        {activeTab === 'price-tables' && (
          <TabelaPrecos />
        )}

        {activeTab === 'billing' && (
          <FechamentoFinanceiro laboratory={laboratory} currentUser={currentUser} />
        )}
        
        {activeTab === 'dashboard-gerencial' && (
          <DashboardGerencial onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'dre-consolidado' && (
          <DashboardDRE />
        )}

        {['executive-dashboard', 'finance-corp'].includes(activeTab) && currentUser?.role === 'Administrador' && (
          <DashboardExecutivo onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'system-parameters' && currentUser?.role === 'Administrador' && (
          <ParametrosSistema />
        )}

        {activeTab === 'painel-laboratorios' && currentUser?.is_superadmin && (
          <PainelLaboratorios
            currentActiveTenantId={currentUser.active_tenant_id || currentUser.tenant_id}
            currentUser={currentUser}
            laboratory={laboratory}
            onTenantChange={(selectedTenant) => {
              setCurrentUser(prev => ({
                ...prev,
                active_tenant_id: selectedTenant.id,
                tenant_name: selectedTenant.name,
                tenant_slug: selectedTenant.slug
              }));
            }}
            onNavigate={(tab) => setActiveTab(tab)}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'supplier-orders' && (
          <GestaoPedidosFornecedor />
        )}


        {activeTab === 'financial-blocked-orders' && currentUser?.role === 'Administrador' && (
          <FilaOrdensBloqueadas />
        )}


        <CentralAlertasFinanceiros
          isOpen={showAlertsModal}
          onClose={() => setShowAlertsModal(false)}
          onNavigateToFinance={() => setActiveTab('finance-corp')}
        />

        
        {activeTab === 'admin-users' && currentUser.role === 'Administrador' && (
          <GerenciamentoUsuarios />
        )}

        {activeTab === 'relatorios-bi' && (
          <RelatoriosHub currentUser={currentUser} />
        )}
        </Suspense>
        </TabErrorBoundary>
      </main>


      {/* Rodapé Fixo */}
      <footer style={{ marginTop: 'auto', padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
        &copy; {new Date().getFullYear()} {laboratory.name}. Painel de Controle de Inventário local.
      </footer>

      {/* Modal de Reconciliação / Fallback */}
      {fallbackData && (
        <Suspense fallback={null}>
        <FallbackModal 
          barcode={fallbackData.barcode}
          initialQty={fallbackData.quantity}
          initialSpherical={fallbackData.spherical}
          initialCylindrical={fallbackData.cylindrical}
          initialLensModelId={fallbackData.lensModelId}
          initialRefractiveIndex={fallbackData.refractiveIndex}
          is167Mode={fallbackData.is167Mode || fallbackData.refractiveIndex === 1.67 || fallbackData.refractiveIndex === '1.67'}
          onClose={() => setFallbackData(null)}
          onSuccess={handleFallbackSuccess}
        />
        </Suspense>
      )}

      {/* Toast flutuante premium */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(34, 197, 94, 0.95)',
          backdropFilter: 'blur(12px)',
          border: toast.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: 600,
          transition: 'all 0.3s ease-in-out'
        }}>
          {toast.message}
        </div>
      )}

      {/* Modal de Configuração do Laboratório */}
      {isLabModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLabModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <button 
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}
              onClick={() => setIsLabModalOpen(false)}
            >
              x
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <Store size={22} style={{ color: 'hsl(var(--primary))' }} />
              Cadastro do Laboratório
            </h3>

            <form onSubmit={handleSaveLab} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Laboratório *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">CNPJ *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="00.000.000/0000-00"
                    value={labForm.cnpj}
                    onChange={(e) => setLabForm({ ...labForm, cnpj: maskCNPJ(e.target.value) })}
                    maxLength={18}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Inscrição Estadual</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: 0712345600100 ou Isento"
                    value={labForm.ie || ''}
                    onChange={(e) => setLabForm({ ...labForm, ie: maskIE(e.target.value) })}
                    maxLength={20}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="(00) 00000-0000"
                    value={labForm.telephone}
                    onChange={(e) => setLabForm({ ...labForm, telephone: maskPhone(e.target.value) })}
                    maxLength={15}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CEP *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="00000-000"
                    value={labForm.cep}
                    onChange={(e) => setLabForm({ ...labForm, cep: maskCEP(e.target.value) })}
                    maxLength={9}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Completo *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={labForm.address}
                  onChange={(e) => setLabForm({ ...labForm, address: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '15px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLabModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Global de Detalhes da OS (Acionado via Busca Global ou seleção direta) */}
      {selectedOSIdForModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedOSIdForModal(null)}
        >
          <div 
            style={{
              background: 'hsl(var(--card, 222 47% 11%))',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense fallback={<LazyFallback />}>
            <OSDetail
              osId={selectedOSIdForModal}
              onClose={() => setSelectedOSIdForModal(null)}
            />
            </Suspense>
          </div>
        </div>
      )}

      {/* Modal de Gestão Multi-Tenant para SuperAdmin */}
      {currentUser?.is_superadmin && (
        <Suspense fallback={null}>
        <TenantManagementModal
          isOpen={showTenantModal}
          onClose={() => setShowTenantModal(false)}
          currentActiveTenantId={currentUser.active_tenant_id || currentUser.tenant_id}
          onOpenFullPanel={() => setActiveTab('painel-laboratorios')}
          onSelectTenant={(selectedTenant) => {
            setCurrentUser(prev => ({
              ...prev,
              active_tenant_id: selectedTenant.id,
              tenant_name: selectedTenant.name,
              tenant_slug: selectedTenant.slug
            }));
          }}
        />
        </Suspense>
      )}
    </div>
  );
}

export default App;




