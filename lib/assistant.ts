export type KnowledgeEntry = {
  applianceId: string;
  title: string;
  page: number;
  keywords: string[];
  answer: string;
  steps: string[];
};

export const knowledgeBase: KnowledgeEntry[] = [
  {
    applianceId: "samsung-washer",
    title: "Troubleshooting: The washing machine does not drain",
    page: 42,
    keywords: ["drain", "draining", "water", "filter", "hose", "5c"],
    answer: "A draining issue is usually caused by a blocked filter or a kinked drain hose. Let’s start with the safest checks from your manual.",
    steps: [
      "Turn off the machine and unplug it.",
      "Open the small cover at the bottom right.",
      "Place a shallow container underneath the filter.",
    ],
  },
  {
    applianceId: "samsung-washer",
    title: "Maintenance: Run a drum cleaning cycle",
    page: 31,
    keywords: ["clean", "cleaning", "drum", "maintenance", "smell", "cycle"],
    answer: "Run the Drum Clean cycle with an empty drum. The manual recommends doing this regularly to remove residue and keep the washer fresh.",
    steps: [
      "Remove all clothing from the drum.",
      "Press Power, then select Drum Clean.",
      "Press and hold Start until the cycle begins.",
    ],
  },
  {
    applianceId: "samsung-washer",
    title: "Setup: First wash and detergent guidance",
    page: 18,
    keywords: ["setup", "install", "first", "detergent", "wash", "start"],
    answer: "Before the first wash, remove the shipping bolts, level the machine, and run an empty rinse cycle. Use only the recommended amount of HE detergent.",
    steps: [
      "Confirm the shipping bolts have been removed.",
      "Check that the machine is level and connected to the drain.",
      "Run an empty rinse cycle before adding laundry.",
    ],
  },
  {
    applianceId: "lg-fridge",
    title: "Troubleshooting: Refrigerator is not cooling",
    page: 28,
    keywords: ["cool", "cooling", "cold", "warm", "temperature", "fridge"],
    answer: "If the refrigerator is not cooling, confirm that the doors close fully and that the temperature is set correctly. Keep ventilation openings clear.",
    steps: [
      "Check that the refrigerator has power and the doors are fully closed.",
      "Set the refrigerator compartment to 3°C and wait several hours.",
      "Leave space around the vents so cold air can circulate.",
    ],
  },
  {
    applianceId: "lg-fridge",
    title: "Maintenance: Cleaning the refrigerator",
    page: 35,
    keywords: ["clean", "cleaning", "shelf", "odor", "smell", "maintenance"],
    answer: "Clean removable shelves with mild detergent and dry them completely before replacing them. Avoid abrasive cleaners and spraying water directly into the appliance.",
    steps: [
      "Unplug the refrigerator before deep cleaning.",
      "Remove shelves and wash them with mild detergent.",
      "Dry all parts completely before reinstalling them.",
    ],
  },
  {
    applianceId: "xiaomi-air",
    title: "Troubleshooting: Air purifier has weak airflow",
    page: 21,
    keywords: ["airflow", "air flow", "weak", "filter", "purifier", "blocked"],
    answer: "Weak airflow is usually caused by a clogged filter or blocked inlet. Check the filter condition and keep clearance around the purifier.",
    steps: [
      "Turn off and unplug the purifier.",
      "Check whether the filter needs replacement.",
      "Keep at least 20 cm of clearance around the air inlet.",
    ],
  },
  {
    applianceId: "xiaomi-air",
    title: "Maintenance: Replace the air purifier filter",
    page: 30,
    keywords: ["replace", "replacement", "filter", "maintenance", "clean"],
    answer: "Replace the filter when the app indicates it is depleted or when airflow remains weak after cleaning the inlet. Use a compatible replacement filter.",
    steps: [
      "Power off the purifier and open the lower cover.",
      "Remove the used filter by its pull tab.",
      "Insert the replacement filter and close the cover securely.",
    ],
  },
  {
    applianceId: "huawei-watch",
    title: "Troubleshooting: Watch will not charge",
    page: 24,
    keywords: ["charge", "charging", "battery", "power", "watch", "charger"],
    answer: "If the watch will not charge, clean the charging contacts and confirm that the magnetic charger is aligned correctly. Try a different power adapter if needed.",
    steps: [
      "Wipe the charging contacts with a dry, soft cloth.",
      "Align the magnetic charger with the contacts on the watch.",
      "Try a compatible power adapter and wait for the charging icon.",
    ],
  },
  {
    applianceId: "huawei-watch",
    title: "Setup: Pair the watch with your phone",
    page: 12,
    keywords: ["setup", "pair", "pairing", "phone", "connect", "bluetooth"],
    answer: "To pair the watch, install the Huawei Health app, enable Bluetooth, and follow the in-app pairing instructions while keeping the devices nearby.",
    steps: [
      "Install or open the Huawei Health app on your phone.",
      "Enable Bluetooth and keep the watch close to the phone.",
      "Select Add device in the app and confirm the pairing code.",
    ],
  },
];

export function retrieveKnowledge(message: string, applianceId: string) {
  const normalized = message.toLowerCase();
  const entries = knowledgeBase.filter((entry) => entry.applianceId === applianceId);
  if (entries.length === 0) return undefined;
  return entries.sort((a, b) => score(b, normalized) - score(a, normalized))[0] ?? entries[0];
}

export async function answerWithOptionalProvider(message: string, entry: KnowledgeEntry, retrievedContext?: string[]) {
  const endpoint = process.env.MANUAL_SATHI_LLM_API_URL;
  const apiKey = process.env.MANUAL_SATHI_LLM_API_KEY;
  const model = process.env.MANUAL_SATHI_LLM_MODEL ?? "manual-sathi-model";

  if (!endpoint || !apiKey) {
    return { answer: entry.answer, provider: "local" as const };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `Answer only from this manual context. Be concise, safe, and do not invent repair instructions.
Manual section: ${entry.title}, page ${entry.page}
Manual answer: ${entry.answer}
Manual steps: ${entry.steps.join(" | ")}
${retrievedContext?.length ? `Retrieved manual context:
${retrievedContext.join("\n\n")}` : ""}`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Configured assistant provider returned ${response.status}.`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("Configured assistant provider returned an empty answer.");
  return { answer, provider: "configured" as const };
}

function score(entry: KnowledgeEntry, message: string) {
  return entry.keywords.reduce((total, keyword) => total + (message.includes(keyword) ? 1 : 0), 0);
}
