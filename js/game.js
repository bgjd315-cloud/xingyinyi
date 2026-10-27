/* 形音義抓寶：單機版。進度存在 localStorage，題庫來自 data/bank.json。 */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = "xyy-public-v1";
  const RUN_LEN = 10;

  let TIERS = {
    小題: { cls: "r1", name: "墨靈", label: "墨靈・語練改編小題", coin: 10, power: 1, weight: 55 },
    語練: { cls: "r2", name: "玉靈", label: "玉靈・語練改編題", coin: 30, power: 3, weight: 22 },
    模考: { cls: "r3", name: "金靈", label: "金靈・大考改編題", coin: 60, power: 6, weight: 14 },
    大考: { cls: "r4", name: "朱印神靈", label: "朱印神靈・學測指考", coin: 120, power: 12, weight: 9 },
  };
  const RANKS = [
    [0, "書僮"], [30, "童生"], [100, "秀才"], [250, "舉人"], [500, "貢士"],
    [900, "進士"], [1500, "探花"], [2200, "榜眼"], [3000, "狀元"],
  ];
  // 主角形象：assets/hero/rank0.webp（書僮）… rank8.webp（狀元），缺圖時自動隱藏
  const heroImg = (i, cls) => `<img class="${cls}" src="assets/hero/rank${i}.webp" alt="${RANKS[i][1]}的模樣" onerror="this.remove()">`;
  // 升級劇情：序章＋每個身分一章。go＝這一章帶玩家去的獵場；gift＝升上這個身分時的賀禮（只發一次）
  const PROLOGUE = {
    title: "序章．墨池裂了", scene: "墨苑藏書閣・深夜", go: "音",
    story: [
      "墨苑藏書閣裡有一方千年墨池，池底沉睡著幾千隻字靈。每個字的讀音、字形、字義，都在那裡安安穩穩。",
      "一個沒有月亮的夜晚，「白字老妖」潛進藏書閣。牠專吃念錯的音、寫錯的字、弄混的意思，吃得越多長得越大。牠一爪劃破封印，字靈驚慌四散，躲進了林中、山上、海裡和神殿。",
      "守池的老塾師墨翁把一支筆交給你：「書僮，字靈不是壞東西，只是迷了路。答對牠們的題目，就能把牠們收回來。收得越多，你的學問越深，身分也會一路往上走。」",
    ],
    note: ["白字", "寫錯或念錯的字叫「白字」。例如「破綻」的「綻」讀ㄓㄢˋ，念成ㄉㄧㄥˋ就是白字。"],
    gift: "墨翁給你三面照妖鏡、一張定身符。第一站：字音林。",
  };
  const RANK_STORY = [
    null,
    { title: "第一章．縣試過關", scene: "縣試・字音林", go: "形",
      story: ["墨翁帶你走進字音林。林裡的字靈被白字老妖念歪了音：多音字分不清該念哪一個，同偏旁的字被帶著跑。",
        "你一隻隻辨清讀音，縣試、府試接連過關。從今天起，你不再只是捧書的僮子，而是正式應考的「童生」。",
        "墨翁提醒你：「白字老妖最愛『有邊讀邊』。看到熟悉的偏旁，先別急著念。」"],
      note: ["應試", "「應」在這裡讀ㄧㄥˋ，是參加、接受的意思，如應試、應考、應聘。"],
      gift: { coins: 50, mirror: 2 } },
    { title: "第二章．入泮為生員", scene: "院試・字形山", go: "義",
      story: ["字形山上，白字老妖把字靈的筆畫揉亂了：形近字擠成一團，同音字互相冒名頂替。",
        "你把它們一一扶正，院試答卷工整得像碑帖。你戴上方巾、穿上藍衫，走過學宮前的泮池，成了「秀才」。"],
      note: ["入泮", "「泮」讀ㄆㄢˋ。古代學宮前有半月形水池叫泮池，考上秀才進入官學，就稱「入泮」。"],
      gift: { coins: 100, charm: 1 } },
    { title: "第三章．秋闈中式", scene: "鄉試・字義海", go: "殿",
      story: ["八月秋闈，你在貢院小小的號舍裡寫了九天。夜裡傳來字義海的浪聲：同一個字放進不同句子，意思就跟著變，白字老妖趁機把它們攪混。",
        "你分清了一字多義、古今異義。桂花開時放榜，你中了「舉人」，報喜的差役敲鑼到家門口。"],
      note: ["解元", "鄉試又叫「秋闈」，「闈」讀ㄨㄟˊ，指考場。鄉試第一名稱「解元」，「解」讀ㄐㄧㄝˋ。"],
      gift: { coins: 200, mirror: 3 } },
    { title: "第四章．春闈會試", scene: "會試・大考神殿", go: "亂",
      story: ["你帶著書箱進京。京城的大考神殿裡，歷屆學測、指考的考題化成了金靈與朱印神靈，連白字老妖都不敢靠近。",
        "你在神殿裡收服了真正的考題，會試榜上有名，成了「貢士」，取得進宮殿試的資格。"],
      note: ["會元", "會試在春天舉行，又叫「春闈」；會試第一名稱「會元」。「會試」的「會」讀ㄏㄨㄟˋ。"],
      gift: { coins: 300, mirror: 2, charm: 1 } },
    { title: "第五章．金殿傳臚", scene: "殿試・百字亂流", go: "逃",
      story: ["殿試前夜，白字老妖終於現身。牠把字音、字形、字義全攪在一起，掀起百字亂流，想讓你在金殿上出錯。",
        "你沉住氣，一題一題拆開來看。隔天唱名的聲音傳過一重又一重宮門：金榜題名，你成了「進士」。"],
      note: ["傳臚", "殿試後唱名公布名次叫「傳臚」，「臚」讀ㄌㄨˊ，有陳述、傳告的意思。"],
      gift: { coins: 500, charm: 2 } },
    { title: "第六章．瓊林探花", scene: "瓊林宴・追捕逃靈", go: "逃",
      story: ["瓊林宴上，你發現白字老妖並沒有消失。牠躲進了你曾經答錯、讓牠逃走的那些字靈裡。",
        "墨翁說：「答錯過的題，就是牠的藏身處。」你回頭追捕逃靈，把舊錯一筆一筆改正。皇上欣賞你的用心，擢升你為一甲第三名「探花」。"],
      note: ["三鼎甲", "殿試一甲只有三人：狀元、榜眼、探花，合稱「三鼎甲」，像鼎的三隻腳並立。"],
      gift: { coins: 600, mirror: 3, charm: 1 } },
    { title: "第七章．翰林榜眼", scene: "翰林院", go: "亂",
      story: ["你在翰林院校讀古籍，終於查出白字老妖的來歷：牠不是外來的妖怪，而是每一次「差不多就好」「大概這樣念吧」累積出來的影子。",
        "想讓牠消失，只能把熟悉的字再抓一次、再確認一次，讓熟練度一顆星一顆星亮起來。你升為一甲第二名「榜眼」。"],
      note: ["榜眼", "「榜」讀ㄅㄤˇ，指張貼名單的告示，不要寫成「傍」。"],
      gift: { coins: 800, mirror: 3, charm: 2 } },
    { title: "終章．獨占鰲頭", scene: "金鑾殿前・墨池", go: "亂",
      story: ["你收服的字靈已經多到可以重新填滿墨池。你提筆一點，封印合攏，白字老妖縮成一滴小小的墨點，落進池裡，變成一隻怯生生的墨靈。",
        "墨翁笑著說：「錯誤收好了，也能變成學問。」皇上欽點你為「狀元」，你帽插宮花、身披紅綢，跨馬遊街。",
        "字海無邊，新的字靈還會出現。往後每多收一隻、多亮一顆星，都是你自己的功名。"],
      note: ["獨占鰲頭", "「鰲」讀ㄠˊ，是傳說中的大海龜。宮殿石階正中刻著鰲頭，狀元站在那裡迎榜，所以說「獨占鰲頭」。"],
      gift: { coins: 1000, mirror: 5, charm: 3 } },
  ];
  const CAST = [
    ["墨翁", "看守墨池的老塾師。說話慢，卻從不念錯一個字。每次你升級，他都會送上賀禮。"],
    ["白字老妖", "吃錯字長大的影子妖怪，專門把讀音念歪、筆畫寫錯、意思弄混。你越粗心，牠越強大。"],
  ];
  const SPIRIT_DESC = {
    r1: "最常見的字靈，一題一個形音義知識點。",
    r2: "成對出現：判斷兩個詞裡的字，讀音、字形或字義是否相同。",
    r3: "歷屆學測、指考的單選原題化成的字靈。",
    r4: "歷屆學測、指考的多選原題化成的神靈，最難收服。",
  };
  const GROUNDS = [
    { id: "音", name: "字音林", desc: "讀音辨正：同偏旁、多音字、形近字", test: (q) => q.kind === "字音" },
    { id: "形", name: "字形山", desc: "錯別字、同音字、形近字", test: (q) => q.kind === "字形" },
    { id: "義", name: "字義海", desc: "一字多義、古今異義", test: (q) => q.kind === "字義" },
    { id: "殿", name: "大考神殿", desc: "只出學測、指考原題與大考改編題", test: (q) => EXAM(q) },
    { id: "亂", name: "百字亂流", desc: "形音義全部混在一起", test: () => true },
    { id: "逃", name: "追捕逃靈", desc: "回頭抓之前答錯逃走的字靈", test: (q) => !!S.esc[q.id] },
  ];
  const GIMG = { 音: "sound", 形: "form", 義: "meaning", 殿: "temple", 亂: "chaos", 逃: "chase" };
  const SHOP = [
    { id: "mirror1", name: "照妖鏡", desc: "答題時去掉一個錯誤選項。", cost: 30, give: { mirror: 1 } },
    { id: "mirror5", name: "照妖鏡（五面裝）", desc: "一次買五面，比較划算。", cost: 130, give: { mirror: 5 } },
    { id: "charm1", name: "定身符", desc: "先貼上再作答：答錯時字靈不會逃走，可以再答一次（收服時銅錢減半）。", cost: 60, give: { charm: 1 } },
    { id: "pot", name: "聚寶盆", desc: "每升一級，之後抓寶的銅錢多一成。", up: "pot", max: 10, base: 200, exp: 1.6 },
    { id: "brush", name: "文房四寶", desc: "每升一級，全部字靈的戰力多 5%。", up: "brush", max: 10, base: 300, exp: 1.7 },
  ];

  let BANK = [], BY_ID = {}, EDITION = "full";
  const EXAM = (q) => !["語練", "小題", "重組"].includes(q.srcType);
  let S = load();
  let run = null;

  // ---------- 存檔 ----------
  function fresh() {
    return { coins: 0, got: {}, esc: {}, stats: {}, items: { mirror: 3, charm: 1 }, lv: { pot: 0, brush: 0 },
      runs: 0, bestCombo: 0, seen: {}, rankSeen: 0, intro: false };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (s && s.got) return Object.assign(fresh(), s);
    } catch (e) { /* 私密視窗等情況讀不到就重新開始 */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 存不了也不影響本次遊玩 */ }
  }

  // ---------- 工具 ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function fmt(s) { return esc(s).replace(/&lt;(\/?)u&gt;/g, "<$1u>").replace(/\n/g, "<br>"); }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 1800);
  }
  const ZY = /^[ㄅ-ㄩˊˇˋ˙ ]+$/;
  function glyphOf(q) {
    if (q._g) return q._g;
    let g = "";
    const pick = (text) => {
      for (const m of String(text).matchAll(/「([^」]{1,6})」/g)) {
        const x = m[1].trim();
        if (x) return x;
      }
      return "";
    };
    if (q.tier === "小題") g = pick(q.stem);
    else g = pick(q.options.join("／")) || pick(q.stem);
    if (!g) g = { 字音: "音", 字形: "形", 字義: "義" }[q.kind];
    if (!ZY.test(g) && g.length > 2) g = g.slice(0, 2);
    q._g = g;
    return g;
  }
  function isZy(g) { return ZY.test(g); }
  function rarityColor(tier) { return `var(--${TIERS[tier].cls})`; }

  function powerOf(id) {
    const q = BY_ID[id];
    if (!q) return 0;
    const stars = S.got[id] || 0;
    return TIERS[q.tier].power * (1 + 0.5 * (stars - 1));
  }
  function badges() {
    const groups = {};
    for (const q of BANK) {
      if (!EXAM(q)) continue;
      (groups[q.source] ||= []).push(q.id);
    }
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0], "zh-Hant", { numeric: true }))
      .map(([name, ids]) => ({ name, ids, done: ids.every((id) => S.got[id]) }));
  }
  function totalPower() {
    let p = 0;
    for (const id in S.got) p += powerOf(id);
    p += badges().filter((b) => b.done).length * 20;
    return Math.round(p * (1 + 0.05 * S.lv.brush));
  }
  function rankOf(p) {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (p >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; }
    }
    return { name: r[1], next, idx: RANKS.indexOf(r) };
  }

  // ---------- 升級劇情 ----------
  let rankQueue = [];
  function giftText(g) {
    const out = [];
    if (g.coins) out.push(`銅錢 ${g.coins}`);
    if (g.mirror) out.push(`照妖鏡 ${g.mirror} 面`);
    if (g.charm) out.push(`定身符 ${g.charm} 張`);
    return out.join("、");
  }
  function ladderHTML(cur) {
    return `<ol class="ladder">${RANKS.map((r, i) =>
      `<li class="${i < cur ? "past" : i === cur ? "now" : ""}">${r[1]}</li>`).join("")}</ol>`;
  }
  function storyHTML(st, cur, giftLine, isPrologue) {
    const before = cur > 0 && !isPrologue ? heroImg(cur - 1, "hero-prev") : "";
    return `<div class="scroll-story">` +
      `<p class="herald">${isPrologue ? "墨苑告急" : "捷　報"}</p>` +
      `<div class="hero-stage">${before}${heroImg(cur, "hero-now")}</div>` +
      (isPrologue ? "" : `<p class="newrank"><small>恭喜升為</small><b>${RANKS[cur][1]}</b></p>`) +
      ladderHTML(cur) +
      `<h3>${st.title}</h3><p class="scene">${st.scene}</p>` +
      st.story.map((t) => `<p>${t}</p>`).join("") +
      `<div class="lore"><b>考場小知識．${st.note[0]}</b>${st.note[1]}</div>` +
      (st.go ? `<p class="goto">下一站：${GROUNDS.find((g) => g.id === st.go).name}</p>` : "") +
      (giftLine ? `<p class="gift">${giftLine}</p>` : "") +
      `<button class="primary wide" id="m-close">${giftLine && !isPrologue ? "收下賀禮" : "繼續"}</button></div>`;
  }
  function openStory(html) {
    $("#mbody").innerHTML = html;
    $("#mbody").classList.add("story");
    $("#modal").classList.remove("hidden");
    $("#m-close").addEventListener("click", closeModal);
  }
  function showPrologue() {
    S.intro = true;
    save();
    openStory(storyHTML(PROLOGUE, 0, PROLOGUE.gift, true));
  }
  // 戰力跨過門檻：依序播放每一章，賀禮在播放時入帳（關掉視窗也不會漏領）
  function checkRankUp() {
    if (run && !run.done) return;
    const idx = rankOf(totalPower()).idx;
    while (S.rankSeen < idx) rankQueue.push(++S.rankSeen);
    save();
    if (rankQueue.length && $("#modal").classList.contains("hidden")) nextStory();
  }
  function nextStory() {
    const i = rankQueue.shift();
    if (i == null) return;
    const st = RANK_STORY[i];
    S.coins += st.gift.coins || 0;
    S.items.mirror += st.gift.mirror || 0;
    S.items.charm += st.gift.charm || 0;
    save();
    refreshTop();
    openStory(storyHTML(st, i, `墨翁的賀禮：${giftText(st.gift)}`));
  }
  function replayStory(i) {
    openStory(i === 0 ? storyHTML(PROLOGUE, 0, "", true) : storyHTML(RANK_STORY[i], i, ""));
  }

  function refreshTop() {
    const p = totalPower();
    $("#coins").textContent = S.coins.toLocaleString();
    $("#power").textContent = p.toLocaleString();
    const r = rankOf(p);
    const shown = Math.min(r.idx, S.rankSeen);
    $("#rank").innerHTML = heroImg(shown, "avatar") + `<span>目前身分：<b>${RANKS[shown][1]}</b>` +
      (r.idx > S.rankSeen ? `　<span class="soon">出巡結束後放榜！</span>`
        : r.next ? `　再 ${r.next[0] - p} 戰力升為「${r.next[1]}」` : "　已登峰造極") + `</span>`;
  }

  // ---------- 分頁 ----------
  function show(tab) {
    for (const b of document.querySelectorAll(".tabs button")) b.classList.toggle("cur", b.dataset.tab === tab);
    for (const v of document.querySelectorAll(".view")) v.classList.add("hidden");
    const map = { hunt: "#v-hunt", dex: "#v-dex", shop: "#v-shop", story: "#v-story", me: "#v-me", enc: "#v-enc", sum: "#v-sum" };
    $(map[tab]).classList.remove("hidden");
    if (tab === "hunt") renderGrounds();
    if (tab === "dex") renderDex();
    if (tab === "shop") renderShop();
    if (tab === "me") renderMe();
    if (tab === "story") renderStory();
    refreshTop();
    window.scrollTo({ top: 0 });
  }
  for (const b of document.querySelectorAll(".tabs button")) {
    b.addEventListener("click", () => {
      if (run && !run.done && !confirm("正在出巡中，要離開嗎？這次出巡會結束。")) return;
      if (run && !run.done) endRun(true);
      show(b.dataset.tab);
    });
  }

  // ---------- 獵場 ----------
  function tierFilter() { return $("#f-tier").value; }
  function poolFor(g) {
    const tf = tierFilter();
    return BANK.filter((q) => g.test(q) && (g.id === "逃" || tf === "all" || q.tier === tf));
  }
  function renderGrounds() {
    const box = $("#grounds");
    box.innerHTML = "";
    for (const g of GROUNDS) {
      const pool = poolFor(g);
      const got = pool.filter((q) => S.got[q.id]).length;
      const b = document.createElement("button");
      b.className = `ground g-${g.id}`;
      b.style.backgroundImage = "linear-gradient(90deg, color-mix(in srgb, var(--surface) 92%, transparent) 30%, " +
        `color-mix(in srgb, var(--surface) 35%, transparent)), url("assets/grounds/${GIMG[g.id]}.webp")`;
      b.disabled = pool.length === 0;
      b.innerHTML = `<span class="gname">${g.name}</span><span class="gdesc">${g.id === "殿" && EDITION === "public" ? "只出歷屆學測、指考原題" : g.desc}</span>` +
        `<span class="gnum">${g.id === "逃" ? `逃走中 ${pool.length} 隻` : `已收服 ${got}／${pool.length}`}</span>`;
      b.addEventListener("click", () => startRun(g));
      box.appendChild(b);
    }
  }
  $("#f-tier").addEventListener("change", renderGrounds);

  // ---------- 出巡 ----------
  function pickQuestions(g) {
    let pool = poolFor(g);
    const preferNew = $("#f-new").checked;
    if (g.id === "逃") return shuffle(pool).slice(0, RUN_LEN);
    const byTier = {};
    for (const q of pool) (byTier[q.tier] ||= []).push(q);
    const tiers = Object.keys(byTier);
    const out = [], used = new Set();
    for (let n = 0; n < RUN_LEN; n++) {
      const avail = tiers.filter((t) => byTier[t].some((q) => !used.has(q.id)));
      if (!avail.length) break;
      const tot = avail.reduce((s, t) => s + TIERS[t].weight, 0);
      let x = Math.random() * tot, t = avail[0];
      for (const k of avail) { x -= TIERS[k].weight; if (x <= 0) { t = k; break; } }
      let cand = byTier[t].filter((q) => !used.has(q.id));
      if (preferNew) {
        const fresh = cand.filter((q) => !S.got[q.id]);
        if (fresh.length) cand = fresh;
      }
      const q = cand[Math.floor(Math.random() * cand.length)];
      used.add(q.id);
      out.push(q);
    }
    return out;
  }
  function startRun(g) {
    const qs = pickQuestions(g);
    if (!qs.length) { toast("這個獵場目前沒有字靈"); return; }
    run = { ground: g, qs, i: 0, combo: 0, log: [], coins: 0, caught: 0, done: false, startPower: totalPower() };
    S.runs++;
    show("enc");
    nextEncounter();
  }
  function comboMult(c) { return c >= 8 ? 2 : c >= 5 ? 1.5 : c >= 3 ? 1.2 : 1; }

  function nextEncounter() {
    const q = run.qs[run.i];
    run.cur = { q, order: shuffle(q.options.map((_, i) => i)), picked: new Set(), gone: new Set(), charm: false, retried: false, locked: false };
    S.seen[q.id] = 1;
    const stage = $("#stage");
    stage.className = "spirit-stage";
    stage.style.setProperty("--rc", rarityColor(q.tier));
    const img = $("#sp-img");
    img.classList.remove("hidden");
    img.src = `assets/spirits/${TIERS[q.tier].cls}.webp`;
    const g = glyphOf(q);
    const gl = $("#glyph");
    gl.textContent = g;
    gl.className = "glyph" + (isZy(g) ? " zy" : "");
    $("#sp-rarity").className = "r " + TIERS[q.tier].cls;
    $("#sp-rarity").textContent = TIERS[q.tier].name + (S.got[q.id] ? "（已收服）" : S.esc[q.id] ? "（曾逃走）" : "");
    $("#sp-kind").textContent = q.kind;
    $("#enc-count").textContent = `第 ${run.i + 1}／${run.qs.length} 隻`;
    $("#enc-combo").textContent = run.combo >= 2 ? `連收 ${run.combo}` : "";
    $("#q-src").textContent = q.source + (q.adapted ? "（改編小題）" : "");
    $("#q-multi").classList.toggle("hidden", q.type !== "multi");
    $("#q-stem").innerHTML = fmt(q.stem);
    $("#q-result").classList.add("hidden");
    $("#q-tools").classList.remove("hidden");
    $("#q-submit").classList.toggle("hidden", q.type !== "multi");
    updateItemButtons();
    renderOpts();
  }
  function renderOpts() {
    const c = run.cur, q = c.q, box = $("#q-opts");
    box.innerHTML = "";
    c.order.forEach((oi, k) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.dataset.oi = oi;
      if (c.gone.has(oi)) { b.classList.add("gone"); b.disabled = true; }
      if (c.picked.has(oi)) b.classList.add("sel");
      b.innerHTML = `<span class="k">${"ABCDE"[k]}</span><span>${fmt(q.options[oi])}</span>`;
      b.addEventListener("click", () => onPick(oi));
      box.appendChild(b);
    });
  }
  function updateItemButtons() {
    $("#n-mirror").textContent = S.items.mirror;
    $("#n-charm").textContent = S.items.charm;
    const c = run && run.cur;
    $("#use-mirror").disabled = !S.items.mirror || !c || c.locked;
    $("#use-charm").disabled = !S.items.charm || !c || c.locked || c.charm || c.retried;
    $("#use-charm").classList.toggle("sel", !!(c && c.charm));
  }
  $("#use-mirror").addEventListener("click", () => {
    const c = run.cur, q = c.q;
    const wrong = c.order.filter((oi) => !q.answer.includes(oi) && !c.gone.has(oi));
    const left = c.order.filter((oi) => !c.gone.has(oi)).length;
    if (!wrong.length || left <= 2) { toast("剩下的選項不能再照了"); return; }
    const oi = wrong[Math.floor(Math.random() * wrong.length)];
    c.gone.add(oi);
    c.picked.delete(oi);
    S.items.mirror--;
    save();
    toast("照妖鏡現形：去掉一個錯誤選項");
    renderOpts();
    updateItemButtons();
  });
  $("#use-charm").addEventListener("click", () => {
    run.cur.charm = true;
    S.items.charm--;
    save();
    toast("已貼上定身符：這題答錯可以再答一次");
    updateItemButtons();
  });
  function onPick(oi) {
    const c = run.cur;
    if (c.locked) return;
    if (c.q.type === "multi") {
      c.picked.has(oi) ? c.picked.delete(oi) : c.picked.add(oi);
      renderOpts();
      return;
    }
    c.picked = new Set([oi]);
    judge();
  }
  $("#q-submit").addEventListener("click", () => {
    if (!run.cur.picked.size) { toast("多選題至少要選一個"); return; }
    judge();
  });

  function judge() {
    const c = run.cur, q = c.q;
    const ans = new Set(q.answer);
    let wrongK = 0;
    for (const oi of c.order) if (ans.has(oi) !== c.picked.has(oi)) wrongK++;
    const n = q.options.length;
    const full = wrongK === 0;
    const frac = q.type === "multi" ? Math.max(0, (n - 2 * wrongK) / n) : (full ? 1 : 0);

    if (!full && c.charm && !c.retried) {
      c.retried = true;
      c.charm = false;
      for (const oi of c.picked) if (!ans.has(oi)) c.gone.add(oi);
      c.picked = new Set([...c.picked].filter((oi) => ans.has(oi)));
      toast("定身符發動！字靈被定住了，再答一次");
      renderOpts();
      updateItemButtons();
      return;
    }

    c.locked = true;
    const st = (S.stats[q.kind] ||= { a: 0, c: 0 });
    st.a++;
    if (full) st.c++;

    const before = !!S.got[q.id], wasEsc = !!S.esc[q.id];
    let gain = 0, verdict, cls;
    const t = TIERS[q.tier];
    if (full) {
      run.combo++;
      S.bestCombo = Math.max(S.bestCombo, run.combo);
      gain = t.coin * comboMult(run.combo) * (1 + 0.1 * S.lv.pot);
      if (before) gain *= 0.5;
      if (wasEsc) gain *= 1.5;
      if (c.retried) gain *= 0.5;
      S.got[q.id] = Math.min(3, (S.got[q.id] || 0) + 1);
      delete S.esc[q.id];
      run.caught++;
      verdict = before ? `再次收服「${glyphOf(q)}」${t.name}！熟練度 ${"★".repeat(S.got[q.id])}`
        : wasEsc ? `追捕成功！「${glyphOf(q)}」${t.name}收入圖鑑` : `收服「${glyphOf(q)}」${t.name}！`;
      cls = "ok";
      $("#stage").classList.add("caught");
    } else if (frac > 0) {
      run.combo = 0;
      gain = t.coin * frac * 0.5;
      if (!S.got[q.id]) S.esc[q.id] = 1;
      verdict = `擦身而過：多選錯 ${wrongK} 個選項，字靈掙脫了`;
      cls = "part";
      $("#stage").classList.add("fled");
    } else {
      run.combo = 0;
      if (!S.got[q.id]) S.esc[q.id] = 1;
      verdict = `「${glyphOf(q)}」${t.name}逃走了`;
      cls = "no";
      $("#stage").classList.add("fled");
    }
    gain = Math.round(gain);
    S.coins += gain;
    run.coins += gain;
    run.log.push({ id: q.id, ok: full, part: !full && frac > 0, gain });
    save();
    refreshTop();

    for (const b of document.querySelectorAll("#q-opts .opt")) {
      const oi = +b.dataset.oi;
      b.disabled = true;
      if (ans.has(oi)) b.classList.add("right");
      else if (c.picked.has(oi)) b.classList.add("wrong");
    }
    const keys = c.order.map((oi, k) => (ans.has(oi) ? "ABCDE"[k] : "")).join("");
    $("#q-verdict").className = "verdict " + cls;
    $("#q-verdict").textContent = verdict + (gain ? `　+${gain} 銅錢` : "");
    $("#q-exp").innerHTML = `<b>正解：${keys}</b>　${fmt(remapExp(q.explanation, c.order) || "（本題沒有附解析）")}`;
    $("#q-result").classList.remove("hidden");
    $("#q-tools").classList.add("hidden");
    $("#enc-combo").textContent = run.combo >= 2 ? `連收 ${run.combo}（銅錢 ×${comboMult(run.combo)}）` : "";
    $("#q-next").textContent = run.i + 1 >= run.qs.length ? "看出巡成果" : "下一隻";
    $("#q-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  $("#q-next").addEventListener("click", () => {
    run.i++;
    if (run.i >= run.qs.length) endRun(false);
    else { nextEncounter(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });
  $("#enc-quit").addEventListener("click", () => {
    if (!run.log.length) { run.done = true; show("hunt"); return; }
    endRun(false);
  });

  function endRun(silent) {
    run.done = true;
    save();
    if (silent) return;
    const p = totalPower();
    $("#sum-line").textContent = `收服 ${run.caught}／${run.log.length} 隻`;
    $("#sum-grid").innerHTML =
      `<div>銅錢<b>+${run.coins}</b></div><div>戰力<b>+${p - run.startPower}</b></div><div>最高連收<b>${Math.max(0, ...streaks(run.log))}</b></div>`;
    const newly = badges().filter((b) => b.done && b.ids.some((id) => run.log.some((l) => l.id === id && l.ok)));
    $("#sum-badges").innerHTML = newly.length
      ? `<p>集滿印記：${newly.map((b) => `<span class="badge">${esc(b.name)}</span>`).join(" ")}</p>` : "";
    const list = $("#sum-list");
    list.innerHTML = "";
    for (const l of run.log) list.appendChild(miniRow(BY_ID[l.id], l.ok ? "收服" : l.part ? "擦身而過" : "逃走", l.ok));
    $("#sum-escaped").disabled = !Object.keys(S.esc).length;
    show("sum");
    setTimeout(checkRankUp, 700);
  }
  function streaks(log) {
    let c = 0; const out = [0];
    for (const l of log) { c = l.ok ? c + 1 : 0; out.push(c); }
    return out;
  }
  $("#sum-again").addEventListener("click", () => startRun(run.ground));
  $("#sum-escaped").addEventListener("click", () => startRun(GROUNDS.find((g) => g.id === "逃")));

  function miniRow(q, status, ok) {
    const d = document.createElement("button");
    d.className = "card mini";
    d.style.setProperty("--rc", rarityColor(q.tier));
    const g = glyphOf(q);
    d.innerHTML = `<span class="mg" style="${isZy(g) ? "font-size:1rem" : ""}">${esc(g)}</span>` +
      `<span class="mt"><b style="color:${ok ? "var(--good)" : "var(--bad)"}">${status}</b>　${esc(q.kind)}・${esc(q.source)}` +
      `<span class="s muted">${esc(q.stem.replace(/<\/?u>/g, ""))}</span></span>`;
    d.addEventListener("click", () => openQ(q));
    return d;
  }

  // 選項出題時打亂了順序，解析裡的 (A)(B)… 要換成畫面上的字母，並依新順序重排
  function remapExp(exp, order) {
    if (!exp) return exp;
    const parts = exp.split(/(?=\([A-E]\))/);
    const head = /^\([A-E]\)/.test(parts[0]) ? "" : parts.shift();
    if (!parts.length) return exp;
    const segs = [];
    for (const p of parts) {
      const oi = "ABCDE".indexOf(p[1]);
      const ni = order.indexOf(oi);
      if (oi < 0 || ni < 0) return exp;   // 對不上就保留原文，不冒險改
      segs.push([ni, "(" + "ABCDE"[ni] + ")" + p.slice(3)]);
    }
    segs.sort((x, y) => x[0] - y[0]);
    return head + segs.map((x) => x[1].replace(/\s+$/, "")).join(" ");
  }

  // ---------- 題目檢視 ----------
  function openQ(q) {
    const keys = q.answer.map((i) => "ABCDE"[i]).join("");
    const stars = S.got[q.id] ? "★".repeat(S.got[q.id]) : "";
    $("#mbody").innerHTML =
      `<div class="qhead"><span class="r ${TIERS[q.tier].cls}">${TIERS[q.tier].name}</span><span class="kindtag">${q.kind}</span>` +
      `<span class="src">${esc(q.source)}${q.adapted ? "（改編小題）" : ""}</span><span style="color:var(--gold)">${stars}</span></div>` +
      `<div class="stem">${fmt(q.stem)}</div>` +
      `<div class="opts">${q.options.map((o, i) => `<div class="opt ${q.answer.includes(i) ? "right" : ""}"><span class="k">${"ABCDE"[i]}</span><span>${fmt(o)}</span></div>`).join("")}</div>` +
      `<div class="exp"><b>正解：${keys}</b>　${fmt(q.explanation || "（本題沒有附解析）")}</div>` +
      `<button class="primary wide" id="m-close">關閉</button>`;
    $("#modal").classList.remove("hidden");
    $("#m-close").addEventListener("click", closeModal);
  }
  function closeModal() {
    $("#modal").classList.add("hidden");
    $("#mbody").classList.remove("story");
    if (rankQueue.length) setTimeout(nextStory, 250);
  }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // ---------- 圖鑑 ----------
  function renderDex() {
    const kind = $("#d-kind").value, tier = $("#d-tier").value, showSel = $("#d-show").value;
    const st = $("#dex-stat");
    st.innerHTML = Object.entries(TIERS).reverse().map(([k, t]) => {
      const all = BANK.filter((q) => q.tier === k);
      const got = all.filter((q) => S.got[q.id]).length;
      return `<div><span class="r ${t.cls}">${t.name}</span><b>${got}／${all.length}</b></div>`;
    }).join("");
    const bs = badges();
    $("#badges").innerHTML = bs.some((b) => b.ids.some((id) => BY_ID[id].tier === tier))
      ? bs.filter((b) => b.ids.some((id) => BY_ID[id].tier === tier))
        .map((b) => `<span class="badge ${b.done ? "" : "off"}">${esc(b.name)} ${b.ids.filter((id) => S.got[id]).length}/${b.ids.length}</span>`).join("")
      : "";
    let qs = BANK.filter((q) => q.tier === tier && (!kind || q.kind === kind));
    if (showSel === "got") qs = qs.filter((q) => S.got[q.id]);
    if (showSel === "esc") qs = qs.filter((q) => S.esc[q.id]);
    const box = $("#dex");
    box.innerHTML = "";
    const frag = document.createDocumentFragment();
    const LIMIT = 600;
    for (const q of qs.slice(0, LIMIT)) {
      const got = S.got[q.id], es = S.esc[q.id];
      const b = document.createElement("button");
      b.className = "cell" + (got ? "" : es ? " esc" : " no");
      b.style.setProperty("--rc", rarityColor(q.tier));
      const g = glyphOf(q);
      if (got || es) {
        if (isZy(g)) b.classList.add("zy");
        b.innerHTML = `${esc(g)}<span class="cap">${esc(capOf(q))}</span>` + (got ? `<span class="st">${"★".repeat(got)}</span>` : "");
        b.addEventListener("click", () => openQ(q));
      } else {
        b.innerHTML = `？<span class="cap">${esc(capOf(q))}</span>`;
        b.addEventListener("click", () => toast("還沒收服，出巡時遇到牠再說"));
      }
      frag.appendChild(b);
    }
    box.appendChild(frag);
    if (qs.length > LIMIT) {
      const p = document.createElement("p");
      p.className = "muted small";
      p.style.gridColumn = "1 / -1";
      p.textContent = `只列出前 ${LIMIT} 隻，用上方篩選縮小範圍。`;
      box.appendChild(p);
    }
  }
  function capOf(q) {
    if (EXAM(q)) return q.source.replace(" 大考改編題", "改編");
    return q.kind;
  }
  for (const id of ["#d-kind", "#d-tier", "#d-show"]) $(id).addEventListener("change", renderDex);

  // ---------- 商店 ----------
  function costOf(it) {
    if (!it.up) return it.cost;
    return Math.round(it.base * Math.pow(S.lv[it.up] + 1, it.exp));
  }
  function renderShop() {
    const box = $("#shop");
    box.innerHTML = "";
    for (const it of SHOP) {
      const d = document.createElement("div");
      d.className = "card item";
      const lv = it.up ? S.lv[it.up] : null;
      const maxed = it.up && lv >= it.max;
      const cost = costOf(it);
      const own = it.give ? `（持有 ${S.items[Object.keys(it.give)[0]]}）` : `（目前 ${lv} 級）`;
      const pic = { mirror: "照妖鏡", charm: "定身符", pot: "聚寶盆", brush: "文房四寶" }[it.id.replace(/\d+$/, "")];
      d.innerHTML = `<img class="item-img" src="assets/shop/${pic}.webp" alt="" onerror="this.remove()">` +
        `<div class="item-txt"><h3>${it.name}</h3><p>${it.desc}${own}</p></div>`;
      const b = document.createElement("button");
      b.className = "primary";
      b.innerHTML = maxed ? "已滿級" : `<i class="coin"></i>${cost}`;
      b.disabled = maxed || S.coins < cost;
      b.addEventListener("click", () => {
        if (S.coins < cost) return;
        S.coins -= cost;
        if (it.give) for (const k in it.give) S.items[k] += it.give[k];
        else S.lv[it.up]++;
        save();
        toast(`買到了：${it.name}`);
        renderShop();
        refreshTop();
        checkRankUp();
      });
      d.appendChild(b);
      box.appendChild(d);
    }
  }

  // ---------- 故事 ----------
  function renderStory() {
    const cur = S.rankSeen;
    const spirits = Object.values(TIERS).map((t) =>
      `<div class="cast-card"><img src="assets/spirits/${t.cls}.webp" alt="" onerror="this.remove()">` +
      `<div><b style="color:var(--${t.cls})">${t.name}</b><p>${SPIRIT_DESC[t.cls] || ""}</p></div></div>`).join("");
    const chapters = RANKS.map((r, i) => {
      const st = i ? RANK_STORY[i] : PROLOGUE;
      return i <= cur
        ? `<button class="chap" data-st="${i}">${heroImg(i, "chap-img")}<span><b>${st.title}</b><small>${r[1]}．${st.scene}</small></span></button>`
        : `<button class="chap" disabled><span class="road-lock">?</span><span><b>${st.title.split("．")[0]}．？？？</b><small>${r[1]}．戰力 ${r[0]} 解鎖</small></span></button>`;
    }).join("");
    $("#story-body").innerHTML =
      `<div class="card story-intro">${heroImg(cur, "story-hero")}<div>` +
      `<h2>墨池裂了</h2>` +
      `<p>墨苑的千年墨池封著幾千隻字靈。白字老妖劃破封印，字靈四散，躲進字音林、字形山、字義海和大考神殿。</p>` +
      `<p>你是墨苑的小書僮。收服字靈、累積戰力，就能一路從<b>書僮</b>考到<b>狀元</b>，把墨池重新封好。</p></div></div>` +
      `<h2 class="sec">人物</h2><div class="cast">` +
      `<div class="cast-card">${heroImg(cur, "")}<div><b>你（${RANKS[cur][1]}）</b><p>墨苑的小書僮。每升一級，衣冠就換一次，最後帽插宮花、跨馬遊街。</p></div></div>` +
      CAST.map(([n, d]) => `<div class="cast-card"><img src="assets/cast/${n}.webp" alt="${n}" onerror="this.outerHTML='<span class=cast-ink>${n[0]}</span>'"><div><b>${n}</b><p>${d}</p></div></div>`).join("") +
      `</div><h2 class="sec">四種字靈</h2><div class="cast">${spirits}</div>` +
      `<h2 class="sec">章節</h2><p class="muted small">戰力到了就會解鎖下一章；點已解鎖的章節可以重看。</p>` +
      `<div class="chaps">${chapters}</div>`;
    for (const b of document.querySelectorAll("#story-body [data-st]")) b.addEventListener("click", () => replayStory(+b.dataset.st));
  }

  // ---------- 戰績 ----------
  function renderMe() {
    const p = totalPower(), r = rankOf(p);
    const nGot = Object.keys(S.got).length, nEsc = Object.keys(S.esc).length;
    const bars = ["字音", "字形", "字義"].map((k) => {
      const s = S.stats[k] || { a: 0, c: 0 };
      const pct = s.a ? Math.round((s.c / s.a) * 100) : 0;
      return `<div class="bar"><span>${k}</span><span class="track"><span class="fill" style="width:${pct}%"></span></span><span>${s.a ? pct + "%（" + s.a + "題）" : "還沒作答"}</span></div>`;
    }).join("");
    const done = badges().filter((b) => b.done).length;
    $("#me-card").innerHTML =
      `<div class="me-hero">${heroImg(S.rankSeen, "me-portrait")}<h2>${RANKS[S.rankSeen][1]}</h2></div>` +
      `<p>戰力 <b>${p}</b>　銅錢 <b>${S.coins}</b>　出巡 <b>${S.runs}</b> 次　最高連收 <b>${S.bestCombo}</b></p>` +
      `<p>圖鑑 <b>${nGot}</b>／${BANK.length} 隻　逃走名單 <b>${nEsc}</b> 隻　集滿卷別印記 <b>${done}</b> 份</p>` +
      `<h3>各類答對率（第一次作答與重抓都算）</h3><div class="bars">${bars}</div>` +
      `<h3>身分之路</h3><p class="muted small">點已解鎖的身分，可以重看那一章和當時的模樣。</p>` +
      `<div class="road">${RANKS.map((x, i) => i <= S.rankSeen
        ? `<button data-st="${i}" class="${i === S.rankSeen ? "now" : ""}">${heroImg(i, "road-img")}${x[1]}<small>${i ? RANK_STORY[i].title.split("．")[1] : "序章"}</small></button>`
        : `<button disabled><span class="road-lock">?</span>${x[1]}<small>戰力 ${x[0]}</small></button>`).join("")}</div>` +
      `<p class="muted small">戰力＝已收服字靈（墨靈 1、玉靈 3、金靈 6、朱印神靈 12，熟練度每多一顆星加五成）＋每份集滿的卷別印記 20，再乘上文房四寶加成。</p>`;
    for (const b of document.querySelectorAll("#me-card [data-st]")) b.addEventListener("click", () => replayStory(+b.dataset.st));
  }
  $("#save-copy").addEventListener("click", async () => {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    try { await navigator.clipboard.writeText(code); toast("存檔碼已複製"); }
    catch (e) { prompt("請手動複製這段存檔碼：", code); }
  });
  $("#save-load").addEventListener("click", () => {
    const code = prompt("貼上存檔碼：");
    if (!code) return;
    try {
      const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (!s.got) throw new Error("bad");
      S = Object.assign(fresh(), s);
      save();
      toast("已還原存檔");
      show("me");
    } catch (e) { toast("存檔碼不正確"); }
  });
  $("#save-reset").addEventListener("click", () => {
    if (!confirm("確定要清除全部進度嗎？圖鑑、銅錢、戰力都會歸零。")) return;
    S = fresh();
    save();
    show("hunt");
  });

  function setupTierUI() {
    const ts = Object.entries(TIERS);
    $("#legend").innerHTML = ts.map(([, t]) => `<span class="r ${t.cls}">${t.label}</span>`).join("");
    $("#f-tier").innerHTML = `<option value="all">全部（依稀有度隨機出現）</option>` +
      ts.slice().reverse().map(([k, t]) => `<option value="${k}">只抓${t.label}</option>`).join("");
    $("#d-tier").innerHTML = ts.slice().reverse().map(([k, t]) => `<option value="${k}">${t.label}</option>`).join("");
  }

  // ---------- 啟動 ----------
  fetch("data/bank.json")
    .then((r) => r.json())
    .then((d) => {
      BANK = d.questions;
      if (d.tiers) TIERS = d.tiers;
      if (d.edition) EDITION = d.edition;
      setupTierUI();
      for (const q of BANK) BY_ID[q.id] = q;
      const c = {};
      for (const q of BANK) c[q.tier] = (c[q.tier] || 0) + 1;
      $("#credits").innerHTML = EDITION === "public"
        ? `題庫共 ${BANK.length} 題：大考題 ${BANK.filter(EXAM).length} 題取自大學入學考試中心公布之 107–115 學測、107–110 指考試題；` +
          `其餘為本站把形音義知識點重新組合出的新題。解析皆為本站自行撰寫或由程式依知識點產生。`
        : `題庫共 ${BANK.length} 題：學測／指考 ${c.大考 || 0} 題、大考改編題 ${c.模考 || 0} 題、` +
        `翰林與龍騰語練改編題 ${c.語練 || 0} 題、語練改編小題 ${c.小題 || 0} 題。` +
        `改編小題由語練的字音字形填寫題改成四選一，干擾選項由程式產生。`;
      if (!S.intro && S.runs > 0) { S.intro = true; S.rankSeen = rankOf(totalPower()).idx; save(); }
      show("hunt");
      if (!S.intro) showPrologue();
    })
    .catch(() => { document.querySelector("main").innerHTML = '<div class="card">題庫載入失敗，請重新整理。</div>'; });
})();
