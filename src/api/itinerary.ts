import client from "./client";

export interface DayPlan {
  day: number;
  title: string;
  activities: string[];
  estimated_cost_inr: number;
  estimated_cost_local?: number;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  miscellaneous: number;
  total: number;
}

export interface ItineraryResponse {
  destination: string;
  destination_country?: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate_info?: string;
  exchange_rate_to_inr?: number;
  days: number;
  itinerary: DayPlan[];
  budget_breakdown: BudgetBreakdown;
  packing_list: string[];
  travel_tips: string[];
}


export interface ItineraryRequest {
  destination: string;
  budget: number;
  days: number;
  interests: string[];
}

export const itineraryApi = {
  generate: (data: ItineraryRequest) =>
    client.post<ItineraryResponse>("/trips/generate-itinerary", data),
  exportPdf: (data: ItineraryResponse) =>
    client.post("/trips/export-pdf", data, { responseType: "blob" }),
};

