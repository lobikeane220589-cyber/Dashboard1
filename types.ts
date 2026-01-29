
export enum TimeRange {
  TODAY = 'Сегодня',
  LAST_7 = '7 дней',
  LAST_30 = '30 дней',
  PREV_MONTH = 'Прошлый месяц',
  YEAR = 'Год',
  CUSTOM = 'Свой период'
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
}

export interface Campaign {
  id: string;
  name: string;
  accountId: string;
}

export interface AdMetric {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  leads: number;
  messaging: number; // Новое поле
  revenue: number;
  campaignId: string;
}

export interface CalculatedMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cpl: number;
  messaging: number; // Новое поле
  roas: number;
  conversions: number;
  leads: number;
  revenue: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  fbAccessToken?: string;
}

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}
