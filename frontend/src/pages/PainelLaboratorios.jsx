import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getBaseUrl } from '../services/api';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Shield,
  Phone,
  MapPin,
  X,
  Crown,
  Users,
  UserCheck,
  UserX,
  Key,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Bell,
  Send,
  Lock,
  Eye,
  Activity,
  Terminal,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Radio,
  Sparkles,
  Filter,
  ChevronRight,
  FileText,
  Check,
  Clock,
  Layers,
  Wrench,
  BarChart3,
  LogOut
} from 'lucide-react';

export default function PainelLaboratorios({
  currentActiveTenantId,
  currentUser,
  laboratory,
  onTenantChange,
  onNavigate,
  onLogout
}) {
  // --- Estados de Navegação e Módulo SaaS Ativo ---
  // 'bi' | 'tenants' | 'billing' | 'security' | 'support'
  const [activeTab, setActiveTab] = useState('bi');

  // --- Estados de Dados do Painel ---
  const [tenants, setTenants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);

  // --- Estados de Filtros e Busca ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Command Menu Global (Cmd + K / Ctrl + K) ---
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // --- Modais de Ação ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);

  // --- Modal de Usuários do Laboratório ---
  const [selectedTenantUsers, setSelectedTenantUsers] = useState(null);
  const [tenantUsersList, setTenantUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    is_active: true,
    must_change_password: false
  });
  const [savingUser, setSavingUser] = useState(false);

  // --- Modais de Suporte e Broadcast ---
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    tenant_name: '',
    subject: '',
    description: '',
    priority: 'MEDIA'
  });
  const [showNewBroadcastModal, setShowNewBroadcastModal] = useState(false);
  const [newBroadcastForm, setNewBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  // --- Form de Criação de Laboratório ---
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    cnpj: '',
    telephone: '',
    address: '',
    cep: '',
    ie: '',
    plan_tier: 'enterprise',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [saving, setSaving] = useState(false);

  // --- Paleta de Cores OFF-WHITE PREMIUM (Alta Legibilidade e Contraste) ---
  const T = {
    bg: '#F8FAFC',              // Off-white / Slate 50 (fundo suave executivo)
    surface: '#FFFFFF',         // Branco puro (cards e superfícies)
    surfaceElevated: '#F1F5F9', // Slate 100 suave
    surfaceHover: '#F8FAFC',    // Hover sutil
    sidebarBg: '#FFFFFF',       // Lateral branca pura
    border: '#E2E8F0',          // Bordas finas elegantes (Slate 200)
    borderLight: '#F1F5F9',     // Borda interna suave
    borderActive: '#D97706',    // Borda ativa em ouro âmbar

    // Tipografia ULTRA NITIDA (Garante que nenhuma letra fique na cor do fundo!)
    textPrimary: '#0F172A',     // Slate 900 (títulos, valores e destaques em preto suave profundo)
    textSecondary: '#334155',   // Slate 700 (rótulos e subtítulos principais)
    textMuted: '#475569',       // Slate 600 (descrições e legendas claras)
    textLight: '#64748B',       // Slate 500 (dados auxiliares)

    // Acentos Executivos
    gold: '#D97706',            // Âmbar Ouro Executivo
    goldDark: '#B45309',        // Âmbar 700
    goldBg: '#FEF3C7',          // Fundo suave âmbar
    goldBorder: '#FDE68A',      // Borda suave âmbar

    emerald: '#059669',         // Verde Esmeralda (Status Ativo / Pago)
    emeraldBg: '#ECFDF5',       // Fundo esmeralda suave

    sky: '#0284C7',             // Azul Sky (Informações e Chamados)
    skyBg: '#F0F9FF',

    rose: '#DC2626',            // Vermelho Rosa (Avisos Críticos)
    roseBg: '#FEF2F2',

    indigo: '#4F46E5',          // Índigo Corporativo
    indigoBg: '#EEF2FF'
  };

  // --- Atalho de Teclado Global: Cmd + K / Ctrl + K ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandMenu(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Carga Inicial de Dados ---
  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadTenants(),
      loadRoles(),
      loadAnalytics(),
      loadInvoices(),
      loadPlans(),
      loadAuditLogs(),
      loadTickets(),
      loadBroadcasts()
    ]);
    setLoading(false);
  };

  const loadTenants = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenants(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar tenants:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar roles:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/billing/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
    }
  };

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/billing/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar audit logs:', err);
    }
  };

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
    }
  };

  const loadBroadcasts = async () => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBroadcasts(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar broadcasts:', err);
    }
  };

  // --- Ação de Impersonate ("Acessar como") ---
  const handleImpersonate = (tenant) => {
    if (!window.confirm(`Deseja entrar no modo IMPERSONATE e acessar o sistema exatamente como o laboratório "${tenant.name}"?`)) {
      return;
    }
    localStorage.setItem('factory_active_tenant_id', tenant.id);
    localStorage.setItem('factory_tenant_name', tenant.name);
    localStorage.setItem('factory_tenant_slug', tenant.slug);
    localStorage.setItem('factory_is_impersonating', 'true');
    if (onTenantChange) {
      onTenantChange(tenant);
    }
    window.location.reload();
  };

  // --- Ação de Detalhes do Tenant (Drawer) ---
  const handleOpenTenantDetails = async (tenant) => {
    setSelectedTenantDetails(tenant);
    setTenantStats(null);
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/${tenant.id}/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenantStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Funções de Usuários do Laboratório ---
  const handleOpenUsersModal = async (tenant) => {
    setSelectedTenantUsers(tenant);
    setShowUserForm(false);
    setEditingUser(null);
    setUsersError('');
    setUsersSuccess('');
    if (roles.length === 0) {
      loadRoles();
    }
    await loadTenantUsers(tenant.id);
  };

  const loadTenantUsers = async (tenantId) => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/${tenantId}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenantUsersList(res.data || []);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : 'Erro ao carregar usuários deste laboratório.');
      setUsersError(msg);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenCreateUser = () => {
    if (roles.length === 0) {
      loadRoles();
    }
    const defaultRole = roles.find(r => r.name === 'Operador') || roles[0];
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role_id: defaultRole ? defaultRole.id : '',
      is_active: true,
      must_change_password: false
    });
    setUsersError('');
    setShowUserForm(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role_id: user.role_id || (user.role ? user.role.id : ''),
      is_active: user.is_active,
      must_change_password: user.must_change_password || false
    });
    setUsersError('');
    setShowUserForm(true);
  };

  const handleSaveUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenantUsers) return;
    if (!userFormData.name || !userFormData.email) {
      setUsersError('Nome e Login/E-mail são obrigatórios.');
      return;
    }
    if (!editingUser && !userFormData.password) {
      setUsersError('A senha inicial é obrigatória para cadastrar um novo usuário.');
      return;
    }

    setSavingUser(true);
    setUsersError('');
    setUsersSuccess('');
    try {
      const token = localStorage.getItem('factory_token');
      if (editingUser) {
        const payload = {
          name: userFormData.name,
          email: userFormData.email,
          role_id: userFormData.role_id || null,
          is_active: userFormData.is_active,
          must_change_password: userFormData.must_change_password
        };
        if (userFormData.password && userFormData.password.trim()) {
          payload.password = userFormData.password.trim();
        }
        await axios.put(
          `${getBaseUrl()}/tenants/${selectedTenantUsers.id}/users/${editingUser.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsersSuccess(`Usuário "${userFormData.name}" atualizado com sucesso!`);
      } else {
        await axios.post(
          `${getBaseUrl()}/tenants/${selectedTenantUsers.id}/users`,
          {
            ...userFormData,
            role_id: userFormData.role_id || null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsersSuccess(`Usuário "${userFormData.name}" cadastrado com sucesso!`);
      }
      setShowUserForm(false);
      await loadTenantUsers(selectedTenantUsers.id);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : 'Erro ao salvar usuário.');
      setUsersError(msg);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}" (${user.email})?`)) {
      return;
    }
    setUsersError('');
    setUsersSuccess('');
    try {
      const token = localStorage.getItem('factory_token');
      await axios.delete(
        `${getBaseUrl()}/tenants/${selectedTenantUsers.id}/users/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsersSuccess(`Usuário "${user.name}" excluído.`);
      await loadTenantUsers(selectedTenantUsers.id);
    } catch (err) {
      console.error(err);
      setUsersError(err.response?.data?.detail || 'Erro ao excluir usuário.');
    }
  };

  // --- Reenvio de Fatura ---
  const handleResendInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.post(
        `${getBaseUrl()}/tenants/billing/invoices/${invoiceId}/resend`,
        { channel: 'whatsapp' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || 'Fatura reenviada com sucesso via WhatsApp!');
    } catch (err) {
      alert('Erro ao reenviar fatura.');
    }
  };

  // --- Atualizar Status de Ticket ---
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('factory_token');
      await axios.put(
        `${getBaseUrl()}/tenants/support/tickets/${ticketId}`,
        { status_val: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Criar Ticket ---
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('factory_token');
      await axios.post(
        `${getBaseUrl()}/tenants/support/tickets`,
        newTicketForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewTicketModal(false);
      setNewTicketForm({ tenant_name: '', subject: '', description: '', priority: 'MEDIA' });
      await loadTickets();
    } catch (err) {
      alert('Erro ao criar ticket.');
    }
  };

  // --- Criar Broadcast ---
  const handleCreateBroadcastSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('factory_token');
      await axios.post(
        `${getBaseUrl()}/tenants/broadcasts`,
        newBroadcastForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewBroadcastModal(false);
      setNewBroadcastForm({ title: '', message: '', type: 'info' });
      await loadBroadcasts();
    } catch (err) {
      alert('Erro ao disparar comunicado.');
    }
  };

  const handleDeleteBroadcast = async (bId) => {
    try {
      const token = localStorage.getItem('factory_token');
      await axios.delete(`${getBaseUrl()}/tenants/broadcasts/${bId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadBroadcasts();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Criação de Tenant ---
  const handleSlugify = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.slug) {
      setError('Nome e Identificador (Slug) são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('factory_token');
      await axios.post(`${getBaseUrl()}/tenants/`, createForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Laboratório "${createForm.name}" provisionado com sucesso!`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        slug: '',
        cnpj: '',
        telephone: '',
        address: '',
        cep: '',
        ie: '',
        plan_tier: 'enterprise',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      });
      await loadAllDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erro ao cadastrar laboratório.');
    } finally {
      setSaving(false);
    }
  };

  // --- Edição de Tenant ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('factory_token');
      await axios.put(`${getBaseUrl()}/tenants/${editingTenant.id}`, editingTenant, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Dados do laboratório "${editingTenant.name}" atualizados!`);
      setEditingTenant(null);
      await loadTenants();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erro ao atualizar dados do laboratório.');
    } finally {
      setSaving(false);
    }
  };

  // --- Filtros de Tenants no CRM ---
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch =
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cnpj?.includes(searchTerm);
      const matchesPlan = filterPlan === 'ALL' || t.plan_tier?.toLowerCase() === filterPlan.toLowerCase();
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && t.is_active) ||
        (filterStatus === 'INACTIVE' && !t.is_active);
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [tenants, searchTerm, filterPlan, filterStatus]);

  // --- Comandos do Command Menu ---
  const filteredCommands = useMemo(() => {
    const q = commandQuery.toLowerCase().trim();
    const systemCommands = [
      { id: 'cmd-bi', title: 'Ir para Visão Geral & BI', category: 'Navegação', action: () => { setActiveTab('bi'); setShowCommandMenu(false); } },
      { id: 'cmd-crm', title: 'Ir para Gestão de Organizações (CRM)', category: 'Navegação', action: () => { setActiveTab('tenants'); setShowCommandMenu(false); } },
      { id: 'cmd-bill', title: 'Ir para Gestão de Faturas & Planos', category: 'Navegação', action: () => { setActiveTab('billing'); setShowCommandMenu(false); } },
      { id: 'cmd-sec', title: 'Ir para Segurança & Trilha de Auditoria (IAM)', category: 'Navegação', action: () => { setActiveTab('security'); setShowCommandMenu(false); } },
      { id: 'cmd-sup', title: 'Ir para Central de Suporte & Broadcast', category: 'Navegação', action: () => { setActiveTab('support'); setShowCommandMenu(false); } },
      { id: 'cmd-new-lab', title: '+ Provisionar Novo Laboratório', category: 'Ações Rápidas', action: () => { setShowCreateModal(true); setShowCommandMenu(false); } },
      { id: 'cmd-new-broad', title: '+ Disparar Comunicado Global (Broadcast)', category: 'Ações Rápidas', action: () => { setShowNewBroadcastModal(true); setShowCommandMenu(false); } },
      { id: 'cmd-new-ticket', title: '+ Abrir Chamado de Suporte Técnico', category: 'Ações Rápidas', action: () => { setShowNewTicketModal(true); setShowCommandMenu(false); } },
      { id: 'cmd-refresh', title: 'Atualizar Todos os Dados e Métricas', category: 'Sistema', action: () => { loadAllDashboardData(); setShowCommandMenu(false); } },
    ];

    const tenantCommands = tenants.map(t => ({
      id: `cmd-tenant-${t.id}`,
      title: `Acessar como (Impersonate): ${t.name}`,
      subtitle: `Slug: ${t.slug} • Plano ${t.plan_tier?.toUpperCase()}`,
      category: 'Laboratórios & Tenants',
      action: () => { handleImpersonate(t); setShowCommandMenu(false); }
    }));

    const all = [...systemCommands, ...tenantCommands];
    if (!q) return all;
    return all.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    );
  }, [commandQuery, tenants]);

  // Seções da Sidebar
  const saasNavItems = [
    { id: 'bi', label: 'Visão Geral & BI', icon: TrendingUp },
    { id: 'tenants', label: 'Laboratórios & CRM', icon: Building2, count: tenants.length },
    { id: 'billing', label: 'Planos & Billing', icon: DollarSign },
    { id: 'security', label: 'Segurança & IAM', icon: Shield },
    { id: 'support', label: 'Suporte & Avisos', icon: MessageSquare, count: tickets.filter(t => t.status !== 'RESOLVIDO').length }
  ];

  const factoryNavItems = [
    { id: 'grid', label: 'Estoque & Grade', icon: Layers, tab: 'grid' },
    { id: 'os-workflow', label: 'Bancada OS & Workflow', icon: Activity, tab: 'os-workflow' },
    { id: 'billing-factory', label: 'Comercial & Finanças', icon: DollarSign, tab: 'billing' },
    { id: 'relatorios-bi', label: 'Relatórios & BI Fábrica', icon: BarChart3, tab: 'relatorios-bi' },
    { id: 'system-parameters', label: 'Parâmetros do Sistema', icon: Wrench, tab: 'system-parameters' }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: T.bg,
      color: T.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* ======================================================== */}
      {/* 1. BARRA LATERAL (SIDEBAR EXECUTIVA OFF-WHITE)           */}
      {/* ======================================================== */}
      <aside style={{
        width: '270px',
        flexShrink: 0,
        backgroundColor: T.sidebarBg,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Cabeçalho da Sidebar */}
        <div style={{
          padding: '20px 20px 16px 20px',
          borderBottom: `1px solid ${T.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            backgroundColor: T.goldBg,
            border: `1px solid ${T.goldBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.goldDark,
            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.15)'
          }}>
            <Crown size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em' }}>
                Opti<span style={{ color: T.goldDark }}>Mind</span>
              </span>
            </div>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: T.goldDark,
              backgroundColor: T.goldBg,
              padding: '1px 6px',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '2px',
              border: `1px solid ${T.goldBorder}`
            }}>
              SUPERADMIN MASTER
            </div>
          </div>
        </div>

        {/* Botão de Atalho Rápido do Command Menu */}
        <div style={{ padding: '14px 16px 8px 16px' }}>
          <button
            onClick={() => setShowCommandMenu(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: T.bg,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} style={{ color: T.goldDark }} />
              <span>Buscar...</span>
            </span>
            <kbd style={{
              backgroundColor: T.surface,
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              color: T.textLight,
              border: `1px solid ${T.border}`,
              fontFamily: 'monospace'
            }}>
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Itens de Navegação (Scrollável) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {/* Seção 1: Módulos de Gestão SaaS */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              display: 'block',
              padding: '0 8px 6px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: T.textLight,
              letterSpacing: '0.06em'
            }}>
              Módulos SaaS B2B
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {saasNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? T.goldBg : 'transparent',
                      color: isActive ? T.goldDark : T.textSecondary,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} style={{ color: isActive ? T.goldDark : T.textLight }} />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isActive ? '#FFFFFF' : T.surfaceElevated,
                        color: isActive ? T.goldDark : T.textLight,
                        border: `1px solid ${isActive ? T.goldBorder : T.border}`
                      }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Módulos de Fábrica (Menu Superior Original agora na Lateral!) */}
          <div>
            <span style={{
              display: 'block',
              padding: '0 8px 6px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: T.textLight,
              letterSpacing: '0.06em'
            }}>
              Operação de Fábrica
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {factoryNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(item.tab);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: T.textSecondary,
                      fontWeight: 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = T.surfaceElevated;
                      e.currentTarget.style.color = T.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = T.textSecondary;
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} style={{ color: T.textLight }} />
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight size={13} style={{ color: T.textLight }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé da Sidebar: Laboratório Ativo e Perfil */}
        <div style={{
          padding: '14px 16px',
          borderTop: `1px solid ${T.border}`,
          backgroundColor: T.bg
        }}>
          {/* Card do Laboratório em Uso */}
          <div style={{
            padding: '10px',
            backgroundColor: T.surface,
            borderRadius: '8px',
            border: `1px solid ${T.border}`,
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: T.textLight, textTransform: 'uppercase' }}>
                Laboratório Ativo
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: T.emerald, backgroundColor: T.emeraldBg, padding: '1px 5px', borderRadius: '3px' }}>
                Em Uso
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.textPrimary, marginTop: '3px' }}>
              {currentUser?.tenant_name || laboratory?.name || 'Nova LAB Matriz'}
            </div>
          </div>

          {/* Dados do Usuário & Sair */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: T.goldBg,
                color: T.goldDark,
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${T.goldBorder}`
              }}>
                {(currentUser?.name || 'SuperAdmin').charAt(0).toUpperCase()}
              </div>
              <div style={{ maxWidth: '120px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: T.textPrimary, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {currentUser?.name || 'Raphael SuperAdmin'}
                </span>
                <span style={{ fontSize: '0.68rem', color: T.textLight, display: 'block' }}>
                  SuperAdmin
                </span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair do Sistema"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: T.rose,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '5px'
                }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. ÁREA PRINCIPAL DE CONTEÚDO (OFF-WHITE PREMIUM)        */}
      {/* ======================================================== */}
      <main style={{
        flex: 1,
        backgroundColor: T.bg,
        padding: '24px 32px',
        overflowY: 'auto',
        minWidth: 0
      }}>
        {/* Barra Superior da Área de Conteúdo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em' }}>
                {activeTab === 'bi' && 'Visão Geral & Business Intelligence'}
                {activeTab === 'tenants' && 'Gestão de Organizações e Laboratórios'}
                {activeTab === 'billing' && 'Gestão de Planos, Assinaturas e Billing'}
                {activeTab === 'security' && 'Controle de Acessos, Permissões e Auditoria'}
                {activeTab === 'support' && 'Central de Suporte e Notificações'}
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: T.emerald,
                backgroundColor: T.emeraldBg,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: T.emerald }}></span>
                Operacional
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: T.textMuted }}>
              Painel de Governança Executiva • Dados e faturamento consolidados em tempo real
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={loadAllDashboardData}
              disabled={loading}
              title="Atualizar dados do sistema"
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                backgroundColor: T.surface,
                border: `1px solid ${T.border}`,
                color: T.textSecondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '7px',
                backgroundColor: T.gold,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Novo Laboratório</span>
            </button>
          </div>
        </div>

        {/* Notificações de Erro / Sucesso */}
        {error && (
          <div style={{
            padding: '12px 18px',
            backgroundColor: T.roseBg,
            border: `1px solid #FECACA`,
            borderRadius: '8px',
            color: T.rose,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: T.rose, cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 18px',
            backgroundColor: T.emeraldBg,
            border: `1px solid #A7F3D0`,
            borderRadius: '8px',
            color: T.emerald,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: T.emerald, cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 1: VISÃO GERAL E BUSINESS INTELLIGENCE (KPIs)        */}
        {/* ======================================================== */}
        {activeTab === 'bi' && (
          <div>
            {/* 1. Métricas de Receita e Retenção */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Card 1: MRR */}
              <div style={{
                backgroundColor: T.surface,
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    MRR (Receita Mensal)
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: T.emeraldBg,
                    color: T.emerald,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <TrendingUp size={11} /> +{analytics?.mrr_growth_mom || 18.4}% MoM
                  </span>
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: '4px 0' }}>
                  R$ {analytics?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: T.textLight }}>
                  Faturamento mensal consolidado dos laboratórios ativos
                </p>
              </div>

              {/* Card 2: ARR */}
              <div style={{
                backgroundColor: T.surface,
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ARR (Receita Anual Projetada)
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: T.goldBg,
                    color: T.goldDark,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Run-Rate Anual
                  </span>
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.goldDark, letterSpacing: '-0.02em', margin: '4px 0' }}>
                  R$ {analytics?.arr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: T.textLight }}>
                  Projeção com base nos contratos SaaS vigentes
                </p>
              </div>

              {/* Card 3: Churn Rate */}
              <div style={{
                backgroundColor: T.surface,
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Taxa de Churn
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: T.emeraldBg,
                    color: T.emerald,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Excelente (&lt; 2%)
                  </span>
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.emerald, letterSpacing: '-0.02em', margin: '4px 0' }}>
                  {analytics?.churn_rate || 0.0}%
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: T.textLight }}>
                  {analytics?.subscriptions?.churned || 0} cancelamentos nos últimos 90 dias
                </p>
              </div>

              {/* Card 4: ARPU */}
              <div style={{
                backgroundColor: T.surface,
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ARPU (Ticket Médio)
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: T.skyBg,
                    color: T.sky,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Por Laboratório
                  </span>
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: '4px 0' }}>
                  R$ {analytics?.arpu?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: T.textLight }}>
                  Receita média recorrente gerada por laboratório
                </p>
              </div>
            </div>

            {/* 2. Saúde da Base de Clientes (Active Subscriptions) */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: T.textPrimary }}>
                    Saúde da Base de Assinaturas (Active Subscriptions)
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem', color: T.textMuted }}>
                    Contagem em tempo real de clientes ativos, em período de teste, past due e churned
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: T.textSecondary }}>
                  Total Cadastrado: <strong>{analytics?.subscriptions?.total || tenants.length} laboratórios</strong>
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: T.bg,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  borderLeft: `4px solid ${T.emerald}`,
                  border: `1px solid ${T.border}`
                }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 700 }}>Clientes Ativos (Assinantes)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.emerald, marginTop: '4px' }}>
                    {analytics?.subscriptions?.active || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.textLight }}>Adimplentes e faturando</div>
                </div>

                <div style={{
                  backgroundColor: T.bg,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  borderLeft: `4px solid ${T.sky}`,
                  border: `1px solid ${T.border}`
                }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 700 }}>Em Período de Teste (Trial)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.sky, marginTop: '4px' }}>
                    {analytics?.subscriptions?.trial || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.textLight }}>Testando ferramentas</div>
                </div>

                <div style={{
                  backgroundColor: T.bg,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  borderLeft: `4px solid ${T.goldDark}`,
                  border: `1px solid ${T.border}`
                }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 700 }}>Inadimplentes (Past Due)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.goldDark, marginTop: '4px' }}>
                    {analytics?.subscriptions?.past_due || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.textLight }}>Cobrança em andamento</div>
                </div>

                <div style={{
                  backgroundColor: T.bg,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  borderLeft: `4px solid ${T.textLight}`,
                  border: `1px solid ${T.border}`
                }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 700 }}>Cancelados (Churned)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.textLight, marginTop: '4px' }}>
                    {analytics?.subscriptions?.churned || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.textLight }}>Contas inativadas</div>
                </div>
              </div>
            </div>

            {/* 3. Gráfico Interativo & Alertas de Anomalias */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Gráfico Visual Executivo */}
              <div style={{
                backgroundColor: T.surface,
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: T.textPrimary }}>
                      Evolução de MRR e Contratos (MoM & YoY)
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: T.textMuted }}>
                      Trajetória de crescimento consolidada da plataforma OptiMind
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: T.goldDark, fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T.goldDark }}></span> MRR (R$)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: T.sky, fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T.sky }}></span> Laboratórios
                    </span>
                  </div>
                </div>

                {/* SVG Chart */}
                <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                  <svg viewBox="0 0 600 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="goldAreaGradLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D97706" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Linhas de Grade */}
                    <line x1="0" y1="30" x2="600" y2="30" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="600" y2="75" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="600" y2="120" stroke="#F1F5F9" strokeDasharray="3 3" />

                    {/* Área e Linha de MRR */}
                    <path
                      d="M 20 120 Q 110 110 200 95 T 380 65 T 520 40 L 580 32 L 580 145 L 20 145 Z"
                      fill="url(#goldAreaGradLight)"
                    />
                    <path
                      d="M 20 120 Q 110 110 200 95 T 380 65 T 520 40 L 580 32"
                      fill="none"
                      stroke={T.goldDark}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Pontos */}
                    {[
                      { cx: 20, cy: 120, label: 'Mai' },
                      { cx: 110, cy: 110, label: 'Jun' },
                      { cx: 200, cy: 95, label: 'Jul' },
                      { cx: 290, cy: 80, label: 'Ago' },
                      { cx: 380, cy: 65, label: 'Set' },
                      { cx: 480, cy: 45, label: 'Out' },
                      { cx: 580, cy: 32, label: 'Nov' },
                    ].map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.cx} cy={p.cy} r="4" fill="#FFFFFF" stroke={T.goldDark} strokeWidth="2.5" />
                        <text x={p.cx} y="156" textAnchor="middle" fill={T.textLight} fontSize="9" fontWeight="600">{p.label}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Alertas de Anomalias (Widgets Âmbar) */}
              <div style={{
                backgroundColor: T.surface,
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={18} style={{ color: T.goldDark }} />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: T.textPrimary }}>
                    Alertas de Anomalias
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                  {analytics?.anomalies?.map(anom => (
                    <div key={anom.id} style={{
                      backgroundColor: anom.type === 'warning' ? T.roseBg : (anom.type === 'amber' ? T.goldBg : T.skyBg),
                      borderRadius: '8px',
                      padding: '12px 14px',
                      borderLeft: `4px solid ${anom.type === 'warning' ? T.rose : (anom.type === 'amber' ? T.goldDark : T.sky)}`
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.textPrimary }}>
                        {anom.title}
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textSecondary, lineHeight: '1.3' }}>
                        {anom.message}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('billing')}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: T.goldBg,
                    border: `1px solid ${T.goldBorder}`,
                    color: T.goldDark,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  Auditar Inadimplência & Faturamento <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: GESTÃO DE ORGANIZAÇÕES E TENANTS (CRM)            */}
        {/* ======================================================== */}
        {activeTab === 'tenants' && (
          <div>
            {/* Barra de Filtros e Busca */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '16px 20px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              {/* Campo de Busca */}
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: T.textLight }} />
                <input
                  type="text"
                  placeholder="Buscar por nome do laboratório, slug, CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '6px',
                    backgroundColor: T.bg,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Filtro por Plano */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textSecondary }}>Plano:</span>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    backgroundColor: T.bg,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="ALL">Todos os Planos</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="pro">Pro</option>
                  <option value="starter">Starter</option>
                </select>
              </div>

              {/* Filtro por Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textSecondary }}>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    backgroundColor: T.bg,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ACTIVE">Ativos</option>
                  <option value="INACTIVE">Inativos / Bloqueados</option>
                </select>
              </div>

              <span style={{ fontSize: '0.78rem', color: T.textLight }}>
                Mostrando <strong>{filteredTenants.length}</strong> de <strong>{tenants.length}</strong>
              </span>
            </div>

            {/* Tabela de Alta Densidade de Clientes */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: T.textSecondary }}>Laboratório / Empresa</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: T.textSecondary }}>Identificador (Slug)</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: T.textSecondary }}>Plano & MRR</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: T.textSecondary }}>CNPJ & Contato</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: T.textSecondary }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: T.textSecondary, textAlign: 'right' }}>Ações de Gestão & Suporte</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: T.textMuted }}>
                        <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: T.goldDark }} />
                        Carregando laboratórios...
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: T.textMuted }}>
                        Nenhum laboratório encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(t => {
                      const isCurrent = t.id === currentActiveTenantId;
                      const planColor = t.plan_tier === 'enterprise' ? T.goldDark : (t.plan_tier === 'pro' ? T.indigo : T.sky);
                      const planBg = t.plan_tier === 'enterprise' ? T.goldBg : (t.plan_tier === 'pro' ? T.indigoBg : T.skyBg);
                      return (
                        <tr key={t.id} style={{
                          borderBottom: `1px solid ${T.border}`,
                          backgroundColor: isCurrent ? '#FFFBEB' : 'transparent',
                          transition: 'background-color 0.1s ease'
                        }}>
                          {/* Nome do Lab */}
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '7px',
                                backgroundColor: planBg,
                                color: planColor,
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${planColor}`
                              }}>
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {t.name}
                                  {isCurrent && (
                                    <span style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 700,
                                      backgroundColor: T.goldBg,
                                      color: T.goldDark,
                                      padding: '1px 6px',
                                      borderRadius: '3px',
                                      border: `1px solid ${T.goldBorder}`
                                    }}>
                                      Sessão Ativa
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: T.textLight }}>{t.address || 'Sem endereço'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: T.textSecondary }}>
                            <span style={{ backgroundColor: T.bg, padding: '3px 7px', borderRadius: '4px', border: `1px solid ${T.border}` }}>
                              {t.slug}
                            </span>
                          </td>

                          {/* Plano & MRR */}
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: planBg,
                              color: planColor,
                              border: `1px solid ${planColor}`
                            }}>
                              {t.plan_tier}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: T.textLight, marginTop: '2px' }}>
                              R$ {t.plan_tier === 'enterprise' ? '1.950,00' : (t.plan_tier === 'pro' ? '890,00' : '390,00')}/mês
                            </div>
                          </td>

                          {/* CNPJ & Contato */}
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ color: T.textSecondary, fontWeight: 500 }}>{t.cnpj || '—'}</div>
                            <div style={{ fontSize: '0.72rem', color: T.textLight, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={11} /> {t.telephone || '—'}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 18px' }}>
                            {t.is_active ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: T.emerald,
                                backgroundColor: T.emeraldBg,
                                padding: '3px 8px',
                                borderRadius: '12px'
                              }}>
                                <CheckCircle2 size={12} /> Ativo
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: T.rose,
                                backgroundColor: T.roseBg,
                                padding: '3px 8px',
                                borderRadius: '12px'
                              }}>
                                <XCircle size={12} /> Inativo
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {/* Botão IMPERSONATE */}
                              <button
                                onClick={() => handleImpersonate(t)}
                                title="Acessar como este laboratório (Impersonate de Suporte)"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: isCurrent ? T.surfaceElevated : T.goldBg,
                                  border: `1px solid ${isCurrent ? T.border : T.goldBorder}`,
                                  color: isCurrent ? T.textLight : T.goldDark,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <Key size={12} />
                                {isCurrent ? 'Em Uso' : 'Acessar como'}
                              </button>

                              {/* Gestão de Usuários */}
                              <button
                                onClick={() => handleOpenUsersModal(t)}
                                title="Gerenciar Usuários e Perfis deste Laboratório"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: T.indigoBg,
                                  border: `1px solid #C7D2FE`,
                                  color: T.indigo,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                <Users size={13} />
                                <span>Usuários</span>
                              </button>

                              {/* Drawer de Métricas */}
                              <button
                                onClick={() => handleOpenTenantDetails(t)}
                                title="Ver Consumo e Recursos"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: T.skyBg,
                                  border: `1px solid #BAE6FD`,
                                  color: T.sky,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Activity size={13} />
                              </button>

                              {/* Editar Cadastro */}
                              <button
                                onClick={() => setEditingTenant(t)}
                                title="Editar Cadastro"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: T.surface,
                                  border: `1px solid ${T.border}`,
                                  color: T.textSecondary,
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: GESTÃO DE PLANOS, ASSINATURAS E BILLING           */}
        {/* ======================================================== */}
        {activeTab === 'billing' && (
          <div>
            {/* 1. Catálogo de Planos */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                    Catálogo de Planos de Assinatura
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                    Tabelas de preços, limites de processamento de OS e recursos por tier
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {plans.map(p => (
                  <div key={p.id} style={{
                    backgroundColor: T.surface,
                    borderRadius: '10px',
                    border: p.is_popular ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
                    padding: '20px',
                    position: 'relative',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    {p.is_popular && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '16px',
                        backgroundColor: T.gold,
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        textTransform: 'uppercase'
                      }}>
                        Mais Popular
                      </span>
                    )}
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: p.is_popular ? T.goldDark : T.textPrimary }}>
                      {p.name}
                    </h4>
                    <div style={{ margin: '10px 0', fontSize: '1.75rem', fontWeight: 800, color: T.textPrimary }}>
                      R$ {p.price?.toFixed(2)} <span style={{ fontSize: '0.8rem', color: T.textLight, fontWeight: 500 }}>/mês</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '0 0 16px 0', minHeight: '34px' }}>
                      {p.description}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: T.textSecondary }}>
                      {p.features?.map((f, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Check size={14} style={{ color: p.is_popular ? T.goldDark : T.emerald }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Faturas & Histórico de Cobrança */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                    Faturas & Histórico de Cobrança B2B
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                    Acompanhamento de pagamentos de mensalidade, boletos e reenvio via WhatsApp
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Fatura ID</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Laboratório</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Plano</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Valor</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Vencimento</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700, textAlign: 'right' }}>Ação de Cobrança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.textSecondary }}>{inv.id}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: T.textPrimary }}>{inv.tenant_name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: T.bg, border: `1px solid ${T.border}`, fontWeight: 600 }}>
                            {inv.plan_tier}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: T.textPrimary }}>
                          R$ {inv.amount?.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', color: T.textSecondary }}>{inv.due_date}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: inv.status === 'PAGO' ? T.emeraldBg : T.goldBg,
                            color: inv.status === 'PAGO' ? T.emerald : T.goldDark
                          }}>
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleResendInvoice(inv.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '5px',
                              backgroundColor: T.emeraldBg,
                              border: `1px solid #A7F3D0`,
                              color: T.emerald,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Send size={11} /> Reenviar WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 4: CONTROLE DE ACESSOS, PERMISSÕES E SEGURANÇA (IAM)  */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ backgroundColor: T.surface, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.emerald, marginBottom: '6px' }}>
                  <Shield size={16} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Isolamento Multi-Tenant</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: T.textPrimary }}>100% Hermético</div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textLight }}>
                  Isolamento estrito por tenant_id em todas as consultas SQL
                </p>
              </div>

              <div style={{ backgroundColor: T.surface, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.goldDark, marginBottom: '6px' }}>
                  <Lock size={16} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Criptografia & Sessões</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: T.goldDark }}>Bcrypt + JWT</div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textLight }}>
                  Tokens assinados com chave simétrica HS256 e expiração de 24h
                </p>
              </div>

              <div style={{ backgroundColor: T.surface, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.sky, marginBottom: '6px' }}>
                  <Users size={16} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Controle por Cargos (RBAC)</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: T.textPrimary }}>{roles.length} Perfis Ativos</div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textLight }}>
                  Administrador Master, Operador de Fábrica e Funções com escopo auditado
                </p>
              </div>
            </div>

            {/* Trilha de Auditoria Imutável */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                    Trilha de Auditoria Imutável (Audit Logs)
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                    Registro cronológico de todas as ações administrativas, alterações de planos e logins
                  </p>
                </div>
                <span style={{ fontSize: '0.72rem', color: T.emerald, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> Logs Imutáveis Gravados
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Data / Hora</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Autor / Usuário</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Ação</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Tabela</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>IP</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px', color: T.textLight, whiteSpace: 'nowrap' }}>{log.created_at}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: T.textPrimary }}>{log.user_name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: log.action.includes('LOGIN') ? T.emeraldBg : (log.action.includes('SECURITY') ? T.goldBg : T.bg),
                            color: log.action.includes('LOGIN') ? T.emerald : (log.action.includes('SECURITY') ? T.goldDark : T.textSecondary),
                            border: `1px solid ${T.border}`
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.textSecondary }}>{log.table_name}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.textLight }}>{log.ip_address || '—'}</td>
                        <td style={{ padding: '10px 14px', color: T.textSecondary }}>{log.details || log.new_values || 'Registro gravado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 5: CENTRAL DE SUPORTE, TICKETS E BROADCAST           */}
        {/* ======================================================== */}
        {activeTab === 'support' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                  Central de Suporte & Comunicação Direta com Usuários
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                  Gestão de chamados (SLA), comunicados globais em tempo real e automação WhatsApp
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowNewBroadcastModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    backgroundColor: T.goldBg,
                    border: `1px solid ${T.goldBorder}`,
                    color: T.goldDark,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Radio size={14} /> + Novo Comunicado (Broadcast)
                </button>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    backgroundColor: T.gold,
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> + Abrir Chamado
                </button>
              </div>
            </div>

            {/* Comunicados Globais */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Avisos Globais Transmitidos no App ({broadcasts.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {broadcasts.map(b => (
                  <div key={b.id} style={{
                    backgroundColor: T.surface,
                    borderRadius: '8px',
                    border: `1px solid ${b.type === 'urgent' ? '#FECACA' : (b.type === 'warning' ? T.goldBorder : T.border)}`,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: T.textPrimary, fontSize: '0.88rem' }}>{b.title}</span>
                        <button
                          onClick={() => handleDeleteBroadcast(b.id)}
                          style={{ background: 'none', border: 'none', color: T.textLight, cursor: 'pointer' }}
                          title="Remover comunicado"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: T.textSecondary, lineHeight: '1.4' }}>
                        {b.message}
                      </p>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '0.7rem', color: T.textLight, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Disparado em: {b.created_at}</span>
                      <span style={{ color: T.emerald, fontWeight: 600 }}>● Exibido a todos os laboratórios</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela de Chamados de Suporte */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 700, color: T.textPrimary }}>
                Fila de Chamados e Tickets Técnicos
              </h4>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Laboratório</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Assunto & Descrição</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Prioridade</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Responsável</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '10px 14px', color: T.textSecondary, fontWeight: 700, textAlign: 'right' }}>Mudar Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: T.textPrimary }}>{ticket.tenant_name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: T.textPrimary }}>{ticket.subject}</div>
                          <div style={{ fontSize: '0.74rem', color: T.textMuted, marginTop: '2px' }}>{ticket.description}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: ticket.priority === 'ALTA' ? T.roseBg : (ticket.priority === 'MEDIA' ? T.goldBg : T.skyBg),
                            color: ticket.priority === 'ALTA' ? T.rose : (ticket.priority === 'MEDIA' ? T.goldDark : T.sky)
                          }}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: T.textSecondary }}>{ticket.assigned_to}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: ticket.status === 'RESOLVIDO' ? T.emeraldBg : (ticket.status === 'EM_ANDAMENTO' ? T.goldBg : T.bg),
                            color: ticket.status === 'RESOLVIDO' ? T.emerald : (ticket.status === 'EM_ANDAMENTO' ? T.goldDark : T.textSecondary),
                            border: `1px solid ${T.border}`
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <select
                            value={ticket.status}
                            onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: T.bg,
                              border: `1px solid ${T.border}`,
                              color: T.textPrimary,
                              fontSize: '0.72rem'
                            }}
                          >
                            <option value="ABERTO">ABERTO</option>
                            <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                            <option value="RESOLVIDO">RESOLVIDO</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. MODAL DO COMMAND MENU GLOBAL (Cmd + K / Ctrl + K)     */}
      {/* ======================================================== */}
      {showCommandMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '80px',
          zIndex: 99999
        }}>
          <div style={{
            width: '100%',
            maxWidth: '640px',
            backgroundColor: T.surface,
            borderRadius: '12px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: `1px solid ${T.border}`
            }}>
              <Search size={18} style={{ color: T.goldDark, marginRight: '12px' }} />
              <input
                autoFocus
                type="text"
                placeholder="Digite para buscar laboratórios, comandos ou navegar..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: T.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              />
              <kbd style={{
                backgroundColor: T.bg,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: T.textLight,
                border: `1px solid ${T.border}`
              }}>
                ESC
              </kbd>
            </div>

            {/* Lista */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
              {filteredCommands.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: T.textMuted, fontSize: '0.85rem' }}>
                  Nenhum comando ou laboratório encontrado para "{commandQuery}".
                </div>
              ) : (
                filteredCommands.map(cmd => (
                  <div
                    key={cmd.id}
                    onClick={cmd.action}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.1s ease',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.bg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.textPrimary }}>
                        {cmd.title}
                      </div>
                      {cmd.subtitle && (
                        <div style={{ fontSize: '0.72rem', color: T.textLight, marginTop: '2px' }}>
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: T.goldDark,
                      backgroundColor: T.goldBg,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${T.goldBorder}`
                    }}>
                      {cmd.category}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé */}
            <div style={{
              padding: '10px 16px',
              backgroundColor: T.bg,
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: T.textLight
            }}>
              <span>Navegue usando o mouse ou teclado</span>
              <span><strong>OptiMind</strong> B2B Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: DETALHES DE RECURSOS DO TENANT                 */}
      {/* ======================================================== */}
      {selectedTenantDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                  Visão de Recursos: {selectedTenantDetails.name}
                </h3>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.goldDark }}>
                  Slug: {selectedTenantDetails.slug}
                </span>
              </div>
              <button onClick={() => setSelectedTenantDetails(null)} style={{ background: 'none', border: 'none', color: T.textLight, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: T.bg, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 600 }}>Usuários Vinculados</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, marginTop: '4px' }}>
                    {tenantStats?.users_count || '1'}
                  </div>
                </div>

                <div style={{ backgroundColor: T.bg, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 600 }}>Armazenamento em Nuvem</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: T.goldDark, marginTop: '4px' }}>
                    {tenantStats?.storage_used_mb || 14.5} MB
                  </div>
                </div>

                <div style={{ backgroundColor: T.bg, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 600 }}>Chamadas de API / Mês</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: T.sky, marginTop: '4px' }}>
                    {tenantStats?.api_calls_month?.toLocaleString('pt-BR') || '4.250'}
                  </div>
                </div>

                <div style={{ backgroundColor: T.bg, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textSecondary, fontWeight: 600 }}>Plano de Assinatura</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.emerald, marginTop: '6px', textTransform: 'uppercase' }}>
                    {selectedTenantDetails.plan_tier}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => { setSelectedTenantDetails(null); handleImpersonate(selectedTenantDetails); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: T.gold,
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Key size={14} /> Acessar como {selectedTenantDetails.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: GESTÃO DE USUÁRIOS DO LABORATÓRIO              */}
      {/* ======================================================== */}
      {selectedTenantUsers && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${T.border}`,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: T.goldDark }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: T.textPrimary }}>
                    Usuários: {selectedTenantUsers.name}
                  </h3>
                  <code style={{ fontSize: '0.72rem', backgroundColor: T.surface, padding: '2px 6px', borderRadius: '4px', color: T.goldDark, border: `1px solid ${T.border}` }}>
                    {selectedTenantUsers.slug}
                  </code>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                  Gerencie os operadores e administradores deste laboratório respeitando os perfis de acesso.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!showUserForm && (
                  <button
                    onClick={handleOpenCreateUser}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: T.gold,
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Novo Usuário
                  </button>
                )}
                <button
                  onClick={() => setSelectedTenantUsers(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {usersError && (
                <div style={{ padding: '10px 14px', backgroundColor: T.roseBg, border: `1px solid #FECACA`, borderRadius: '6px', color: T.rose, marginBottom: '14px', fontSize: '0.82rem' }}>
                  {usersError}
                </div>
              )}

              {usersSuccess && (
                <div style={{ padding: '10px 14px', backgroundColor: T.emeraldBg, border: `1px solid #A7F3D0`, borderRadius: '6px', color: T.emerald, marginBottom: '14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} /> {usersSuccess}
                </div>
              )}

              {showUserForm ? (
                <form onSubmit={handleSaveUserSubmit} style={{ backgroundColor: T.bg, padding: '18px', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: T.textPrimary }}>
                      {editingUser ? `Editar Usuário: ${editingUser.name}` : 'Cadastrar Novo Usuário no Laboratório'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowUserForm(false)}
                      style={{ border: 'none', background: 'transparent', color: T.textMuted, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Voltar à Lista
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Leonardo Araújo"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                        Login / E-mail de Acesso *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="leootica ou leo@lab.com"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                        {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        placeholder={editingUser ? 'Digite apenas para alterar' : 'Mínimo 4 caracteres'}
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary }}>
                          Perfil de Acesso / Função (Role) *
                        </label>
                        {roles.length === 0 && (
                          <button
                            type="button"
                            onClick={loadRoles}
                            style={{ fontSize: '0.72rem', color: T.goldDark, border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Recarregar opções
                          </button>
                        )}
                      </div>
                      <select
                        required
                        value={userFormData.role_id}
                        onChange={(e) => setUserFormData({ ...userFormData, role_id: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      >
                        <option value="">-- Selecione o Perfil --</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.description ? `(${r.description})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: T.textSecondary, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={userFormData.is_active}
                        onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: T.gold }}
                      />
                      Usuário Ativo (Pode fazer login no sistema)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: T.textSecondary, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={userFormData.must_change_password}
                        onChange={(e) => setUserFormData({ ...userFormData, must_change_password: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: T.gold }}
                      />
                      Exigir troca de senha no primeiro login
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowUserForm(false)}
                      style={{ padding: '6px 12px', borderRadius: '5px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textSecondary, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingUser}
                      style={{ padding: '6px 16px', borderRadius: '5px', border: 'none', backgroundColor: T.gold, color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {savingUser ? 'Salvando...' : (editingUser ? 'Atualizar Usuário' : 'Cadastrar Usuário')}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Tabela de Usuários */}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ padding: '8px 14px', fontWeight: 700, color: T.textSecondary }}>Nome</th>
                      <th style={{ padding: '8px 14px', fontWeight: 700, color: T.textSecondary }}>Login / E-mail</th>
                      <th style={{ padding: '8px 14px', fontWeight: 700, color: T.textSecondary }}>Perfil / Função</th>
                      <th style={{ padding: '8px 14px', fontWeight: 700, color: T.textSecondary }}>Status</th>
                      <th style={{ padding: '8px 14px', fontWeight: 700, color: T.textSecondary, textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: T.textMuted }}>
                          <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 4px auto', color: T.goldDark }} />
                          Carregando usuários...
                        </td>
                      </tr>
                    ) : tenantUsersList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: T.textMuted }}>
                          Nenhum usuário cadastrado neste laboratório. Clique em <strong>+ Novo Usuário</strong> para criar o primeiro.
                        </td>
                      </tr>
                    ) : (
                      tenantUsersList.map(u => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '8px 14px', fontWeight: 700, color: T.textPrimary }}>
                            {u.name}
                            {u.is_superadmin && (
                              <span style={{ marginLeft: '6px', fontSize: '0.62rem', backgroundColor: T.goldBg, color: T.goldDark, padding: '1px 5px', borderRadius: '3px', border: `1px solid ${T.goldBorder}` }}>
                                SuperAdmin
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 14px', color: T.textSecondary, fontFamily: 'monospace' }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: u.role?.name === 'Administrador' ? T.goldBg : T.indigoBg,
                              color: u.role?.name === 'Administrador' ? T.goldDark : T.indigo,
                              border: `1px solid ${u.role?.name === 'Administrador' ? T.goldBorder : '#C7D2FE'}`
                            }}>
                              {u.role ? u.role.name : 'Sem Perfil'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            {u.is_active ? (
                              <span style={{ color: T.emerald, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={12} /> Ativo
                              </span>
                            ) : (
                              <span style={{ color: T.rose, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <XCircle size={12} /> Inativo
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                title="Editar Usuário"
                                style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textSecondary, cursor: 'pointer' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              {!u.is_superadmin && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="Excluir Usuário"
                                  style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid #FECACA`, backgroundColor: T.roseBg, color: T.rose, cursor: 'pointer' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: PROVISIONAR NOVO LABORATÓRIO (TENANT)          */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${T.border}`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} style={{ color: T.goldDark }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: T.textPrimary }}>
                  Provisionar Novo Laboratório Óptico (Tenant)
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Nome Fantasia / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ótica Alpha Prime"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCreateForm(prev => ({
                        ...prev,
                        name,
                        slug: prev.slug === '' || prev.slug === handleSlugify(prev.name) ? handleSlugify(name) : prev.slug
                      }));
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Identificador Único (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: optica-alpha"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().trim() }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.goldDark, fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={createForm.cnpj}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(61) 99999-9999"
                    value={createForm.telephone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, telephone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={createForm.plan_tier}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, plan_tier: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="enterprise">Enterprise (R$ 1.950/mês)</option>
                    <option value="pro">Pro (R$ 890/mês)</option>
                    <option value="starter">Starter (R$ 390/mês)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Inscrição Estadual (IE)
                  </label>
                  <input
                    type="text"
                    placeholder="07.123.456/001-00"
                    value={createForm.ie}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ie: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Principal, 1000 - Centro"
                    value={createForm.address}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Administrador Inicial */}
              <div style={{ backgroundColor: T.bg, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '16px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.goldDark, display: 'block', marginBottom: '8px' }}>
                  Provisionar Usuário Administrador Inicial do Laboratório
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <input
                      type="text"
                      placeholder="Login de Acesso (ex: admin.alpha)"
                      value={createForm.admin_email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_email: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '5px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Senha Inicial de Acesso"
                      value={createForm.admin_password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_password: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '5px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textSecondary, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Provisionando...' : 'Provisionar Laboratório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: EDITAR LABORATÓRIO (TENANT)                    */}
      {/* ======================================================== */}
      {editingTenant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg
            }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                Editar: {editingTenant.name}
              </h3>
              <button onClick={() => setEditingTenant(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={editingTenant.cnpj || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, cnpj: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editingTenant.telephone || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, telephone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={editingTenant.plan_tier}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan_tier: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="enterprise">Enterprise</option>
                    <option value="pro">Pro</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="edit_tenant_active"
                    checked={editingTenant.is_active}
                    onChange={(e) => setEditingTenant({ ...editingTenant, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: T.gold }}
                  />
                  <label htmlFor="edit_tenant_active" style={{ fontSize: '0.85rem', fontWeight: 700, color: T.textPrimary, cursor: 'pointer' }}>
                    Laboratório Ativo (Permitir acesso de seus operadores e faturamento)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textSecondary, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL: NOVO COMUNICADO GLOBAL (BROADCAST)             */}
      {/* ======================================================== */}
      {showNewBroadcastModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={16} style={{ color: T.goldDark }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: T.textPrimary }}>
                  Disparar Comunicado Global (Broadcast)
                </h3>
              </div>
              <button onClick={() => setShowNewBroadcastModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcastSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Título do Comunicado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manutenção Programada dos Servidores"
                  value={newBroadcastForm.title}
                  onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Tipo de Aviso
                </label>
                <select
                  value={newBroadcastForm.type}
                  onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="info">Informativo (Azul)</option>
                  <option value="warning">Atenção / Operacional (Âmbar Ouro)</option>
                  <option value="urgent">Urgente / Crítico (Vermelho)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Mensagem aos Laboratórios *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Escreva o comunicado que será exibido no topo do painel de todos os clientes..."
                  value={newBroadcastForm.message}
                  onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, message: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewBroadcastModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textSecondary, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Transmitir Comunicado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MODAL: NOVO TICKET DE SUPORTE                         */}
      {/* ======================================================== */}
      {showNewTicketModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.bg
            }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.textPrimary }}>
                Abrir Novo Chamado de Suporte
              </h3>
              <button onClick={() => setShowNewTicketModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Laboratório Solicitante *
                </label>
                <select
                  required
                  value={newTicketForm.tenant_name}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, tenant_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="">-- Selecione o Laboratório --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.slug})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Assunto do Chamado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Divergência de espessura de centro em lente 1.67"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Prioridade (SLA)
                </label>
                <select
                  value={newTicketForm.priority}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="BAIXA">BAIXA (Até 48h)</option>
                  <option value="MEDIA">MÉDIA (Até 24h)</option>
                  <option value="ALTA">ALTA / URGENTE (Até 4h)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: T.textSecondary, marginBottom: '4px' }}>
                  Descrição Detalhada do Problema *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Descreva o ocorrido com o operador ou integração..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textSecondary, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Registrar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
