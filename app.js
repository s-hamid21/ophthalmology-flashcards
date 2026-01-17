/* Ophthalmology Flashcards (UK Finals)
   - Single page app
   - Stores cards + stats in localStorage
   - Basic spaced repetition-lite using "dueAt" timestamps
*/

const STORAGE_KEY = "ophthal_flashcards_v1";

const $ = (id) => document.getElementById(id);

const els = {
  search: $("search"),
  tagFilter: $("tagFilter"),
  mode: $("mode"),
  statTotal: $("statTotal"),
  statDue: $("statDue"),
  statNew: $("statNew"),

  card: $("card"),
  pillTag: $("pillTag"),
  pillTopic: $("pillTopic"),
  qText: $("qText"),
  aBlock: $("aBlock"),
  aText: $("aText"),
  cuesText: $("cuesText"),
  promptsText: $("promptsText"),

  btnFlip: $("btnFlip"),
  btnNext: $("btnNext"),
  btnShuffle: $("btnShuffle"),
  btnResetStats: $("btnResetStats"),
  btnExport: $("btnExport"),
  fileImport: $("fileImport"),

  newTag: $("newTag"),
  newTopic: $("newTopic"),
  newQ: $("newQ"),
  newA: $("newA"),
  newCues: $("newCues"),
  newPrompts: $("newPrompts"),
  btnAdd: $("btnAdd"),
  btnSeed: $("btnSeed"),
  btnClearAll: $("btnClearAll"),
};

let cards = [];
let queue = [];
let currentIndex = 0;
let showingAnswer = false;

function nowMs(){ return Date.now(); }
function uid(){ return Math.random().toString(16).slice(2) + "-" + Math.random().toString(16).slice(2); }

function starterCards(){
  // Final-year UK medical student level: emergencies, common clinics, neuro-ophth, paeds, basics.
  // Keep phrasing exam-safe; avoid copying proprietary resources verbatim.
  return [
    {
      id: uid(),
      tag: "Red eye",
      topic: "Red flags",
      q: "Red eye: list key red flags that need urgent ophthalmology assessment.",
      a: "- Reduced visual acuity\n- Severe pain and/or photophobia\n- Corneal opacity/defect or fluorescein uptake\n- Abnormal pupil (fixed mid‑dilated, irregular, RAPD)\n- Contact lens wearer with pain\n- Trauma / chemical exposure\n- Severe headache + nausea/vomiting (consider AACG)\n- Immunosuppression or suspected herpetic eye disease",
      cues: "In exams: start with visual acuity + pupils. Pain/photophobia and reduced VA are the big danger signals.",
      prompts: "What bedside tests can you do (VA, pupils, fluorescein)? What is your referral urgency and safety netting?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Red eye",
      topic: "Conjunctivitis",
      q: "How do you distinguish conjunctivitis from sight‑threatening causes of red eye?",
      a: "- Conjunctivitis: normal vision, mild discomfort/grittiness, diffuse redness, discharge, minimal photophobia\n- Consider serious pathology if: reduced VA, significant pain, photophobia, corneal staining, abnormal pupil, ciliary flush, contact lens wearer, trauma/chemical exposure",
      cues: "Photophobia or reduced VA should make you re‑think 'simple conjunctivitis'.",
      prompts: "What advice would you give about contact lenses, hygiene, and return precautions?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Cornea",
      topic: "Keratitis",
      q: "Contact lens wearer with a painful red eye: what diagnosis must you assume until proven otherwise, and why?",
      a: "Assume microbial keratitis (corneal infection/ulcer).\n\nIt can progress rapidly and threaten vision (scarring/perforation). Pseudomonas is a key concern in contact lens wearers.",
      cues: "Treat as keratitis until proven otherwise. Avoid topical steroids unless specialist‑directed.",
      prompts: "What will fluorescein show? What is your immediate management and referral plan?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Glaucoma",
      topic: "Acute angle closure",
      q: "Acute angle‑closure glaucoma: classic symptoms and key signs.",
      a: "- Severe unilateral eye pain + headache\n- Blurred vision/haloes\n- Nausea/vomiting\n- Red eye\n- Mid‑dilated fixed pupil\n- Hazy cornea\n- Raised IOP (if measurable)",
      cues: "Often mislabelled as migraine. Ask about haloes and nausea; examine the pupil.",
      prompts: "What are your immediate actions? What should you avoid prescribing?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Uveitis",
      topic: "Anterior uveitis",
      q: "Anterior uveitis: typical presentation and exam findings.",
      a: "- Pain and photophobia\n- Red eye (often ciliary flush)\n- Blurred vision\n- Small/irregular pupil (posterior synechiae)\n- Cells/flare in anterior chamber (slit lamp)\n- May be associated with autoimmune disease (e.g. HLA‑B27)",
      cues: "Photophobia is a key differentiator from conjunctivitis.",
      prompts: "What differentials cause painful photophobia? When should you consider herpetic disease?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Retina",
      topic: "Retinal detachment",
      q: "Retinal detachment: symptoms and why the 'curtain' description is urgent.",
      a: "- Flashes (photopsia)\n- New floaters\n- 'Curtain/shadow' over vision (field loss)\n- Reduced peripheral vision\n\nUrgent because macular involvement affects prognosis; earlier treatment improves outcomes.",
      cues: "Differentiate from posterior vitreous detachment (PVD). RD often has a field defect/curtain.",
      prompts: "What risk factors (high myopia, trauma, surgery)? What advice while awaiting review?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Retina",
      topic: "Central retinal artery occlusion",
      q: "CRAO: presentation and immediate action.",
      a: "Sudden, painless, unilateral severe visual loss.\n\nImmediate action: treat as an emergency (stroke-equivalent) — urgent same‑day ophthalmology/ED assessment and stroke pathway as per local guidance.",
      cues: "If asked about fundoscopy: pale retina with 'cherry red spot' can be seen (not always).",
      prompts: "What are the key differentials for sudden painless visual loss?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Retina",
      topic: "Central retinal vein occlusion",
      q: "CRVO: typical presentation and fundoscopy description.",
      a: "Painless unilateral visual loss (variable severity).\nFundoscopy classically shows widespread retinal haemorrhages, dilated/tortuous veins, and optic disc swelling ('blood and thunder').",
      cues: "Think vascular risk factors: HTN, diabetes, glaucoma, hyperviscosity.",
      prompts: "What systemic work-up might be considered depending on age/risk factors?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Neuro-ophthalmology",
      topic: "Optic neuritis",
      q: "Optic neuritis: key features and classic association.",
      a: "- Pain on eye movement\n- Subacute unilateral visual loss\n- Reduced colour vision\n- Relative afferent pupillary defect (if unilateral)\n- Often young adult; association with demyelination / multiple sclerosis",
      cues: "Fundus may be normal (retrobulbar neuritis).",
      prompts: "What red flags suggest atypical optic neuritis needing urgent imaging?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Neuro-ophthalmology",
      topic: "Papilloedema",
      q: "Papilloedema: definition and key causes you should mention in exams.",
      a: "Optic disc swelling due to raised intracranial pressure.\n\nKey causes: intracranial mass/haemorrhage, idiopathic intracranial hypertension, venous sinus thrombosis, hydrocephalus, malignant hypertension.",
      cues: "Don't confuse with optic neuritis (pain/colour vision) or pseudopapilloedema (drusen).",
      prompts: "What symptoms suggest raised ICP? What is your immediate management plan?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Pupils",
      topic: "RAPD",
      q: "What is a relative afferent pupillary defect (RAPD) and what does it suggest?",
      a: "An RAPD (Marcus Gunn pupil) is detected with the swinging light test: when light is moved to the affected eye, both pupils dilate relative to the other side.\n\nSuggests an afferent defect: optic nerve disease (e.g. optic neuritis) or severe retinal disease (e.g. large RD/CRAO).",
      cues: "RAPD does NOT occur with isolated media opacity (e.g. cataract) in most exam contexts.",
      prompts: "How would you explain the swinging light test to an examiner?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Trauma",
      topic: "Chemical eye injury",
      q: "Chemical eye injury: immediate management (first steps).",
      a: "- Immediate irrigation (do not delay)\n- Remove contact lenses/particulate matter; evert lids and sweep fornices if needed\n- Check pH and continue irrigation until neutral (per local guidance)\n- Assess visual acuity and perform fluorescein when safe\n- Urgent ophthalmology review",
      cues: "Time-critical: irrigate first, assess later.",
      prompts: "What chemical types are most harmful? What analgesia can help irrigation?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Trauma",
      topic: "Open globe",
      q: "Suspected open globe injury: what are the key features and what must you NOT do?",
      a: "Features: severe pain, reduced vision, irregular/peaked pupil, uveal prolapse, shallow anterior chamber, obvious laceration.\n\nDo NOT: apply pressure, measure IOP, or remove protruding foreign body.\n\nActions: shield the eye, analgesia/antiemetic, urgent ophthalmology.",
      cues: "The priority is to prevent further extrusion of intraocular contents.",
      prompts: "What systemic measures (tetanus, antibiotics) might be considered per local policy?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Paediatrics",
      topic: "Leukocoria",
      q: "Leukocoria in a child: key differentials and urgency.",
      a: "Differentials: retinoblastoma (must not miss), congenital cataract, Coats disease, retinal detachment, persistent fetal vasculature.\n\nUrgency: same‑day/urgent ophthalmology referral because of sight‑ and life‑threatening causes.",
      cues: "In OSCEs, explicitly say retinoblastoma and urgent referral.",
      prompts: "What other associated symptoms might parents report? How would you counsel them?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    },
    {
      id: uid(),
      tag: "Common clinics",
      topic: "Cataract",
      q: "Cataract: classic symptoms and important history points before surgery.",
      a: "Symptoms: gradual painless reduction in vision, glare/haloes, difficulty with night driving, reduced contrast.\n\nPre-op history: anticoagulants, diabetes, alpha‑blockers (e.g. tamsulosin), previous eye surgery/trauma, ability to lie flat, infection risk and consent expectations.",
      cues: "Cataract causes painless, gradual loss (contrast with acute painful/red eye).",
      prompts: "What are common post-op complications you might counsel about?",
      createdAt: nowMs(),
      dueAt: 0,
      lapses: 0,
      ease: 2.3
    }
  ];
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{
      cards = JSON.parse(raw);
    }catch{
      cards = starterCards();
    }
  } else {
    cards = starterCards();
  }
  save();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function normalize(s){
  return (s||"").toLowerCase().trim();
}

function uniqueTags(list){
  const set = new Set();
  list.forEach(c => { if(c.tag) set.add(c.tag); });
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function buildQueue(){
  const q = normalize(els.search.value);
  const tag = els.tagFilter.value;
  const mode = els.mode.value;
  const t = nowMs();

  let filtered = cards.filter(c => {
    const hay = normalize([c.tag,c.topic,c.q,c.a,c.cues,c.prompts].join(" "));
    const matchesQuery = !q || hay.includes(q);
    const matchesTag = !tag || c.tag === tag;
    return matchesQuery && matchesTag;
  });

  // mode filters
  if(mode === "new"){
    filtered = filtered.filter(c => !c.dueAt || c.dueAt === 0);
  } else if(mode === "wrong"){
    filtered = filtered.filter(c => (c.lapses||0) >= 1);
  } else if(mode === "due"){
    filtered = filtered.sort((a,b) => (a.dueAt||0) - (b.dueAt||0));
  }

  // In due mode, prioritize due cards (dueAt <= now), then soonest
  if(mode === "due"){
    const due = filtered.filter(c => (c.dueAt||0) <= t);
    const notDue = filtered.filter(c => (c.dueAt||0) > t);
    filtered = [...due, ...notDue];
  }

  queue = filtered;
  currentIndex = 0;
  showingAnswer = false;
  renderStats();
  renderCard();
}

function renderStats(){
  const t = nowMs();
  els.statTotal.textContent = String(cards.length);
  els.statDue.textContent = String(cards.filter(c => (c.dueAt||0) <= t && (c.dueAt||0) !== 0).length);
  els.statNew.textContent = String(cards.filter(c => !c.dueAt || c.dueAt === 0).length);

  const tags = uniqueTags(cards);
  const current = els.tagFilter.value;

  // rebuild tag dropdown
  els.tagFilter.innerHTML = `<option value="">All tags</option>` +
    tags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("");

  if(tags.includes(current)) els.tagFilter.value = current;
}

function escapeHtml(str){
  return (str||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function formatAsBullets(text){
  return escapeHtml(text).replaceAll("\n", "<br/>");
}

function currentCard(){
  if(queue.length === 0) return null;
  return queue[Math.min(currentIndex, queue.length-1)];
}

function renderCard(){
  const c = currentCard();
  if(!c){
    els.pillTag.textContent = "No matches";
    els.pillTopic.textContent = "—";
    els.qText.textContent = "No cards found for your filters.";
    els.aBlock.classList.add("hidden");
    els.btnFlip.disabled = true;
    els.btnNext.disabled = true;
    return;
  }

  els.btnFlip.disabled = false;
  els.btnNext.disabled = false;

  els.pillTag.textContent = c.tag || "Untagged";
  els.pillTopic.textContent = c.topic || "Ophthalmology";
  els.qText.textContent = c.q || "(No question)";

  els.aText.innerHTML = formatAsBullets(c.a || "(No answer)");
  els.cuesText.innerHTML = formatAsBullets(c.cues || "—");
  els.promptsText.innerHTML = formatAsBullets(c.prompts || "—");

  if(showingAnswer){
    els.aBlock.classList.remove("hidden");
    els.btnFlip.textContent = "Hide (Space)";
  } else {
    els.aBlock.classList.add("hidden");
    els.btnFlip.textContent = "Flip (Space)";
  }
}

function flip(){
  showingAnswer = !showingAnswer;
  renderCard();
}

function next(){
  if(queue.length === 0) return;
  currentIndex = (currentIndex + 1) % queue.length;
  showingAnswer = false;
  renderCard();
}

function shuffleQueue(){
  for(let i=queue.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  currentIndex = 0;
  showingAnswer = false;
  renderCard();
}

function gradeCard(grade){
  const c = currentCard();
  if(!c) return;

  const t = nowMs();
  const mins = 60 * 1000;
  const day = 24 * 60 * mins;

  let delta = 0;
  if(grade === "again"){
    delta = 5 * mins;
    c.lapses = (c.lapses||0) + 1;
    c.ease = Math.max(1.3, (c.ease||2.3) - 0.2);
  } else if(grade === "hard"){
    delta = 1 * day;
    c.ease = Math.max(1.3, (c.ease||2.3) - 0.05);
  } else if(grade === "good"){
    delta = 3 * day;
    c.ease = (c.ease||2.3) + 0.05;
  } else if(grade === "easy"){
    delta = 7 * day;
    c.ease = (c.ease||2.3) + 0.15;
  }

  const scale = (c.ease || 2.3) / 2.3;
  c.dueAt = t + Math.round(delta * scale);

  save();
  renderStats();
  next();
}

function addCard(){
  const tag = (els.newTag.value || "").trim() || "General";
  const topic = (els.newTopic.value || "").trim();
  const q = (els.newQ.value || "").trim();
  const a = (els.newA.value || "").trim();

  if(!q || !a){
    alert("Please add at least a Question and an Answer.");
    return;
  }

  const card = {
    id: uid(),
    tag,
    topic,
    q,
    a,
    cues: (els.newCues.value || "").trim(),
    prompts: (els.newPrompts.value || "").trim(),
    createdAt: nowMs(),
    dueAt: 0,
    lapses: 0,
    ease: 2.3
  };

  cards.unshift(card);
  save();

  els.newQ.value = "";
  els.newA.value = "";
  els.newCues.value = "";
  els.newPrompts.value = "";

  renderStats();
  buildQueue();
  alert("Added ✅");
}

function resetStats(){
  if(!confirm("Reset learning stats (due dates, lapses, ease) for all cards?")) return;
  cards = cards.map(c => ({...c, dueAt: 0, lapses: 0, ease: 2.3}));
  save();
  renderStats();
  buildQueue();
}

function exportJson(){
  const blob = new Blob([JSON.stringify(cards, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ophthal_flashcards_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJson(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const imported = JSON.parse(reader.result);
      if(!Array.isArray(imported)) throw new Error("Invalid JSON format (expected array).");
      const byId = new Map(cards.map(c => [c.id, c]));
      for(const c of imported){
        if(!c || typeof c !== "object") continue;
        const id = c.id || uid();
        byId.set(id, {
          id,
          tag: (c.tag||"General"),
          topic: (c.topic||""),
          q: (c.q||"").trim(),
          a: (c.a||"").trim(),
          cues: (c.cues||""),
          prompts: (c.prompts||""),
          createdAt: c.createdAt || nowMs(),
          dueAt: c.dueAt || 0,
          lapses: c.lapses || 0,
          ease: c.ease || 2.3
        });
      }
      cards = Array.from(byId.values());
      save();
      renderStats();
      buildQueue();
      alert("Imported ✅");
    }catch(e){
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function restoreSeed(){
  if(!confirm("Restore starter set? This will overwrite your current cards in this browser.")) return;
  cards = starterCards();
  save();
  renderStats();
  buildQueue();
}

function clearAll(){
  if(!confirm("Delete ALL cards from this browser? This cannot be undone.")) return;
  cards = [];
  save();
  renderStats();
  buildQueue();
}

function wire(){
  els.search.addEventListener("input", buildQueue);
  els.tagFilter.addEventListener("change", buildQueue);
  els.mode.addEventListener("change", buildQueue);

  els.btnFlip.addEventListener("click", flip);
  els.btnNext.addEventListener("click", next);
  els.btnShuffle.addEventListener("click", () => { buildQueue(); shuffleQueue(); });

  els.btnAdd.addEventListener("click", addCard);
  els.btnResetStats.addEventListener("click", resetStats);
  els.btnExport.addEventListener("click", exportJson);
  els.fileImport.addEventListener("change", (e) => {
    if(e.target.files && e.target.files[0]) importJson(e.target.files[0]);
    e.target.value = "";
  });

  els.btnSeed.addEventListener("click", restoreSeed);
  els.btnClearAll.addEventListener("click", clearAll);

  document.addEventListener("keydown", (e) => {
    if(e.target && ["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;

    if(e.code === "Space"){
      e.preventDefault();
      flip();
    } else if(e.key.toLowerCase() === "n"){
      next();
    } else if(["1","2","3","4"].includes(e.key)){
      const map = { "1":"again", "2":"hard", "3":"good", "4":"easy" };
      gradeCard(map[e.key]);
    }
  });

  document.querySelectorAll(".rate").forEach(btn => {
    btn.addEventListener("click", () => gradeCard(btn.dataset.grade));
  });

  els.card.addEventListener("click", (e) => {
    if(e.target.closest("button") || e.target.closest("label")) return;
    flip();
  });
}

(function init(){
  load();
  wire();
  renderStats();
  buildQueue();
})();
