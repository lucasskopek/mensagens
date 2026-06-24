'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { AppView, Contact, Schedule, MessageHistory, MessageStyle, User, UserConfig } from '@/lib/types';
import { MESSAGE_STYLES, PRICING_PLANS } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart, MessageCircle, Clock, User as UserIcon, Settings, LogOut, Plus, Trash2, Send,
  Check, X, ChevronRight, Crown, Sparkles, Eye, EyeOff,
  ChevronLeft, Info, Gift, ArrowRight, Phone, Mail, Lock,
  Loader2, HeartHandshake, CheckCircle2, RefreshCw, CreditCard, CalendarDays
} from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function parsePhoneToDigits(value: string): string {
  return value.replace(/\D/g, '');
}

const styleLabels: Record<MessageStyle, string> = {
  romantic: 'Romântica',
  spicy: 'Apimentada',
  playful: 'Brincalhona',
  serious: 'Séria',
};

const styleEmojis: Record<MessageStyle, string> = {
  romantic: '💕',
  spicy: '🔥',
  playful: '😊',
  serious: '🤝',
};

/* ─────────────────── LANDING PAGE ─────────────────── */
function LandingPage() {
  const { setView, setShowPricing, showPricing } = useAppStore();
  const [userName, setUserName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [sendTime, setSendTime] = useState('08:00');
  const [style, setStyle] = useState<MessageStyle>('romantic');
  const [loading, setLoading] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleFreeTest = async () => {
    if (!userName || !contactName || !contactPhone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (parsePhoneToDigits(contactPhone).length < 10) {
      toast.error('Insira um número de WhatsApp válido');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/free-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, contactName, contactPhone, sendTime, style }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedMsg(data.message);
      setShowResult(true);
      toast.success('Mensagem gerada com sucesso! Seu amor vai adorar! ❤️');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-burgundy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-burgundy animate-pulse-heart" fill="#722F37" />
            <span className="text-xl font-bold text-gradient-burgundy">WhatsRomance</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" onClick={() => setView('auth')} className="text-graphite hover:text-burgundy hover:bg-burgundy-50">
              <UserIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>
            <Button
              onClick={() => document.getElementById('free-test')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-burgundy hover:bg-burgundy-dark text-white"
            >
              <Gift className="w-4 h-4 mr-2" />
              Teste Grátis
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-burgundy-50 via-rose-pastel-light to-background" />
          <div className="absolute top-20 left-10 text-burgundy-100 text-6xl opacity-30 animate-float">💕</div>
          <div className="absolute top-40 right-20 text-burgundy-100 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>❤️</div>
          <div className="absolute bottom-20 left-1/4 text-burgundy-100 text-4xl opacity-25 animate-float" style={{ animationDelay: '2s' }}>🌹</div>

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <motion.div variants={stagger} initial="initial" animate="animate">
              <motion.div variants={fadeUp}>
                <Badge className="mb-6 bg-burgundy/10 text-burgundy border-burgundy/20 hover:bg-burgundy/15 px-4 py-1.5 text-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  IA Especialista em Relacionamentos
                </Badge>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-graphite leading-tight mb-6">
                Deixe que nossa IA cuide do{' '}
                <span className="text-gradient-burgundy">romance</span> por você.
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-graphite-muted max-w-2xl mx-auto mb-10">
                Mensagens únicas, automatizadas e personalizadas para o seu amor,{' '}
                <strong className="text-graphite">365 dias por ano.</strong>
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => document.getElementById('free-test')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-burgundy hover:bg-burgundy-dark text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-burgundy/20"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Teste Grátis Agora
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-burgundy/30 text-burgundy hover:bg-burgundy-50 text-lg px-8 py-6 rounded-xl"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Ver Planos
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-graphite-muted">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-burgundy" /> Mensagens 100% únicas</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-burgundy" /> Anti-repetição IA</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-burgundy" /> 4 estilos disponíveis</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-burgundy" /> Agendamento fácil</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Free Test Section */}
        <section id="free-test" className="py-16 sm:py-24">
          <div className="max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-xl border-burgundy/10 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-burgundy to-burgundy-light text-white text-center pb-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                    <Gift className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-2xl">Teste Grátis</CardTitle>
                  <CardDescription className="text-white/80">
                    Veja a mágica acontecer — sem compromisso
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {showResult ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <div className="text-center mb-4">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-lg text-graphite">Mensagem Gerada!</h3>
                        <p className="text-sm text-graphite-muted">Veja como a IA criou algo especial:</p>
                      </div>
                      <div className="bg-rose-pastel-light rounded-lg p-4 border border-burgundy/10">
                        <p className="text-graphite leading-relaxed whitespace-pre-wrap">{generatedMsg}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => { setShowResult(false); setGeneratedMsg(''); }} variant="outline" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" /> Gerar Outra
                        </Button>
                        <Button onClick={() => { setShowPricing(true); setView('landing'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="flex-1 bg-burgundy hover:bg-burgundy-dark text-white">
                          <ArrowRight className="w-4 h-4 mr-2" /> Ver Planos
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="userName">Seu Nome *</Label>
                        <Input id="userName" placeholder="Como você se chama?" value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="contactName">Nome do seu Amor *</Label>
                        <Input id="contactName" placeholder="O nome de quem vai receber" value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="contactPhone">WhatsApp do Destinatário *</Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                          <Input id="contactPhone" placeholder="(11) 99999-9999" value={contactPhone} onChange={(e) => setContactPhone(formatPhone(e.target.value))} className="pl-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sendTime">Horário de Disparo</Label>
                          <div className="relative mt-1.5">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                            <Input id="sendTime" type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="pl-10" />
                          </div>
                        </div>
                        <div>
                          <Label>Tom da Mensagem</Label>
                          <Select value={style} onValueChange={(v) => setStyle(v as MessageStyle)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MESSAGE_STYLES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.emoji} {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        onClick={handleFreeTest}
                        disabled={loading}
                        className="w-full bg-burgundy hover:bg-burgundy-dark text-white py-6 text-lg rounded-xl shadow-lg shadow-burgundy/20"
                      >
                        {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando...</> : <><Send className="w-5 h-5 mr-2" /> Agendar Mensagem Grátis</>}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 sm:py-24 bg-gradient-to-b from-background via-burgundy-50/50 to-background">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-graphite mb-4">
                Escolha o Plano <span className="text-gradient-burgundy">Perfeito</span>
              </h2>
              <p className="text-graphite-muted max-w-xl mx-auto">
                Comece com o teste grátis. Depois, escolha o plano que melhor se adapta à sua relação.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PRICING_PLANS.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`relative h-full flex flex-col ${plan.popular ? 'border-2 border-burgundy shadow-xl shadow-burgundy/10' : 'border-burgundy/10'} hover:shadow-lg transition-shadow`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-burgundy text-white px-3 py-1 shadow-md">
                          <Crown className="w-3 h-3 mr-1" /> Melhor Valor
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-xs">{plan.period}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div>
                        <span className="text-3xl font-bold text-graphite">{plan.totalPrice}</span>
                        {plan.credits > 0 && (
                          <p className="text-sm text-graphite-muted mt-1">{plan.credits} mensagens incluídas</p>
                        )}
                        <p className="text-sm font-medium text-burgundy mt-1">
                          R$ {plan.pricePerMsg.toFixed(2).replace('.', ',')} por mensagem
                        </p>
                      </div>
                      <Separator />
                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-graphite-muted">
                            <Check className="w-4 h-4 text-burgundy mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className={`w-full ${plan.popular ? 'bg-burgundy hover:bg-burgundy-dark text-white' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}
                        onClick={() => setView('auth')}
                      >
                        {plan.id === 'avulso' ? 'Recarregar' : 'Assinar Agora'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-burgundy/10 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-burgundy" fill="#722F37" />
            <span className="font-bold text-gradient-burgundy">WhatsRomance</span>
          </div>
          <p className="text-sm text-graphite-muted">
            &copy; 2025 WhatsRomance. Todos os direitos reservados.
          </p>
          <p className="text-xs text-graphite-muted/60 mt-2">
            Feito com ❤️ para fortalecer relacionamentos
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────── AUTH PAGE ─────────────────── */
function AuthPage() {
  const { setView, setUser, user } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (mode === 'register' && !name) {
      toast.error('Nome é obrigatório para cadastro');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, whatsapp: parsePhoneToDigits(whatsapp) || undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        isDev: data.isDev,
        credits: data.credits,
        createdAt: data.createdAt,
      };
      setUser(userData);

      if (data.isDev) {
        toast.success('Modo Desenvolvedor ativado! Créditos ilimitados. 👑');
        setView('dashboard');
      } else {
        toast.success(`Bem-vindo(a), ${data.name}! 💕`);
        setView('onboarding');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-burgundy-50 via-rose-pastel-light to-background px-4 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="shadow-xl border-burgundy/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center mb-3">
              <Heart className="w-7 h-7 text-burgundy" fill="#722F37" />
            </div>
            <CardTitle className="text-2xl text-gradient-burgundy">WhatsRomance</CardTitle>
            <CardDescription>Entre na sua conta ou crie uma nova</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative mt-1.5">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                    <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>
              {mode === 'register' && (
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                    <Input id="whatsapp" placeholder="(11) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} className="pl-10" />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-muted hover:text-graphite">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-burgundy hover:bg-burgundy-dark text-white py-6">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aguarde...</> : mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="link" onClick={() => setView('landing')} className="text-graphite-muted">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar ao início
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

/* ─────────────────── ONBOARDING PAGE ─────────────────── */
function OnboardingPage() {
  const { user, setView, setConfig } = useAppStore();
  const [loading, setLoading] = useState(false);

  // Z-API credentials
  const [whatsappApiUrl, setWhatsappApiUrl] = useState('https://api.z-api.io');
  const [whatsappApiToken, setWhatsappApiToken] = useState('');
  const [whatsappInstanceName, setWhatsappInstanceName] = useState('');

  const handleSave = async () => {
    if (!user) return;
    if (!whatsappApiToken || !whatsappInstanceName) {
      toast.error('Preencha o Token e o Instance ID');
      return;
    }
    setLoading(true);
    try {
      const configData: UserConfig = {
        whatsappApiUrl: whatsappApiUrl || 'https://api.z-api.io',
        whatsappApiToken,
        whatsappInstanceName,
        setupCompleted: true,
      };
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...configData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfig(configData);
      toast.success('Z-API configurada com sucesso! Mensagens serão enviadas via WhatsApp. 🎉');
      setView('dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!user) return;
    setConfig({ setupCompleted: false });
    toast.info('Configure a Z-API depois em Configurações para enviar mensagens reais.');
    setView('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-burgundy-50 via-background to-rose-pastel-light">
      {/* Header */}
      <header className="glass-burgundy">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-burgundy" fill="#722F37" />
            <span className="font-bold text-gradient-burgundy">WhatsRomance</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-graphite-muted">
            Pular Configuração <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <Card className="shadow-xl border-burgundy/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-600" /></div>
                <div>
                  <CardTitle>Conectar Z-API (WhatsApp)</CardTitle>
                  <CardDescription>Configure seu gateway para enviar mensagens reais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-rose-pastel-light rounded-lg p-4 text-sm text-graphite space-y-2">
                <p className="font-medium text-graphite flex items-center gap-1.5"><Info className="w-4 h-4 text-burgundy" /> Onde encontrar suas credenciais:</p>
                <ol className="list-decimal list-inside space-y-1 text-graphite-muted">
                  <li>Acesse o painel do <strong>Z-API</strong> (<a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="text-burgundy underline hover:text-burgundy-dark">z-api.io</a>).</li>
                  <li>Crie ou selecione uma <strong>Instância</strong> ativa e faça a leitura do QR Code com o seu WhatsApp.</li>
                  <li>Copie a URL completa de envio que fica no formato:<br /><code className="text-xs bg-burgundy/10 px-1.5 py-0.5 rounded break-all">https://api.z-api.io/instances/<strong>{'{INSTANCE_ID}'}</strong>/token/<strong>{'{TOKEN}'}</strong>/send-text</code></li>
                  <li>Cole o <strong>Instance ID</strong> e o <strong>Token</strong> nos campos abaixo.</li>
                </ol>
              </div>
              <div>
                <Label>API URL</Label>
                <Input placeholder="https://api.z-api.io" value={whatsappApiUrl} onChange={(e) => setWhatsappApiUrl(e.target.value)} className="mt-1.5" />
                <p className="text-xs text-graphite-muted mt-1">Padrão: https://api.z-api.io</p>
              </div>
              <div>
                <Label>Instance ID</Label>
                <Input placeholder="3F5217F0ED99C172B0886272DDAD8C6F" value={whatsappInstanceName} onChange={(e) => setWhatsappInstanceName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>API Token</Label>
                <Input placeholder="A5952CF5C5A11E0654F91542" type="password" value={whatsappApiToken} onChange={(e) => setWhatsappApiToken(e.target.value)} className="mt-1.5" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setView('landing')}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
              <Button onClick={handleSave} disabled={loading} className="bg-burgundy hover:bg-burgundy-dark text-white">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Check className="w-4 h-4 mr-2" /> Salvar e Continuar</>}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

/* ─────────────────── DASHBOARD ─────────────────── */
function Dashboard() {
  const { user, isDevMode, logout, setView, setConfig } = useAppStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [history, setHistory] = useState<MessageHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [cRes, sRes, hRes, cfgRes] = await Promise.all([
        fetch(`/api/contacts?userId=${user.id}`),
        fetch(`/api/schedules?userId=${user.id}`),
        fetch(`/api/messages?userId=${user.id}`),
        fetch(`/api/onboarding?userId=${user.id}`),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      const hData = await hRes.json();
      const cfgData = await cfgRes.json();
      setContacts(cData.error ? [] : cData);
      setSchedules(sData.error ? [] : sData);
      setHistory(hData.error ? [] : hData);
      // Sync config from DB (includes Z-API credentials)
      if (cfgData && !cfgData.error && cfgData.setupCompleted) {
        setConfig(cfgData);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user, setConfig]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-burgundy-50/30 to-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-burgundy">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-burgundy" fill="#722F37" />
            <span className="font-bold text-gradient-burgundy hidden sm:inline">WhatsRomance</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isDevMode ? (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 px-3 py-1">
                <Crown className="w-3.5 h-3.5 mr-1" /> Créditos Ilimitados [Modo Dev]
              </Badge>
            ) : (
              <CreditBadge userId={user.id} credits={user.credits} onUpdate={loadData} />
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-graphite-muted hover:text-burgundy">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 sm:py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-burgundy to-burgundy-light text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Olá, {user.name}! {isDevMode ? '👑' : '💕'}</h2>
              <p className="text-white/80 text-sm">Gerencie seus agendamentos e mantenha a chama acesa.</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="schedules">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="schedules" className="text-xs sm:text-sm">
              <CalendarDays className="w-4 h-4 sm:mr-1.5" /> Agendamentos
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <Clock className="w-4 h-4 sm:mr-1.5" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <Settings className="w-4 h-4 sm:mr-1.5" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules">
            {loading ? (
              <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
            ) : (
              <ScheduleTab contacts={contacts} schedules={schedules} userId={user.id} userName={user.name} isDev={user.isDev} onUpdate={loadData} />
            )}
          </TabsContent>

          <TabsContent value="history">
            {loading ? (
              <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
            ) : (
              <HistoryTab history={history} />
            )}
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-burgundy/10 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-burgundy" fill="#722F37" />
            <span className="text-sm font-medium text-gradient-burgundy">WhatsRomance</span>
          </div>
          <p className="text-xs text-graphite-muted">&copy; 2025 WhatsRomance &middot; Feito com ❤️ para fortalecer relacionamentos</p>
        </div>
      </footer>
    </div>
  );
}

/* Credit Badge */
function CreditBadge({ userId, credits, onUpdate }: { userId: string; credits: number; onUpdate: () => void }) {
  const [balance, setBalance] = useState(credits);
  const [showRecharge, setShowRecharge] = useState(false);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const res = await fetch(`/api/credits?userId=${userId}`);
        const data = await res.json();
        if (data.credits !== undefined) setBalance(data.credits);
      } catch { /* ignore */ }
    };
    loadCredits();
  }, [userId]);

  const handleRecharge = async (planId: string) => {
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) return;
    // For avulso, prompt for custom amount
    if (planId === 'avulso') {
      const amountStr = prompt('Quantos créditos deseja comprar? (mín. 10)');
      if (!amountStr) return;
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount < 10) {
        toast.error('Mínimo de 10 créditos');
        return;
      }
      try {
        const res = await fetch('/api/credits/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, amount, planName: `Avulso (${amount} créditos)` }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setBalance(data.credits);
        toast.success(`${amount} créditos adicionados! 🎉`);
        setShowRecharge(false);
        onUpdate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro');
      }
      return;
    }
    if (!plan.credits) return;
    try {
      const res = await fetch('/api/credits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: plan.credits, planName: plan.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBalance(data.credits);
      toast.success(`${plan.credits} créditos adicionados! 🎉`);
      setShowRecharge(false);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const pct = balance > 0 ? Math.min((balance / 365) * 100, 100) : 0;

  return (
    <>
      <Dialog open={showRecharge} onOpenChange={setShowRecharge}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-burgundy border-burgundy/30 hover:bg-burgundy-50">
            <CreditCard className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">{balance} créditos</span>
            <span className="sm:hidden">{balance}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recarregar Créditos</DialogTitle>
            <DialogDescription>Escolha um plano para continuar enviando mensagens</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {PRICING_PLANS.map(p => (
              <Card key={p.id} className={`cursor-pointer transition-all hover:shadow-md ${p.popular ? 'border-2 border-burgundy' : ''}`} onClick={() => handleRecharge(p.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-graphite">{p.name}</p>
                    <p className="text-sm text-graphite-muted">{p.totalPrice} {p.credits > 0 ? `· ${p.credits} mensagens` : '· R$ 0,50/unidade'}</p>
                  </div>
                  <Button size="sm" className="bg-burgundy hover:bg-burgundy-dark text-white">
                    {p.id === 'avulso' ? 'Recarregar' : 'Assinar'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {balance <= 5 && balance > 0 && (
        <Badge variant="destructive" className="text-xs animate-pulse">Baixo!</Badge>
      )}
      {balance === 0 && (
        <Badge variant="destructive" className="text-xs">Zerado!</Badge>
      )}
    </>
  );
}

/* ─── Create Schedule Dialog ─── */
function CreateScheduleDialog({
  contacts, userId, open, onOpenChange, onSuccess
}: {
  contacts: Contact[]; userId: string; open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void;
}) {
  const [contactId, setContactId] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<MessageStyle[]>(['romantic']);
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [newTime, setNewTime] = useState('12:00');
  const [loading, setLoading] = useState(false);

  const toggleStyle = (s: MessageStyle) => {
    setSelectedStyles(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const addTime = () => {
    if (newTime && !times.includes(newTime) && times.length < 5) {
      setTimes([...times, newTime]);
      setNewTime('');
    }
  };
  const removeTime = (t: string) => setTimes(times.filter(x => x !== t));

  const handleCreate = async () => {
    if (!contactId || selectedStyles.length === 0 || times.length === 0) {
      toast.error('Selecione um contato, pelo menos um estilo e um horário');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, contactId, messageStyles: selectedStyles,
          timesPerDay: times.length, sendTimes: times,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Agendamento criado com sucesso! 📅');
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContactId('');
    setSelectedStyles(['romantic']);
    setTimes(['08:00']);
    setNewTime('12:00');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-burgundy" />
            Criar Agendamento
          </DialogTitle>
          <DialogDescription>Configure o envio automático de mensagens para um contato</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Contact Selection */}
          <div>
            <Label className="text-sm font-medium">Contato *</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style Selection */}
          <div>
            <Label className="text-sm font-medium">Estilos de Mensagem * <span className="text-graphite-muted font-normal">(pode marcar mais de um)</span></Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {MESSAGE_STYLES.map(s => (
                <label
                  key={s.value}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedStyles.includes(s.value)
                      ? 'border-burgundy bg-burgundy-50'
                      : 'border-burgundy/10 hover:border-burgundy/30'
                  }`}
                >
                  <Checkbox
                    checked={selectedStyles.includes(s.value)}
                    onCheckedChange={() => toggleStyle(s.value)}
                  />
                  <div>
                    <span className="text-sm font-medium">{s.emoji} {s.label}</span>
                    <p className="text-xs text-graphite-muted">{s.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Times Selection */}
          <div>
            <Label className="text-sm font-medium">
              Horários de Envio *
              <span className="text-graphite-muted font-normal ml-1">({times.length}x ao dia, máx. 5)</span>
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {times.map(t => (
                <Badge key={t} variant="secondary" className="px-3 py-1.5 text-sm gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {t}
                  <button onClick={() => removeTime(t)} className="ml-0.5 hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {times.length < 5 && (
              <div className="flex gap-2 mt-3">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={addTime} disabled={!newTime}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !contactId || selectedStyles.length === 0}
            className="bg-burgundy hover:bg-burgundy-dark text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : <><CalendarDays className="w-4 h-4 mr-2" /> Criar Agendamento</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Schedule Tab */
function ScheduleTab({ contacts, schedules, userId, userName, isDev, onUpdate }: {
  contacts: Contact[]; schedules: Schedule[]; userId: string; userName: string; isDev: boolean; onUpdate: () => void;
}) {
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [scheduleContact, setScheduleContact] = useState<Contact | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [previewMsg, setPreviewMsg] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('romantic');

  const addContact = async () => {
    if (!newContactName || !newContactPhone) { toast.error('Preencha nome e telefone'); return; }
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: newContactName, phone: parsePhoneToDigits(newContactPhone) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Contato adicionado! 💕');
      setNewContactName('');
      setNewContactPhone('');
      setShowAddContact(false);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Contato removido');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const handleGenerate = async (contact: Contact, style: MessageStyle) => {
    setGenLoading(true);
    setSelectedStyle(style);
    try {
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactName: contact.name, senderName: userName, style, userId, contactId: contact.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreviewMsg(data.message);
      toast.success('Mensagem gerada! ✨');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setGenLoading(false);
    }
  };

  const handleSend = async (contact: Contact, message: string) => {
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contact.name, phoneNumber: contact.phone,
          message, style: selectedStyle, userId, contactId: contact.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      setPreviewMsg('');
      setScheduleContact(null);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar');
    }
  };

  const toggleSchedule = async (schedule: Schedule) => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schedule.id, userId, active: !schedule.active }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Agendamento removido');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-graphite">Seus Contatos</h2>
          <p className="text-sm text-graphite-muted">{contacts.length} contato(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          {contacts.length > 0 && (
            <Button onClick={() => setShowCreateSchedule(true)} variant="outline" className="border-burgundy/30 text-burgundy hover:bg-burgundy-50">
              <CalendarDays className="w-4 h-4 mr-2" /> Agendar
            </Button>
          )}
          <Button onClick={() => setShowAddContact(true)} className="bg-burgundy hover:bg-burgundy-dark text-white">
            <Plus className="w-4 h-4 mr-2" /> Novo Contato
          </Button>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
            <DialogDescription>Adicione a pessoa que vai receber mensagens românticas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome do Contato</Label>
              <Input placeholder="Nome do seu amor" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
                <Input placeholder="(11) 99999-9999" value={newContactPhone} onChange={(e) => setNewContactPhone(formatPhone(e.target.value))} className="pl-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancelar</Button>
            <Button onClick={addContact} className="bg-burgundy hover:bg-burgundy-dark text-white">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <CreateScheduleDialog
        contacts={contacts}
        userId={userId}
        open={showCreateSchedule}
        onOpenChange={setShowCreateSchedule}
        onSuccess={onUpdate}
      />

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <Card className="border-dashed border-2 border-burgundy/20">
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 text-burgundy/30 mx-auto mb-3" />
            <p className="text-graphite-muted font-medium">Nenhum contato ainda</p>
            <p className="text-sm text-graphite-muted/70">Adicione seu amor para começar a enviar mensagens</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="border-burgundy/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-burgundy" />
                    </div>
                    <div>
                      <p className="font-semibold text-graphite">{contact.name}</p>
                      <p className="text-sm text-graphite-muted">{contact.phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteContact(contact.id)} className="text-graphite-muted hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-graphite-muted mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Gerar mensagem rápida:</p>
                <div className="flex gap-2">
                  {MESSAGE_STYLES.map((s) => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant="outline"
                      className="text-xs flex-1 hover:bg-burgundy-50 hover:border-burgundy/30 hover:text-burgundy"
                      disabled={genLoading}
                      onClick={() => { setScheduleContact(contact); handleGenerate(contact, s.value); }}
                    >
                      {s.emoji} {s.label}
                    </Button>
                  ))}
                </div>
                {scheduleContact?.id === contact.id && previewMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <div className="bg-rose-pastel-light rounded-lg p-3 border border-burgundy/10 mb-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {styleEmojis[selectedStyle]} {styleLabels[selectedStyle]}
                        </Badge>
                      </div>
                      <p className="text-sm text-graphite whitespace-pre-wrap">{previewMsg}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setGenLoading(true); handleGenerate(contact, selectedStyle).finally(() => setGenLoading(false)); }}>
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${genLoading ? 'animate-spin' : ''}`} /> Regenerar
                      </Button>
                      <Button size="sm" className="flex-1 bg-burgundy hover:bg-burgundy-dark text-white" onClick={() => handleSend(contact, previewMsg)}>
                        <Send className="w-4 h-4 mr-1.5" /> Enviar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active Schedules */}
      {schedules.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-graphite mb-4">Agendamentos Ativos</h3>
          <div className="space-y-3">
            {schedules.map((s) => (
              <Card key={s.id} className={`border-burgundy/10 ${!s.active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-burgundy/10 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4 text-burgundy" />
                        </div>
                        <p className="font-semibold text-graphite truncate">{s.contactName}</p>
                        <div className="flex gap-1 flex-wrap">
                          {s.messageStyles.map((st: string) => (
                            <Badge key={st} variant="secondary" className="text-xs px-1.5 py-0">
                              {styleEmojis[st as MessageStyle] || '💬'} {styleLabels[st as MessageStyle] || st}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-graphite-muted ml-10">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        {s.timesPerDay}x ao dia · {s.sendTimes.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Switch checked={s.active} onCheckedChange={() => toggleSchedule(s)} />
                      <Button variant="ghost" size="sm" onClick={() => deleteSchedule(s.id)} className="text-graphite-muted hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* History Tab */
function HistoryTab({ history }: { history: MessageHistory[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <Card className="border-dashed border-2 border-burgundy/20">
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 text-burgundy/30 mx-auto mb-3" />
          <p className="text-graphite-muted font-medium">Nenhum envio ainda</p>
          <p className="text-sm text-graphite-muted/70">As mensagens enviadas aparecerão aqui</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    sent: { label: 'Enviado', className: 'bg-green-100 text-green-700 border-green-200' },
    delivered: { label: 'Entregue', className: 'bg-teal-100 text-teal-700 border-teal-200' },
    pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    failed: { label: 'Falhou', className: 'bg-red-100 text-red-700 border-red-200' },
  };

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-3">
        {history.map((msg) => {
          const st = statusConfig[msg.status] || statusConfig.pending;
          return (
            <Card key={msg.id} className="border-burgundy/10 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-burgundy/10 flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-burgundy" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-graphite truncate">{msg.contactName}</p>
                      <p className="text-xs text-graphite-muted">{new Date(msg.sentAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs ${st.className}`}>{st.label}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {styleEmojis[msg.style as MessageStyle] || '💬'} {styleLabels[msg.style as MessageStyle] || msg.style}
                    </Badge>
                  </div>
                </div>
                <p
                  className={`text-sm text-graphite-muted leading-relaxed cursor-pointer ${expanded === msg.id ? '' : 'line-clamp-2'}`}
                  onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                >
                  {msg.message}
                </p>
                {expanded === msg.id && (
                  <Button variant="link" size="sm" onClick={() => setExpanded(null)} className="text-burgundy p-0 h-auto mt-1">
                    Mostrar menos
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/* Settings Tab */
function SettingsTab({ userId }: { userId: string }) {
  const { user, config, setConfig } = useAppStore();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    configured: boolean;
    connected?: boolean;
    phone?: string;
    battery?: number;
    pushName?: string;
    error?: string;
  } | null>(null);
  const [showEditConfig, setShowEditConfig] = useState(false);
  const [whatsappApiUrl, setWhatsappApiUrl] = useState(config?.whatsappApiUrl || 'https://api.z-api.io');
  const [whatsappApiToken, setWhatsappApiToken] = useState(config?.whatsappApiToken || '');
  const [whatsappInstanceName, setWhatsappInstanceName] = useState(config?.whatsappInstanceName || '');
  const [saving, setSaving] = useState(false);

  // Sync local state when config loads from DB
  useEffect(() => {
    if (config?.whatsappApiUrl) setWhatsappApiUrl(config.whatsappApiUrl);
    if (config?.whatsappApiToken) setWhatsappApiToken(config.whatsappApiToken);
    if (config?.whatsappInstanceName) setWhatsappInstanceName(config.whatsappInstanceName);
  }, [config]);

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch(`/api/whatsapp/status?userId=${userId}`);
      const data = await res.json();
      setConnectionStatus(data);
      if (data.connected) {
        toast.success(`WhatsApp conectado! Número: ${data.phone} 📱✅`);
      } else if (data.configured === false) {
        toast.error('Z-API não configurada. Preencha as credenciais primeiro.');
      } else {
        toast.error(`Conexão falhou: ${data.error || 'Verifique as credenciais'}`);
      }
    } catch {
      toast.error('Erro ao testar conexão com Z-API');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          whatsappApiUrl: whatsappApiUrl || 'https://api.z-api.io',
          whatsappApiToken,
          whatsappInstanceName,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfig({ whatsappApiUrl, whatsappApiToken, whatsappInstanceName, setupCompleted: true });
      toast.success('Configurações Z-API atualizadas! 🎉');
      setShowEditConfig(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const isZapiConfigured = !!(config?.whatsappApiToken && config?.whatsappInstanceName);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-burgundy/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-graphite">{user?.credits ?? 0}</p>
            <p className="text-xs text-graphite-muted mt-1">Créditos {user?.isDev ? '(∞)' : ''}</p>
          </CardContent>
        </Card>
        <Card className="border-burgundy/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{isZapiConfigured ? '✅' : '⏳'}</p>
            <p className="text-xs text-graphite-muted mt-1">Z-API</p>
          </CardContent>
        </Card>
        <Card className="border-burgundy/10 col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-graphite">{user?.isDev ? '👑' : '👤'}</p>
            <p className="text-xs text-graphite-muted mt-1">{user?.isDev ? 'Admin' : 'Usuário'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Z-API Status Card */}
      <Card className="border-burgundy/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-burgundy" /> Z-API (WhatsApp)</CardTitle>
            <CardDescription>Status da conexão com seu WhatsApp</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testing} className="border-burgundy/30 text-burgundy hover:bg-burgundy-50">
              {testing ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Verificando...</> : <><Send className="w-4 h-4 mr-1.5" /> Testar</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditConfig(true)} className="border-burgundy/30 text-burgundy hover:bg-burgundy-50">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'API URL', value: config?.whatsappApiUrl, icon: MessageCircle },
            { label: 'Instance ID', value: config?.whatsappInstanceName, icon: Phone },
            { label: 'Token', value: config?.whatsappApiToken ? '••••••••••••' : undefined, icon: Lock },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between py-2.5 border-b border-burgundy/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-burgundy/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-burgundy" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-graphite">{f.label}</p>
                  <p className="text-xs text-graphite-muted truncate max-w-[280px]">{f.value || 'Não configurado'}</p>
                </div>
              </div>
              <Badge variant={f.value ? 'default' : 'secondary'} className={f.value ? 'bg-green-100 text-green-700 border-green-200' : ''}>
                {f.value ? 'Ativo' : 'Pendente'}
              </Badge>
            </div>
          ))}

          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border mt-3 ${
                connectionStatus.connected
                  ? 'bg-green-50 border-green-200'
                  : connectionStatus.configured === false
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-semibold text-sm">
                  {connectionStatus.connected ? 'Conectado' : connectionStatus.configured === false ? 'Não Configurado' : 'Desconectado'}
                </span>
              </div>
              {connectionStatus.connected && (
                <div className="text-sm text-graphite-muted space-y-1">
                  <p>📱 Número: <strong>{connectionStatus.phone}</strong></p>
                  {connectionStatus.pushName && <p>👤 Push Name: <strong>{connectionStatus.pushName}</strong></p>}
                  {connectionStatus.battery !== undefined && <p>🔋 Bateria: <strong>{connectionStatus.battery}%</strong></p>}
                </div>
              )}
              {!connectionStatus.connected && connectionStatus.error && (
                <p className="text-sm text-red-600">{connectionStatus.error}</p>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Edit Z-API Config Dialog */}
      <Dialog open={showEditConfig} onOpenChange={setShowEditConfig}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Z-API</DialogTitle>
            <DialogDescription>Atualize suas credenciais do gateway WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-graphite flex items-center gap-1.5 mb-2"><MessageCircle className="w-4 h-4 text-green-600" /> Credenciais Z-API</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">API URL</Label>
                  <Input placeholder="https://api.z-api.io" value={whatsappApiUrl} onChange={(e) => setWhatsappApiUrl(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Instance ID</Label>
                  <Input placeholder="3F5217F0ED99C172B0886272DDAD8C6F" value={whatsappInstanceName} onChange={(e) => setWhatsappInstanceName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">API Token</Label>
                  <Input type="password" placeholder="A5952CF5C5A11E0654F91542" value={whatsappApiToken} onChange={(e) => setWhatsappApiToken(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditConfig(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} disabled={saving} className="bg-burgundy hover:bg-burgundy-dark text-white">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Check className="w-4 h-4 mr-2" /> Salvar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function HomePage() {
  const { currentView, user, setView } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-redirect: if user is logged in but viewing landing/auth, go to dashboard
  useEffect(() => {
    if (mounted && user && (currentView === 'landing' || currentView === 'auth')) {
      setView('dashboard');
    }
  }, [mounted, user, currentView, setView]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Heart className="w-10 h-10 text-burgundy animate-pulse-heart" fill="#722F37" />
          <p className="text-graphite-muted text-sm">Carregando WhatsRomance...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {currentView === 'landing' && (
        <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <LandingPage />
        </motion.div>
      )}
      {currentView === 'auth' && (
        <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <AuthPage />
        </motion.div>
      )}
      {currentView === 'onboarding' && (
        <motion.div key="onboarding" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <OnboardingPage />
        </motion.div>
      )}
      {currentView === 'dashboard' && (
        <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <Dashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}