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
  Laptop
} from 'lucide-react';

export default function PainelLaboratorios({ currentActiveTenantId, onTenantChange }) {
  // --- Estados de Navegação e Abas ---
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
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null); // Drawer de detalhes do tenant
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

  // --- Escuta de Teclado Global: Cmd + K / Ctrl + K ---
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
    if (!window.confirm(`Deseja entrar no modo de suporte IMPERSONATE e acessar o sistema exatamente como o laboratório "${tenant.name}"?`)) {
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

  // Cores Temáticas Executivas
  const T = {
    bg: '#0C0C0E',
    surface: '#141418',
    surfaceElevated: '#181820',
    border: '#26262F',
    borderLight: '#32323E',
    gold: '#E2A336',
    goldHover: '#F5B041',
    goldGlow: 'rgba(226, 163, 54, 0.15)',
    goldSubtle: 'rgba(226, 163, 54, 0.08)',
    text: '#F4F4F6',
    textMuted: '#A1A1B2',
    textDim: '#6F6F82',
    emerald: '#10B981',
    emeraldSubtle: 'rgba(16, 185, 129, 0.12)',
    rose: '#EF4444',
    roseSubtle: 'rgba(239, 68, 68, 0.12)',
    sky: '#38BDF8',
    skySubtle: 'rgba(56, 189, 248, 0.12)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: T.bg,
      color: T.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '0.875rem',
      padding: '24px 32px',
      boxSizing: 'border-box'
    }}>
      {/* ======================================================== */}
      {/* 1. HEADER EXECUTIVO COM INDICADOR DE IMPERSONATE & ATALHO */}
      {/* ======================================================== */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '20px',
        borderBottom: `1px solid ${T.border}`,
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Identidade da Plataforma */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: T.goldSubtle,
            border: `1px solid ${T.gold}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 15px ${T.goldGlow}`
          }}>
            <Crown size={22} style={{ color: T.gold }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: T.text }}>
                OptiMind <span style={{ color: T.gold }}>Enterprise</span>
              </h1>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: T.goldSubtle,
                color: T.gold,
                border: `1px solid rgba(226, 163, 54, 0.3)`
              }}>
                SUPERADMIN MASTER
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: T.textDim,
                backgroundColor: T.surfaceElevated,
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${T.border}`
              }}>
                v2.4 Multi-Tenant
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: T.textMuted }}>
              Painel de Controle B2B Executivo • Governança, Faturamento Recorrente e Monitoramento Multi-Tenant
            </p>
          </div>
        </div>

        {/* Ações Globais: Command Menu, Refresh e Novo Lab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Botão de Atalho Command Menu (Cmd + K) */}
          <button
            onClick={() => setShowCommandMenu(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: T.surface,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={14} style={{ color: T.gold }} />
            <span>Buscar ou Executar...</span>
            <kbd style={{
              backgroundColor: T.surfaceElevated,
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              color: T.text,
              border: `1px solid ${T.borderLight}`,
              fontFamily: 'monospace'
            }}>
              Ctrl + K
            </kbd>
          </button>

          <button
            onClick={loadAllDashboardData}
            disabled={loading}
            title="Atualizar dados do sistema"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: T.surface,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span style={{ fontSize: '0.8rem' }}>Atualizar</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: T.gold,
              border: 'none',
              color: '#000000',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: `0 2px 10px ${T.goldGlow}`
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Novo Laboratório</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. BARRA DE NAVEGAÇÃO MODULAR EXECUTIVA (ABAS)            */}
      {/* ======================================================== */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '24px',
        borderBottom: `1px solid ${T.border}`,
        paddingBottom: '2px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'bi', label: '1. Visão Geral & BI (Tempo Real)', icon: TrendingUp },
          { id: 'tenants', label: '2. Organizações & Tenants (CRM)', icon: Building2, count: tenants.length },
          { id: 'billing', label: '3. Planos & Billing (Financeiro)', icon: DollarSign },
          { id: 'security', label: '4. Segurança & Auditoria (IAM)', icon: Shield },
          { id: 'support', label: '5. Suporte & Notificações', icon: MessageSquare, count: tickets.filter(t => t.status !== 'RESOLVIDO').length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? `2px solid ${T.gold}` : '2px solid transparent',
                backgroundColor: isActive ? T.surface : 'transparent',
                color: isActive ? T.gold : T.textMuted,
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? T.goldGlow : T.surfaceElevated,
                  color: isActive ? T.gold : T.textDim,
                  border: `1px solid ${isActive ? T.gold : T.border}`
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Feedback de Notificações */}
      {error && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: T.roseSubtle,
          border: `1px solid ${T.rose}`,
          borderRadius: '8px',
          color: '#fca5a5',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ color: T.rose }} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: T.emeraldSubtle,
          border: `1px solid ${T.emerald}`,
          borderRadius: '8px',
          color: '#86efac',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: T.emerald }} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer' }}><X size={16} /></button>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Card 1: MRR */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '18px 20px',
              position: 'relative',
              boxShadow: `0 4px 15px rgba(0,0,0,0.3)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MRR (Receita Recorrente Mensal)
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: T.emeraldSubtle,
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
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: '4px 0' }}>
                R$ {analytics?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: T.textDim }}>
                Faturamento mensal consolidado dos laboratórios ativos
              </p>
            </div>

            {/* Card 2: ARR */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '18px 20px',
              boxShadow: `0 4px 15px rgba(0,0,0,0.3)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ARR (Receita Anual Projetada)
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: T.goldSubtle,
                  color: T.gold,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Run-Rate Anual
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.gold, letterSpacing: '-0.02em', margin: '4px 0' }}>
                R$ {analytics?.arr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: T.textDim }}>
                Projeção com base nos contratos SaaS vigentes
              </p>
            </div>

            {/* Card 3: Churn Rate */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '18px 20px',
              boxShadow: `0 4px 15px rgba(0,0,0,0.3)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Taxa de Churn (Cancelamento)
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: T.emeraldSubtle,
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
              <p style={{ margin: 0, fontSize: '0.75rem', color: T.textDim }}>
                {analytics?.subscriptions?.churned || 0} cancelamentos registrados nos últimos 90 dias
              </p>
            </div>

            {/* Card 4: ARPU */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '18px 20px',
              boxShadow: `0 4px 15px rgba(0,0,0,0.3)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ARPU (Receita Média / Cliente)
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: T.skySubtle,
                  color: T.sky,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Ticket Médio
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: T.text, letterSpacing: '-0.02em', margin: '4px 0' }}>
                R$ {analytics?.arpu?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: T.textDim }}>
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
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: T.text }}>
                  Saúde da Base de Assinaturas (Active Subscriptions)
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                  Contagem em tempo real de contas ativas, em teste, past due e churned
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: T.textDim }}>
                Total Cadastrado: <strong>{analytics?.subscriptions?.total || tenants.length} laboratórios</strong>
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: T.surfaceElevated,
                borderRadius: '8px',
                padding: '14px 16px',
                borderLeft: `4px solid ${T.emerald}`
              }}>
                <div style={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>Clientes Ativos (Assinantes)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.emerald, marginTop: '4px' }}>
                  {analytics?.subscriptions?.active || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: T.textDim }}>Adimplentes e faturando</div>
              </div>

              <div style={{
                backgroundColor: T.surfaceElevated,
                borderRadius: '8px',
                padding: '14px 16px',
                borderLeft: `4px solid ${T.sky}`
              }}>
                <div style={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>Em Período de Teste (Trial)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.sky, marginTop: '4px' }}>
                  {analytics?.subscriptions?.trial || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: T.textDim }}>Testando ferramentas</div>
              </div>

              <div style={{
                backgroundColor: T.surfaceElevated,
                borderRadius: '8px',
                padding: '14px 16px',
                borderLeft: `4px solid ${T.gold}`
              }}>
                <div style={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>Inadimplentes (Past Due)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.gold, marginTop: '4px' }}>
                  {analytics?.subscriptions?.past_due || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: T.textDim }}>Cobrança em andamento</div>
              </div>

              <div style={{
                backgroundColor: T.surfaceElevated,
                borderRadius: '8px',
                padding: '14px 16px',
                borderLeft: `4px solid ${T.borderLight}`
              }}>
                <div style={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>Cancelados (Churned)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: T.textDim, marginTop: '4px' }}>
                  {analytics?.subscriptions?.churned || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: T.textDim }}>Contas inativadas</div>
              </div>
            </div>
          </div>

          {/* 3. Gráfico Interativo de Evolução MoM & Alertas de Anomalias */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Gráfico Visual Executivo (SVG Interativo) */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: T.text }}>
                    Evolução de MRR e Contratos (MoM & YoY)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: T.textMuted }}>
                    Trajetória de crescimento consolidada da plataforma OptiMind
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: T.gold }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T.gold }}></span> MRR (R$)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: T.sky }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T.sky }}></span> Laboratórios
                  </span>
                </div>
              </div>

              {/* SVG Chart */}
              <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                <svg viewBox="0 0 600 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={T.gold} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Linhas de Grade Horizontais */}
                  <line x1="0" y1="30" x2="600" y2="30" stroke={T.border} strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="600" y2="75" stroke={T.border} strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke={T.border} strokeDasharray="3 3" />

                  {/* Área e Linha de MRR */}
                  <path
                    d="M 20 120 Q 110 110 200 95 T 380 65 T 520 40 L 580 32 L 580 145 L 20 145 Z"
                    fill="url(#goldAreaGrad)"
                  />
                  <path
                    d="M 20 120 Q 110 110 200 95 T 380 65 T 520 40 L 580 32"
                    fill="none"
                    stroke={T.gold}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Pontos de MRR */}
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
                      <circle cx={p.cx} cy={p.cy} r="4" fill={T.surface} stroke={T.gold} strokeWidth="2.5" />
                      <text x={p.cx} y="156" textAnchor="middle" fill={T.textDim} fontSize="9">{p.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Alertas de Anomalias (Widgets Âmbar #E2A336) */}
            <div style={{
              backgroundColor: T.surface,
              borderRadius: '10px',
              border: `1px solid ${T.border}`,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={18} style={{ color: T.gold }} />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: T.text }}>
                  Alertas de Anomalias
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                {analytics?.anomalies?.map(anom => (
                  <div key={anom.id} style={{
                    backgroundColor: T.surfaceElevated,
                    borderRadius: '8px',
                    padding: '12px 14px',
                    borderLeft: `3px solid ${anom.type === 'warning' ? T.rose : (anom.type === 'amber' ? T.gold : T.sky)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: T.text }}>
                        {anom.title}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textMuted, lineHeight: '1.3' }}>
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
                  backgroundColor: T.goldSubtle,
                  border: `1px solid ${T.gold}`,
                  color: T.gold,
                  fontSize: '0.78rem',
                  fontWeight: 600,
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
          {/* Barra de Filtros e Busca de Alta Densidade */}
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
            flexWrap: 'wrap'
          }}>
            {/* Campo de Busca */}
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: T.textDim }} />
              <input
                type="text"
                placeholder="Buscar por nome do laboratório, slug, CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '6px',
                  backgroundColor: T.surfaceElevated,
                  border: `1px solid ${T.borderLight}`,
                  color: T.text,
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filtro por Plano */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: T.textMuted }}>Plano:</span>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: T.surfaceElevated,
                  border: `1px solid ${T.borderLight}`,
                  color: T.text,
                  fontSize: '0.8rem'
                }}
              >
                <option value="ALL">Todos os Planos</option>
                <option value="enterprise">Enterprise (Ouro)</option>
                <option value="pro">Pro (Profissional)</option>
                <option value="starter">Starter</option>
              </select>
            </div>

            {/* Filtro por Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: T.textMuted }}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: T.surfaceElevated,
                  border: `1px solid ${T.borderLight}`,
                  color: T.text,
                  fontSize: '0.8rem'
                }}
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativos</option>
                <option value="INACTIVE">Inativos / Bloqueados</option>
              </select>
            </div>

            <span style={{ fontSize: '0.78rem', color: T.textDim }}>
              Mostrando <strong>{filteredTenants.length}</strong> de <strong>{tenants.length}</strong>
            </span>
          </div>

          {/* Tabela de Alta Densidade de Clientes */}
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: T.surfaceElevated, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: T.textMuted }}>Laboratório / Empresa</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: T.textMuted }}>Identificador (Slug)</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: T.textMuted }}>Plano & MRR</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: T.textMuted }}>CNPJ & Contato</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: T.textMuted }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: T.textMuted, textAlign: 'right' }}>Ações de Gestão & Suporte</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: T.textMuted }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: T.gold }} />
                      Carregando dados dos laboratórios...
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
                    const planColor = t.plan_tier === 'enterprise' ? T.gold : (t.plan_tier === 'pro' ? '#a855f7' : T.sky);
                    return (
                      <tr key={t.id} style={{
                        borderBottom: `1px solid ${T.border}`,
                        backgroundColor: isCurrent ? 'rgba(226, 163, 54, 0.04)' : 'transparent',
                        transition: 'background-color 0.1s ease'
                      }}>
                        {/* Nome do Lab */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: T.surfaceElevated,
                              border: `1px solid ${T.borderLight}`,
                              color: planColor,
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t.name}
                                {isCurrent && (
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    backgroundColor: T.goldSubtle,
                                    color: T.gold,
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    border: `1px solid rgba(226, 163, 54, 0.3)`
                                  }}>
                                    Sessão Ativa
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: T.textDim }}>{t.address || 'Sem endereço cadastrado'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: T.textMuted }}>
                          <span style={{ backgroundColor: T.surfaceElevated, padding: '3px 7px', borderRadius: '4px', border: `1px solid ${T.border}` }}>
                            {t.slug}
                          </span>
                        </td>

                        {/* Plano & MRR */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: planColor,
                              border: `1px solid ${planColor}`
                            }}>
                              {t.plan_tier}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: T.textDim, marginTop: '2px' }}>
                            R$ {t.plan_tier === 'enterprise' ? '1.950,00' : (t.plan_tier === 'pro' ? '890,00' : '390,00')}/mês
                          </div>
                        </td>

                        {/* CNPJ & Contato */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ color: T.textMuted }}>{t.cnpj || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: T.textDim, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
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
                              fontWeight: 600,
                              color: T.emerald,
                              backgroundColor: T.emeraldSubtle,
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
                              fontWeight: 600,
                              color: T.rose,
                              backgroundColor: T.roseSubtle,
                              padding: '3px 8px',
                              borderRadius: '12px'
                            }}>
                              <XCircle size={12} /> Inativo
                            </span>
                          )}
                        </td>

                        {/* Ações: Impersonate, Usuários, Detalhes e Editar */}
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Botão IMPERSONATE ("Acessar como") */}
                            <button
                              onClick={() => handleImpersonate(t)}
                              title="Acessar como este laboratório (Impersonate de Suporte)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: isCurrent ? T.surfaceElevated : T.goldSubtle,
                                border: `1px solid ${isCurrent ? T.border : T.gold}`,
                                color: isCurrent ? T.textMuted : T.gold,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
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
                                backgroundColor: T.surfaceElevated,
                                border: `1px solid ${T.border}`,
                                color: T.textMuted,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem'
                              }}
                            >
                              <Users size={13} />
                              <span>Usuários</span>
                            </button>

                            {/* Drawer de Métricas */}
                            <button
                              onClick={() => handleOpenTenantDetails(t)}
                              title="Ver Consumo e Detalhes de Recursos"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: T.surfaceElevated,
                                border: `1px solid ${T.border}`,
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
                              title="Editar Dados Cadastrais"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: T.surfaceElevated,
                                border: `1px solid ${T.border}`,
                                color: T.textMuted,
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
      {/* ABA 3: GESTÃO DE PLANOS, ASSINATURAS E BILLING (FINANCEIRO) */}
      {/* ======================================================== */}
      {activeTab === 'billing' && (
        <div>
          {/* 1. Catálogo de Planos */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
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
                  border: p.is_popular ? `1.5px solid ${T.gold}` : `1px solid ${T.border}`,
                  padding: '20px',
                  position: 'relative',
                  boxShadow: p.is_popular ? `0 0 20px ${T.goldGlow}` : 'none'
                }}>
                  {p.is_popular && (
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      backgroundColor: T.gold,
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase'
                    }}>
                      Mais Popular
                    </span>
                  )}
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: p.is_popular ? T.gold : T.text }}>
                    {p.name}
                  </h4>
                  <div style={{ margin: '10px 0', fontSize: '1.75rem', fontWeight: 800, color: T.text }}>
                    R$ {p.price?.toFixed(2)} <span style={{ fontSize: '0.8rem', color: T.textDim, fontWeight: 500 }}>/mês</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '0 0 16px 0', minHeight: '34px' }}>
                    {p.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: T.textMuted }}>
                    {p.features?.map((f, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Check size={14} style={{ color: p.is_popular ? T.gold : T.emerald }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Faturas & Histórico de Transações */}
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
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
                  <tr style={{ backgroundColor: T.surfaceElevated, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Fatura ID</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Laboratório</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Plano</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Valor</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Vencimento</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Status</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted, textAlign: 'right' }}>Ação de Cobrança</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.textMuted }}>{inv.id}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{inv.tenant_name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: T.surfaceElevated, border: `1px solid ${T.border}` }}>
                          {inv.plan_tier}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>
                        R$ {inv.amount?.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 14px', color: T.textMuted }}>{inv.due_date}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: inv.status === 'PAGO' ? T.emeraldSubtle : T.goldSubtle,
                          color: inv.status === 'PAGO' ? T.emerald : T.gold
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
                            padding: '4px 10px',
                            borderRadius: '5px',
                            backgroundColor: T.surfaceElevated,
                            border: `1px solid ${T.borderLight}`,
                            color: T.textMuted,
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={11} style={{ color: T.emerald }} /> Reenviar WhatsApp
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
          {/* Cards de Métricas de Segurança */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ backgroundColor: T.surface, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.emerald, marginBottom: '6px' }}>
                <Shield size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Isolamento Multi-Tenant</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>100% Hermético</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textDim }}>
                Isolamento estrito por tenant_id e contexto assíncrono em todas as consultas SQL
              </p>
            </div>

            <div style={{ backgroundColor: T.surface, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.gold, marginBottom: '6px' }}>
                <Lock size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Criptografia & Sessões</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: T.gold }}>Bcrypt + JWT</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textDim }}>
                Tokens assinados com chave simétrica HS256 e expiração automática de 24 horas
              </p>
            </div>

            <div style={{ backgroundColor: T.surface, borderRadius: '10px', border: `1px solid ${T.border}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.sky, marginBottom: '6px' }}>
                <Users size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Controle por Cargos (RBAC)</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>{roles.length} Perfis Ativos</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: T.textDim }}>
                Administrador Master, Operador de Fábrica e Funções com escopo auditado
              </p>
            </div>
          </div>

          {/* Trilha de Auditoria Imutável (Audit Logs) */}
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
                  Trilha de Auditoria Imutável (Audit Logs)
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: T.textMuted }}>
                  Registro cronológico de todas as ações administrativas, alterações de planos e logins
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', color: T.emerald, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Logs Imutáveis Gravados
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: T.surfaceElevated, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Data / Hora</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Autor / Usuário</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Ação</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Tabela / Recurso</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>IP de Origem</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', color: T.textDim, whiteSpace: 'nowrap' }}>{log.created_at}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{log.user_name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: log.action.includes('LOGIN') ? T.emeraldSubtle : (log.action.includes('SECURITY') ? T.goldSubtle : T.surfaceElevated),
                          color: log.action.includes('LOGIN') ? T.emerald : (log.action.includes('SECURITY') ? T.gold : T.textMuted)
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.textDim }}>{log.table_name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.textDim }}>{log.ip_address || '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.textMuted }}>{log.details || log.new_values || 'Registro gravado'}</td>
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
          {/* Header de Ações do Suporte */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
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
                  backgroundColor: T.surfaceElevated,
                  border: `1px solid ${T.gold}`,
                  color: T.gold,
                  fontSize: '0.78rem',
                  fontWeight: 600,
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
                  color: '#000',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> + Abrir Chamado
              </button>
            </div>
          </div>

          {/* 1. Comunicados Globais Ativos (Broadcast) */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Avisos Globais Transmitidos no App ({broadcasts.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {broadcasts.map(b => (
                <div key={b.id} style={{
                  backgroundColor: T.surface,
                  borderRadius: '8px',
                  border: `1px solid ${b.type === 'urgent' ? T.rose : (b.type === 'warning' ? T.gold : T.border)}`,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: T.text, fontSize: '0.88rem' }}>{b.title}</span>
                      <button
                        onClick={() => handleDeleteBroadcast(b.id)}
                        style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer' }}
                        title="Remover comunicado"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: T.textMuted, lineHeight: '1.4' }}>
                      {b.message}
                    </p>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '0.7rem', color: T.textDim, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Disparado em: {b.created_at}</span>
                    <span style={{ color: T.emerald }}>● Exibido a todos os laboratórios</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Tabela de Chamados de Suporte (Ticketing) */}
          <div style={{
            backgroundColor: T.surface,
            borderRadius: '10px',
            border: `1px solid ${T.border}`,
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 700, color: T.text }}>
              Fila de Chamados e Tickets Técnicos
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: T.surfaceElevated, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Laboratório Solicitante</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Assunto & Descrição</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Prioridade</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Responsável</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted }}>Status</th>
                    <th style={{ padding: '10px 14px', color: T.textMuted, textAlign: 'right' }}>Mudar Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: T.text }}>{ticket.tenant_name}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: T.text }}>{ticket.subject}</div>
                        <div style={{ fontSize: '0.74rem', color: T.textDim, marginTop: '2px' }}>{ticket.description}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: ticket.priority === 'ALTA' ? T.roseSubtle : (ticket.priority === 'MEDIA' ? T.goldSubtle : T.skySubtle),
                          color: ticket.priority === 'ALTA' ? T.rose : (ticket.priority === 'MEDIA' ? T.gold : T.sky)
                        }}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: T.textMuted }}>{ticket.assigned_to}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: ticket.status === 'RESOLVIDO' ? T.emeraldSubtle : (ticket.status === 'EM_ANDAMENTO' ? T.goldSubtle : T.surfaceElevated),
                          color: ticket.status === 'RESOLVIDO' ? T.emerald : (ticket.status === 'EM_ANDAMENTO' ? T.gold : T.textMuted)
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
                            backgroundColor: T.surfaceElevated,
                            border: `1px solid ${T.borderLight}`,
                            color: T.text,
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

      {/* ======================================================== */}
      {/* 6. MODAL DO COMMAND MENU GLOBAL (Cmd + K / Ctrl + K)     */}
      {/* ======================================================== */}
      {showCommandMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
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
            border: `1px solid ${T.borderLight}`,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px ${T.goldGlow}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Input do Command Menu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: `1px solid ${T.border}`
            }}>
              <Search size={18} style={{ color: T.gold, marginRight: '12px' }} />
              <input
                autoFocus
                type="text"
                placeholder="Digite para buscar clientes, executar comandos ou navegar..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: T.text,
                  fontSize: '0.95rem'
                }}
              />
              <kbd style={{
                backgroundColor: T.surfaceElevated,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: T.textDim,
                border: `1px solid ${T.borderLight}`
              }}>
                ESC
              </kbd>
            </div>

            {/* Lista de Comandos e Ações */}
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.surfaceElevated}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text }}>
                        {cmd.title}
                      </div>
                      {cmd.subtitle && (
                        <div style={{ fontSize: '0.72rem', color: T.textDim, marginTop: '2px' }}>
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      color: T.gold,
                      backgroundColor: T.goldSubtle,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid rgba(226, 163, 54, 0.2)`
                    }}>
                      {cmd.category}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé do Command Menu */}
            <div style={{
              padding: '10px 16px',
              backgroundColor: T.surfaceElevated,
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: T.textDim
            }}>
              <span>Navegue usando o mouse ou atalhos</span>
              <span><strong>OptiMind</strong> B2B Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL DE DETALHES DE RECURSOS DO TENANT          */}
      {/* ======================================================== */}
      {selectedTenantDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
            border: `1px solid ${T.borderLight}`,
            boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5)`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.surfaceElevated
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
                  Visão de Recursos: {selectedTenantDetails.name}
                </h3>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.gold }}>
                  Slug: {selectedTenantDetails.slug}
                </span>
              </div>
              <button onClick={() => setSelectedTenantDetails(null)} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: T.surfaceElevated, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textMuted }}>Usuários Vinculados</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: T.text, marginTop: '4px' }}>
                    {tenantStats?.users_count || '1'}
                  </div>
                </div>

                <div style={{ backgroundColor: T.surfaceElevated, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textMuted }}>Armazenamento em Nuvem</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: T.gold, marginTop: '4px' }}>
                    {tenantStats?.storage_used_mb || 14.5} MB
                  </div>
                </div>

                <div style={{ backgroundColor: T.surfaceElevated, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textMuted }}>Chamadas de API / Mês</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: T.sky, marginTop: '4px' }}>
                    {tenantStats?.api_calls_month?.toLocaleString('pt-BR') || '4.250'}
                  </div>
                </div>

                <div style={{ backgroundColor: T.surfaceElevated, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '0.74rem', color: T.textMuted }}>Plano de Assinatura</div>
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
                    color: '#000',
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
      {/* MODAL: GESTÃO DE USUÁRIOS DO LABORATÓRIO SELECIONADO      */}
      {/* ======================================================== */}
      {selectedTenantUsers && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
            border: `1px solid ${T.borderLight}`,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.surfaceElevated
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: T.gold }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: T.text }}>
                    Usuários: {selectedTenantUsers.name}
                  </h3>
                  <code style={{ fontSize: '0.72rem', backgroundColor: T.bg, padding: '2px 6px', borderRadius: '4px', color: T.gold, border: `1px solid ${T.border}` }}>
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
                      color: '#000',
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
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textDim, padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {usersError && (
                <div style={{ padding: '10px 14px', backgroundColor: T.roseSubtle, border: `1px solid ${T.rose}`, borderRadius: '6px', color: '#fca5a5', marginBottom: '14px', fontSize: '0.82rem' }}>
                  {usersError}
                </div>
              )}

              {usersSuccess && (
                <div style={{ padding: '10px 14px', backgroundColor: T.emeraldSubtle, border: `1px solid ${T.emerald}`, borderRadius: '6px', color: '#86efac', marginBottom: '14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} /> {usersSuccess}
                </div>
              )}

              {showUserForm ? (
                <form onSubmit={handleSaveUserSubmit} style={{ backgroundColor: T.surfaceElevated, padding: '18px', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: T.text }}>
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
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Leonardo Araújo"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                        Login / E-mail de Acesso *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="leootica ou leo@lab.com"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                        {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        placeholder={editingUser ? 'Digite apenas para alterar' : 'Mínimo 4 caracteres'}
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: T.textMuted }}>
                          Perfil de Acesso / Função (Role) *
                        </label>
                        {roles.length === 0 && (
                          <button
                            type="button"
                            onClick={loadRoles}
                            style={{ fontSize: '0.72rem', color: T.gold, border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Recarregar opções
                          </button>
                        )}
                      </div>
                      <select
                        required
                        value={userFormData.role_id}
                        onChange={(e) => setUserFormData({ ...userFormData, role_id: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: T.textMuted, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={userFormData.is_active}
                        onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: T.gold }}
                      />
                      Usuário Ativo (Pode fazer login no sistema)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: T.textMuted, cursor: 'pointer' }}>
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
                      style={{ padding: '6px 12px', borderRadius: '5px', border: `1px solid ${T.borderLight}`, backgroundColor: T.surface, color: T.textMuted, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingUser}
                      style={{ padding: '6px 16px', borderRadius: '5px', border: 'none', backgroundColor: T.gold, color: '#000', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
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
                    <tr style={{ backgroundColor: T.surfaceElevated, borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: T.textMuted }}>Nome</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: T.textMuted }}>Login / E-mail</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: T.textMuted }}>Perfil / Função</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: T.textMuted }}>Status</th>
                      <th style={{ padding: '8px 14px', fontWeight: 600, color: T.textMuted, textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: T.textMuted }}>
                          <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 4px auto', color: T.gold }} />
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
                          <td style={{ padding: '8px 14px', fontWeight: 600, color: T.text }}>
                            {u.name}
                            {u.is_superadmin && (
                              <span style={{ marginLeft: '6px', fontSize: '0.62rem', backgroundColor: T.goldSubtle, color: T.gold, padding: '1px 5px', borderRadius: '3px', border: `1px solid rgba(226,163,54,0.3)` }}>
                                SuperAdmin
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 14px', color: T.textMuted, fontFamily: 'monospace' }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: u.role?.name === 'Administrador' ? T.goldSubtle : T.surfaceElevated,
                              color: u.role?.name === 'Administrador' ? T.gold : T.sky,
                              border: `1px solid ${u.role?.name === 'Administrador' ? 'rgba(226,163,54,0.3)' : T.border}`
                            }}>
                              {u.role ? u.role.name : 'Sem Perfil'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            {u.is_active ? (
                              <span style={{ color: T.emerald, fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={12} /> Ativo
                              </span>
                            ) : (
                              <span style={{ color: T.rose, fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <XCircle size={12} /> Inativo
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                title="Editar Usuário"
                                style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${T.border}`, backgroundColor: T.surfaceElevated, color: T.textMuted, cursor: 'pointer' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              {!u.is_superadmin && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="Excluir Usuário"
                                  style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${T.border}`, backgroundColor: T.surfaceElevated, color: T.rose, cursor: 'pointer' }}
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
      {/* MODAL: PROVISIONAR NOVO LABORATÓRIO (TENANT)             */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 25px ${T.goldGlow}`,
            border: `1px solid ${T.gold}`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.surfaceElevated
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} style={{ color: T.gold }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: T.text }}>
                  Provisionar Novo Laboratório Óptico (Tenant)
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textDim }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
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
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Identificador Único (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: optica-alpha"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().trim() }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.gold, fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={createForm.cnpj}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(61) 99999-9999"
                    value={createForm.telephone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, telephone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={createForm.plan_tier}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, plan_tier: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="enterprise">Enterprise (R$ 1.950/mês)</option>
                    <option value="pro">Pro (R$ 890/mês)</option>
                    <option value="starter">Starter (R$ 390/mês)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Inscrição Estadual (IE)
                  </label>
                  <input
                    type="text"
                    placeholder="07.123.456/001-00"
                    value={createForm.ie}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ie: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Principal, 1000 - Centro"
                    value={createForm.address}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Administrador Inicial */}
              <div style={{ backgroundColor: T.surfaceElevated, padding: '14px', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '16px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.gold, display: 'block', marginBottom: '8px' }}>
                  Provisionar Usuário Administrador Inicial do Laboratório
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <input
                      type="text"
                      placeholder="Login de Acesso (ex: admin.alpha)"
                      value={createForm.admin_email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_email: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '5px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Senha Inicial de Acesso"
                      value={createForm.admin_password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_password: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '5px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${T.borderLight}`, backgroundColor: T.surfaceElevated, color: T.textMuted, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#000', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Provisionando...' : 'Provisionar Laboratório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR LABORATÓRIO (TENANT)                       */}
      {/* ======================================================== */}
      {editingTenant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
            border: `1px solid ${T.borderLight}`,
            boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5)`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.surfaceElevated
            }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
                Editar: {editingTenant.name}
              </h3>
              <button onClick={() => setEditingTenant(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textDim }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={editingTenant.cnpj || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, cnpj: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editingTenant.telephone || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, telephone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={editingTenant.plan_tier}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan_tier: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
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
                  <label htmlFor="edit_tenant_active" style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, cursor: 'pointer' }}>
                    Laboratório Ativo (Permitir acesso de seus operadores e faturamento)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${T.borderLight}`, backgroundColor: T.surfaceElevated, color: T.textMuted, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#000', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO COMUNICADO GLOBAL (BROADCAST)                 */}
      {/* ======================================================== */}
      {showNewBroadcastModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
            border: `1px solid ${T.gold}`,
            boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px ${T.goldGlow}`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.surfaceElevated
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={16} style={{ color: T.gold }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
                  Disparar Comunicado Global (Broadcast)
                </h3>
              </div>
              <button onClick={() => setShowNewBroadcastModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textDim }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcastSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Título do Comunicado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manutenção Programada dos Servidores"
                  value={newBroadcastForm.title}
                  onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Tipo de Aviso
                </label>
                <select
                  value={newBroadcastForm.type}
                  onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="info">Informativo (Azul)</option>
                  <option value="warning">Atenção / Operacional (Âmbar Ouro)</option>
                  <option value="urgent">Urgente / Crítico (Vermelho)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Mensagem aos Laboratórios *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Escreva o comunicado que será exibido no topo do painel de todos os clientes..."
                  value={newBroadcastForm.message}
                  onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, message: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewBroadcastModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${T.borderLight}`, backgroundColor: T.surfaceElevated, color: T.textMuted, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#000', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Transmitir Comunicado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO TICKET DE SUPORTE                            */}
      {/* ======================================================== */}
      {showNewTicketModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
            border: `1px solid ${T.borderLight}`,
            boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5)`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: T.surfaceElevated
            }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: T.text }}>
                Abrir Novo Chamado de Suporte
              </h3>
              <button onClick={() => setShowNewTicketModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textDim }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Laboratório Solicitante *
                </label>
                <select
                  required
                  value={newTicketForm.tenant_name}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, tenant_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="">-- Selecione o Laboratório --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.slug})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Assunto do Chamado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Divergência de espessura de centro em lente 1.67"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Prioridade (SLA)
                </label>
                <select
                  value={newTicketForm.priority}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="BAIXA">BAIXA (Até 48h)</option>
                  <option value="MEDIA">MÉDIA (Até 24h)</option>
                  <option value="ALTA">ALTA / URGENTE (Até 4h)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, marginBottom: '4px' }}>
                  Descrição Detalhada do Problema *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Descreva o ocorrido com o operador ou integração..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', backgroundColor: T.bg, border: `1px solid ${T.borderLight}`, color: T.text, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${T.borderLight}`, backgroundColor: T.surfaceElevated, color: T.textMuted, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', backgroundColor: T.gold, color: '#000', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
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
