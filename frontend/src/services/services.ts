import type { ServicesResponse } from "../types/appointments";
import { getAuthHeaders } from "../utils/authSession";
import { apiUrl } from "../utils/apiUrl";
import { Stethoscope, Star, Calendar, Heart, CheckCircle2 } from "lucide-react";

export type ServiceItem = {
  id: number;
  name: string;
  type: string;
  typeLabel: string;
  appointmentType: string;
  price: number;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options.headers,
    },
  });

  return response;
}

function getServiceIcon(type: string): { icon: React.ElementType; iconColor: string; iconBg: string } {
  const iconMap: Record<string, { icon: React.ElementType; iconColor: string; iconBg: string }> = {
    MEDICAL:  { icon: Stethoscope,  iconColor: "#0891B2", iconBg: "#ECFEFF" },
    VACCINE:  { icon: Stethoscope,  iconColor: "#0891B2", iconBg: "#ECFEFF" },
    GROOMING:  { icon: Star,         iconColor: "#D97706", iconBg: "#FFFBEB" },
    BOARDING:  { icon: Calendar,     iconColor: "#7C3AED", iconBg: "#F5F3FF" },
    FOOD:      { icon: Heart,        iconColor: "#E11D48", iconBg: "#FFF1F2" },
    OTHER:     { icon: CheckCircle2, iconColor: "#64748B", iconBg: "#F1F5F9" },
  };
  return iconMap[type] || iconMap.OTHER;
}

export const servicesService = {
  async fetchServices(): Promise<ServiceItem[]> {
    console.log("[FRONTEND] fetchServices called");
    const response = await fetchWithAuth("/api/customer/services");
    const data: ServicesResponse = await response.json();

    console.log("[FRONTEND] fetchServices response:", data);

    if (!data.ok) {
      throw new Error(data.message || "Không thể tải danh sách dịch vụ");
    }

    const servicesWithIcons = (data.services || []).map((svc) => {
      const iconInfo = getServiceIcon(svc.appointmentType);
      return {
        id: svc.id,
        name: svc.name,
        type: svc.type,
        typeLabel: svc.typeLabel || svc.type,
        appointmentType: svc.appointmentType,
        price: svc.price,
        description: svc.description,
        icon: iconInfo.icon,
        iconColor: iconInfo.iconColor,
        iconBg: iconInfo.iconBg,
      };
    });

    return servicesWithIcons;
  },
};
