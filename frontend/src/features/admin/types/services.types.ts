export type Category = "clinic" | "vaccination" | "grooming" | "boarding";

export interface PriceVariant {
  label: string;
  price: number;
}

export interface Service {
  id: string;
  category: Category;
  name: string;
  description: string;
  duration: number;
  durationUnit: "phút" | "đêm" | "ngày";
  pricingType: "fixed" | "variants";
  basePrice: number;
  variants?: PriceVariant[];
  status: "active" | "inactive";
  bookingsMonth: number;
  revenueMonth: number;
  tag?: string;
}
