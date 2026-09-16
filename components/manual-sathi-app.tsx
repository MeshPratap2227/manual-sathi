"use client";

import { useEffect, useMemo, useState } from "react";
import { ApplianceArt } from "@/components/appliance-art";
import { Button, Card, Input } from "@/components/ui";
import { activeApplianceStorageKey, applianceStorageKey, appliances, brands, suggestedQuestions, type Appliance } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, BookOpen, Bot, Check, ChevronRight, CircleHelp, FileText, Headphones,
  Home, Library, Menu, MessageCircle, Mic, MoreHorizontal, Play, Plus, Search, Send, Settings2,
  ShieldCheck, Sparkles, UserRound, Volume2, Wrench, X,
} from "lucide-react";

type View = "home" | "appliance" | "manual" | "chat";

const aiAnswer = "A draining issue is usually caused by a blocked filter or a kinked drain hose. Let’s start with the safest checks from your manual.";

function Logo() {
  return <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white"><BookOpen size={18} strokeWidth={2.5} /></div><span className="text-[17px] font-bold tracking-[-0.03em]">Manual Sathi</span></div>;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function Sidebar({ view, setView, openScan, mobileOpen, close }: { view: View; setView: (v: View) => void; openScan: () => void; mobileOpen: boolean; close: () => void }) {
  const nav = [{ id: "home" as View, label: "Home", icon: Home }, { id: "appliance" as View, label: "My appliances", icon: Library }, { id: "manual" as View, label: "Manual library", icon: FileText }];
  return <aside className={cn("fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-line bg-white px-5 py-6 transition-transform lg:static lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center justify-between lg:block"><Logo /><button onClick={close} className="rounded-lg p-2 text-muted lg:hidden"><X size={19} /></button></div><div className="mt-12 space-y-1">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setView(id); close(); }} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition", view === id ? "bg-blue-50 text-navy" : "text-muted hover:bg-gray-50 hover:text-ink")}><Icon size={18} />{label}</button>)}</div><div className="mt-auto"><div className="rounded-2xl bg-[#f4f7fb] p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-navy"><Sparkles size={17} /></div><p className="text-sm font-semibold">Make any manual useful</p><p className="mt-1 text-xs leading-5 text-muted">Scan a manual and turn it into your own AI assistant.</p><Button size="sm" variant="secondary" className="mt-4 w-full" onClick={openScan}><Plus size={14} /> Add manual</Button></div><div className="mt-5 flex items-center gap-3 border-t border-line pt-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-bold text-navy">AS</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Aarav Sharma</p><p className="text-xs text-muted">Personal workspace</p></div><MoreHorizontal size={18} className="text-muted" /></div></div></aside>;
}

function Header({ onMenu, onSearch }: { onMenu: () => void; onSearch: (v: string) => void }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [configured, setConfigured] = useState(false);
  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data: { configured?: boolean }) => setConfigured(Boolean(data.configured))).catch(() => undefined); }, []);
  const submitAuth = async () => {
    setAuthError("");
    setAuthMessage("");
    if (authMode === "sign-up" && password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    const response = await fetch(authMode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) { setAuthError(data.error ?? "Unable to sign in."); return; }
    if (authMode === "sign-up") {
      setAuthMessage("Account created. Check your email if confirmation is enabled, then sign in.");
      setAuthMode("sign-in");
      setConfirmPassword("");
      return;
    }
    setAuthOpen(false);
  };
  return <><header className="flex h-[76px] items-center justify-between border-b border-line bg-white px-5 sm:px-8 lg:px-10"><button onClick={onMenu} className="mr-3 rounded-lg p-2 text-muted lg:hidden"><Menu size={21} /></button><div className="hidden max-w-md flex-1 lg:block"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input aria-label="Search manuals" onChange={(e) => onSearch(e.target.value)} placeholder="Search appliances, brands or manuals..." className="h-10 w-full rounded-xl bg-paper pl-10 pr-4 text-sm outline-none placeholder:text-[#98a2b3]" /></div></div><div className="flex items-center gap-3 sm:gap-5"><button className="relative rounded-xl p-2 text-muted hover:bg-gray-50"><CircleHelp size={19} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" /></button><div className="hidden h-7 w-px bg-line sm:block" /><button onClick={() => configured && setAuthOpen(true)} className={cn("flex items-center gap-2.5 text-left", configured && "cursor-pointer")}><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-bold text-navy">AS</div><div className="hidden sm:block"><p className="text-sm font-semibold">Aarav Sharma</p><p className="text-xs text-muted">{configured ? "Account" : "Demo workspace"}</p></div></button></div></header>{authOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5"><Card className="w-full max-w-sm p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-navy">Your account</p><h2 className="mt-2 text-2xl font-bold">{authMode === "sign-in" ? "Sign in" : "Create account"}</h2></div><button onClick={() => setAuthOpen(false)} className="rounded-lg p-2 text-muted hover:bg-gray-50"><X size={18} /></button></div><div className="mt-6 space-y-3"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" />{authMode === "sign-up" && <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />}<Button className="w-full" onClick={submitAuth}>{authMode === "sign-in" ? "Sign in" : "Create account"}</Button>{authError && <p role="alert" className="text-xs font-semibold text-red-600">{authError}</p>}{authMessage && <p role="status" className="text-xs font-semibold text-emerald-700">{authMessage}</p>}</div><button onClick={() => { setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in"); setAuthError(""); setAuthMessage(""); }} className="mt-4 w-full text-center text-xs font-semibold text-navy hover:underline">{authMode === "sign-in" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></Card></div>}</>;
}

function HomeView({ openAppliance, openScan, selectAppliance }: { openAppliance: () => void; openScan: () => void; selectAppliance: (id: string) => void }) {
  return <div className="mx-auto max-w-[1250px] space-y-8"><section className="pt-4"><p className="text-sm font-medium text-muted">Tuesday, 16 September 2026</p><h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] sm:text-[38px]">Good morning, Aarav <span aria-hidden>👋</span></h1><p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">What can we help you with today? Pick an appliance to get started.</p></section><div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]"><Card className="relative min-h-[235px] overflow-hidden bg-navy p-7 text-white sm:p-9"><div className="relative z-10 max-w-[420px]"><div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Sparkles size={20} /></div><h2 className="text-[25px] font-bold leading-tight tracking-[-0.03em]">Your manuals,<br />now more helpful.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-blue-100">Get clear, step-by-step answers for setup, maintenance, and troubleshooting.</p><Button onClick={openAppliance} className="mt-6 bg-white text-navy hover:bg-blue-50">Ask Manual Sathi <ArrowRight size={16} /></Button></div><div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" /><div className="absolute -right-4 -bottom-32 h-72 w-72 rounded-full border border-white/10" /><div className="absolute bottom-7 right-12 hidden h-20 w-20 rounded-full border border-white/20 bg-white/5 sm:block" /></Card><Card className="flex min-h-[235px] flex-col justify-between p-6 sm:p-7"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Quick action</p><p className="mt-1 text-sm text-muted">Have a manual with you?</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-navy"><Plus size={19} /></div></div><div><p className="text-[21px] font-bold tracking-[-0.03em]">Scan & understand</p><p className="mt-1 text-sm leading-5 text-muted">Upload pages and create a personal appliance guide.</p><button onClick={openScan} className="mt-4 text-sm font-bold text-navy underline decoration-blue-200 underline-offset-4">Scan a manual <ArrowRight className="ml-1 inline" size={15} /></button></div></Card></div><section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-bold tracking-[-0.03em]">My appliances</h2><p className="mt-1 text-sm text-muted">Your personal appliance library</p></div><button onClick={openAppliance} className="text-sm font-semibold text-navy hover:underline">View all <ArrowRight className="ml-1 inline" size={15} /></button></div><div className="grid gap-4 md:grid-cols-3">{appliances.map((item) =>   <button key={item.id} onClick={() => selectAppliance(item.id)} className="text-left"><Card className="group overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-blue-200"><div className={cn("flex h-[138px] items-center justify-center rounded-xl bg-gradient-to-br", item.accent)}><ApplianceArt kind={item.icon} /></div><div className="mt-4 flex items-start justify-between"><div><p className="text-[15px] font-bold">{item.brand} {item.type}</p><p className="mt-1 text-xs text-muted">{item.model} · {item.room}</p></div><ChevronRight size={17} className="mt-1 text-muted transition group-hover:translate-x-1 group-hover:text-navy" /></div><div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{item.status}</div></Card></button>)}</div></section><section><div className="mb-4"><h2 className="text-xl font-bold tracking-[-0.03em]">Browse by brand</h2><p className="mt-1 text-sm text-muted">Find your appliance manual</p></div><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden">{brands.map((brand) => <button key={brand.name} className="flex min-w-[145px] items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-soft hover:border-blue-200"><span className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white", brand.color)}>{brand.mark}</span><span className="text-sm font-semibold">{brand.name}</span></button>)}</div></section></div>;
}

function ScanDialog({ close, openAppliance }: { close: () => void; openAppliance: (manualId?: string) => void }) {
  const [fileName, setFileName] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File>();
  const [manualId, setManualId] = useState<string>();
  const chooseFile = (file: File | undefined) => {
    setError("");
    if (!file) return;
    const supported = ["application/pdf", "image/jpeg", "image/png"];
    if (!supported.includes(file.type)) {
      setFileName("");
      setError("Please choose a PDF, JPG, or PNG file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileName("");
      setError("That file is larger than 10 MB. Choose a smaller manual.");
      return;
    }
    setFile(file);
    setFileName(file.name);
  };
  const createGuide = async () => {
    if (!file || creating) return;
    setCreating(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/manuals", { method: "POST", body: data });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(payload.error ?? "The manual could not be uploaded.");
      setManualId(payload.id);
      setReady(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The manual could not be uploaded.");
    } finally {
      setCreating(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6"><Card className="w-full max-w-lg rounded-b-none p-6 sm:rounded-2xl sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-navy">{ready ? "Guide ready" : "Create an appliance guide"}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">{ready ? "Your manual is ready to explore" : "Scan your manual"}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted">{ready ? "We created a searchable appliance workspace from your manual. Ask questions or browse the extracted guide." : "Upload a page or PDF and Manual Sathi will turn it into a searchable guide."}</p></div><button onClick={close} className="rounded-lg p-2 text-muted hover:bg-gray-50"><X size={18} /></button></div>{ready ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700"><Check size={19} /></div><div><p className="text-sm font-bold text-emerald-900">{fileName}</p><p className="mt-1 text-xs leading-5 text-emerald-800">Manual indexed · Ready for questions</p></div></div></div> : <><label onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }} className={cn("mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition", dragging ? "border-navy bg-blue-100" : "border-blue-200 bg-blue-50/50 hover:border-navy hover:bg-blue-50")}><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-navy shadow-sm"><FileText size={21} /></div><p className="mt-4 text-sm font-bold">{dragging ? "Drop your manual here" : fileName || "Choose or drop a manual file"}</p><p className="mt-1 text-xs text-muted">PDF, JPG or PNG · up to 10 MB</p><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => chooseFile(e.target.files?.[0])} /></label>{error && <p role="alert" className="mt-3 text-center text-xs font-semibold text-red-600">{error}</p>}</>}<div className="mt-5 flex gap-3"><Button variant="secondary" className="flex-1" onClick={close}>{ready ? "Close" : "Cancel"}</Button><Button className="flex-1" disabled={!fileName || creating} onClick={() => ready ? openAppliance() : createGuide()}>{ready ? <><MessageCircle size={16} /> Open assistant</> : creating ? "Creating guide…" : <><Sparkles size={16} /> Create guide</>}</Button></div><p className="mt-4 text-center text-[11px] text-muted">{ready ? "Prototype mode: extracted content is represented with mock data." : "Prototype mode: upload validation is active; OCR and persistence are next."}</p></Card></div>;
}

function ApplianceView({ appliance, openChat, openManual }: { appliance: Appliance; openChat: () => void; openManual: () => void }) {
  return <div className="mx-auto max-w-[1150px] space-y-6"><button className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> My appliances</button><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-navy">{appliance.brand} · {appliance.type}</p><h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em]">Your appliance assistant</h1><p className="mt-2 text-sm text-muted">Everything you need for your {appliance.brand} {appliance.model}.</p></div><Button onClick={openChat}><MessageCircle size={17} /> Ask Manual Sathi</Button></div><Card className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-7"><div className={cn("flex h-44 flex-1 items-center justify-center rounded-xl bg-gradient-to-br", appliance.accent)}><ApplianceArt kind={appliance.icon} className="scale-125" /></div><div className="flex-[1.2]"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Active appliance</p><h2 className="mt-2 text-2xl font-bold">{appliance.brand} {appliance.model}</h2><p className="mt-1 text-sm text-muted">{appliance.type} · {appliance.room}</p></div><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:block"><Check size={13} className="mr-1 inline" /> Connected</span></div><div className="mt-6 grid grid-cols-3 gap-2"><button onClick={openChat} className="rounded-xl bg-blue-50 p-3 text-left text-xs font-semibold text-navy"><Wrench size={16} className="mb-3" />Troubleshoot</button><button onClick={openManual} className="rounded-xl bg-gray-50 p-3 text-left text-xs font-semibold text-ink"><BookOpen size={16} className="mb-3 text-muted" />View manual</button><button onClick={openChat} className="rounded-xl bg-gray-50 p-3 text-left text-xs font-semibold text-ink"><Settings2 size={16} className="mb-3 text-muted" />Setup guide</button></div></div></Card><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><Card className="p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold">Common questions</h2><p className="mt-1 text-sm text-muted">Quick answers from your manual</p></div><CircleHelp size={18} className="text-muted" /></div><div className="mt-5 space-y-2">{suggestedQuestions.map((q) => <button key={q} onClick={openChat} className="flex w-full items-center justify-between rounded-xl border border-line p-3.5 text-left text-sm font-medium hover:border-blue-200 hover:bg-blue-50/40"><span>{q}</span><ArrowRight size={15} className="text-muted" /></button>)}</div></Card><Card className="p-6"><div className="flex items-center gap-2 text-emerald-700"><ShieldCheck size={18} /><span className="text-sm font-bold">Safety first</span></div><h2 className="mt-4 font-bold">Before you troubleshoot</h2><p className="mt-2 text-sm leading-6 text-muted">Always unplug the appliance before checking internal parts. Manual Sathi only recommends safe, user-serviceable steps.</p><button onClick={openManual} className="mt-4 text-sm font-bold text-navy">Read safety information <ArrowRight className="ml-1 inline" size={15} /></button></Card></div></div>;
}

function ManualView({ appliance, back, askAI }: { appliance: Appliance; back: () => void; askAI: () => void }) {
  const manualText = "Troubleshooting. The washing machine does not drain. If the washing machine does not drain, check the drain hose, clean the debris filter, and check that the standpipe is between 60 and 90 centimeters above the floor. Do not remove the pump filter while a wash cycle is running or when the water is hot.";
  return <div className="mx-auto max-w-[1100px] space-y-6"><div className="flex items-center justify-between"><button onClick={back} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Back to appliance</button><Button variant="secondary" size="sm" onClick={() => speak(manualText)}><Headphones size={15} /> Listen</Button></div><div><p className="text-sm font-semibold text-navy">{appliance.brand} {appliance.model} · User manual</p><h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em]">Troubleshooting guide</h1><p className="mt-2 text-sm text-muted">Page 42 of 68 · Last updated September 2026</p></div><div className="grid gap-5 lg:grid-cols-[1fr_270px]"><Card className="min-h-[520px] p-7 sm:p-12"><div className="mx-auto max-w-2xl"><div className="flex items-center justify-between border-b border-line pb-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-muted">Samsung</p><h2 className="mt-2 text-2xl font-bold">Troubleshooting</h2></div><span className="text-xs text-muted">42</span></div><div className="mt-8"><h3 className="text-lg font-bold">The washing machine does not drain</h3><p className="mt-3 text-sm leading-7 text-muted">If the washing machine does not drain, check the following items in order. Stop the cycle and unplug the appliance before inspecting the filter.</p><div className="mt-7 space-y-4">{["Make sure the drain hose is not kinked or blocked.", "Clean the debris filter at the bottom right of the machine.", "Check that the standpipe is between 60–90 cm above the floor."].map((x, i) => <div className="flex gap-3" key={x}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-navy">{i + 1}</span><p className="text-sm leading-6">{x}</p></div>)}</div><div className="mt-9 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">Important</p><p className="mt-1 text-sm leading-6 text-amber-800">Do not remove the pump filter while a wash cycle is running or when the water is hot.</p></div></div></div></Card><Card className="h-fit p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted">In this section</p><div className="mt-4 space-y-1">{["Safety information", "Error codes", "The washing machine does not drain", "The door does not open"].map((x, i) => <button key={x} className={cn("w-full rounded-lg px-3 py-2.5 text-left text-sm", i === 2 ? "bg-blue-50 font-semibold text-navy" : "text-muted hover:bg-gray-50")}>{x}</button>)}</div><div className="mt-6 border-t border-line pt-5"><p className="text-xs font-bold uppercase tracking-wider text-muted">Need help?</p><Button className="mt-3 w-full" size="sm" onClick={askAI}><Bot size={15} /> Ask AI about this</Button></div></Card></div></div>;
}

type ChatMessage = { role: "user" | "ai"; text: string; steps?: string[]; source?: string };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function ChatView({ appliance, manualId }: { appliance: Appliance; manualId?: string }) {
  const initialQuestion = appliance.id === "lg-fridge"
    ? "My refrigerator is not cooling. What should I check?"
    : appliance.id === "xiaomi-air"
      ? "The air purifier has weak airflow. What should I check?"
      : appliance.id === "huawei-watch"
        ? "My watch is not charging. What should I check?"
      : "My washing machine is not draining. What should I check?";
  const initialAnswer = appliance.id === "lg-fridge"
    ? "If your refrigerator is not cooling, let’s start with the door seal, temperature setting, and ventilation from your manual."
    : appliance.id === "xiaomi-air"
      ? "Weak airflow is usually caused by a clogged filter or blocked inlet. Let’s start with the safest checks from your manual."
      : appliance.id === "huawei-watch"
        ? "If your watch is not charging, let’s start by checking the contacts and charger alignment from your manual."
      : aiAnswer;
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "user", text: initialQuestion },
    {
      role: "ai",
      text: initialAnswer,
      source: appliance.id === "lg-fridge" ? "Troubleshooting · page 28" : appliance.id === "xiaomi-air" ? "Troubleshooting · page 21" : appliance.id === "huawei-watch" ? "Troubleshooting · page 24" : "Troubleshooting · page 42",
      steps: appliance.id === "lg-fridge"
        ? ["Check that the refrigerator has power and the doors are fully closed.", "Set the refrigerator compartment to 3°C and wait several hours.", "Leave space around the vents so cold air can circulate."]
        : appliance.id === "xiaomi-air"
          ? ["Turn off and unplug the purifier.", "Check whether the filter needs replacement.", "Keep at least 20 cm of clearance around the air inlet."]
          : appliance.id === "huawei-watch"
            ? ["Wipe the charging contacts with a dry, soft cloth.", "Align the magnetic charger with the contacts on the watch.", "Try a compatible power adapter and wait for the charging icon."]
          : ["Turn off the machine and unplug it.", "Open the small cover at the bottom right.", "Place a shallow container underneath the filter."],
    },
  ]);
  const send = async () => {
    const message = input.trim();
    if (!message || isSending) return;
    setError("");
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setIsSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, applianceId: appliance.id, manualId }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string; steps?: string[]; sources?: { title: string; page: number }[] };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "The assistant could not respond.");
      setMessages((m) => [...m, { role: "ai", text: payload.answer!, steps: payload.steps, source: payload.sources?.[0] ? `${payload.sources[0].title} · page ${payload.sources[0].page}` : undefined }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant could not respond.");
    } finally {
      setIsSending(false);
    }
  };
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const recognitionConstructor = (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!recognitionConstructor) {
      setError("Voice input is not supported in this browser. You can still type your question.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new recognitionConstructor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setError("We could not hear that. Please try again or type your question.");
    };
    recognition.onend = () => setIsListening(false);
    setError("");
    setIsListening(true);
    recognition.start();
  };
  return <div className="mx-auto flex min-h-[calc(100vh-124px)] max-w-[1050px] flex-col"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-navy"><Bot size={23} /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-navy">Your appliance assistant</p><h1 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Ask Manual Sathi</h1></div></div><div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-muted"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {appliance.brand} {appliance.model}</div></div><Card className="flex flex-1 flex-col overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="text-sm font-bold">Troubleshooting mode</p><p className="mt-0.5 text-xs text-muted">Answers grounded in your appliance manual</p></div><Button variant="ghost" size="icon"><MoreHorizontal size={19} /></Button></div><div className="flex-1 space-y-6 overflow-auto bg-[#fbfcfd] p-5 sm:p-8">{messages.map((message, i) => <div key={i} className={cn("flex max-w-[720px] gap-3", message.role === "user" && "ml-auto flex-row-reverse")}><div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", message.role === "ai" ? "bg-navy text-white" : "bg-blue-100 text-navy")}>{message.role === "ai" ? <Sparkles size={14} /> : <UserRound size={14} />}</div><div className={cn("rounded-2xl px-4 py-3.5 text-sm leading-6", message.role === "ai" ? "rounded-tl-sm border border-line bg-white text-ink" : "rounded-tr-sm bg-navy text-white")}>{message.text}{message.role === "ai" && message.steps && <div className="mt-5 border-t border-line pt-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-navy"><Wrench size={14} /> Recommended next steps</div>{message.steps.map((s, j) => <div key={s} className="mb-2 flex items-start gap-2.5 text-xs text-muted"><span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-navy">{j + 1}</span>{s}</div>)}{message.source && <p className="mt-3 text-[11px] font-medium text-muted"><FileText size={12} className="mr-1 inline" /> Source: {message.source}</p>}<button onClick={() => speak(message.steps?.join(" ") ?? message.text)} className="mt-2 text-xs font-bold text-navy hover:underline"><Volume2 size={13} className="mr-1 inline" /> Listen to steps</button></div>}</div></div>)}{isSending && <div className="flex items-center gap-2 text-xs font-semibold text-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-navy" /> Manual Sathi is thinking…</div>}</div><div className="border-t border-line bg-white p-4"><div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hidden">{suggestedQuestions.slice(1).map((q) => <button key={q} onClick={() => setInput(q)} className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-medium text-muted hover:border-blue-200 hover:text-navy">{q}</button>)}</div><div className="flex items-center gap-2"><button onClick={toggleListening} aria-label={isListening ? "Stop listening" : "Use voice input"} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition", isListening ? "border-red-200 bg-red-50 text-red-600" : "border-line text-muted hover:bg-gray-50")}><Mic size={18} /></button><Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={isListening ? "Listening…" : "Ask anything about your appliance..."} /><Button onClick={send} size="icon" aria-label="Send message" disabled={isSending}><Send size={17} /></Button></div>{error && <p role="alert" className="mt-2 text-center text-xs font-semibold text-red-600">{error}</p>}<p className="mt-2 text-center text-[11px] text-muted">Manual Sathi can make mistakes. Always follow the safety instructions in your manual.</p></div></Card></div>;
}

export default function ManualSathiApp() {
  const [view, setView] = useState<View>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [savedAppliances, setSavedAppliances] = useState<Appliance[]>(appliances);
  const [activeApplianceId, setActiveApplianceId] = useState(appliances[0].id);
  const [uploadedManualId, setUploadedManualId] = useState<string>();
  useEffect(() => {
    const storedAppliances = window.localStorage.getItem(applianceStorageKey);
    const storedActiveId = window.localStorage.getItem(activeApplianceStorageKey);
    if (storedAppliances) {
      try {
        const parsed = JSON.parse(storedAppliances) as Appliance[];
        if (Array.isArray(parsed) && parsed.length > 0) setSavedAppliances(parsed);
      } catch {
        window.localStorage.removeItem(applianceStorageKey);
      }
    }
    if (storedActiveId) setActiveApplianceId(storedActiveId);
  }, []);
  useEffect(() => {
    window.localStorage.setItem(applianceStorageKey, JSON.stringify(savedAppliances));
    window.localStorage.setItem(activeApplianceStorageKey, activeApplianceId);
  }, [savedAppliances, activeApplianceId]);
  const activeAppliance = savedAppliances.find((item) => item.id === activeApplianceId) ?? savedAppliances[0] ?? appliances[0];
  const openAppliance = () => {
    setActiveApplianceId(savedAppliances[0]?.id ?? appliances[0].id);
    setView("appliance");
  };
  const filtered = useMemo(() => savedAppliances.filter((a) => `${a.brand} ${a.type} ${a.model}`.toLowerCase().includes(search.toLowerCase())), [savedAppliances, search]);
  const selectAppliance = (id: string) => {
    setActiveApplianceId(id);
    setView("appliance");
  };
  const currentView = view === "home" ? <HomeView openAppliance={openAppliance} openScan={() => setScanOpen(true)} selectAppliance={selectAppliance} /> : view === "appliance" ? <ApplianceView appliance={activeAppliance} openChat={() => setView("chat")} openManual={() => setView("manual")} /> : view === "manual" ? <ManualView appliance={activeAppliance} back={() => setView("appliance")} askAI={() => setView("chat")} /> : <ChatView appliance={activeAppliance} manualId={uploadedManualId} />;
  return <div className="flex min-h-screen bg-paper"><Sidebar view={view} setView={setView} openScan={() => setScanOpen(true)} mobileOpen={mobileOpen} close={() => setMobileOpen(false)} /><div className="flex min-w-0 flex-1 flex-col"><Header onMenu={() => setMobileOpen(true)} onSearch={setSearch} /><main className="flex-1 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">{search ? <div className="mx-auto max-w-[1250px]"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm text-muted">Search results</p><h1 className="mt-1 text-2xl font-bold">Appliances matching “{search}”</h1></div><Button variant="ghost" onClick={() => setSearch("")}>Clear</Button></div>{filtered.length ? <div className="grid gap-4 md:grid-cols-3">{filtered.map((item) => <button key={item.id} onClick={() => { setSearch(""); selectAppliance(item.id); }} className="text-left"><Card className="p-4"><div className={cn("flex h-32 items-center justify-center rounded-xl bg-gradient-to-br", item.accent)}><ApplianceArt kind={item.icon} /></div><p className="mt-4 font-bold">{item.brand} {item.type}</p><p className="mt-1 text-xs text-muted">{item.model}</p></Card></button>)}</div> : <Card className="p-10 text-center"><Search className="mx-auto text-muted" /><p className="mt-3 font-semibold">No appliances found</p><p className="mt-1 text-sm text-muted">Try a brand, model, or appliance type.</p></Card>}</div> : currentView}</main><div className="h-16 lg:hidden" /><nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-t border-line bg-white px-2 lg:hidden">{[{ id: "home" as View, label: "Home", icon: Home }, { id: "appliance" as View, label: "Appliances", icon: Library }, { id: "manual" as View, label: "Manuals", icon: FileText }, { id: "chat" as View, label: "Ask AI", icon: Bot }].map(({ id, label, icon: Icon }) => <button onClick={() => setView(id)} key={id} className={cn("flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold", view === id ? "text-navy" : "text-muted")}><Icon size={19} />{label}</button>)}</nav>{scanOpen && <ScanDialog close={() => setScanOpen(false)} openAppliance={(manualId) => { setUploadedManualId(manualId); setScanOpen(false); setView("appliance"); }} />}</div></div>;
}
