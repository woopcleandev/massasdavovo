import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NEIGHBORHOODS } from '../types';
import { 
  User, Mail, Lock, Phone, MapPin, Plus, Trash2, LogOut, 
  Home, Briefcase, Tag, Sparkles, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';

export const MyAccountView: React.FC = () => {
  const { 
    currentUser, 
    userProfile, 
    savedAddresses, 
    registerWithEmail, 
    loginWithEmail, 
    logout, 
    updateUserProfile, 
    addSavedAddress, 
    deleteSavedAddress 
  } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Address Form Fields
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0].name);
  const [label, setLabel] = useState<'casa' | 'trabalho' | 'outro'>('casa');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');

  // General States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setWhatsapp('');
    setMessage(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (authMode === 'register') {
        if (!name.trim()) throw new Error("O nome é obrigatório.");
        if (name.length < 2) throw new Error("O nome deve ter pelo menos 2 caracteres.");
        if (!whatsapp.trim()) throw new Error("O WhatsApp de contato é obrigatório.");
        if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
        if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

        await registerWithEmail(email, password, name, whatsapp);
        setMessage({ type: 'success', text: 'Conta criada com sucesso! Boas-vindas!' });
      } else {
        await loginWithEmail(email, password);
        setMessage({ type: 'success', text: 'Login efetuado com sucesso!' });
      }
    } catch (err: any) {
      let friendlyError = err.message || "Erro ao processar solicitação.";
      if (err.code === 'auth/email-already-in-use') friendlyError = "Este e-mail já está cadastrado.";
      if (err.code === 'auth/wrong-password') friendlyError = "Senha incorreta.";
      if (err.code === 'auth/user-not-found') friendlyError = "Nenhuma conta encontrada com este e-mail.";
      if (err.code === 'auth/invalid-email') friendlyError = "E-mail inválido.";
      
      setMessage({ type: 'error', text: friendlyError });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!editName.trim() || editName.length < 2) throw new Error("Nome inválido.");
      if (!editWhatsapp.trim()) throw new Error("WhatsApp é obrigatório.");
      
      await updateUserProfile(editName, editWhatsapp);
      setIsEditingProfile(false);
      setMessage({ type: 'success', text: 'Seus dados foram atualizados!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erro ao atualizar dados." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!street.trim() || street.length < 3) throw new Error("Insira um endereço válido.");
      if (!number.trim()) throw new Error("Insira o número.");
      
      await addSavedAddress({
        street,
        number,
        complement,
        neighborhood,
        label
      });

      // Reset address fields
      setStreet('');
      setNumber('');
      setComplement('');
      setLabel('casa');
      setIsAddingAddress(false);
      setMessage({ type: 'success', text: 'Novo endereço salvo com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erro ao salvar endereço." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este endereço?")) return;
    setLoading(true);
    try {
      await deleteSavedAddress(id);
      setMessage({ type: 'success', text: 'Endereço removido!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: "Erro ao remover endereço." });
    } finally {
      setLoading(false);
    }
  };

  const startEditProfile = () => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditWhatsapp(userProfile.whatsapp);
      setIsEditingProfile(true);
    }
  };

  // 1. GUEST FORM (NOT LOGGED IN)
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-lg mt-2">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#0b1c3f]/10 text-[#0b1c3f] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#0b1c3f]/5">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight">
            {authMode === 'login' ? 'Entre na sua Conta' : 'Crie sua Conta'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {authMode === 'login' 
              ? 'Acesse para salvar seus endereços e fazer pedidos na sacola mais rápido!' 
              : 'Cadastre-se rapidinho e guarde seus endereços de Casa ou do Trabalho.'}
          </p>
        </div>

        {message && (
          <div className={`mb-5 p-4 rounded-xl border flex gap-2.5 text-xs text-left leading-relaxed ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-red-50 text-red-800 border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
          {authMode === 'register' && (
            <>
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Seu Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Souza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp para Contato</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: (66) 99652-3006"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Seu E-mail (Login)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Ex: seu-email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="password"
                required
                placeholder={authMode === 'register' ? 'Mínimo de 6 caracteres' : 'Sua senha secreta'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden"
              />
            </div>
          </div>

          {authMode === 'register' && (
            /* Confirm Password */
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/10 font-bold py-3.5 px-6 transition-all shadow-md active:scale-98 mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#d4af37]" />
            ) : (
              <span>{authMode === 'login' ? 'Entrar Agora' : 'Criar Conta Grátis'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            {authMode === 'login' ? 'Não possui uma conta?' : 'Já possui uma conta?'}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setMessage(null);
              }}
              className="text-[#0b1c3f] hover:underline font-bold ml-1"
            >
              {authMode === 'login' ? 'Cadastre-se aqui' : 'Entre por aqui'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN CUSTOMER DASHBOARD
  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-2">
      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex gap-2.5 text-xs text-left leading-relaxed ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-red-50 text-red-800 border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Customer profile details panel */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-[#0b1c3f]/5 text-[#0b1c3f] border border-[#0b1c3f]/10 flex items-center justify-center font-black text-xl shrink-0">
              {userProfile?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-extrabold text-gray-950">{userProfile?.name || 'Cliente da Vovó'}</h2>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-[#d4af37]/20 text-[#0b1c3f] border border-[#d4af37]/30 rounded-sm px-1.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-[#0b1c3f]" />
                  <span>VIP</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{currentUser?.email}</p>
              <p className="text-xs text-gray-600 mt-1 font-semibold">📲 WhatsApp: {userProfile?.whatsapp || 'Não informado'}</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!isEditingProfile ? (
              <button
                onClick={startEditProfile}
                className="rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2 px-4 transition"
              >
                Editar Perfil
              </button>
            ) : (
              <button
                onClick={() => setIsEditingProfile(false)}
                className="rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2 px-4 transition"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={logout}
              className="rounded-xl bg-red-50 hover:bg-red-100/80 text-red-700 font-bold text-xs py-2 px-4 transition flex items-center gap-1.5 border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Editing Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleProfileUpdate} className="mt-6 pt-6 border-t border-gray-100 space-y-4 text-left">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Atualizar Meus Dados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden bg-gray-50/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">WhatsApp para Contato</label>
                <input
                  type="tel"
                  required
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-[#0b1c3f] focus:border-[#d4af37] outline-hidden bg-gray-50/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/10 text-xs font-bold py-2.5 px-5 transition shadow-xs"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        )}
      </div>

      {/* Saved addresses manager panel */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0b1c3f]" />
              <span>Meus Endereços Salvos</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie os locais de entrega para agilizar seu pedido</p>
          </div>
          {!isAddingAddress && (
            <button
              onClick={() => setIsAddingAddress(true)}
              className="rounded-xl bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/10 text-xs font-bold py-2.5 px-4 transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          )}
        </div>

        {/* Add Address Form Panel */}
        {isAddingAddress && (
          <form onSubmit={handleAddAddressSubmit} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5 space-y-4 animate-fade-in text-left">
            <h4 className="text-xs font-extrabold text-gray-800">Novo Local de Entrega</h4>
            
            <div className="space-y-3">
              {/* Neighborhood selection */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Bairro (Primavera do Leste)</label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs focus:ring-[#0b1c3f] outline-hidden"
                >
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.name} value={n.name}>{n.name}</option>
                  ))}
                </select>
              </div>

              {/* Street & Number */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Av. Porto Alegre"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-[#0b1c3f] outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Número</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 203"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-[#0b1c3f] outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Complement */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Complemento (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Apto 302, Bloco B"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-[#0b1c3f] outline-hidden bg-white"
                />
              </div>

              {/* Label selector (Casa, Trabalho, Outro) */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Identificação / Tipo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLabel('casa')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition ${
                      label === 'casa'
                        ? 'bg-[#0b1c3f] text-[#d4af37] border-[#d4af37]/20 shadow-xs'
                        : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Casa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabel('trabalho')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition ${
                      label === 'trabalho'
                        ? 'bg-[#0b1c3f] text-[#d4af37] border-[#d4af37]/20 shadow-xs'
                        : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Trabalho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabel('outro')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition ${
                      label === 'outro'
                        ? 'bg-[#0b1c3f] text-[#d4af37] border-[#d4af37]/20 shadow-xs'
                        : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Outro</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs py-2 px-4 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#0b1c3f] hover:bg-[#07132c] text-[#d4af37] border border-[#d4af37]/10 font-bold text-xs py-2 px-4 transition flex items-center gap-1.5 shadow-xs"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin text-[#d4af37]" />}
                <span>Salvar Local</span>
              </button>
            </div>
          </form>
        )}

        {/* Addresses list */}
        {savedAddresses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl p-4">
            <span className="text-2xl block mb-2">🏠</span>
            <p className="text-xs text-gray-500 font-medium">Nenhum endereço cadastrado.</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Adicione os locais que você mais pede para facilitar a sua entrega.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map((addr) => (
              <div 
                key={addr.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs hover:border-gray-200 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-[#0b1c3f] shrink-0 border border-gray-100/50">
                    {addr.label === 'casa' && <Home className="w-4 h-4" />}
                    {addr.label === 'trabalho' && <Briefcase className="w-4 h-4" />}
                    {addr.label === 'outro' && <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-gray-900 capitalize">{addr.label}</span>
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gray-300" />
                      <span className="text-[10px] text-gray-500 font-bold">{addr.neighborhood}</span>
                    </div>
                    <p className="text-xs text-gray-700 font-semibold mt-0.5 truncate">
                      {addr.street}, Nº {addr.number}
                    </p>
                    {addr.complement && (
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Compl: {addr.complement}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-2 rounded-xl text-gray-300 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                  title="Remover endereço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
