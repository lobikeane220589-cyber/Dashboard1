
// ПОЛУЧИТЕ ЭТИ ДАННЫЕ В НАСТРОЙКАХ SUPABASE (Settings > API)
const SUPABASE_URL = 'https://your-project-id.supabase.co'; 
const SUPABASE_KEY = 'your-anon-public-key';

export const supabaseService = {
  /**
   * Проверка, настроена ли БД
   */
  isConfigured(): boolean {
    return SUPABASE_URL !== 'https://your-project-id.supabase.co' && SUPABASE_KEY !== 'your-anon-public-key';
  },

  async saveMetrics(metrics: any[]): Promise<void> {
    if (!this.isConfigured()) return;

    const formatted = metrics.map(m => ({
      id: `${m.date}_${m.campaignId}`, 
      date: m.date,
      spend: m.spend,
      clicks: m.clicks,
      impressions: m.impressions,
      leads: m.leads,
      messaging: m.messaging,
      conversions: m.conversions,
      revenue: m.revenue,
      target_id: m.campaignId
    }));

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/ad_insights`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(formatted)
      });
    } catch (err) {
      console.error('Database Sync Error:', err);
    }
  },

  async getStoredMetrics(targetId: string, startDate: string, endDate: string): Promise<any[]> {
    if (!this.isConfigured()) return [];

    try {
      const query = `target_id=eq.${targetId}&date=gte.${startDate}&date=lte.${endDate}`;
      const response = await fetch(`${SUPABASE_URL}/rest/v1/ad_insights?${query}&order=date.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.map((d: any) => ({
          date: d.date,
          spend: d.spend,
          clicks: d.clicks,
          impressions: d.impressions,
          leads: d.leads,
          messaging: d.messaging,
          conversions: d.conversions,
          revenue: d.revenue,
          campaignId: d.target_id
        }));
      }
      return [];
    } catch (err) {
      return [];
    }
  }
};
