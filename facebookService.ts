
import { AdAccount, Campaign, AdMetric, CustomDateRange } from './types';

declare const FB: any;

export const facebookService = {
  isSDKLoaded(): boolean {
    return typeof FB !== 'undefined';
  },

  async login(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSDKLoaded()) {
        reject('Facebook SDK не загружен. Проверьте блокировщики рекламы или App ID.');
        return;
      }
      
      FB.login((response: any) => {
        if (response.authResponse) {
          resolve(response.authResponse.accessToken);
        } else {
          const errorMsg = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost'
            ? 'Facebook требует HTTPS соединение для входа.'
            : 'Вход отменен. Убедитесь, что ваш домен добавлен в "App Domains" в настройках Meta App.';
          reject(errorMsg);
        }
      }, { scope: 'ads_read,read_insights' });
    });
  },

  getAccessToken(): string | null {
    const userStr = localStorage.getItem('ads_insight_user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.fbAccessToken || null;
    } catch {
      return null;
    }
  },

  async callGraphAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Требуется авторизация.');

    const queryParams = new URLSearchParams({ ...params, access_token: token });
    const response = await fetch(`https://graph.facebook.com/v18.0/${endpoint}?${queryParams.toString()}`);
    const data = await response.json();

    if (data.error) throw data.error;
    return data;
  },

  async getAdAccounts(): Promise<AdAccount[]> {
    const response = await this.callGraphAPI('me/adaccounts', { fields: 'name,account_id,currency' });
    return response.data.map((acc: any) => ({
      id: acc.id,
      name: acc.name || `ID: ${acc.account_id}`,
      currency: acc.currency
    }));
  },

  async getCampaigns(accountId: string): Promise<Campaign[]> {
    const response = await this.callGraphAPI(`${accountId}/campaigns`, { fields: 'name,id', limit: 50 });
    return response.data.map((camp: any) => ({
      id: camp.id,
      name: camp.name,
      accountId: accountId
    }));
  },

  async getInsights(targetId: string, range: CustomDateRange): Promise<AdMetric[]> {
    const params = {
      fields: 'date_start,spend,clicks,impressions,actions,action_values',
      time_range: JSON.stringify({ 'since': range.startDate, 'until': range.endDate }),
      time_increment: 1,
      level: targetId.startsWith('act_') ? 'account' : 'campaign'
    };

    const response = await this.callGraphAPI(`${targetId}/insights`, params);
    return response.data.map((item: any) => {
      const actions = item.actions || [];
      const actionValues = item.action_values || [];
      
      const leads = actions.filter((a: any) => ['lead', 'registration'].includes(a.action_type))
        .reduce((sum: number, a: any) => sum + parseInt(a.value), 0);
      
      const messaging = actions.filter((a: any) => a.action_type.includes('messaging_conversation_started'))
        .reduce((sum: number, a: any) => sum + parseInt(a.value), 0);

      const conversions = parseInt(actions.find((a: any) => a.action_type === 'purchase')?.value || '0');
      const revenue = parseFloat(actionValues.find((a: any) => a.action_type === 'purchase')?.value || '0');

      return {
        date: item.date_start,
        spend: parseFloat(item.spend) || 0,
        clicks: parseInt(item.clicks) || 0,
        impressions: parseInt(item.impressions) || 0,
        leads,
        messaging,
        conversions,
        revenue,
        campaignId: targetId
      };
    });
  }
};
