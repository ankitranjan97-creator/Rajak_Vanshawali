/* =========================================================================
   ⚙️ VANSHAWALI CORE ENGINE (vansh-engine.js)
   Features:
   - Option 1 Top Strip + Symbolic [ अ | A ] Language Switcher (Hindi / English)
   - Direct Add/Edit Bypass when Admin is Logged In
   - 2 Separate Name Boxes (Hindi + English)
   - Live Session Visitor Counter (1,250+ via GAS)
========================================================================= */

// 1. LocalStorage Sync with vansh-data.js
const savedTree = localStorage.getItem("NARAYAN_MAHTO_TREE_FINAL");
if (savedTree) {
    try {
        const parsed = JSON.parse(savedTree);
        if (parsed && parsed.children && parsed.children[0] && parsed.children[0].id === "chaman") {
            FAMILY_TREE_DATA = parsed;
        }
    } catch (e) {}
}
const savedComments = localStorage.getItem("NARAYAN_MAHTO_COMMENTS_FINAL");
if (savedComments) {
    try { FAMILY_COMMENTS_DATA = JSON.parse(savedComments); } catch (e) {}
}

let FLAT_MEMBERS = [];
let CURRENT_BRANCH_FILTER = "ALL";
let CURRENT_D3_MODE = "horizontal";
let CURRENT_LANG = localStorage.getItem("VANSH_LANG_PREF") || "hi";
let D3_ZOOM_BEHAVIOR = null;
let D3_SVG_SEL = null;

function getMainSixBranches() {
    const chamanNode = (FAMILY_TREE_DATA.children || []).find(c => c.id === "chaman");
    return (chamanNode && chamanNode.children) ? chamanNode.children : [];
}

/* =========================================================================
   2. LANGUAGE ENGINE (HINDI ⇄ ENGLISH) & DISPLAY HELPERS
========================================================================= */
function getDisplayName(memberOrNode) {
    if (!memberOrNode) return "";
    if (CURRENT_LANG === "en" && memberOrNode.en && memberOrNode.en.trim()) {
        const prefixMatch = (memberOrNode.name || "").match(/^([0-9]+\.\s*)/);
        const prefix = prefixMatch ? prefixMatch[1] : "";
        return prefix + memberOrNode.en.trim();
    }
    return memberOrNode.name || "";
}

function getBranchLabelDisplay(branchStr) {
    if (!branchStr) return CURRENT_LANG === "en" ? "Main Lineage" : "मूल शाखा";
    if (CURRENT_LANG === "hi") return branchStr;
    const map = {
        "मूल पुरुष (१ली पीढ़ी)": "Root Ancestor (Gen 1)",
        "द्वितीय पीढ़ी": "2nd Generation",
        "शाखा 1: मोहन महतो": "Branch 1: Mohan Mahto",
        "शाखा 2: लछु महतो": "Branch 2: Lachhu Mahto",
        "शाखा 3: नेमचंद महतो": "Branch 3: Nemchand Mahto",
        "शाखा 4: हुकुमचंद महतो": "Branch 4: Hukumchand Mahto",
        "शाखा 5: दिपचंद महतो": "Branch 5: Dipchand Mahto",
        "शाखा 6: छोटू महतो": "Branch 6: Chhotu Mahto"
    };
    return map[branchStr] || branchStr;
}

function getGenLabelHi(gen) {
    if (CURRENT_LANG === "en") {
        if (gen === 1) return "Gen 1 (Root)";
        if (gen === 2) return "Gen 2";
        if (gen === 3) return "Gen 3 (Branch)";
        return `Gen ${gen}`;
    }
    if (gen === 1) return "१ली पीढ़ी (मूल)";
    if (gen === 2) return "२री पीढ़ी";
    if (gen === 3) return "३री पीढ़ी (शाखा)";
    if (gen === 4) return "४थी पीढ़ी";
    if (gen === 5) return "५वीं पीढ़ी";
    return `${gen}वीं पीढ़ी`;
}

function toggleLanguageSwitch() {
    setLanguage(CURRENT_LANG === "hi" ? "en" : "hi");
}

function setLanguage(lang) {
    CURRENT_LANG = (lang === "en") ? "en" : "hi";
    localStorage.setItem("VANSH_LANG_PREF", CURRENT_LANG);
    document.documentElement.setAttribute("lang", CURRENT_LANG);

    // Update Symbolic Header Switch [ अ | A ]
    const symHi = document.getElementById("symLangHi");
    const symEn = document.getElementById("symLangEn");
    if (symHi && symEn) {
        symHi.classList.toggle("active", CURRENT_LANG === "hi");
        symEn.classList.toggle("active", CURRENT_LANG === "en");
    }

    // Update Sidebar Language Buttons
    const sbHi = document.getElementById("sbLangHiBtn");
    const sbEn = document.getElementById("sbLangEnBtn");
    if (sbHi && sbEn) {
        sbHi.classList.toggle("active-theme", CURRENT_LANG === "hi");
        sbEn.classList.toggle("active-theme", CURRENT_LANG === "en");
    }

    const isEn = (CURRENT_LANG === "en");
    const setTxt = (id, hi, en) => {
        const el = document.getElementById(id);
        if (el) el.innerText = isEn ? en : hi;
    };

    setTxt("hdrMenuTxt", "मेनू", "Menu");
    setTxt("hdrHomeTxt", "होम", "Home");
    setTxt("title-text", "स्व. नारायण महतो का वंशावली", "Family Tree of Late Narayan Mahto");
    setTxt("tagline-text", "✨ हमारा परिवार, हमारा रजक समाज! ✨", "✨ Our Family, Our Rajak Heritage! ✨");
    setTxt("location-text", "आशानगर, थाना- सोहसराय, बिहार शरीफ (नालंदा)", "Asha Nagar, P.S.- Sohsarai, Bihar Sharif (Nalanda)");
    setTxt("note-text", "ℹ️ नोट :- यह आँकड़ा स्मरण के आधार पर पारिवारिक सदस्यों द्वारा तैयार किया गया है!", "ℹ️ Note: This lineage record has been compiled by family members based on collective memory!");

    setTxt("lblStatTotal", "कुल पारिवारिक सदस्य", "Total Family Members");
    setTxt("lblStatBranches", "मुख्य शाखाएँ", "Main Branches");
    setTxt("lblStatGens", "पीढ़ियाँ", "Generations");
    setTxt("lblStatVisits", "कुल दर्शक (Total Visits)", "Total Visitors");

    setTxt("ctrlHomeBtn", "🏠 होम", "🏠 Home");
    setTxt("lblViewPicker", "👁️ दृश्य चुनें:", "👁️ View:");
    setTxt("ctrlPrintBtn", "🖨️ प्रिंट / PDF", "🖨️ Print / PDF");
    setTxt("btnExpandAll", "📂 सभी खोलें", "📂 Expand All");
    setTxt("btnCollapseAll", "📁 संक्षिप्त करें", "📁 Collapse");
    setTxt("backToHomeBtn", "⬅️ वापस होम (मुख्य वृक्ष) पर जाएँ", "⬅️ Back to Home (Main Tree)");
    setTxt("currentViewLabel", "📌 किसी भी नाम पर क्लिक करके फोटो व वंश-पथ देखें | ➕ दबाकर नई संतान जोड़ें", "📌 Click any member name for photo & lineage | Press ➕ to add child");

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.placeholder = isEn ? "🔍 Search member name (Hindi / English)..." : "🔍 सदस्य का नाम खोजें (हिंदी / English)...";
    }

    const todayBadge = document.getElementById("stat-today-badge");
    if (todayBadge && todayBadge.dataset.count) {
        todayBadge.innerText = isEn ? `Today: ${todayBadge.dataset.count}` : `आज: ${todayBadge.dataset.count}`;
    }

    renderAllViews();
    const radialSec = document.getElementById("view-radial");
    if (radialSec && radialSec.classList.contains("active")) {
        renderD3Diagram(CURRENT_D3_MODE);
    }
}

/* =========================================================================
   3. SMART PHOTO & SVG AVATAR RESOLVER
========================================================================= */
function resolvePhotoUrl(rawPath) {
    if (!rawPath || !rawPath.trim()) return "";
    const trimmed = rawPath.trim();
    const driveMatch = trimmed.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{15,})/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w400`;
    }
    return trimmed;
}

function getCleanInitials(name) {
    if (!name) return "वंश";
    return name.replace(/^[0-9]+\.\s*/, "").replace("स्व.", "").replace("Late ", "").trim().slice(0, 2);
}

function buildSvgFallbackDataUri(name, gen = 5) {
    const initials = getCleanInitials(name);
    const bgColors = ["#7C2D12", "#B45309", "#9A3412", "#047857", "#0369A1", "#6D28D9", "#991B1B"];
    const bg = bgColors[(gen - 1) % bgColors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="38" fill="${bg}" stroke="#FDE68A" stroke-width="3"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Noto Sans Devanagari, sans-serif" font-weight="800" font-size="26">${initials}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function renderMemberAvatarHtml(member, cssClass = "member-thumb") {
    const dispName = getDisplayName(member);
    const fallbackUri = buildSvgFallbackDataUri(dispName, member.gen);
    const photoUrl = resolvePhotoUrl(member.photo);
    const srcToUse = photoUrl || fallbackUri;
    return `<img src="${srcToUse}" alt="${dispName}" class="${cssClass}" onerror="this.onerror=null;this.src='${fallbackUri}';">`;
}

/* =========================================================================
   4. FLATTEN TREE & INDEX MEMBERS
========================================================================= */
function rebuildFlatIndex(node = FAMILY_TREE_DATA, parentId = null, ancestorChain = []) {
    if (node.id === "root-1") FLAT_MEMBERS = [];
    const currentChain = [...ancestorChain, { id: node.id, name: node.name, en: node.en || "", gen: node.gen }];
    FLAT_MEMBERS.push({
        id: node.id,
        name: node.name,
        en: node.en || "",
        gen: node.gen || 1,
        branch: node.branch || "मूल शाखा",
        location: node.location || "आशानगर, बिहार शरीफ",
        notes: node.notes || "",
        photo: node.photo || "",
        parentId: parentId,
        ancestors: currentChain,
        childCount: (node.children || []).length,
        rawRef: node
    });
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => rebuildFlatIndex(child, node.id, currentChain));
    }
}

/* =========================================================================
   5. SMART FUZZY & PHONETIC SEARCH ENGINE
========================================================================= */
function normalizePhonetic(str) {
    if (!str) return "";
    return str.toLowerCase().trim()
        .replace(/स/g, 'श').replace(/ष/g, 'श')
        .replace(/ी/g, 'ि').replace(/ू/g, 'ु')
        .replace(/ब/g, 'व')
        .replace(/ph/g, 'f').replace(/sh/g, 's')
        .replace(/ee/g, 'i').replace(/oo/g, 'u')
        .replace(/ai/g, 'ay').replace(/chh/g, 'ch')
        .replace(/\s+/g, ' ');
}

function getEditDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    return matrix[a.length][b.length];
}

function computeFuzzyScore(query, member) {
    const qNorm = normalizePhonetic(query);
    const nameHi = normalizePhonetic(member.name);
    const nameEn = normalizePhonetic(member.en);
    if (nameHi.includes(qNorm) || nameEn.includes(qNorm)) return 100;

    const tokens = `${nameHi} ${nameEn}`.split(' ').filter(Boolean);
    let best = 0;
    for (const token of tokens) {
        if (token.startsWith(qNorm)) return 95;
        const dist = getEditDistance(qNorm, token.slice(0, Math.max(qNorm.length, token.length)));
        const maxLen = Math.max(qNorm.length, token.length);
        const sim = ((maxLen - dist) / maxLen) * 100;
        if (sim > best) best = sim;
    }
    return best;
}

function handleSmartSearch(query) {
    const box = document.getElementById("searchSuggestions");
    if (!query || query.trim().length < 1) {
        box.style.display = "none";
        return;
    }
    const scored = FLAT_MEMBERS.map(m => ({ member: m, score: computeFuzzyScore(query, m) }))
        .filter(item => item.score >= 48)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    if (scored.length === 0) {
        box.innerHTML = `<div class="suggestion-item"><span>${CURRENT_LANG === 'en' ? 'No matching member found' : 'कोई मिलता-जुलता नाम नहीं मिला'}</span></div>`;
        box.style.display = "block";
        return;
    }

    box.innerHTML = scored.map(({ member, score }) => `
        <div class="suggestion-item" onclick="focusOnMember('${member.id}')">
            <div style="display:flex; align-items:center; gap:10px;">
                ${renderMemberAvatarHtml(member, "member-thumb")}
                <div>
                    <strong>${getDisplayName(member)}</strong> ${member.en && CURRENT_LANG === 'hi' ? `<span style="color:var(--text-muted); font-size:0.8rem;">(${member.en})</span>` : ''}
                    <div style="font-size:0.75rem; color:var(--text-muted);">
                        ${getBranchLabelDisplay(member.branch)} • ${getGenLabelHi(member.gen)} • 📍 ${member.location}
                    </div>
                </div>
            </div>
            <span class="gen-badge">${score >= 95 ? (CURRENT_LANG === 'en' ? 'Exact' : 'सटीक मिलान') : (CURRENT_LANG === 'en' ? 'Similar' : 'मिलता-जुलता')}</span>
        </div>
    `).join("");
    box.style.display = "block";
}

function focusOnMember(memberId) {
    document.getElementById("searchSuggestions").style.display = "none";
    CURRENT_BRANCH_FILTER = "ALL";
    document.getElementById("branchSelect").value = "ALL";
    selectUnifiedView("tree");
    renderTreeView();

    const targetMember = FLAT_MEMBERS.find(m => m.id === memberId);
    if (targetMember && targetMember.ancestors) {
        targetMember.ancestors.forEach(anc => {
            const liEl = document.getElementById(`li-${anc.id}`);
            if (liEl) liEl.classList.remove("collapsed");
        });
    }

    setTimeout(() => {
        document.querySelectorAll(".node-box").forEach(el => el.classList.remove("highlight-focus"));
        const boxEl = document.getElementById(`box-${memberId}`);
        if (boxEl) {
            boxEl.classList.add("highlight-focus");
            boxEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    }, 120);
}

/* =========================================================================
   6. VIEW 1: CLASSIC COLLAPSIBLE TREE VIEW
========================================================================= */
function buildClassicTreeHtml(node) {
    const childrenToRender = (node.id === "chaman" && CURRENT_BRANCH_FILTER !== "ALL")
        ? (node.children || []).filter(c => c.branch === CURRENT_BRANCH_FILTER)
        : (node.children || []);

    const hasKids = childrenToRender.length > 0;
    const defaultCollapsed = (hasKids && node.gen >= 3 && CURRENT_BRANCH_FILTER === "ALL") ? "collapsed" : "";
    const liClass = `${hasKids ? 'has-children' : ''} ${defaultCollapsed}`.trim();

    let boxTypeClass = "";
    if (node.gen === 1) boxTypeClass = "root-box";
    else if (node.gen === 2) boxTypeClass = "gen2-box";
    else if (node.gen === 3) boxTypeClass = "branch-box";

    const toggleHtml = hasKids
        ? `<span class="toggle-btn" onclick="toggleCollapse(event, '${node.id}')">▼</span>`
        : "";

    const notesBadge = node.notes
        ? `<span class="badge-note">${node.notes}</span>`
        : "";

    const avatarThumb = renderMemberAvatarHtml(node, "member-thumb");
    const dispName = getDisplayName(node);

    const childrenUl = hasKids
        ? `<ul>${childrenToRender.map(c => buildClassicTreeHtml(c)).join("")}</ul>`
        : "";

    return `
        <li id="li-${node.id}" class="${liClass}">
            <div class="node-box ${boxTypeClass}" id="box-${node.id}">
                ${toggleHtml}
                ${avatarThumb}
                <span class="node-name" onclick="openMemberProfileModal('${node.id}')">${dispName}</span>
                <span class="gen-badge">${getGenLabelHi(node.gen)}</span>
                ${notesBadge}
                <span class="action-btns no-print">
                    <button class="action-btn" onclick="openMemberRequestModal('${node.id}', 'ADD')" title="संतान जोड़ें">➕</button>
                    <button class="action-btn" onclick="openMemberRequestModal('${node.id}', 'EDIT')" title="सुधार / फोटो जोड़ें">✏️</button>
                </span>
            </div>
            ${childrenUl}
        </li>
    `;
}

function renderTreeView() {
    const container = document.getElementById("treeContainer");
    container.innerHTML = `<ul class="tree" style="padding-left:0;">${buildClassicTreeHtml(FAMILY_TREE_DATA)}</ul>`;
}

function toggleCollapse(e, nodeId) {
    e.stopPropagation();
    const li = document.getElementById(`li-${nodeId}`);
    if (li) li.classList.toggle("collapsed");
}

function expandAll() {
    document.querySelectorAll("#treeContainer li.has-children").forEach(li => li.classList.remove("collapsed"));
}

function collapseAll() {
    document.querySelectorAll("#treeContainer li.has-children").forEach(li => {
        if (li.id !== "li-root-1" && li.id !== "li-chaman") {
            li.classList.add("collapsed");
        }
    });
}

function handleBranchSelect(val) {
    CURRENT_BRANCH_FILTER = val;
    selectUnifiedView("tree");
    renderTreeView();
    const backBtn = document.getElementById("backToHomeBtn");
    if (val !== "ALL") {
        expandAll();
        if (backBtn) backBtn.style.display = "inline-flex";
    } else if (backBtn) {
        backBtn.style.display = "none";
    }
}

function openMemberProfileModal(memberId) {
    const m = FLAT_MEMBERS.find(x => x.id === memberId);
    if (!m) return;

    const pathStr = m.ancestors.map(a => getDisplayName(a)).join(" ➔ ");
    document.getElementById("currentViewLabel").innerHTML = `📌 <strong>${getDisplayName(m)}:</strong> ${pathStr} ${m.notes ? `| <strong>${m.notes}</strong>` : ''}`;

    const fallbackUri = buildSvgFallbackDataUri(getDisplayName(m), m.gen);
    const photoUrl = resolvePhotoUrl(m.photo) || fallbackUri;
    const kids = (m.rawRef && m.rawRef.children) ? m.rawRef.children : [];

    document.getElementById("memberProfileBody").innerHTML = `
        <div style="margin: 10px 0 14px;">
            <img src="${photoUrl}" alt="${m.name}" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:4px solid var(--accent-gold); box-shadow:0 6px 18px rgba(0,0,0,0.18);" onerror="this.onerror=null;this.src='${fallbackUri}';">
        </div>
        <h2 style="margin:0; color:var(--primary); font-size:1.4rem;">${m.name}</h2>
        ${m.en ? `<div style="color:var(--text-muted); font-size:0.9rem; font-weight:600; margin-bottom:8px;">${m.en}</div>` : ''}
        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin:10px 0;">
            <span class="gen-badge" style="font-size:0.8rem; padding:4px 10px;">👑 ${getGenLabelHi(m.gen)}</span>
            <span class="gen-badge" style="font-size:0.8rem; padding:4px 10px;">🌿 ${getBranchLabelDisplay(m.branch)}</span>
        </div>
        ${m.notes ? `<div style="margin:8px 0; font-weight:700; color:#991B1B; background:#FEE2E2; display:inline-block; padding:4px 12px; border-radius:999px; font-size:0.84rem;">${m.notes}</div>` : ''}
        <div style="font-size:0.86rem; color:var(--text-muted); margin-top:6px;">📍 ${CURRENT_LANG === 'en' ? 'Location' : 'निवास'}: <strong>${m.location}</strong></div>
        <div style="background:var(--bg); padding:12px; border-radius:10px; border:1px solid var(--border); margin-top:14px; text-align:left; font-size:0.84rem;">
            <div style="font-weight:800; color:var(--primary); margin-bottom:4px;">📜 ${CURRENT_LANG === 'en' ? 'Lineage Path' : 'संपूर्ण वंश-पथ'}:</div>
            <div style="line-height:1.6;">${pathStr}</div>
            ${kids.length > 0 ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border);"><strong>👶 ${CURRENT_LANG === 'en' ? 'Children' : 'संतान'} (${kids.length}):</strong> ${kids.map(k => getDisplayName(k)).join(", ")}</div>` : ''}
        </div>
        <div style="display:flex; justify-content:center; gap:8px; margin-top:16px;">
            <button class="ctrl-btn ctrl-btn-primary" onclick="closeModal('memberProfileModal'); openMemberRequestModal('${m.id}', 'ADD');">➕ ${CURRENT_LANG === 'en' ? 'Add Child' : 'संतान जोड़ें'}</button>
            <button class="ctrl-btn" onclick="closeModal('memberProfileModal'); openMemberRequestModal('${m.id}', 'EDIT');">✏️ ${CURRENT_LANG === 'en' ? 'Edit / Photo' : 'विवरण / फोटो सुधारें'}</button>
        </div>
    `;
    openModal("memberProfileModal");
}

/* =========================================================================
   7. VIEW 2 & 3: HIGH-RESOLUTION D3.JS 360° RADIAL & HORIZONTAL CHART
========================================================================= */
function renderD3Diagram(mode = "horizontal") {
    CURRENT_D3_MODE = mode;
    const container = document.getElementById("d3VizContainer");
    container.querySelectorAll("svg").forEach(s => s.remove());

    const btnRad = document.getElementById("d3BtnRadial");
    const btnHor = document.getElementById("d3BtnHoriz");
    if (btnRad && btnHor) {
        btnRad.classList.toggle("ctrl-btn-primary", mode === "radial");
        btnHor.classList.toggle("ctrl-btn-primary", mode === "horizontal");
    }

    const width = container.clientWidth || 1150;
    const height = container.clientHeight || 660;

    const svg = d3.select("#d3VizContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("font-family", "'Noto Sans Devanagari', 'Inter', sans-serif");

    const g = svg.append("g");
    D3_SVG_SEL = svg;

    D3_ZOOM_BEHAVIOR = d3.zoom()
        .scaleExtent([0.15, 3.5])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(D3_ZOOM_BEHAVIOR);
    const root = d3.hierarchy(FAMILY_TREE_DATA);

    if (mode === "radial") {
        const radius = 1150;
        const treeLayout = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

        treeLayout(root);

        g.selectAll("path.link")
            .data(root.links())
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "var(--line-color)")
            .attr("stroke-opacity", 0.7)
            .attr("stroke-width", 2)
            .attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y));

        const node = g.selectAll("g.node")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

        node.append("circle")
            .attr("r", d => d.depth === 0 ? 8 : (d.children ? 5.5 : 4.2))
            .attr("fill", d => d.children ? "var(--primary)" : "#059669")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 8 : -8)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
            .style("font-size", "12px")
            .style("font-weight", "700")
            .style("fill", "var(--text)")
            .style("paint-order", "stroke")
            .style("stroke", "var(--card-bg)")
            .style("stroke-width", "3.5px")
            .text(d => getDisplayName(d.data));

        svg.call(D3_ZOOM_BEHAVIOR.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.32));
    } else {
        const dx = 32;
        const dy = 260;
        const treeLayout = d3.tree().nodeSize([dx, dy]);
        treeLayout(root);

        g.selectAll("path.link")
            .data(root.links())
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "var(--line-color)")
            .attr("stroke-opacity", 0.75)
            .attr("stroke-width", 2.2)
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        const node = g.selectAll("g.node")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("r", d => d.depth === 0 ? 8 : (d.children ? 6 : 4.5))
            .attr("fill", d => d.children ? "var(--primary)" : "#059669")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        node.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.children ? -10 : 10)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .style("font-size", "13.5px")
            .style("font-weight", "700")
            .style("fill", "var(--text)")
            .style("paint-order", "stroke")
            .style("stroke", "var(--card-bg)")
            .style("stroke-width", "4px")
            .text(d => getDisplayName(d.data));

        svg.call(D3_ZOOM_BEHAVIOR.transform, d3.zoomIdentity.translate(140, height / 2).scale(0.65));
    }
}

function zoomD3(factor) {
    if (D3_SVG_SEL && D3_ZOOM_BEHAVIOR) {
        D3_SVG_SEL.transition().duration(250).call(D3_ZOOM_BEHAVIOR.scaleBy, factor);
    }
}

function resetD3Zoom() {
    renderD3Diagram(CURRENT_D3_MODE);
}

/* =========================================================================
   8. VIEW 4, 5, 6, 7, 8: CARDS, ANALYTICS, KINSHIP, GEOGRAPHY & COMMENTS
========================================================================= */
function renderCardView() {
    const maxGen = Math.max(...FLAT_MEMBERS.map(m => m.gen));
    let html = "";
    for (let g = 1; g <= maxGen; g++) {
        const genMembers = FLAT_MEMBERS.filter(m => m.gen === g);
        html += `
            <div class="gen-row">
                <div class="gen-header">
                    <div class="gen-title">👑 ${getGenLabelHi(g)}</div>
                    <span class="gen-count-badge">${genMembers.length} ${CURRENT_LANG === 'en' ? 'Members' : 'सदस्य'}</span>
                </div>
                <div class="member-avatar-grid">
                    ${genMembers.map(m => `
                        <div class="avatar-card" onclick="openMemberProfileModal('${m.id}')">
                            ${renderMemberAvatarHtml(m, "avatar-photo-lg")}
                            <div>
                                <div class="avatar-name">${getDisplayName(m)}</div>
                                <div style="font-size:0.74rem; color:var(--text-muted);">${getBranchLabelDisplay(m.branch)}</div>
                                ${m.notes ? `<div style="font-size:0.74rem; color:var(--primary); font-weight:700;">${m.notes}</div>` : ''}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }
    document.getElementById("roadmapContainer").innerHTML = html;
}

function buildPictorialBranchDonutSvg(branchCounts, total) {
    const colors = ["#9A3412", "#D97706", "#059669", "#0284C7", "#7C3AED", "#BE185D"];
    let cumulativePercent = 0;

    function getCoordinatesForPercent(percent) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    const slices = branchCounts.map((b, i) => {
        const pct = b.count / total;
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += pct;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = pct > 0.5 ? 1 : 0;
        const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
        return `<path d="${pathData}" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="0.03"></path>`;
    }).join("");

    const legend = branchCounts.map((b, i) => `
        <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:700;">
            <span style="width:12px; height:12px; border-radius:3px; background:${colors[i % colors.length]}; display:inline-block;"></span>
            <span>${getBranchLabelDisplay(b.name)}: ${b.count} (${b.pct}%)</span>
        </div>
    `).join("");

    return `
        <div style="display:flex; align-items:center; justify-content:center; gap:20px; flex-wrap:wrap; margin-bottom:18px; padding:12px; background:var(--bg); border-radius:10px;">
            <svg viewBox="-1.1 -1.1 2.2 2.2" style="width:135px; height:135px; transform:rotate(-90deg);">
                ${slices}
                <circle cx="0" cy="0" r="0.55" fill="var(--card-bg)"></circle>
            </svg>
            <div style="display:grid; grid-template-columns:1fr; gap:5px;">
                ${legend}
            </div>
        </div>
    `;
}

function renderAnalyticsDashboard() {
    const totalMembers = FLAT_MEMBERS.length;
    const maxGen = Math.max(...FLAT_MEMBERS.map(m => m.gen));
    const mainBranches = getMainSixBranches();
    const uniqueLocations = new Set(FLAT_MEMBERS.map(m => m.location.trim())).size;

    document.getElementById("stat-total").innerText = totalMembers;
    document.getElementById("stat-branches").innerText = mainBranches.length;
    document.getElementById("stat-gens").innerText = maxGen;

    document.getElementById("analyticsKpiGrid").innerHTML = `
        <div class="kpi-card"><div class="kpi-value">${totalMembers}</div><div class="kpi-label">${CURRENT_LANG === 'en' ? 'Total Members' : 'कुल पंजीकृत सदस्य'}</div></div>
        <div class="kpi-card"><div class="kpi-value">${mainBranches.length}</div><div class="kpi-label">${CURRENT_LANG === 'en' ? 'Main Branches' : 'मुख्य वंश शाखाएँ'}</div></div>
        <div class="kpi-card"><div class="kpi-value">${maxGen}</div><div class="kpi-label">${CURRENT_LANG === 'en' ? 'Generations' : 'कुल पीढ़ियाँ'}</div></div>
        <div class="kpi-card"><div class="kpi-value">${uniqueLocations}</div><div class="kpi-label">${CURRENT_LANG === 'en' ? 'Locations' : 'निवास क्षेत्र'}</div></div>
    `;

    const branchStats = mainBranches.map(b => {
        const count = FLAT_MEMBERS.filter(m => m.branch === b.branch).length;
        const pct = Math.round((count / totalMembers) * 100);
        return { name: b.branch, count, pct };
    });

    const donutHtml = buildPictorialBranchDonutSvg(branchStats, totalMembers);

    document.getElementById("branchComparisonBars").innerHTML = donutHtml + branchStats.map(b => `
        <div class="bar-row">
            <div class="bar-label-line"><span>${getBranchLabelDisplay(b.name)}</span><span>${b.count} (${b.pct}%)</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.max(b.pct, 6)}%;"></div></div>
        </div>
    `).join("");

    let genBarsHtml = "";
    for (let g = 1; g <= maxGen; g++) {
        const count = FLAT_MEMBERS.filter(m => m.gen === g).length;
        const pct = Math.round((count / totalMembers) * 100);
        genBarsHtml += `
            <div class="bar-row">
                <div class="bar-label-line"><span>${getGenLabelHi(g)}</span><span>${count} (${pct}%)</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max(pct, 4)}%;"></div></div>
            </div>
        `;
    }
    document.getElementById("generationComparisonBars").innerHTML = genBarsHtml;
}

function populateKinshipSelectors() {
    const optionsHtml = FLAT_MEMBERS.map(m => `<option value="${m.id}">${getDisplayName(m)} (${getGenLabelHi(m.gen)} - ${getBranchLabelDisplay(m.branch)})</option>`).join("");
    const selA = document.getElementById("kinMemberA");
    const selB = document.getElementById("kinMemberB");
    if (selA && selB) {
        selA.innerHTML = optionsHtml;
        selB.innerHTML = optionsHtml;
        if (FLAT_MEMBERS.length > 2) selB.selectedIndex = FLAT_MEMBERS.length - 1;
    }
}

function calculateKinship() {
    const idA = document.getElementById("kinMemberA").value;
    const idB = document.getElementById("kinMemberB").value;
    const memA = FLAT_MEMBERS.find(m => m.id === idA);
    const memB = FLAT_MEMBERS.find(m => m.id === idB);
    const resBox = document.getElementById("kinshipResultArea");
    if (!memA || !memB) return;

    if (idA === idB) {
        resBox.innerHTML = `<div class="analytics-panel" style="text-align:center;">आपने दोनों स्थानों पर एक ही सदस्य (<strong>${getDisplayName(memA)}</strong>) को चुना है।</div>`;
        return;
    }

    let commonAncestor = memA.ancestors[0];
    const minLen = Math.min(memA.ancestors.length, memB.ancestors.length);
    for (let i = 0; i < minLen; i++) {
        if (memA.ancestors[i].id === memB.ancestors[i].id) commonAncestor = memA.ancestors[i];
        else break;
    }

    const distA = memA.gen - commonAncestor.gen;
    const distB = memB.gen - commonAncestor.gen;
    const genDiff = Math.abs(memA.gen - memB.gen);

    let relationTitle = "";
    if (commonAncestor.id === memA.id) {
        relationTitle = distB === 1 ? "पिता - पुत्र (Father - Son)" : distB === 2 ? "दादा - पोता (Grandfather - Grandson)" : `सीधे पूर्वज और वंशज (${distB} पीढ़ी का अंतर)`;
    } else if (commonAncestor.id === memB.id) {
        relationTitle = distA === 1 ? "पुत्र - पिता (Son - Father)" : distA === 2 ? "पोता - दादा (Grandson - Grandfather)" : `सीधे वंशज और पूर्वज (${distA} पीढ़ी का अंतर)`;
    } else if (distA === 1 && distB === 1) {
        relationTitle = "सगे भाई (Real Brothers)";
    } else if (memA.gen === memB.gen) {
        relationTitle = "चचेरे / पट्टीदार भाई (Cousin Brothers - समान पीढ़ी)";
    } else if (genDiff === 1) {
        relationTitle = "चाचा / ताऊ एवं भतीजा (Uncle & Nephew)";
    } else if (genDiff === 2) {
        relationTitle = "दादा एवं पोता (Grandfather & Grandson Line)";
    } else {
        relationTitle = `पारिवारिक रक्त संबंध (${genDiff} पीढ़ी का अंतर)`;
    }

    const upPath = [...memA.ancestors].reverse();
    const lcaIdxUp = upPath.findIndex(a => a.id === commonAncestor.id);
    const lcaIdxDown = memB.ancestors.findIndex(a => a.id === commonAncestor.id);
    const fullChain = [...upPath.slice(0, lcaIdxUp + 1), ...memB.ancestors.slice(lcaIdxDown + 1)];

    resBox.innerHTML = `
        <div class="analytics-panel" style="text-align:center; border-top:4px solid var(--primary);">
            <div style="font-size:0.85rem; color:var(--text-muted);">आपसी संबंध परिणाम</div>
            <h3 style="color:var(--primary); font-size:1.35rem; margin:6px 0;">${relationTitle}</h3>
            <p style="font-size:0.9rem;">साझे पूर्वज (Common Ancestor): <strong>${getDisplayName(commonAncestor)} (${getGenLabelHi(commonAncestor.gen)})</strong></p>
            <div class="path-chain-box">
                ${fullChain.map((step, idx) => `
                    <span style="padding:6px 12px; border-radius:8px; background:${step.id === commonAncestor.id ? 'var(--primary)' : 'var(--card-bg)'}; color:${step.id === commonAncestor.id ? '#fff' : 'var(--text)'}; border:1px solid var(--border); font-weight:700; font-size:0.85rem;">
                        ${getDisplayName(step)} (${getGenLabelHi(step.gen)})
                    </span>
                    ${idx < fullChain.length - 1 ? `<span style="color:var(--primary); font-weight:bold;">➔</span>` : ''}
                `).join("")}
            </div>
        </div>
    `;
}

function renderGeographyView() {
    const locMap = {};
    FLAT_MEMBERS.forEach(m => {
        const loc = m.location || "आशानगर, बिहार शरीफ";
        if (!locMap[loc]) locMap[loc] = [];
        locMap[loc].push(m);
    });

    document.getElementById("geographyGridContainer").innerHTML = Object.entries(locMap).map(([loc, members]) => `
        <div class="analytics-panel">
            <h4 style="color:var(--primary); margin-bottom:8px;">📍 ${loc}</h4>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:10px;">कुल सदस्य: ${members.length}</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${members.map(m => `<span class="gen-badge" style="cursor:pointer; padding:4px 9px;" onclick="focusOnMember('${m.id}')">${getDisplayName(m)}</span>`).join("")}
            </div>
        </div>
    `).join("");
}

function renderCommentsView() {
    document.getElementById("commentsListContainer").innerHTML = FAMILY_COMMENTS_DATA.map(c => `
        <div class="analytics-panel" style="border-left:4px solid var(--primary);">
            <p style="font-size:0.95rem; margin-bottom:10px;">"${c.text}"</p>
            <div style="font-size:0.8rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                <strong>— ${c.author} (${c.branch})</strong>
                <span>${c.date}</span>
            </div>
        </div>
    `).join("");
}

function submitFamilyComment() {
    const author = document.getElementById("commentAuthor").value.trim();
    const branch = document.getElementById("commentBranch").value.trim() || "आशानगर, बिहार शरीफ";
    const text = document.getElementById("commentText").value.trim();
    if (!author || !text) {
        alert("कृपया अपना नाम और संदेश दोनों लिखें।");
        return;
    }
    FAMILY_COMMENTS_DATA.unshift({
        id: "c-" + Date.now(),
        author,
        branch,
        date: new Date().toLocaleDateString('hi-IN'),
        text
    });
    localStorage.setItem("NARAYAN_MAHTO_COMMENTS_FINAL", JSON.stringify(FAMILY_COMMENTS_DATA));
    document.getElementById("commentAuthor").value = "";
    document.getElementById("commentText").value = "";
    renderCommentsView();
}

/* =========================================================================
   9. UNIFIED VIEW PICKER, HOME/BACK NAVIGATION & 10-THEME SWITCHER
========================================================================= */
function toggleSidebar(open) {
    const drawer = document.getElementById("sidebarDrawer");
    const overlay = document.getElementById("sidebarOverlay");
    if (open) {
        drawer.classList.add("open");
        overlay.style.display = "block";
    } else {
        drawer.classList.remove("open");
        overlay.style.display = "none";
    }
}

function changeTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("VANSHAWALI_THEME_FINAL", themeName);

    document.querySelectorAll(".theme-chip-btn").forEach(btn => {
        const isMatch = btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${themeName}'`);
        btn.classList.toggle("active-theme", Boolean(isMatch));
    });

    const radialView = document.getElementById("view-radial");
    if (radialView && radialView.classList.contains("active")) {
        renderD3Diagram(CURRENT_D3_MODE);
    }
}

function selectUnifiedView(viewChoice) {
    const mainSelect = document.getElementById("unifiedViewSelect");
    const sideSelect = document.getElementById("sidebarViewPicker");
    if (mainSelect) mainSelect.value = viewChoice;
    if (sideSelect) sideSelect.value = viewChoice;

    let sectionKey = viewChoice;
    if (viewChoice === "radial_sun") {
        sectionKey = "radial";
        CURRENT_D3_MODE = "radial";
    } else if (viewChoice === "radial_horiz") {
        sectionKey = "radial";
        CURRENT_D3_MODE = "horizontal";
    }

    document.querySelectorAll(".view-section-box").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(`view-${sectionKey}`);
    if (target) target.classList.add("active");

    const backBtn = document.getElementById("backToHomeBtn");
    if (backBtn) {
        const isDefaultHome = (viewChoice === "tree" && CURRENT_BRANCH_FILTER === "ALL");
        backBtn.style.display = isDefaultHome ? "none" : "inline-flex";
    }

    if (sectionKey === "radial") {
        setTimeout(() => renderD3Diagram(CURRENT_D3_MODE), 60);
    }
}

function switchView(viewKey) {
    if (viewKey === "radial") {
        selectUnifiedView(CURRENT_D3_MODE === "radial" ? "radial_sun" : "radial_horiz");
    } else {
        selectUnifiedView(viewKey);
    }
}

function goHomeView() {
    CURRENT_BRANCH_FILTER = "ALL";
    const branchSel = document.getElementById("branchSelect");
    if (branchSel) branchSel.value = "ALL";

    const searchIn = document.getElementById("searchInput");
    if (searchIn) searchIn.value = "";
    const suggBox = document.getElementById("searchSuggestions");
    if (suggBox) suggBox.style.display = "none";

    selectUnifiedView("tree");
    renderTreeView();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function togglePublicEditMode() {
    const isEnabled = document.body.classList.toggle("edit-mode-enabled");
    const btn = document.getElementById("toggleEditModeBtn");
    const statusTxt = document.getElementById("editModeStatusText");
    if (isEnabled) {
        btn.classList.add("active-mode");
        statusTxt.innerText = "सक्रिय (ON)";
    } else {
        btn.classList.remove("active-mode");
        statusTxt.innerText = "बंद";
    }
    toggleSidebar(false);
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "flex";
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function openAboutModal() {
    toggleSidebar(false);
    openModal("aboutModal");
}

/* =========================================================================
   10. ADD / EDIT MEMBER (2 BOXES: HINDI + ENGLISH & DIRECT ADD IF ADMIN LOGGED IN)
========================================================================= */
let PENDING_REQUESTS = [];
const savedPending = localStorage.getItem("NARAYAN_MAHTO_PENDING_FINAL");
if (savedPending) {
    try { PENDING_REQUESTS = JSON.parse(savedPending); } catch (e) {}
}

function updatePendingBadge() {
    const badge = document.getElementById("pendingBadgeCount");
    if (badge) badge.innerText = PENDING_REQUESTS.length;
}

function openMemberRequestModal(targetId, actionType) {
    const member = FLAT_MEMBERS.find(m => m.id === targetId);
    if (!member) return;

    document.getElementById("editTargetId").value = targetId;
    document.getElementById("editActionType").value = actionType;

    const noticeEl = document.getElementById("editModalNoticeText");
    const submitBtn = document.getElementById("editModalSubmitBtn");
    const subByGroup = document.getElementById("submittedByGroup");

    // यदि Admin लॉगिन सक्रिय है, तो डायरेक्ट सेव मोड दिखाएँ
    if (IS_ADMIN_LOGGED_IN) {
        if (noticeEl) {
            noticeEl.style.color = "#059669";
            noticeEl.innerHTML = "🟢 <strong>Admin Mode सक्रिय:</strong> आपके द्वारा किया गया बदलाव बिना किसी पेंडिंग कतार के <strong>सीधे मुख्य वंशावली में तुरंत जुड़ जाएगा!</strong>";
        }
        if (submitBtn) submitBtn.innerText = "⚡ सीधे वंशावली में जोड़ें / सेव करें (Direct Save)";
        if (subByGroup) subByGroup.style.display = "none";
    } else {
        if (noticeEl) {
            noticeEl.style.color = "var(--text-muted)";
            noticeEl.innerHTML = "ℹ️ यह बदलाव <strong>Admin</strong> द्वारा सत्यापित और Approve किए जाने के बाद मुख्य वंशावली में दिखाई देगा।";
        }
        if (submitBtn) submitBtn.innerText = "✅ एडमिन स्वीकृति हेतु भेजें";
        if (subByGroup) subByGroup.style.display = "block";
    }

    if (actionType === "ADD") {
        document.getElementById("editModalTitle").innerText = `➕ "${getDisplayName(member)}" की संतान जोड़ें`;
        document.getElementById("reqMemberName").value = "";
        document.getElementById("reqMemberNameEn").value = "";
        document.getElementById("reqMemberPhoto").value = "";
        document.getElementById("reqMemberLocation").value = member.location || "आशानगर, बिहार शरीफ";
        document.getElementById("reqMemberNotes").value = "";
    } else {
        document.getElementById("editModalTitle").innerText = `✏️ "${getDisplayName(member)}" के विवरण / फोटो में सुधार`;
        document.getElementById("reqMemberName").value = member.name || "";
        document.getElementById("reqMemberNameEn").value = member.en || "";
        document.getElementById("reqMemberPhoto").value = member.photo || `photos/${member.id}.jpg`;
        document.getElementById("reqMemberLocation").value = member.location || "";
        document.getElementById("reqMemberNotes").value = member.notes || "";
    }
    openModal("memberEditModal");
}

async function submitEditRequestForApproval() {
    const targetId = document.getElementById("editTargetId").value;
    const actionType = document.getElementById("editActionType").value;
    const nameHi = document.getElementById("reqMemberName").value.trim();
    const nameEn = document.getElementById("reqMemberNameEn").value.trim();
    const photo = document.getElementById("reqMemberPhoto").value.trim();
    const location = document.getElementById("reqMemberLocation").value.trim() || "आशानगर, बिहार शरीफ";
    const notes = document.getElementById("reqMemberNotes").value.trim();
    const submittedBy = IS_ADMIN_LOGGED_IN ? "Admin" : document.getElementById("reqSubmittedBy").value.trim();

    if (!nameHi && !nameEn) {
        alert("कृपया सदस्य का नाम (हिंदी या English में) अवश्य भरें।");
        return;
    }
    if (!IS_ADMIN_LOGGED_IN && !submittedBy) {
        alert("कृपया निवेदक (अपना) नाम अवश्य भरें।");
        return;
    }

    const finalNameHi = nameHi || nameEn;
    const finalNameEn = nameEn || "";

    // ⚡ CASE 1: ADMIN IS LOGGED IN -> DIRECT ADD / EDIT (NO APPROVAL QUEUE)
    if (IS_ADMIN_LOGGED_IN) {
        const targetNode = findNodeRecursive(FAMILY_TREE_DATA, targetId);
        if (!targetNode) {
            alert("मूल सदस्य डेटा में नहीं मिला।");
            return;
        }

        if (actionType === "ADD") {
            if (!targetNode.children) targetNode.children = [];
            const newChildId = `m_${Date.now()}`;
            targetNode.children.push({
                id: newChildId,
                name: finalNameHi,
                en: finalNameEn,
                gen: (targetNode.gen || 1) + 1,
                branch: targetNode.branch || "मूल शाखा",
                location: location,
                notes: notes,
                photo: photo,
                children: []
            });
        } else if (actionType === "EDIT") {
            targetNode.name = finalNameHi;
            targetNode.en = finalNameEn;
            targetNode.location = location;
            targetNode.notes = notes;
            if (photo !== undefined) targetNode.photo = photo;
        }

        localStorage.setItem("NARAYAN_MAHTO_TREE_FINAL", JSON.stringify(FAMILY_TREE_DATA));
        closeModal("memberEditModal");
        renderAllViews();
        alert(`✅ Admin Direct Save: "${finalNameHi}" को सीधे वंशावली में जोड़/अपडेट कर दिया गया है! (स्थायी करने हेतु '📥 vansh-data.js डाउनलोड' कर GitHub पर अपलोड करें)`);
        return;
    }

    // ⏳ CASE 2: PUBLIC USER -> SEND FOR ADMIN APPROVAL & EMAIL ALERT
    const targetMember = FLAT_MEMBERS.find(m => m.id === targetId);
    const newReq = {
        reqId: "req-" + Date.now(),
        targetId,
        targetName: targetMember ? targetMember.name : "",
        targetGen: targetMember ? targetMember.gen : 1,
        targetBranch: targetMember ? targetMember.branch : "मूल शाखा",
        actionType,
        name: finalNameHi,
        en: finalNameEn,
        photo,
        location,
        notes,
        submittedBy,
        timestamp: new Date().toLocaleString("hi-IN")
    };

    PENDING_REQUESTS.push(newReq);
    localStorage.setItem("NARAYAN_MAHTO_PENDING_FINAL", JSON.stringify(PENDING_REQUESTS));
    updatePendingBadge();
    closeModal("memberEditModal");

    if (GAS_BACKEND_OTP_URL && !GAS_BACKEND_OTP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
        try {
            const url = `${GAS_BACKEND_OTP_URL}?action=submitEdit&payload=${encodeURIComponent(JSON.stringify(newReq))}`;
            await fetch(url);
        } catch (err) {
            console.warn("Cloud alert sync warning:", err);
        }
    }

    alert("✅ आपका अनुरोध सफलतापूर्वक दर्ज हो गया है और एडमिन को ईमेल अलर्ट भेज दिया गया है! सत्यापन के बाद यह वंशावली में जुड़ जाएगा।");
}

/* =========================================================================
   11. ADMIN SECURITY: SHA-256, OTP -> PASSWORD CHANGE & ADMIN LOGOUT
========================================================================= */
let ADMIN_PASSWORD_SHA256 =
    localStorage.getItem("ADMIN_CUSTOM_HASH_FINAL") ||
    (typeof MASTER_ADMIN_HASH !== "undefined" ? MASTER_ADMIN_HASH : "") ||
    "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

const GAS_BACKEND_OTP_URL = "https://script.google.com/macros/s/AKfycbxa-6-aJ9FJI1UthD7dX4a_smXrkvKMmNMJfeubfopw0N24CayJ-bxEjlNQa5bvgtmQbg/exec";

let IS_ADMIN_LOGGED_IN = false;

async function sha256Hex(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function checkLockoutStatus() {
    const lockUntil = parseInt(localStorage.getItem("ADMIN_LOCKOUT_UNTIL") || "0", 10);
    if (Date.now() < lockUntil) {
        const minsLeft = Math.ceil((lockUntil - Date.now()) / 60000);
        return { locked: true, minsLeft };
    }
    return { locked: false, minsLeft: 0 };
}

function syncAdminSessionUI() {
    const masterBtn = document.getElementById("downloadMasterBtn");
    const topLogoutBtn = document.getElementById("topBarLogoutBtn");
    const sideLogoutBtn = document.getElementById("sidebarLogoutBtn");
    const sideAdminTxt = document.getElementById("sidebarAdminBtnText");

    if (masterBtn) masterBtn.style.display = IS_ADMIN_LOGGED_IN ? "inline-flex" : "none";
    if (topLogoutBtn) topLogoutBtn.style.display = IS_ADMIN_LOGGED_IN ? "inline-flex" : "none";
    if (sideLogoutBtn) sideLogoutBtn.style.display = IS_ADMIN_LOGGED_IN ? "flex" : "none";
    if (sideAdminTxt) {
        sideAdminTxt.innerText = IS_ADMIN_LOGGED_IN ? "🟢 एडमिन डैशबोर्ड (Active)" : "🔒 एडमिन पैनल (Admin Login)";
    }

    // एडमिन लॉगिन होते ही Edit Mode के ➕ और ✏️ बटन अपने-आप चालू कर दें ताकि डायरेक्ट एंट्री हो सके
    if (IS_ADMIN_LOGGED_IN && !document.body.classList.contains("edit-mode-enabled")) {
        document.body.classList.add("edit-mode-enabled");
        const btn = document.getElementById("toggleEditModeBtn");
        const statusTxt = document.getElementById("editModeStatusText");
        if (btn) btn.classList.add("active-mode");
        if (statusTxt) statusTxt.innerText = "सक्रिय (ON)";
    }
}

function openAdminModal() {
    toggleSidebar(false);
    updatePendingBadge();
    const authMsg = document.getElementById("adminAuthMsg");
    if (authMsg) authMsg.innerText = "";
    document.getElementById("adminPasswordChangeSection").style.display = "none";

    if (IS_ADMIN_LOGGED_IN) {
        document.getElementById("adminLoginSection").style.display = "none";
        document.getElementById("adminDashboardSection").style.display = "block";
        renderPendingApprovals();
    } else {
        document.getElementById("adminLoginSection").style.display = "block";
        document.getElementById("adminDashboardSection").style.display = "none";
    }
    openModal("adminModal");
}

async function verifyAdminLogin() {
    const lockState = checkLockoutStatus();
    const authMsg = document.getElementById("adminAuthMsg");
    if (lockState.locked) {
        authMsg.style.color = "#DC2626";
        authMsg.innerText = `⛔ सुरक्षा लॉकआउट: 3 गलत प्रयासों के कारण पैनल ${lockState.minsLeft} मिनट के लिए लॉक है। आप नीचे ईमेल OTP से रिकवर और पासवर्ड रीसेट कर सकते हैं।`;
        return;
    }

    const inputPass = document.getElementById("adminPassInput").value;
    if (!inputPass) {
        authMsg.style.color = "#DC2626";
        authMsg.innerText = "कृपया पासवर्ड दर्ज करें।";
        return;
    }

    const inputHash = await sha256Hex(inputPass);
    if (inputHash === ADMIN_PASSWORD_SHA256) {
        localStorage.setItem("ADMIN_FAILED_STRIKES", "0");
        localStorage.removeItem("ADMIN_LOCKOUT_UNTIL");
        unlockAdminDashboard();
    } else {
        let strikes = parseInt(localStorage.getItem("ADMIN_FAILED_STRIKES") || "0", 10) + 1;
        localStorage.setItem("ADMIN_FAILED_STRIKES", strikes.toString());
        authMsg.style.color = "#DC2626";
        if (strikes >= 3) {
            const lockTime = Date.now() + 15 * 60 * 1000;
            localStorage.setItem("ADMIN_LOCKOUT_UNTIL", lockTime.toString());
            authMsg.innerText = "⛔ 3 बार गलत पासवर्ड! एडमिन पैनल 15 मिनट के लिए लॉक कर दिया गया है। अब आप ईमेल OTP से पासवर्ड बदल सकते हैं।";
        } else {
            authMsg.innerText = `❌ गलत पासवर्ड! (प्रयास ${strikes}/3)`;
        }
    }
}

function unlockAdminDashboard() {
    IS_ADMIN_LOGGED_IN = true;
    document.getElementById("adminPassInput").value = "";
    document.getElementById("adminAuthMsg").innerText = "";
    document.getElementById("adminLoginSection").style.display = "none";
    document.getElementById("adminPasswordChangeSection").style.display = "none";
    document.getElementById("adminDashboardSection").style.display = "block";
    syncAdminSessionUI();
    renderPendingApprovals();
}

function adminLogout() {
    IS_ADMIN_LOGGED_IN = false;
    syncAdminSessionUI();
    document.getElementById("adminPassInput").value = "";
    document.getElementById("adminOtpInput").value = "";
    document.getElementById("otpVerifyBox").style.display = "none";
    document.getElementById("adminPasswordChangeSection").style.display = "none";
    document.getElementById("adminDashboardSection").style.display = "none";
    document.getElementById("adminLoginSection").style.display = "block";
    const authMsg = document.getElementById("adminAuthMsg");
    if (authMsg) {
        authMsg.style.color = "#059669";
        authMsg.innerText = "✅ आप सफलतापूर्वक एडमिन पैनल से लॉगआउट हो गए हैं।";
    }
    toggleSidebar(false);
}

async function requestBackendOTP() {
    const authMsg = document.getElementById("adminAuthMsg");
    document.getElementById("otpVerifyBox").style.display = "block";

    authMsg.style.color = "var(--primary)";
    authMsg.innerText = "⏳ बैकएंड से अप्रूवल कोड आपके ईमेल पर भेजा जा रहा है...";

    try {
        const res = await fetch(`${GAS_BACKEND_OTP_URL}?action=sendOTP`);
        const data = await res.json();
        if (data.status === "sent") {
            authMsg.style.color = "#059669";
            authMsg.innerText = "✅ 6-अंकीय अप्रूवल कोड आपके ईमेल (ankitranjan97@gmail.com) पर भेज दिया गया है। कोड नीचे दर्ज करें।";
        } else {
            authMsg.style.color = "#DC2626";
            authMsg.innerText = "⚠️ कोड भेजने में समस्या: " + (data.message || "कृपया Google Apps Script में परमिशन Allow करें।");
        }
    } catch (err) {
        authMsg.style.color = "#DC2626";
        authMsg.innerText = "⚠️ नेटवर्क या बैकएंड कनेक्शन त्रुटि।";
    }
}

async function verifyBackendOTP() {
    const otpCode = document.getElementById("adminOtpInput").value.trim();
    const authMsg = document.getElementById("adminAuthMsg");
    if (!otpCode) {
        authMsg.style.color = "#DC2626";
        authMsg.innerText = "कृपया 6-अंकीय OTP कोड दर्ज करें।";
        return;
    }

    authMsg.style.color = "var(--primary)";
    authMsg.innerText = "⏳ OTP कोड की जाँच की जा रही है...";

    try {
        const res = await fetch(`${GAS_BACKEND_OTP_URL}?action=verifyOTP&code=${encodeURIComponent(otpCode)}`);
        const data = await res.json();
        if (data.status === "verified") {
            localStorage.setItem("ADMIN_FAILED_STRIKES", "0");
            localStorage.removeItem("ADMIN_LOCKOUT_UNTIL");
            IS_ADMIN_LOGGED_IN = true;
            syncAdminSessionUI();

            document.getElementById("adminLoginSection").style.display = "none";
            document.getElementById("adminDashboardSection").style.display = "none";
            document.getElementById("pwdChangeSubtext").innerText = "✅ OTP सफलतापूर्वक सत्यापित हो गया! अब आप यहाँ अपना नया एडमिन पासवर्ड सेट कर सकते हैं:";
            document.getElementById("newAdminPass1").value = "";
            document.getElementById("newAdminPass2").value = "";
            document.getElementById("pwdChangeMsg").innerText = "";
            document.getElementById("adminPasswordChangeSection").style.display = "block";
        } else {
            authMsg.style.color = "#DC2626";
            authMsg.innerText = "❌ अमान्य या समाप्त हो चुका अप्रूवल कोड!";
        }
    } catch (err) {
        authMsg.style.color = "#DC2626";
        authMsg.innerText = "⚠️ सत्यापन विफल रहा।";
    }
}

function openPasswordChangeBoxFromDashboard() {
    document.getElementById("adminDashboardSection").style.display = "none";
    document.getElementById("pwdChangeSubtext").innerText = "यहाँ अपना नया एडमिन पासवर्ड दर्ज करें (यह SHA-256 एन्क्रिप्शन के साथ सेव होगा):";
    document.getElementById("newAdminPass1").value = "";
    document.getElementById("newAdminPass2").value = "";
    document.getElementById("pwdChangeMsg").innerText = "";
    document.getElementById("adminPasswordChangeSection").style.display = "block";
}

function skipPasswordChangeToDashboard() {
    unlockAdminDashboard();
}

async function saveNewAdminPassword() {
    const p1 = document.getElementById("newAdminPass1").value;
    const p2 = document.getElementById("newAdminPass2").value;
    const msgEl = document.getElementById("pwdChangeMsg");

    if (!p1 || p1.length < 4) {
        msgEl.style.color = "#DC2626";
        msgEl.innerHTML = "⚠️ नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।";
        return;
    }
    if (p1 !== p2) {
        msgEl.style.color = "#DC2626";
        msgEl.innerHTML = "❌ दोनों बॉक्स में लिखा गया पासवर्ड एक समान नहीं है!";
        return;
    }

    const newHash = await sha256Hex(p1);
    ADMIN_PASSWORD_SHA256 = newHash;
    localStorage.setItem("ADMIN_CUSTOM_HASH_FINAL", newHash);

    msgEl.style.color = "#059669";
    msgEl.innerHTML = `
        <div style="background:#ECFDF5; border:1.5px solid #10B981; padding:10px; border-radius:8px; margin-top:6px;">
            <div style="font-weight:800; color:#065F46; margin-bottom:6px;">
                ✅ नया पासवर्ड इस ब्राउज़र में सेव हो गया है!
            </div>
            <div style="font-size:0.78rem; color:#047857; margin-bottom:6px;">
                📌 <strong>सभी मोबाइल/कंप्यूटर के लिए स्थायी करने हेतु:</strong> नीचे दिया गया SHA-256 हैश कॉपी करें या सीधे डैशबोर्ड से <strong>"📥 vansh-data.js डाउनलोड"</strong> करके GitHub पर अपलोड कर दें:
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <input type="text" id="generatedHashBox" class="form-input" value="${newHash}" readonly style="font-size:0.75rem; font-family:monospace; background:#FFFFFF; padding:6px 8px;">
                <button type="button" class="ctrl-btn ctrl-btn-primary" onclick="copyGeneratedHash()" style="white-space:nowrap; padding:6px 10px;">📋 कॉपी करें</button>
            </div>
            <div style="margin-top:8px; text-align:right;">
                <button type="button" class="ctrl-btn ctrl-btn-success" onclick="unlockAdminDashboard()">➡️ एडमिन डैशबोर्ड खोलें</button>
            </div>
        </div>
    `;
}

function copyGeneratedHash() {
    const hashInput = document.getElementById("generatedHashBox");
    if (!hashInput) return;
    hashInput.select();
    navigator.clipboard.writeText(hashInput.value).then(() => {
        alert("✅ नया SHA-256 पासवर्ड हैश कॉपी हो गया है!");
    });
}

/* =========================================================================
   12. ADMIN APPROVAL WORKFLOW & MODULAR vansh-data.js DOWNLOADER
========================================================================= */
function findNodeRecursive(node, targetId) {
    if (node.id === targetId) return node;
    for (const child of (node.children || [])) {
        const found = findNodeRecursive(child, targetId);
        if (found) return found;
    }
    return null;
}

function renderPendingApprovals() {
    const container = document.getElementById("pendingApprovalsList");
    if (PENDING_REQUESTS.length === 0) {
        container.innerHTML = `<div style="padding:14px; text-align:center; color:var(--text-muted);">🎉 कोई लंबित अनुरोध (Pending Request) नहीं है।</div>`;
        return;
    }

    container.innerHTML = PENDING_REQUESTS.map(req => `
        <div class="analytics-panel" style="padding:12px; border-left:4px solid var(--primary);">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
                <span><strong>${req.actionType === 'ADD' ? '➕ नई संतान जोड़ें' : '✏️ विवरण/फोटो सुधार'}</strong> (${req.targetBranch})</span>
                <span>${req.timestamp}</span>
            </div>
            <div style="margin:6px 0; font-size:0.95rem;">
                संदर्भ सदस्य: <strong>${req.targetName}</strong> ➔ प्रस्तावित नाम: <strong style="color:var(--primary);">${req.name}</strong> ${req.en ? `(${req.en})` : ''}
            </div>
            <div style="font-size:0.82rem; color:var(--text-muted);">
                📍 स्थान: ${req.location} | 🖼️ फोटो: ${req.photo || '—'} | 📝 नोट: ${req.notes || '—'} | 👤 निवेदक: <strong>${req.submittedBy}</strong>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px;">
                <button class="ctrl-btn ctrl-btn-success" style="padding:5px 12px; font-size:0.8rem;" onclick="approveRequest('${req.reqId}')">✅ Approve (स्वीकार करें)</button>
                <button class="ctrl-btn" style="padding:5px 12px; font-size:0.8rem; color:#DC2626; border-color:#FCA5A5;" onclick="rejectRequest('${req.reqId}')">🗑️ Reject (हटाएँ)</button>
            </div>
        </div>
    `).join("");
}

function approveRequest(reqId) {
    const idx = PENDING_REQUESTS.findIndex(r => r.reqId === reqId);
    if (idx === -1) return;
    const req = PENDING_REQUESTS[idx];

    const targetNode = findNodeRecursive(FAMILY_TREE_DATA, req.targetId);
    if (!targetNode) {
        alert("मूल सदस्य डेटा में नहीं मिला।");
        return;
    }

    if (req.actionType === "ADD") {
        if (!targetNode.children) targetNode.children = [];
        const newChildId = `m_${Date.now()}`;
        targetNode.children.push({
            id: newChildId,
            name: req.name,
            en: req.en || "",
            gen: (targetNode.gen || 1) + 1,
            branch: targetNode.branch || "मूल शाखा",
            location: req.location || "आशानगर, बिहार शरीफ",
            notes: req.notes || "",
            photo: req.photo || "",
            children: []
        });
    } else if (req.actionType === "EDIT") {
        targetNode.name = req.name;
        if (req.en !== undefined) targetNode.en = req.en;
        targetNode.location = req.location;
        targetNode.notes = req.notes;
        if (req.photo !== undefined) targetNode.photo = req.photo;
    }

    PENDING_REQUESTS.splice(idx, 1);
    localStorage.setItem("NARAYAN_MAHTO_PENDING_FINAL", JSON.stringify(PENDING_REQUESTS));
    localStorage.setItem("NARAYAN_MAHTO_TREE_FINAL", JSON.stringify(FAMILY_TREE_DATA));

    fetch(`${GAS_BACKEND_OTP_URL}?action=removePending&reqId=${encodeURIComponent(reqId)}`).catch(() => {});

    updatePendingBadge();
    renderPendingApprovals();
    renderAllViews();
}

function rejectRequest(reqId) {
    PENDING_REQUESTS = PENDING_REQUESTS.filter(r => r.reqId !== reqId);
    localStorage.setItem("NARAYAN_MAHTO_PENDING_FINAL", JSON.stringify(PENDING_REQUESTS));
    fetch(`${GAS_BACKEND_OTP_URL}?action=removePending&reqId=${encodeURIComponent(reqId)}`).catch(() => {});
    updatePendingBadge();
    renderPendingApprovals();
}

function downloadMasterDataJS() {
    const jsContent = `/* =========================================================================
   📚 MASTER VANSHAWALI DATA FILE (vansh-data.js)
   Updated on: ${new Date().toLocaleString("hi-IN")}
========================================================================= */

// एडमिन पासवर्ड का स्थायी SHA-256 हैश (सभी डिवाइसों के लिए)
const MASTER_ADMIN_HASH = "${ADMIN_PASSWORD_SHA256}";

/* === MASTER_DATA_START === */
let FAMILY_TREE_DATA = ${JSON.stringify(FAMILY_TREE_DATA, null, 4)};

let FAMILY_COMMENTS_DATA = ${JSON.stringify(FAMILY_COMMENTS_DATA, null, 4)};
/* === MASTER_DATA_END === */
`;
    const blob = new Blob([jsContent], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vansh-data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* =========================================================================
   13. LIVE VISITOR COUNTER (1,250+ UNIQUE SESSION) & CLOUD PENDING SYNC
========================================================================= */
async function initLiveVisitorCounter() {
    const totalEl = document.getElementById("stat-visits");
    const todayEl = document.getElementById("stat-today-badge");

    const alreadyCounted = sessionStorage.getItem("VANSH_VISIT_SESSION_COUNTED");
    const action = alreadyCounted ? "getVisitor" : "hitVisitor";

    try {
        if (GAS_BACKEND_OTP_URL && !GAS_BACKEND_OTP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
            const res = await fetch(`${GAS_BACKEND_OTP_URL}?action=${action}`);
            const data = await res.json();
            if (data && data.status === "ok") {
                sessionStorage.setItem("VANSH_VISIT_SESSION_COUNTED", "1");
                localStorage.setItem("VANSH_CACHED_TOTAL_VISITS", data.total.toString());
                localStorage.setItem("VANSH_CACHED_TODAY_VISITS", data.today.toString());

                if (totalEl) totalEl.innerText = Number(data.total).toLocaleString("en-IN");
                if (todayEl) {
                    todayEl.dataset.count = data.today;
                    todayEl.innerText = CURRENT_LANG === "en" ? `Today: ${data.today}` : `आज: ${data.today}`;
                }
                return;
            }
        }
    } catch (e) {}

    // Fallback if offline or before GAS redeploy
    let localTotal = parseInt(localStorage.getItem("VANSH_CACHED_TOTAL_VISITS") || "1250", 10);
    let localToday = parseInt(localStorage.getItem("VANSH_CACHED_TODAY_VISITS") || "3", 10);
    if (!alreadyCounted) {
        localTotal += 1;
        localToday += 1;
        sessionStorage.setItem("VANSH_VISIT_SESSION_COUNTED", "1");
        localStorage.setItem("VANSH_CACHED_TOTAL_VISITS", localTotal.toString());
        localStorage.setItem("VANSH_CACHED_TODAY_VISITS", localToday.toString());
    }
    if (totalEl) totalEl.innerText = Number(localTotal).toLocaleString("en-IN");
    if (todayEl) {
        todayEl.dataset.count = localToday;
        todayEl.innerText = CURRENT_LANG === "en" ? `Today: ${localToday}` : `आज: ${localToday}`;
    }
}

async function syncCloudPendingRequests() {
    if (!GAS_BACKEND_OTP_URL || GAS_BACKEND_OTP_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) return;
    try {
        const res = await fetch(`${GAS_BACKEND_OTP_URL}?action=getPending`);
        const data = await res.json();
        if (data.status === "ok" && Array.isArray(data.items)) {
            const existingIds = new Set(PENDING_REQUESTS.map(r => r.reqId));
            data.items.forEach(item => {
                if (!existingIds.has(item.reqId)) {
                    PENDING_REQUESTS.push(item);
                }
            });
            localStorage.setItem("NARAYAN_MAHTO_PENDING_FINAL", JSON.stringify(PENDING_REQUESTS));
            updatePendingBadge();
            if (IS_ADMIN_LOGGED_IN) renderPendingApprovals();
        }
    } catch (e) {}
}

/* =========================================================================
   14. SINGLE-PAGE FAST & ULTRA-HD PRINT, PDF & PNG STUDIO
========================================================================= */
function triggerSinglePageHDPrint() {
    toggleSidebar(false);
    const statusBox = document.getElementById("printStudioStatus");
    if (statusBox) statusBox.style.display = "none";
    openModal("printStudioModal");
}

function buildSinglePagePosterGridHtml() {
    const branches = getMainSixBranches();
    const columnsHtml = branches.map(branchNode => `
        <div style="flex:1; min-width:340px; background:#FFFDF9; border:1.5px solid #CBD5E1; border-top:4px solid #9A3412; border-radius:10px; padding:12px;">
            <div style="text-align:center; font-weight:800; font-size:15px; color:#7C2D12; background:#FEF3C7; padding:6px 10px; border-radius:6px; margin-bottom:10px; border:1px solid #F59E0B;">
                🌿 ${getDisplayName(branchNode)} (${getBranchLabelDisplay(branchNode.branch)})
            </div>
            <ul class="tree" style="padding-left:0; margin:0;">
                ${(branchNode.children || []).map(c => buildClassicTreeHtml(c)).join("")}
            </ul>
        </div>
    `).join("");

    return `
        <div style="text-align:center; margin-bottom:16px;">
            <div style="display:inline-block; background:#7C2D12; color:#FFFFFF; font-weight:800; font-size:17px; padding:8px 24px; border-radius:8px; border:2px solid #FDE68A;">
                👑 ${CURRENT_LANG === 'en' ? 'Root Ancestor: Late Narayan Mahto (Gen 1) ➔ Late Chaman Mahto (Gen 2)' : 'मूल पुरुष: स्व. नारायण महतो (१ली पीढ़ी) ➔ स्व. चमन महतो (२री पीढ़ी)'}
            </div>
        </div>
        <div style="display:flex; flex-direction:row; align-items:flex-start; gap:14px; width:max-content;">
            ${columnsHtml}
        </div>
    `;
}

function buildPureVectorD3Svg(mode, customTitle, container) {
    const root = d3.hierarchy(FAMILY_TREE_DATA);
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svgEl);

    const fontStack = "'Noto Sans Devanagari', 'Nirmala UI', 'Inter', sans-serif";
    const svg = d3.select(svgEl)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .style("font-family", fontStack)
        .style("background", "#FFFFFF");

    const mainG = svg.append("g");
    const chartG = mainG.append("g");

    if (mode === "radial_svg") {
        const radius = 1350;
        const treeLayout = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent == b.parent ? 1.3 : 2.2) / Math.max(1, a.depth));

        treeLayout(root);

        chartG.selectAll("path.link")
            .data(root.links())
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "#9A3412")
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", 2.2)
            .attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y));

        const node = chartG.selectAll("g.node")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

        node.append("circle")
            .attr("r", d => d.depth === 0 ? 10 : (d.children ? 6.5 : 5))
            .attr("fill", d => d.children ? "#9A3412" : "#059669")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 1.8);

        node.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.x < Math.PI === !d.children ? 10 : -10)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
            .attr("fill", "#0F172A")
            .attr("font-family", fontStack)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("paint-order", "stroke")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", "4px")
            .text(d => getDisplayName(d.data));
    } else {
        const dx = 36;
        const dy = 290;
        const treeLayout = d3.tree().nodeSize([dx, dy]);
        treeLayout(root);

        chartG.selectAll("path.link")
            .data(root.links())
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "#9A3412")
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", 2.2)
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        const node = chartG.selectAll("g.node")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("r", d => d.depth === 0 ? 10 : (d.children ? 6.5 : 5))
            .attr("fill", d => d.children ? "#9A3412" : "#059669")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 1.8);

        node.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.children ? -11 : 11)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .attr("fill", "#0F172A")
            .attr("font-family", fontStack)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("paint-order", "stroke")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", "4px")
            .text(d => getDisplayName(d.data));
    }

    const chartBox = chartG.node().getBBox();
    const headerHeight = 140;
    const pad = 65;
    const fullW = Math.max(Math.ceil(chartBox.width + pad * 2), 1200);
    const fullH = Math.ceil(chartBox.height + headerHeight + pad * 2);

    const minX = chartBox.x - pad;
    const minY = chartBox.y - headerHeight - pad;
    const centerX = minX + fullW / 2;

    svg.insert("rect", ":first-child")
        .attr("x", minX)
        .attr("y", minY)
        .attr("width", fullW)
        .attr("height", fullH)
        .attr("fill", "#FFFFFF");

    const headerG = mainG.append("g")
        .attr("transform", `translate(${centerX}, ${minY + 48})`);

    headerG.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#7C2D12")
        .attr("font-family", fontStack)
        .attr("font-size", "32px")
        .attr("font-weight", "800")
        .text(customTitle);

    headerG.append("text")
        .attr("y", 36)
        .attr("text-anchor", "middle")
        .attr("fill", "#B45309")
        .attr("font-family", fontStack)
        .attr("font-size", "20px")
        .attr("font-weight", "800")
        .text("✨ हमारा परिवार, हमारा रजक समाज! ✨");

    headerG.append("text")
        .attr("y", 66)
        .attr("text-anchor", "middle")
        .attr("fill", "#475569")
        .attr("font-family", fontStack)
        .attr("font-size", "16px")
        .attr("font-weight", "600")
        .text(`📍 आशानगर, थाना- सोहसराय, बिहार शरीफ (नालंदा) | कुल सदस्य: ${FLAT_MEMBERS.length} | पीढ़ियाँ: 9`);

    headerG.append("line")
        .attr("x1", -fullW * 0.44)
        .attr("x2", fullW * 0.44)
        .attr("y1", 86)
        .attr("y2", 86)
        .attr("stroke", "#9A3412")
        .attr("stroke-width", 3);

    svg.attr("width", fullW)
       .attr("height", fullH)
       .attr("viewBox", `${minX} ${minY} ${fullW} ${fullH}`);

    return { svgEl, fullW, fullH };
}

function renderSvgDirectlyToHiDPICanvas(svgEl, baseW, baseH, desiredScale) {
    return new Promise((resolve, reject) => {
        const MAX_CANVAS_DIM = 10000;
        const safeScale = Math.min(desiredScale, MAX_CANVAS_DIM / Math.max(baseW, baseH));
        const finalW = Math.round(baseW * safeScale);
        const finalH = Math.round(baseH * safeScale);

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgEl);
        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = finalW;
            canvas.height = finalH;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, finalW, finalH);
            ctx.drawImage(img, 0, 0, finalW, finalH);
            URL.revokeObjectURL(url);
            resolve({ canvas, safeScale });
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
}

async function exportSinglePageChart(format) {
    let targetType = document.getElementById("printTargetSelect").value;
    const desiredScale = parseFloat(document.getElementById("printQualitySelect").value || "1.5");
    const customTitle = document.getElementById("printCustomTitle").value.trim() || "स्व. नारायण महतो का वंशावली";
    const statusBox = document.getElementById("printStudioStatus");
    const renderArea = document.getElementById("printableChartArea");

    const radialSec = document.getElementById("view-radial");
    if (targetType === "current" && radialSec && radialSec.classList.contains("active")) {
        targetType = (CURRENT_D3_MODE === "radial") ? "radial_svg" : "horizontal_svg";
    }

    statusBox.style.display = "block";
    statusBox.style.background = "#FEF3C7";
    statusBox.style.color = "#92400E";
    statusBox.innerText = "⚡ कृपया प्रतीक्षा करें, सिंगल-पेज चार्ट तैयार हो रहा है...";

    renderArea.style.left = "0px";
    renderArea.style.top = "0px";
    renderArea.innerHTML = "";

    const isVectorD3 = (targetType === "radial_svg" || targetType === "horizontal_svg");
    let vectorData = null;

    if (isVectorD3) {
        vectorData = buildPureVectorD3Svg(targetType, customTitle, renderArea);
    } else {
        let innerChartHtml = "";
        if (targetType === "poster_grid") {
            innerChartHtml = buildSinglePagePosterGridHtml();
        } else if (targetType === "full_expanded") {
            const prevFilter = CURRENT_BRANCH_FILTER;
            CURRENT_BRANCH_FILTER = "ALL";
            innerChartHtml = `<ul class="tree" style="padding-left:0;">${buildClassicTreeHtml(FAMILY_TREE_DATA)}</ul>`;
            CURRENT_BRANCH_FILTER = prevFilter;
        } else {
            const activeSec = document.querySelector(".view-section-box.active");
            if (activeSec) innerChartHtml = activeSec.innerHTML;
        }

        renderArea.innerHTML = `
            <style>
                #printableChartArea * {
                    box-shadow: none !important;
                    text-shadow: none !important;
                    animation: none !important;
                    transition: none !important;
                    overflow: visible !important;
                    max-height: none !important;
                }
            </style>
            <div style="text-align:center; padding-bottom:16px; margin-bottom:20px; border-bottom:3px solid #9A3412; font-family:'Noto Sans Devanagari', sans-serif; background:#FFFFFF;">
                <h1 style="margin:0 0 6px 0; color:#7C2D12; font-size:28px; font-weight:800;">${customTitle}</h1>
                <div style="font-size:17px; font-weight:800; color:#B45309; margin-bottom:4px;">✨ हमारा परिवार, हमारा रजक समाज! ✨</div>
                <div style="font-size:14px; color:#334155; font-weight:700;">📍 आशानगर, थाना- सोहसराय, बिहार शरीफ (नालंदा) | कुल सदस्य: ${FLAT_MEMBERS.length} | पीढ़ियाँ: 9</div>
            </div>
            <div id="printChartBody" style="display:inline-block; background:#FFFFFF; width:max-content;">${innerChartHtml}</div>
        `;

        const chartBody = renderArea.querySelector("#printChartBody");
        chartBody.querySelectorAll("li.collapsed").forEach(li => li.classList.remove("collapsed"));
        chartBody.querySelectorAll(".no-print, .action-btns, .toggle-btn, .viz-controls").forEach(el => el.remove());
    }

    await new Promise(r => setTimeout(r, 120));

    try {
        if (format === "print") {
            const contentW = Math.max(renderArea.scrollWidth, renderArea.offsetWidth, 800);
            const contentH = Math.max(renderArea.scrollHeight, renderArea.offsetHeight, 600);
            const isLandscape = contentW >= contentH;

            const printWin = window.open("", "_blank");
            const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
                .map(el => el.outerHTML).join("\n");

            printWin.document.write(`
                <!DOCTYPE html>
                <html lang="hi">
                <head>
                    <title>${customTitle}</title>
                    ${styles}
                    <style>
                        @page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 6mm; }
                        html, body {
                            background: #FFFFFF !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100%;
                            height: 100%;
                            overflow: hidden !important;
                        }
                        #printPageViewport {
                            width: 100vw;
                            height: 96vh;
                            display: flex;
                            align-items: flex-start;
                            justify-content: center;
                            overflow: hidden;
                        }
                        #printFitWrap {
                            width: max-content;
                            transform-origin: top center;
                        }
                    </style>
                </head>
                <body>
                    <div id="printPageViewport">
                        <div id="printFitWrap">${renderArea.innerHTML}</div>
                    </div>
                    <script>
                        window.onload = function() {
                            const wrap = document.getElementById('printFitWrap');
                            const availW = window.innerWidth - 20;
                            const availH = window.innerHeight - 20;
                            const w = Math.max(wrap.scrollWidth, wrap.offsetWidth, 1);
                            const h = Math.max(wrap.scrollHeight, wrap.offsetHeight, 1);
                            const scale = Math.min(1, availW / w, availH / h);
                            wrap.style.transform = 'scale(' + scale.toFixed(4) + ')';
                            setTimeout(() => { window.print(); window.close(); }, 300);
                        };
                    <\/script>
                </body>
                </html>
            `);
            printWin.document.close();
            renderArea.style.left = "-99999px";
            renderArea.innerHTML = "";
            statusBox.style.display = "none";
            closeModal("printStudioModal");
            return;
        }

        let finalCanvas = null;
        if (isVectorD3 && vectorData) {
            const res = await renderSvgDirectlyToHiDPICanvas(vectorData.svgEl, vectorData.fullW, vectorData.fullH, desiredScale);
            finalCanvas = res.canvas;
        } else {
            const chartBody = renderArea.querySelector("#printChartBody") || renderArea;
            const baseWidth = Math.max(renderArea.scrollWidth, chartBody.scrollWidth, 900) + 64;
            const baseHeight = Math.max(renderArea.scrollHeight, chartBody.scrollHeight, 600) + 64;
            const MAX_SAFE_DIM = desiredScale <= 1.6 ? 7500 : 11500;
            const safeScale = Math.min(desiredScale, MAX_SAFE_DIM / Math.max(baseWidth, baseHeight));

            finalCanvas = await window.html2canvas(renderArea, {
                scale: safeScale,
                useCORS: true,
                logging: false,
                backgroundColor: "#FFFFFF",
                width: baseWidth,
                height: baseHeight,
                windowWidth: baseWidth,
                windowHeight: baseHeight,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0
            });
        }

        if (format === "png") {
            finalCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `Vanshawali_1Page_${targetType}.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, "image/png");
        } else if (format === "pdf") {
            const useFastJpeg = desiredScale <= 2.3;
            const imgFormat = useFastJpeg ? "JPEG" : "PNG";
            const imgData = useFastJpeg
                ? finalCanvas.toDataURL("image/jpeg", 0.94)
                : finalCanvas.toDataURL("image/png");

            const MAX_PDF_PAGE_PT = 3200;
            const pdfRatio = Math.min(1, MAX_PDF_PAGE_PT / Math.max(finalCanvas.width, finalCanvas.height));
            const pdfW = Math.round(finalCanvas.width * pdfRatio);
            const pdfH = Math.round(finalCanvas.height * pdfRatio);
            const orientation = pdfW >= pdfH ? "l" : "p";

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: orientation,
                unit: "pt",
                format: [pdfW, pdfH],
                compress: true
            });
            pdf.addImage(imgData, imgFormat, 0, 0, pdfW, pdfH, undefined, "FAST");
            pdf.save(`Vanshawali_1Page_${targetType}.pdf`);
        }

        statusBox.style.display = "none";
        closeModal("printStudioModal");
    } catch (err) {
        console.error("Export Error:", err);
        statusBox.style.background = "#FEE2E2";
        statusBox.style.color = "#991B1B";
        statusBox.innerText = "⚠️ त्रुटि आई। कृपया 'Fast / Medium HD' चुनें या नीचे वाला 'सीधे 1-पेज में प्रिंट' बटन दबाएँ।";
    } finally {
        renderArea.style.left = "-99999px";
        renderArea.innerHTML = "";
    }
}

/* =========================================================================
   15. INITIALIZE ALL VIEWS ON PAGE LOAD
========================================================================= */
function renderAllViews() {
    rebuildFlatIndex(FAMILY_TREE_DATA);
    renderTreeView();
    renderCardView();
    renderAnalyticsDashboard();
    populateKinshipSelectors();
    calculateKinship();
    renderGeographyView();
    renderCommentsView();
    updatePendingBadge();
    syncAdminSessionUI();
}

window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("VANSHAWALI_THEME_FINAL") || "classic";
    changeTheme(savedTheme);
    setLanguage(CURRENT_LANG);
    initLiveVisitorCounter();
    setTimeout(syncCloudPendingRequests, 1200);

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrap")) {
            const box = document.getElementById("searchSuggestions");
            if (box) box.style.display = "none";
        }
    });
});
