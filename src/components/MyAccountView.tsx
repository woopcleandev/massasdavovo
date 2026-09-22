import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NEIGHBORHOODS } from '../types';
import { 
  User, Lock, Phone, MapPin, Plus, Trash2, LogOut, 
  Home, Briefcase, Tag, Sparkles, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';

export const MyAccountView: React.FC = () => {
  const { 
    currentUser, 
    userProfile, 
    savedAddresses, 
    registerWithWhatsapp, 
    loginWithWhatsapp, 
    logout, 
    updateUserProfile, 
    addSavedAddress, 
    deleteSavedAddress 
  } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form Fields
  const [whatsapp, setWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [name, setName] = useState('');

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
    setWhatsapp('');
    setPin('');
    setConfirmPin('');
    setName('');
    setMessage(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (authMode === 'login') {
        if (!whatsapp || !pin) {
          throw new Error('Preencha seu WhatsApp e o seu PIN de 4 dígitos.');
        }
        await loginWithWhatsapp(whatsapp, pin);
        clearForm();
      } else {
        if (!name.trim()) {
          throw new Error('Informe seu nome completo.');
        }
        if (!whatsapp || !pin) {
          throw new Error('Preencha o WhatsApp e o PIN de 4 dígitos.');
        }
        if (pin.length !== 4) {
          throw new Error('O PIN de segurança deve ter exatamente 4 números.');
        }
        if (pin !== confirmPin) {
          throw new Error('Os PINs digitados não são idênticos.');
        }

        await registerWithWhatsapp(name, whatsapp, pin);
        clearForm();
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro durante a autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!editName.trim()) throw new Error('Nome não pode estar vazio.');
      await updateUserProfile(editName, editWhatsapp);
      setIsEditingProfile(false);
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
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
      <div className="max-w-md mx-auto dark-glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl mt-2 text-white">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-400/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-400/20">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {authMode === 'login' ? 'Entre na sua Conta' : 'Crie sua Conta'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {authMode === 'login' 
              ? 'Acesse para salvar seus endereços e fazer pedidos na sacola mais rápido!' 
              : 'Cadastre-se rapidinho e guarde seus endereços de Casa ou do Trabalho.'}
          </p>
        </div>

        {message && (
          <div className={`mb-5 p-4 rounded-xl border flex gap-2.5 text-xs text-left leading-relaxed ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-300 border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
          {authMode === 'register' && (
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Seu Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Souza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-400/60 outline-none"
                />
              </div>
            </div>
          )}

          {/* WhatsApp Field */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">Seu WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="tel"
                required
                placeholder="Ex: (66) 99652-3006"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-400/60 outline-none"
              />
            </div>
          </div>

          {/* PIN de 4 dígitos */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">PIN de 4 dígitos</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="password"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Ex: 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-400/60 outline-none font-mono text-base tracking-widest"
              />
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Confirmar PIN de 4 dígitos</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Ex: 1234"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-400/60 outline-none font-mono text-base tracking-widest"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl dark-glass-button-gold font-bold py-3.5 px-6 transition-all shadow-md active:scale-98 mt-6 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <span>{authMode === 'login' ? 'Entrar Agora' : 'Criar Conta Grátis'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-gray-400">
            {authMode === 'login' ? 'Não possui uma conta?' : 'Já possui uma conta?'}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setMessage(null);
              }}
              className="text-amber-400 hover:underline font-bold ml-1 cursor-pointer"
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
    <div className="max-w-2xl mx-auto space-y-6 mt-2 text-white">
      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex gap-2.5 text-xs text-left leading-relaxed ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-300 border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Customer profile details panel */}
      <div className="dark-glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-black text-xl shrink-0">
              {userProfile?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-extrabold text-white">{userProfile?.name || 'Cliente da Vovó'}</h2>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-sm px-1.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-400" />
                  <span>VIP</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{currentUser?.email}</p>
              <p className="text-xs text-gray-300 mt-1 font-semibold">📲 WhatsApp: {userProfile?.whatsapp || 'Não informado'}</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!isEditingProfile ? (
              <button
                onClick={startEditProfile}
                className="rounded-xl border border-white/15 hover:bg-white/10 text-gray-200 font-bold text-xs py-2 px-4 transition cursor-pointer"
              >
                Editar Perfil
              </button>
            ) : (
              <button
                onClick={() => setIsEditingProfile(false)}
                className="rounded-xl border border-white/15 hover:bg-white/10 text-gray-200 font-bold text-xs py-2 px-4 transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={logout}
              className="rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold text-xs py-2 px-4 transition flex items-center gap-1.5 border border-red-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Editing Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleProfileUpdate} className="mt-6 pt-6 border-t border-white/10 space-y-4 text-left">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Atualizar Meus Dados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white focus:border-amber-400/60 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">WhatsApp para Contato</label>
                <input
                  type="tel"
                  required
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white focus:border-amber-400/60 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl dark-glass-button-gold text-xs font-bold py-2.5 px-5 transition shadow-xs cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        )}
      </div>

      {/* Saved addresses manager panel */}
      <div className="dark-glass-panel rounded-3xl p-6 border border-white/10 shadow-md text-left">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>Meus Endereços Salvos</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie os locais de entrega para agilizar seu pedido</p>
          </div>
          {!isAddingAddress && (
            <button
              onClick={() => setIsAddingAddress(true)}
              className="rounded-xl dark-glass-button-gold text-xs font-bold py-2.5 px-4 transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          )}
        </div>

        {/* Add Address Form Panel */}
        {isAddingAddress && (
          <form onSubmit={handleAddAddressSubmit} className="dark-glass-card border border-white/10 rounded-2xl p-4 mb-5 space-y-4 animate-fade-in text-left">
            <h4 className="text-xs font-extrabold text-white">Novo Local de Entrega</h4>
            
            <div className="space-y-3">
              {/* Neighborhood selection */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Bairro (Primavera do Leste)</label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 text-white p-2.5 text-xs focus:border-amber-400/60 outline-none"
                >
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.name} value={n.name} className="bg-gray-900 text-white">{n.name}</option>
                  ))}
                </select>
              </div>

              {/* Street & Number */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Av. Porto Alegre"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-2.5 text-xs focus:border-amber-400/60 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">Número</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 203"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-2.5 text-xs focus:border-amber-400/60 outline-none"
                  />
                </div>
              </div>

              {/* Complement */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Complemento (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Apto 302, Bloco B"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-2.5 text-xs focus:border-amber-400/60 outline-none"
                />
              </div>

              {/* Label selector (Casa, Trabalho, Outro) */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">Identificação / Tipo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLabel('casa')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition cursor-pointer ${
                      label === 'casa'
                        ? 'bg-amber-400 text-black border-amber-300 font-extrabold shadow-sm'
                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Casa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabel('trabalho')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition cursor-pointer ${
                      label === 'trabalho'
                        ? 'bg-amber-400 text-black border-amber-300 font-extrabold shadow-sm'
                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Trabalho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabel('outro')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition cursor-pointer ${
                      label === 'outro'
                        ? 'bg-amber-400 text-black border-amber-300 font-extrabold shadow-sm'
                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
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
                className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs py-2 px-4 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl dark-glass-button-gold font-bold text-xs py-2 px-4 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin text-black" />}
                <span>Salvar Local</span>
              </button>
            </div>
          </form>
        )}

        {/* Addresses list */}
        {savedAddresses.length === 0 ? (
          <div className="text-center py-8 dark-glass-card border border-dashed border-white/10 rounded-2xl p-4">
            <span className="text-2xl block mb-2">🏠</span>
            <p className="text-xs text-gray-400 font-medium">Nenhum endereço cadastrado.</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Adicione os locais que você mais pede para facilitar a sua entrega.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map((addr) => (
              <div 
                key={addr.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 dark-glass-card shadow-xs hover:border-amber-400/30 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 shrink-0 border border-amber-400/20">
                    {addr.label === 'casa' && <Home className="w-4 h-4" />}
                    {addr.label === 'trabalho' && <Briefcase className="w-4 h-4" />}
                    {addr.label === 'outro' && <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-white capitalize">{addr.label}</span>
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] text-gray-400 font-bold">{addr.neighborhood}</span>
                    </div>
                    <p className="text-xs text-gray-300 font-semibold mt-0.5 truncate">
                      {addr.street}, Nº {addr.number}
                    </p>
                    {addr.complement && (
                      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Compl: {addr.complement}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 cursor-pointer"
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
