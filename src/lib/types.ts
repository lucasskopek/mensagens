export type MessageStyle = 'romantic' | 'spicy' | 'playful' | 'serious';

export interface User {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  isDev: boolean;
  credits: number;
  createdAt: string;
}

export interface UserConfig {
  id?: string;
  setupCompleted: boolean;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  nicknames?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  userId: string;
  contactId: string;
  contactName?: string;
  contactPhone?: string;
  messageStyles: MessageStyle[];
  timesPerDay: number;
  sendTimes: string[];
  recurring: boolean;       // true = 365 dias/ano
  selectedDates: string[];  // specific dates when recurring=false
  active: boolean;
  createdAt: string;
}

export interface MessageHistory {
  id: string;
  userId: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  message: string;
  style: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: string;
  deliveredAt?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  pricePerMsg: number;
  totalPrice: string;
  period: string;
  credits: number;
  features: string[];
  popular?: boolean;
}

export type AppView = 'landing' | 'auth' | 'onboarding' | 'dashboard';

export const MESSAGE_STYLES: { value: MessageStyle; label: string; emoji: string; description: string }[] = [
  { value: 'romantic', label: 'Românticas', emoji: '💕', description: 'Profundas e poéticas' },
  { value: 'spicy', label: 'Apimentadas', emoji: '🔥', description: 'Ousadas e provocantes' },
  { value: 'playful', label: 'Brincalhonas', emoji: '😊', description: 'Divertidas e leves' },
  { value: 'serious', label: 'Sérias', emoji: '🤝', description: 'Gratidão e companheirismo' },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'avulso',
    name: 'Uso Livre',
    pricePerMsg: 0.50,
    totalPrice: 'R$ 0,50/unidade',
    period: 'Recarga Avulsa',
    credits: 0,
    features: ['Compre apenas o que precisar', 'Sem compromisso mensal', 'Válido por 90 dias', 'Múltiplos contatos'],
  },
  {
    id: 'mensal',
    name: 'Mensal',
    pricePerMsg: 0.25,
    totalPrice: 'R$ 7,50/mês',
    period: '30 mensagens/mês',
    credits: 30,
    features: ['30 mensagens por mês', 'R$ 0,25 por mensagem', 'Múltiplos contatos', 'Agendamentos flexíveis', 'Suporte prioritário'],
  },
  {
    id: 'semestral',
    name: 'Semestral',
    pricePerMsg: 0.20,
    totalPrice: 'R$ 36,00/semestre',
    period: '180 mensagens/semestre',
    credits: 180,
    features: ['180 mensagens no semestre', 'R$ 0,20 por mensagem', 'Múltiplos contatos', 'Agendamentos flexíveis', 'Suporte prioritário', 'Estilos exclusivos IA'],
  },
  {
    id: 'anual',
    name: 'Anual',
    pricePerMsg: 0.10,
    totalPrice: 'R$ 36,50/ano',
    period: '365 mensagens/ano',
    credits: 365,
    popular: true,
    features: ['365 mensagens por ano', 'R$ 0,10 por mensagem (melhor valor!)', 'Todos os contatos ilimitados', 'Agendamentos flexíveis', 'Suporte VIP', 'Estilos exclusivos IA', 'Prioridade de envio'],
  },
];

export const DEV_EMAIL = 'lucasskopek@outlook.com.br';
export const DEV_PASSWORD = 'Skopek231165';