// Реестр фраз для новых языков: keys.json — [{ s: русская фраза (ключ словаря), e: English, t: очередь }].
// Номер фразы = её место в списке и больше не меняется: новые фразы дописываются в конец.
// Очередь: 0 — главная и общие надписи, 1 — оценка стоимости и то, что видит гость, 2 — кабинеты заказчика
// и исполнителя, 3 — служебные разделы сотрудников (админка, CRM, аналитика) и юридические тексты.
import fs from 'node:fs';
const en = await import('../../frontend/src/i18n/dict.en.js');
const base = await import('../../frontend/src/i18n/dict.js');
const list = JSON.parse(fs.readFileSync('phrases.json', 'utf8'));
const STAFF = /AdminDashboard|EngineerDashboardPage|AnalystDashboardPage|adminExcelIO|RoleHierarchyTreePage|CrmPage|AdminTeamPanel|DealCardModal|SmartDealCreateModal|data\/legal\.js|__dash_harness|go:crm\.go|go:admin\.go|LeadCreateModal|adminAuditStore|go:finance\.go|go:team\.go|KpiAnalyticsModule|DisputeResolutionModule|go:engineers\.go|engineerData|roleManager|go:defect_samples|go:export/;
const GUEST = /SmartPhotoEstimatePage|smeta\/|go:pkg\/services\/smeta|go:smeta\.go|categoriesData|workCatalog|CategoryTemplatePage|FeaturePageModule|FeatureModuleModal|PhoneDemo|WorkflowDiagramSection|LiveAIScannerDemo|go:auth\.go|ProfileQuestionnaire|RegisterPage|LoginPage|ChangePasswordPage|Header|FooterSection|TestimonialsSection|EstimateExamples|StatsBanner|PriceCatalogSection|PlatformServicesSection|AiAssistantWidget|go:assistant|OnboardingTour|NotFoundPage|VoiceControlWidget|LangSwitch|LegalPage|WorkPicker|ContractorsCatalogPage|MaterialsMarketplacePage|EquipmentMarketplace\b|catalogService/;
const tierOf = (files) => { if (!files || !files.length) return 1; if (files.some((f) => GUEST.test(f))) return 1; if (files.every((f) => STAFF.test(f))) return 3; return 2; };
// ключ словаря → файлы, где фраза встречается (те же преобразования, что в build.mjs)
const filesOf = new Map();
for (const x of list) {
  let src = x.k.replace(/^T:/, '');
  if (x.num) src = src.replace(/\{([a-j])\}/g, (all, c) => (x.num.includes(c) ? '{n}' : all));
  filesOf.set(src, [...(filesOf.get(src) || []), ...(x.files || [])]);
}
const fresh = [];
for (const [s, e] of Object.entries(base.DICT)) if (Array.isArray(e) && e[1]) fresh.push({ s, e: e[1], t: 0, f: '' });
for (const [s, e] of Object.entries(en.EN)) fresh.push({ s, e, t: tierOf(filesOf.get(s)), f: (filesOf.get(s) || ['~extra'])[0] });
for (const [s, e] of en.EN_TEMPLATES) fresh.push({ s, e, t: tierOf(filesOf.get(s)), f: (filesOf.get(s) || ['~extra'])[0] });
const old = fs.existsSync('keys.json') ? JSON.parse(fs.readFileSync('keys.json', 'utf8')) : [];
const have = new Map(old.map((k, i) => [k.s, i]));
const add = [];
const seen = new Set();
for (const k of fresh) {
  if (seen.has(k.s)) continue; seen.add(k.s);
  if (have.has(k.s)) { old[have.get(k.s)].e = k.e; continue; }
  add.push(k);
}
// первый раз — по очередям, внутри очереди фразы одного файла рядом (так перевод получается ровнее)
add.sort((a, b) => a.t - b.t || (a.f < b.f ? -1 : a.f > b.f ? 1 : 0));
const out = [...old, ...add.map(({ s, e, t }) => ({ s, e, t }))];
fs.writeFileSync('keys.json', JSON.stringify(out));
const by = [0, 0, 0, 0]; out.forEach((k) => { by[k.t]++; });
const chars = [0, 0, 0, 0]; out.forEach((k) => { chars[k.t] += k.s.length; });
console.log(`фраз ${out.length} (новых ${add.length}); по очередям: ${by.join(' / ')}; знаков: ${chars.join(' / ')}`);
