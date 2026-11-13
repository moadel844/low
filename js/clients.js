const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
const POA_TYPES = { general: 'عام', special: 'خاص' };
const POA_STATUS = { active: { t: 'ساري', c: 'good' }, revoked: { t: 'ملغي', c: 'warn' }, expired: { t: 'منتهي', c: 'brass' } };
const DEGREES = { first_instance: 'ابتدائي', appeal: 'استئناف', cassation: 'نقض', objection: 'معارضة', appeal_objection: 'معارضة استئنافية', other: 'أخرى' };
const CASE_STATUS = { open: 'متداولة', reserved: 'محجوزة للحكم', judged: 'محكوم فيها', archived: 'مؤرشفة' };
const MAX_BYTES = 50 * 1024 * 1024;
const POA_LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];

const LETTER_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5', '#039BE5', 
  '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33', '#FDD835', '#FFB300', 
  '#FB8C00', '#F4511E', '#6D4C41', '#757575', '#546E7A', '#EF5350', '#EC407A', 
  '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A'
];

const namesData = {
  'ا': ['أحمد محمود', 'إبراهيم سعيد', 'أمل حسن', 'أمير خالد', 'آية علي'],
  'ب': ['بلال يوسف', 'بسمة محمد', 'بدر عبدالله', 'باسل أحمد', 'بشير عمر'],
  'ت': ['تامر حسين', 'توفيق جابر', 'تسنيم كمال', 'تقي الدين', 'تاليا سمير'],
  'ث': ['ثروت فؤاد', 'ثابت عادل', 'ثريا منير', 'ثاليا وليد', 'ثامر رشاد'],
  'ج': ['جمال عبد الله', 'جهاد مصطفى', 'جيهان شريف', 'جواد كريم', 'جميلة صابر'],
  'ح': ['حسن علي', 'حسام الدين', 'حنان طارق', 'حمدي رفعت', 'حياة ناصر'],
  'خ': ['خالد ياسين', 'خليل إبراهيم', 'خديجة عمر', 'خميس سالم', 'خلود فتحي'],
  'د': ['داوود سليمان', 'ديانا رامي', 'دانا عصام', 'دعاء نادر', 'ديلارا وائل'],
  'ذ': ['ذياد حاتم', 'ذو الفقار', 'ذكرى جمال', 'ذكاء صبري', 'ذيبان فوزي'],
  'ر': ['رامي عادل', 'رنا إبراهيم', 'ريم سعيد', 'رؤوف فؤاد', 'رشا نبيل'],
  'ز': ['زياد محسن', 'زينب حسن', 'زكريا عبد الله', 'زينة وليد', 'زاهر عاطف'],
  'س': ['سامح جمال', 'سارة علي', 'سعيد مصطفى', 'سلمى كريم', 'سليمان طاهر'],
  'ش': ['شريف منصور', 'شيماء رفعت', 'شادي ياسر', 'شروق عادل', 'شهد وليد'],
  'ص': ['صفاء الدين', 'صابر فهمي', 'صباح رشدي', 'صخر حاتم', 'صلاح الدين'],
  'ض': ['ضياء الدين', 'ضحى يوسف', 'ضياء فؤاد', 'ضاري عادل', 'ضمير رامي'],
  'ط': ['طارق حسن', 'طه ياسين', 'طيبة منصور', 'طاهر سليم', 'طلة علي'],
  'ظ': ['ظافر ممدوح', 'ظبية راضي', 'ظفر سعيد', 'ظلال صابر', 'ظهير كمال'],
  'ع': ['عمر خالد', 'علي يوسف', 'عبد الرحمن', 'عائشة محمد', 'عثمان عادل'],
  'غ': ['غانم صالح', 'غادة منير', 'غيث سامي', 'غريب فؤاد', 'غالية كريم'],
  'ف': ['فؤاد حسن', 'فاطمة يوسف', 'فادي جمال', 'فريدة علي', 'فيصل سعيد'],
  'ق': ['قاسم صالح', 'قمر سامي', 'قيس راضي', 'قتادة عادل', 'قدرية محمود'],
  'ك': ['كريم ياسر', 'كمال فؤاد', 'كنزي حسن', 'كوثر علي', 'كرم سعيد'],
  'ل': ['لؤي محمود', 'لمياء سعيد', 'ليلى حسن', 'لطفي كمال', 'لينا وليد'],
  'م': ['محمد أحمد', 'محمود علي', 'مصطفى يوسف', 'منى سامي', 'مروان تامر'],
  'ن': ['ناصر جمال', 'نورا رامي', 'نادر فؤاد', 'نادية علي', 'نبيل حسن'],
  'ه': ['هاني ياسر', 'هدى سعيد', 'هيثم محمود', 'هند رشدي', 'هشام عادل'],
  'و': ['وليد فؤاد', 'وسام راضي', 'وفاء محمود', 'وجدي كمال', 'وئام علي'],
  'ي': ['يوسف أحمد', 'ياسين محمود', 'ياسمين علي', 'يحيى سعيد', 'يارا كمال']
};

const DUMMY_CLIENTS = [];
POA_LETTERS.forEach((letter, index) => {
  const names = namesData[letter];
  names.forEach((name, i) => {
    DUMMY_CLIENTS.push({
      id: `d_${letter}_${i}`,
      full_name: name,
      national_id: `29001010101${index}${i}`, 
      phone: `0101111${index}${i}`,
      governorate: 'القاهرة',
      city: 'المعادي',
      powers_of_attorney: [{
        poa_letter: letter, 
        poa_number: `10${index}${i}`,
        status: 'active',
        issue_date: '2023-01-01'
      }]
    });
  });
});

const EG_PROVINCES = {
  'القاهرة': ['مدينة نصر', 'المعادي', 'مصر الجديدة', 'الزمالك', 'التجمع الأول', 'التجمع الخامس', 'الشروق', 'مدينة بدر', 'حلوان', 'المقطم', 'شبرا', 'المرج', 'السلام', 'حدائق القبة', 'روض الفرج', 'السيدة زينب', 'مصر القديمة', 'الخليفة', 'الموسكي', 'بولاق', 'الزيتون', 'الشرابية', 'الأميرية', 'الوايلي', 'عين شمس', 'النزهة', 'القاهرة الجديدة', 'الرحاب', 'مدينتي', 'العبور'],
  'الجيزة': ['الدقي', 'المهندسين', 'العجوزة', 'إمبابة', 'الوراق', 'بولاق الدكرور', 'العمرانية', 'الحوامدية', 'البدرشين', 'الصف', 'أطفيح', 'كرداسة', 'أوسيم', 'منشأة القناطر', 'الواحات البحرية', '6 أكتوبر', 'الشيخ زايد', 'حدائق أكتوبر'],
};

let me = null, currentId = null, currentClient = null, editingClientId = null, editingPoaId = null, searchTimer;
let currentDocs = [], currentPoas = [], currentCases = [];
let allClientsData = []; 
let activeLetterFilter = 'all';

const $ = (id) => document.getElementById(id);
const isAdmin = () => me && me.role === 'admin';

function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (['checked', 'disabled', 'selected', 'value', 'hidden'].includes(k)) n[k] = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().filter(Boolean).forEach((c) => n.append(c));
  return n;
}
function btn(text, onclick, cls = 'ghost') { return el('button', { type: 'button', class: 'btn small ' + cls, text, onclick }); }
let toastTimer; function flash(text, ok = true) { const t = $('toast'); t.textContent = text; t.className = 'alert toast' + (ok ? ' ok' : ''); t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 6000); }
function normDigits(s) { return String(s ?? '').replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660).replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06F0); }
function fmtDate(d) { if (!d) return ''; return new Date(d + 'T00:00:00').toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }); }
function goToLogin() { location.replace('login.html'); }

function formatWhatsApp(phone) {
  if (!phone) return '#';
  let p = normDigits(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = '20' + p.substring(1);
  else if (!p.startsWith('20')) p = '20' + p;
  return `https://wa.me/${p}`;
}

// دالة إرسال إشعار
async function sendNotif(title, msg) {
  try {
    await sb.from('notifications').insert({ title, message: msg, target_role: 'all' });
  } catch (e) {
    console.error("فشل إرسال الإشعار", e);
  }
}

function fillLetters(select, current) { select.replaceChildren(); select.append(el('option', { value: '', text: '— بدون حرف —' })); POA_LETTERS.forEach((l) => { select.append(el('option', { value: l, text: l, selected: l === current })); }); }
function fillGovernorates() { const sel = $('f-gov'); sel.replaceChildren(); sel.append(el('option', { value: '', text: '— اختر المحافظة —' })); Object.keys(EG_PROVINCES).sort((a, b) => a.localeCompare(b, 'ar')).forEach((g) => { sel.append(el('option', { value: g, text: g })); }); }
function fillCities(gov, current) { const sel = $('f-city'); sel.replaceChildren(); if (!gov || !EG_PROVINCES[gov]) { sel.append(el('option', { value: '', text: '— اختر المحافظة أولاً —' })); return; } sel.append(el('option', { value: '', text: '— اختر المدينة / المركز —' })); EG_PROVINCES[gov].forEach((c) => { sel.append(el('option', { value: c, text: c, selected: c === current })); }); }

async function loadList() {
  let { data, error } = await sb.from('clients').select(`
    *,
    powers_of_attorney(poa_number, poa_letter, status, issue_date),
    cases(
      id, case_number, case_year, next_hearing_date,
      case_sessions(session_date, decision, notes)
    )
  `).order('full_name');

  if (error) { flash('مقدرتش أحمّل الموكلين.', false); return; }
  allClientsData = [...(data || []), ...DUMMY_CLIENTS];
  renderTabs();
  applyFilters();
}

function renderTabs() {
  const foldersContainer = $('folders-container');
  foldersContainer.innerHTML = `<button class="folder-tab ${activeLetterFilter === 'all' ? 'active' : ''}" onclick="filterByLetter('all', this)">الكل</button>`;
  
  POA_LETTERS.forEach((letter, index) => {
    const hasClients = allClientsData.some(c => c.powers_of_attorney && c.powers_of_attorney.some(p => p.poa_letter === letter));
    if (hasClients) {
      const color = LETTER_COLORS[index];
      foldersContainer.innerHTML += `<button class="folder-tab ${activeLetterFilter === letter ? 'active' : ''}" style="background-color: ${activeLetterFilter === letter ? 'var(--surface)' : color}; color: ${activeLetterFilter === letter ? color : '#fff'}; border-top: 4px solid ${color};" onclick="filterByLetter('${letter}', this)">${letter}</button>`;
    }
  });
}

window.filterByLetter = (letter, btnElement) => {
  activeLetterFilter = letter;
  document.querySelectorAll('.folder-tab').forEach(btn => {
    btn.classList.remove('active');
    const l = btn.textContent.trim();
    const idx = POA_LETTERS.indexOf(l);
    if (idx !== -1) { btn.style.backgroundColor = LETTER_COLORS[idx]; btn.style.color = '#fff'; }
    else if (l === 'الكل') { btn.style.backgroundColor = 'var(--paper)'; btn.style.color = 'var(--ink-soft)'; }
  });
  if (btnElement) {
    btnElement.classList.add('active');
    btnElement.style.backgroundColor = 'var(--surface)';
    btnElement.style.color = btnElement.style.borderTopColor;
  }
  applyFilters();
};

function applyFilters() {
  const term = $('search').value.trim().toLowerCase();
  const normTerm = normDigits(term);
  
  let filtered = allClientsData;

  if (activeLetterFilter !== 'all') {
    filtered = filtered.filter(c => c.powers_of_attorney && c.powers_of_attorney.some(p => p.poa_letter === activeLetterFilter));
  }

  if (term) {
    filtered = filtered.filter(c => {
      const name = (c.full_name || '').toLowerCase();
      const nid = normDigits(c.national_id || '');
      const phone = normDigits(c.phone || '');
      return name.includes(term) || nid.includes(normTerm) || phone.includes(normTerm);
    });
  }

  renderTable(filtered);
}

function renderTable(data) {
  const tbody = $('clients-tbody'); tbody.replaceChildren();
  
  if (!data.length) { 
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;" class="muted">مفيش موكلين مطابقين للبحث.</td></tr>`;
    return; 
  }

  data.forEach((c) => {
    const activePoa = c.powers_of_attorney?.find(p => p.status === 'active') || c.powers_of_attorney?.[0];
    
    const poaLetter = activePoa?.poa_letter || '-';
    const letterIndex = POA_LETTERS.indexOf(poaLetter);
    const badgeColor = letterIndex !== -1 ? LETTER_COLORS[letterIndex] : 'var(--indigo)';
    
    const waLink = c.phone ? `<a href="${formatWhatsApp(c.phone)}" target="_blank" class="wa-btn" title="واتساب"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>` : '';

    let latestAction = '<span class="muted">لا يوجد إجراءات</span>';
    if (c.cases && c.cases.length > 0) {
      let latestDate = null;
      let latestText = '';
      c.cases.forEach(cs => {
        if (cs.case_sessions && cs.case_sessions.length > 0) {
          cs.case_sessions.forEach(s => {
            const sDate = s.session_date ? new Date(s.session_date) : new Date(0);
            if (!latestDate || sDate > latestDate) {
              latestDate = sDate;
              latestText = s.decision || 'تم عقد جلسة';
            }
          });
        }
      });
      if (latestDate) {
        latestAction = `<strong style="color: var(--indigo); font-size: 0.85rem;">${latestText}</strong><br><span class="muted" style="font-size: 0.75rem;">بتاريخ: ${fmtDate(latestDate.toISOString().split('T')[0])}</span>`;
      }
    }

    tbody.innerHTML += `
      <tr>
        <td><strong style="color: var(--indigo); cursor: pointer;" onclick="openClient('${c.id}')">${c.full_name}</strong></td>
        <td dir="ltr" style="text-align: right;">${c.national_id || '-'}</td>
        <td dir="ltr" style="text-align: right;">${c.phone || '-'} ${waLink}</td>
        <td><span class="letter-badge" style="background-color: ${badgeColor};">${poaLetter}</span></td>
        <td><span class="tag">${activePoa?.poa_number || '-'}</span></td>
        <td>${latestAction}</td>
        <td>${c.governorate ? c.governorate + ' - ' : ''}${c.city || '-'}</td>
        <td><button type="button" class="btn small ghost" onclick="openClient('${c.id}')">عرض الملف</button></td>
      </tr>
    `;
  });
}

$('search').addEventListener('input', () => { 
  clearTimeout(searchTimer); 
  searchTimer = setTimeout(applyFilters, 300); 
});

window.openClient = async (id) => {
  currentId = id;
  $('list-view').hidden = true; $('detail-view').hidden = false;
  $('d-name').textContent = 'جاري التحميل...';
  
  if (id.startsWith('d_')) {
    const dummy = DUMMY_CLIENTS.find(c => c.id === id);
    if (dummy) {
      currentClient = dummy;
      currentPoas = dummy.powers_of_attorney || [];
      currentCases = []; currentDocs = [];
      renderDetail();
      return;
    }
  }

  const [c, p, cs, d] = await Promise.all([
    sb.from('clients').select('*').eq('id', id).maybeSingle(),
    sb.from('powers_of_attorney').select('*').eq('client_id', id).order('issue_date', { ascending: false, nullsFirst: false }),
    sb.from('cases').select('id, case_number, case_year, court, degree, status').eq('client_id', id).order('case_year', { ascending: false }),
    sb.from('documents').select('*').eq('client_id', id).order('created_at', { ascending: false })
  ]);
  
  if (c.error || !c.data) { flash('مقدرتش أفتح بيانات الموكل.', false); return; }
  currentClient = c.data; currentPoas = p.data || []; currentCases = cs.data || []; currentDocs = d.data || [];
  renderDetail();
};

function renderDetail() {
  const c = currentClient;
  $('d-name').textContent = c.full_name;
  const waLink = c.phone ? `<a href="${formatWhatsApp(c.phone)}" target="_blank" class="wa-btn" title="واتساب"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>` : '';
  $('d-info-line').innerHTML = `موبايل: <span dir="ltr">${c.phone || '-'}</span> ${waLink} | محافظة: ${c.governorate || '-'}`;

  const info = [
    ['الرقم القومي', c.national_id], ['الموبايل', c.phone], ['واتساب', c.whatsapp], ['البريد الإلكتروني', c.email],
    ['المحافظة', c.governorate], ['المدينة / المركز', c.city], ['العنوان التفصيلي', c.address], ['ملاحظات', c.notes]
  ];
  const dl = el('dl', { class: 'kv' });
  info.forEach(([k, v]) => { if (v) dl.append(el('div', {}, el('dt', { text: k }), el('dd', { text: v }))); });
  $('d-info').replaceChildren(dl.children.length ? dl : el('p', { class: 'muted', text: 'مفيش بيانات مسجلة.' }));

  const docsUl = $('d-docs-list'); docsUl.replaceChildren();
  const ownDocs = currentDocs.filter(d => !d.poa_id);
  if (!ownDocs.length) docsUl.append(el('li', { class: 'muted', text: 'لا يوجد مستندات.' }));
  else ownDocs.forEach(d => { docsUl.append(el('li', {}, el('span', { class: 'name', text: d.title }), el('div', { class: 'row', style: 'margin:0' }, btn('فتح', () => openDoc(d)), btn('حذف', () => removeDoc(d), 'danger')))); });

  const poasBox = $('d-poas-list'); poasBox.replaceChildren();
  if (!currentPoas.length) poasBox.append(el('p', { class: 'muted', text: 'لا يوجد توكيلات مسجلة.' }));
  else {
    currentPoas.forEach((p) => {
      const st = POA_STATUS[p.status] || { t: p.status, c: '' }; const mine = currentDocs.filter((d) => d.poa_id === p.id);
      const poaTitle = p.poa_letter ? `توكيل ${p.poa_letter} رقم ${p.poa_number}` : `توكيل رقم ${p.poa_number}`;
      
      poasBox.append(el('div', { class: 'card', style: 'margin-bottom: 1rem;' }, 
        el('h4', { style: 'margin-top:0; display:flex; justify-content:space-between;' }, el('span', { text: poaTitle }), el('span', { class: 'tag ' + st.c, text: st.t })),
        el('div', { class: 'muted', style: 'font-size:0.9rem; margin-bottom:0.5rem;' }, `مكتب التوثيق: ${p.notary_office || '-'} | سنة: ${p.issue_date ? p.issue_date.split('-')[0] : '-'}`),
        el('div', { class: 'row' },
          btn('تعديل', () => openPoaDialog(p)),
          btn('حذف', () => deletePoa(p, mine), 'danger'),
          btn('رفع سكان', () => document.getElementById('d-file-docs').click())
        )
      ));
    });
  }

  const casesBox = $('d-cases-list'); casesBox.replaceChildren();
  if (!currentCases.length) casesBox.innerHTML = '<p class="muted">لا يوجد قضايا مرتبطة.</p>';
  else {
    currentCases.forEach((k) => {
      const st = CASE_STATUS[k.status] || k.status;
      casesBox.append(el('div', { class: 'mini-case-card', onclick: () => window.location.href = `cases.html?id=${k.id}&mode=view` }, 
        el('h5', { text: `قضية ${k.case_number} لسنة ${k.case_year}` }),
        el('p', { text: `${k.court} - ${st}` })
      ));
    });
  }
}

window.showList = () => { $('detail-view').hidden = true; $('list-view').hidden = false; loadList(); };

window.editCurrentClient = () => { 
  if (currentClient.id.startsWith('d_')) { alert('دي بيانات تجريبية.'); return; }
  openClientDialog(currentClient); 
};

async function deleteCurrentClient() {
  if (currentClient.id.startsWith('d_')) { alert('دي بيانات تجريبية.'); return; }
  if (!confirm(`حذف الموكل "${currentClient.full_name}" نهائياً؟`)) return;
  const { error } = await sb.from('clients').delete().eq('id', currentClient.id);
  if (error) { flash(error.code === '23503' ? 'مينفعش يتحذف لأن عليه قضايا.' : 'تعذّر الحذف.', false); return; }
  if (currentDocs.length) await sb.storage.from('law-docs').remove(currentDocs.map((d) => d.file_path));
  flash('اتحذف الموكل.'); showList();
}

window.openLinkCaseDialog = async () => {
  if (currentClient.id.startsWith('d_')) { alert('دي بيانات تجريبية.'); return; }
  const select = $('link-case-select'); select.innerHTML = '<option value="">جاري التحميل...</option>';
  const { data } = await sb.from('cases').select('id, case_number, case_year, clients(full_name)').neq('client_id', currentClient.id);
  select.innerHTML = '<option value="">— اختر القضية —</option>';
  if (data) { data.forEach(c => { select.innerHTML += `<option value="${c.id}">قضية ${c.case_number} لسنة ${c.case_year} (الموكل الحالي: ${c.clients?.full_name || 'بدون'})</option>`; }); }
  $('link-case-dialog').showModal();
};

$('link-case-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const caseId = $('link-case-select').value; if (!caseId) return;
  const caseNum = $('link-case-select').options[$('link-case-select').selectedIndex].text.split(' ')[1];
  await sb.from('cases').update({ client_id: currentClient.id }).eq('id', caseId);
  $('link-case-dialog').close(); 
  flash('تم ربط القضية بالموكل.'); 
  
  // إشعار ربط قضية
  await sendNotif('ربط قضية بموكل 🔗', `تم ربط القضية رقم (${caseNum}) بالموكل: ${currentClient.full_name} بواسطة ${me.full_name}`);
  
  await openClient(currentClient.id);
});

async function uploadFiles(files, { docType, poaId, title, clientId }) {
  if (clientId.startsWith('d_')) { alert('دي بيانات تجريبية.'); return; }
  let okCount = 0;
  for (const f of files) {
    if (f.size > MAX_BYTES) { flash(`الملف "${f.name}" أكبر من 50 ميجا.`, false); continue; }
    const ext = ((f.name.split('.').pop() || 'bin').toLowerCase()).slice(0, 5);
    const uid = (crypto.randomUUID?.() ?? Date.now().toString(36));
    const path = `clients/${clientId}/${uid}.${ext}`;
    const up = await sb.storage.from('law-docs').upload(path, f, { contentType: f.type, upsert: false });
    if (up.error) { flash(`تعذّر رفع "${f.name}".`, false); continue; }
    const stem = f.name.replace(/\.[^.]+$/, '');
    const ins = await sb.from('documents').insert({ client_id: clientId, poa_id: poaId || null, doc_type: docType, title: title || stem, file_path: path, file_name: f.name, mime_type: f.type, size_bytes: f.size });
    if (ins.error) { await sb.storage.from('law-docs').remove([path]); flash(`تعذّر تسجيل "${f.name}".`, false); continue; }
    okCount++;
  }
  if (okCount) {
    flash(`اترفع ${okCount} ملف.`);
    // إشعار رفع مستند
    await sendNotif('رفع مستندات 📁', `تم رفع ${okCount} مستند جديد للموكل: ${currentClient.full_name} بواسطة ${me.full_name}`);
  }
  await openClient(currentClient.id);
}

async function openDoc(d) { const w = window.open('about:blank', '_blank'); const { data, error } = await sb.storage.from('law-docs').createSignedUrl(d.file_path, 120); if (error || !data) { if (w) w.close(); flash('تعذّر الفتح.', false); return; } if (w) w.location.href = data.signedUrl; else location.href = data.signedUrl; }
async function removeDoc(d) { if (!confirm(`حذف الملف "${d.title}"؟`)) return; const r = await sb.storage.from('law-docs').remove([d.file_path]); if (r.error) { flash('تعذّر الحذف.', false); return; } await sb.from('documents').delete().eq('id', d.id); flash('اتحذف.'); await openClient(currentClient.id); }

$('d-file-docs').addEventListener('change', async (e) => { 
  if (!e.target.files.length) return; 
  await uploadFiles([...e.target.files], { docType: 'id_copy', poaId: null, title: null, clientId: currentClient.id }); 
  e.target.value = ''; 
});

function openClientDialog(c) {
  editingClientId = c ? c.id : null; $('client-dialog-title').textContent = c ? 'تعديل بيانات الموكل' : 'موكل جديد';
  $('f-name').value = c?.full_name || ''; $('f-nid').value = c?.national_id || ''; $('f-phone').value = c?.phone || ''; $('f-wa').value = c?.whatsapp || ''; $('f-email').value = c?.email || '';
  $('f-gov').value = c?.governorate || ''; fillCities(c?.governorate || '', c?.city || ''); $('f-address').value = c?.address || ''; $('f-notes').value = c?.notes || '';
  $('client-error').hidden = true; $('client-dialog').showModal(); $('f-name').focus();
}

$('client-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const err = $('client-error'); const fail = (t) => { err.textContent = t; err.hidden = false; }; err.hidden = true;
  const name = $('f-name').value.trim(); const nid = normDigits($('f-nid').value).replace(/\s+/g, ''); const phone = normDigits($('f-phone').value).replace(/\s+/g, ''); const wa = normDigits($('f-wa').value).replace(/\s+/g, ''); const email = $('f-email').value.trim();
  if (!name) return fail('اكتب اسم الموكل.'); if (nid && !/^\d{14}$/.test(nid)) return fail('الرقم القومي لازم 14 رقم.');
  
  const payload = { full_name: name, national_id: nid || null, phone: phone || null, whatsapp: wa || null, email: email || null, governorate: $('f-gov').value || null, city: $('f-city').value || null, address: $('f-address').value.trim() || null, notes: $('f-notes').value.trim() || null };
  const btnSave = $('client-save'); btnSave.disabled = true;
  try {
    let id = editingClientId;
    if (editingClientId) { 
      const r = await sb.from('clients').update(payload).eq('id', editingClientId); 
      if (r.error) return fail('تعذّر الحفظ.'); 
      await sendNotif('تعديل بيانات موكل ✏️', `تم تعديل بيانات الموكل: ${name} بواسطة ${me.full_name}`);
    }
    else { 
      const r = await sb.from('clients').insert(payload).select('id').single(); 
      if (r.error) return fail('تعذّر الإضافة.'); 
      id = r.data.id; 
      await sendNotif('إضافة موكل جديد 👤', `تم إضافة موكل جديد باسم: ${name} بواسطة ${me.full_name}`);
    }
    $('client-dialog').close(); flash('اتحفظ.'); if (editingClientId) { openClient(id); } else { showList(); }
  } finally { btnSave.disabled = false; }
});

function openPoaDialog(p) {
  if (currentClient.id.startsWith('d_')) { alert('دي بيانات تجريبية.'); return; }
  editingPoaId = p ? p.id : null; $('poa-dialog-title').textContent = p ? 'تعديل التوكيل' : 'توكيل جديد';
  fillLetters($('p-letter'), p?.poa_letter || ''); $('p-number').value = p?.poa_number || ''; $('p-type').value = p?.poa_type || 'general';
  $('p-date').value = p?.issue_date ? p.issue_date.split('-')[0] : ''; $('p-office').value = p?.notary_office || ''; $('p-status').value = p?.status || 'active'; $('p-scope').value = p?.scope || '';
  $('poa-error').hidden = true; $('poa-dialog').showModal(); $('p-number').focus();
}

$('poa-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const err = $('poa-error'); const fail = (t) => { err.textContent = t; err.hidden = false; }; err.hidden = true;
  const number = normDigits($('p-number').value).trim(); if (!number) return fail('اكتب رقم التوكيل.');
  const letter = $('p-letter').value;
  const payload = { client_id: currentClient.id, poa_letter: letter || null, poa_number: number, poa_type: $('p-type').value, issue_date: $('p-date').value ? `${$('p-date').value}-01-01` : null, notary_office: $('p-office').value.trim() || null, status: $('p-status').value, scope: $('p-scope').value.trim() || null };
  const b = $('poa-save'); b.disabled = true;
  try { 
    const r = editingPoaId ? await sb.from('powers_of_attorney').update(payload).eq('id', editingPoaId) : await sb.from('powers_of_attorney').insert(payload); 
    if (r.error) return fail('تعذّر الحفظ.'); 
    $('poa-dialog').close(); flash('اتحفظ.'); 
    
    // إشعار توكيل
    const title = editingPoaId ? 'تعديل توكيل ✏️' : 'إضافة توكيل جديد 📄';
    const msg = `تم ${editingPoaId ? 'تعديل' : 'إضافة'} توكيل ${letter ? letter + ' رقم ' : 'رقم '}${number} للموكل: ${currentClient.full_name} بواسطة ${me.full_name}`;
    await sendNotif(title, msg);

    await openClient(currentClient.id); 
  } finally { b.disabled = false; }
});

async function deletePoa(p, docs) { if (!confirm(`حذف التوكيل؟`)) return; const { error } = await sb.from('powers_of_attorney').delete().eq('id', p.id); if (error) { flash('تعذّر الحذف.', false); return; } if (docs.length) await sb.storage.from('law-docs').remove(docs.map((d) => d.file_path)); flash('اتحذف.'); await openClient(currentClient.id); }

document.querySelectorAll('dialog [data-close]').forEach((b) => { b.addEventListener('click', () => b.closest('dialog').close()); });
$('new-client').addEventListener('click', () => openClientDialog(null));

async function init() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) { goToLogin(); return; }
  const { data: profile, error } = await sb.from('profiles').select('id, full_name, role, is_active').eq('id', session.user.id).maybeSingle();
  if (error || !profile || !profile.is_active) { await sb.auth.signOut(); goToLogin(); return; }
  me = profile; $('user-name').textContent = profile.full_name || session.user.email; $('user-avatar').textContent = (document.getElementById('user-name').textContent || '?').trim().charAt(0); $('user-role').textContent = ROLE_LABELS[profile.role] || profile.role;
  if (isAdmin()) $('admin-link').hidden = false;
  fillGovernorates(); $('f-gov').addEventListener('change', () => fillCities($('f-gov').value));
  await loadList(); $('app').hidden = false;
  const urlParams = new URLSearchParams(window.location.search); const clientId = urlParams.get('id'); if (clientId) openClient(clientId);
}
$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') goToLogin(); });
init();