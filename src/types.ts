export interface ClimateData {
  year: number;
  avg_temp: number;
  peak_bloom_day: number;
  pollinator_peak_day: number;
}

export interface FarmerInput {
  id?: number;
  crop_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  sowing_date: string;
  crop_category: 'pollinator-dependent' | 'self-pollinating';
  created_at?: string;
}

export type Language = 'en' | 'te';

export interface Translation {
  title: string;
  farmerPortal: string;
  analysisPortal: string;
  riskPortal: string;
  mapPortal: string;
  cropName: string;
  location: string;
  sowingDate: string;
  cropCategory: string;
  submit: string;
  pollinatorDependent: string;
  selfPollinating: string;
  tempTrend: string;
  bloomShift: string;
  overlapIndex: string;
  riskScore: string;
  recommendations: string;
  low: string;
  moderate: string;
  high: string;
  languageToggle: string;
  cropPlaceholder: string;
  locationPlaceholder: string;
  analyzing: string;
  whyBloomSync: string;
  whyBloomSyncDesc: string;
  recentSubmissions: string;
  avgTempShift: string;
  bloomWindowShift: string;
  last20Years: string;
  earlierBloom: string;
  currentSeason: string;
  bloomPeak: string;
  pollinatorPeak: string;
  noAnalysisYet: string;
  noAnalysisDesc: string;
  goToFarmerPortal: string;
  riskLegend: string;
  safeZone: string;
  footerDesc: string;
}
