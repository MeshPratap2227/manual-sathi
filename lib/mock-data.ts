export type Appliance = {
  id: string;
  brand: string;
  model: string;
  type: string;
  room: string;
  status: string;
  accent: string;
  icon: string;
  issue?: string;
};

export const applianceStorageKey = "manual-sathi-appliances";
export const activeApplianceStorageKey = "manual-sathi-active-appliance";

export const appliances: Appliance[] = [
  { id: "samsung-washer", brand: "Samsung", model: "WW90T534DAW", type: "Washing machine", room: "Utility room", status: "Ready to help", accent: "from-sky-100 to-blue-50", icon: "washer", issue: "Not draining properly" },
  { id: "lg-fridge", brand: "LG", model: "GC-B257JLYL", type: "Refrigerator", room: "Kitchen", status: "Ready to help", accent: "from-slate-100 to-gray-50", icon: "fridge" },
  { id: "xiaomi-air", brand: "Xiaomi", model: "Smart Air Purifier 4", type: "Air purifier", room: "Living room", status: "Ready to help", accent: "from-emerald-100 to-green-50", icon: "air" },
  { id: "huawei-watch", brand: "Huawei", model: "Watch GT 4", type: "Smartwatch", room: "Bedroom", status: "Ready to help", accent: "from-rose-100 to-red-50", icon: "watch" },
];

export const brands = [
  { name: "Samsung", mark: "S", color: "bg-[#142c45]" },
  { name: "LG", mark: "LG", color: "bg-[#a50034]" },
  { name: "Xiaomi", mark: "mi", color: "bg-[#ff6900]" },
  { name: "Huawei", mark: "H", color: "bg-[#c8102e]" },
];

export const suggestedQuestions = [
  "Why is my washing machine not draining?",
  "How do I run a cleaning cycle?",
  "What does error code 5C mean?",
];
