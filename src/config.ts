/**
 * Centralized configuration for the application.
 * No hardcoded strings should exist outside of this file or environment variables.
 */

export const CONFIG = {
  company: {
    name: import.meta.env.VITE_COMPANY_NAME || "SD GHT HEALTH CARE",
    subtitle: import.meta.env.VITE_COMPANY_SUBTITLE || "NIGERIA LTD",
    phone: import.meta.env.VITE_CONTACT_PHONE || "+234 (0) 123 456 789",
    logoUrl: import.meta.env.VITE_LOGO_URL || "", // Add this line
  },
  defaults: {
    distributorId: import.meta.env.VITE_DEFAULT_DISTRIBUTOR_ID || "SD-GHT-MEMBER-001",
  },
  navigation: [
    { id: "products", label: "Products" },
    { id: "recommended", label: "Recommended" },
    { id: "blogs", label: "Health Blog" },
    { id: "consultation", label: "Consultation" },
    { id: "history", label: "My Records" },
    { id: "admin", label: "Admin" },
  ],
};
