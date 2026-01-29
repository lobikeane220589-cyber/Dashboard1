
import { AdAccount, Campaign, AdMetric, TimeRange } from './types';

export const mockAccounts: AdAccount[] = [
  { id: 'act_1', name: 'Глобальный маркетинг', currency: 'USD' },
  { id: 'act_2', name: 'E-commerce филиал (ЕС)', currency: 'EUR' },
];

export const mockCampaigns: Campaign[] = [
  { id: 'cmp_1', name: 'Летняя распродажа 2024', accountId: 'act_1' },
  { id: 'cmp_2', name: 'Узнаваемость бренда - РФ', accountId: 'act_1' },
  { id: 'cmp_3', name: 'Ретаргетинг (VIP)', accountId: 'act_1' },
  { id: 'cmp_4', name: 'Праздничная коллекция', accountId: 'act_2' },
  { id: 'cmp_5', name: 'Весеннее обновление', accountId: 'act_2' },
];

export const generateMockMetrics = (campaignId: string): AdMetric[] => {
  const metrics: AdMetric[] = [];
  const now = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    const baseSpend = 50 + Math.random() * 200;
    const impressions = Math.floor(baseSpend * 100 + Math.random() * 500);
    const clicks = Math.floor(impressions * (0.005 + Math.random() * 0.025));
    const messaging = Math.floor(clicks * (0.1 + Math.random() * 0.2)); // Начато переписок
    const leads = Math.floor(clicks * (0.05 + Math.random() * 0.15)); 
    const conversions = Math.floor((leads + messaging) * (0.1 + Math.random() * 0.2)); 
    const revenue = conversions * (20 + Math.random() * 100);

    metrics.push({
      date: date.toISOString().split('T')[0],
      spend: parseFloat(baseSpend.toFixed(2)),
      clicks,
      impressions,
      leads,
      messaging,
      conversions,
      revenue: parseFloat(revenue.toFixed(2)),
      campaignId
    });
  }
  
  return metrics.reverse();
};
