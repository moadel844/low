const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
const CASE_TYPES = { civil: 'مدني', criminal: 'جنائي', family: 'أسرة', labor: 'عمال', commercial: 'تجاري', administrative: 'إداري', other: 'أخرى' };
const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const EGYPT_HOLIDAYS = {
  '01-07': 'عيد الميلاد المجيد', '01-25': 'عيد الشرطة', '04-25': 'تحرير سيناء', '05-01': 'عيد العمال', '06-30': 'ثورة 30 يونيو', '07-23': 'ثورة 23 يوليو', '10-06': 'عيد القوات المسلحة',
  '2024-04-10': 'عيد الفطر', '2024-04-11': 'إجازة الفطر', '2024-06-15': 'وقفة عرفات', '2024-06-16': 'عيد الأضحى', '2024-06-17': 'إجازة الأضحى', '2024-07-07': 'رأس السنة الهجرية', '2024-09-15': 'المولد النبوي',
  '2025-03-30': 'عيد الفطر', '2025-03-31': 'إجازة الفطر', '2025-06-05': 'وقفة عرفات', '2025-06-06': 'عيد الأضحى', '2025-06-07': 'إجازة الأضحى', '2025-06-26': 'رأس السنة الهجرية', '2025-09-04': 'المولد النبوي',
};

let me = null, lawyers = [], currentView = 'month', currentDate = new Date(), selectedDate = new Date(), hearingsData = [], eventsData = [];
const $ = (id) => document.getElementById(id);
const isAdmin = () => me && me.role === 'admin';
function goToLogin() { location.replace('login.html'); }
const formatDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function formatWhatsApp(phone) {
  if (!phone) return '#';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '20' + p.substring(1);
  else if (!p.startsWith('20')) p = '20' + p;
  return `https://wa.me/${p}`;
}

// دالة إرسال إشعار
async function sendNotif(title, msg) {
  try {
    await sb.from('notifications').insert({ title, message: msg, target_role: 'all' });
  } catch (e) { console.error("فشل إرسال الإشعار", e); }
}

function getHolidayName(dateStr) {
  const d = new Date(dateStr); const mmdd = dateStr.substring(5); const day = d.getDay();
  if (EGYPT_HOLIDAYS[dateStr]) return EGYPT_HOLIDAYS[dateStr]; if (EGYPT_HOLIDAYS[mmdd]) return EGYPT_HOLIDAYS[mmdd];
  const yStr = formatDateStr(new Date(d.getTime() - 86400000)); const tStr = formatDateStr(new Date(d.getTime() + 86400000));
  if (day === 4 && (EGYPT_HOLIDAYS[tStr] || EGYPT_HOLIDAYS[tStr.substring(5)])) return 'إجازة بديلة لـ ' + (EGYPT_HOLIDAYS[tStr] || EGYPT_HOLIDAYS[tStr.substring(5)]);
  if (day === 0 && (EGYPT_HOLIDAYS[yStr] || EGYPT_HOLIDAYS[yStr.substring(5)])) return 'إجازة بديلة لـ ' + (EGYPT_HOLIDAYS[yStr] || EGYPT_HOLIDAYS[yStr.substring(5)]);
  return null;
}

async function loadData() {
  const { data: l } = await sb.from('profiles').select('id, full_name').in('role', ['admin', 'lawyer']).eq('is_active', true);
  if (l) { lawyers = l; const sel = $('filter-lawyer'); sel.innerHTML = '<option value="">كل المحامين</option>'; lawyers.forEach(law => sel.append(el('option', { value: law.id, text: law.full_name }))); }
  const { data: c } = await sb.from('cases').select('id, case_number, case_year, court, next_hearing_date, case_type, responsible_lawyer_id, clients(full_name, phone)').not('next_hearing_date', 'is', null);
  const { data: e } = await sb.from('custom_events').select('*');
  if (c && c.length > 0) hearingsData = c; else { const y = currentDate.getFullYear(), m = currentDate.getMonth(), d = currentDate.getDate(); hearingsData = [{ id: 'd1', case_number: '1234', case_year: '2024', court: 'جنوب القاهرة', next_hearing_date: formatDateStr(new Date(y, m, d)), case_type: 'civil', clients: { full_name: 'أحمد محمود', phone: '01000000000' }, responsible_lawyer_id: null }]; }
  if (e && e.length > 0) eventsData = e;
}

window.toggleView = (view) => { currentView = view; $('btn-view-month').classList.toggle('active', view === 'month'); $('btn-view-week').classList.toggle('active', view === 'week'); renderCalendar(); };

window.selectDay = (y, m, d) => { selectedDate = new Date(y, m, d); renderCalendar(); renderDayDetails(); };

function renderSideTabs() {
  const container = $('side-tabs-container');
  if (!container) return;
  container.innerHTML = '';
  const baseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  for (let offset = -3; offset <= 2; offset++) {
    const targetDate = new Date(baseDate);
    targetDate.setMonth(targetDate.getMonth() + offset);

    const monthName = ARABIC_MONTHS[targetDate.getMonth()];
    const isActive = targetDate.getMonth() === currentDate.getMonth() && targetDate.getFullYear() === currentDate.getFullYear();

    const div = document.createElement('div');
    div.className = `side-tab ${isActive ? 'active' : ''}`;
    div.textContent = monthName;

    div.onclick = () => {
      currentDate = new Date(targetDate);
      if (selectedDate.getMonth() !== targetDate.getMonth() || selectedDate.getFullYear() !== targetDate.getFullYear()) {
        selectedDate = new Date(targetDate);
      }
      renderCalendar();
      renderDayDetails();
    };

    container.appendChild(div);
  }
}

function renderCalendar() {
  renderSideTabs();

  const year = currentDate.getFullYear(), month = currentDate.getMonth(), filterLawyer = $('filter-lawyer').value;
  const filteredHearings = filterLawyer ? hearingsData.filter(h => h.responsible_lawyer_id === filterLawyer) : hearingsData;
  const filteredEvents = filterLawyer ? eventsData.filter(e => e.created_by === filterLawyer) : eventsData;
  const grid = $('calendar-grid'); grid.innerHTML = '';
  if (currentView === 'month') {
    const monthName = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(currentDate); $('month-year-display').textContent = monthName;
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0), startingDayOfWeek = firstDay.getDay(), daysInMonth = lastDay.getDate();
    for (let i = 0; i < startingDayOfWeek; i++) grid.innerHTML += `<div class="cal-cell other-month"></div>`;
    const todayStr = formatDateStr(new Date()), selectedStr = formatDateStr(selectedDate);
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day), cellDateStr = formatDateStr(cellDate), isToday = cellDateStr === todayStr, isSelected = cellDateStr === selectedStr, holidayName = getHolidayName(cellDateStr);
      const dayCases = filteredHearings.filter(h => h.next_hearing_date === cellDateStr), dayEvents = filteredEvents.filter(e => e.event_date === cellDateStr);
      let dotsHtml = '';
      if (dayCases.length > 0 || dayEvents.length > 0) { dotsHtml = `<div class="dots">`; dayCases.forEach(h => { let dc = 'civil'; if(h.case_type==='criminal') dc='criminal'; if(h.case_type==='family') dc='family'; dotsHtml += `<span class="dot ${dc}"></span>`; }); dayEvents.forEach(() => dotsHtml += `<span class="dot event"></span>`); dotsHtml += `</div>`; }
      grid.innerHTML += `<div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${holidayName ? 'holiday' : ''}" onclick="selectDay(${year}, ${month}, ${day})"><span class="day-num">${day}</span>${holidayName ? `<span class="holiday-name">${holidayName}</span>` : ''}${dotsHtml}</div>`;
    }
    const totalCells = startingDayOfWeek + daysInMonth; for (let i = 0; i < 42 - totalCells; i++) grid.innerHTML += `<div class="cal-cell other-month"></div>`; grid.classList.remove('week-view');
  } else {
    const firstDayOfWeek = new Date(selectedDate); firstDayOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const lastDayOfWeek = new Date(firstDayOfWeek); lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    $('month-year-display').textContent = `أسبوع ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(firstDayOfWeek)} - ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(lastDayOfWeek)}`;
    const todayStr = formatDateStr(new Date()), selectedStr = formatDateStr(selectedDate);
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(firstDayOfWeek); cellDate.setDate(firstDayOfWeek.getDate() + i); const cellDateStr = formatDateStr(cellDate);
      const isToday = cellDateStr === todayStr, isSelected = cellDateStr === selectedStr, holidayName = getHolidayName(cellDateStr);
      const dayCases = filteredHearings.filter(h => h.next_hearing_date === cellDateStr), dayEvents = filteredEvents.filter(e => e.event_date === cellDateStr);
      let itemsHtml = ''; dayCases.forEach(h => { itemsHtml += `<div class="case-label">${h.clients?.full_name || 'موكل'} (${CASE_TYPES[h.case_type]})</div>`; }); dayEvents.forEach(e => { itemsHtml += `<div class="event-label">${e.title}</div>`; });
      grid.innerHTML += `<div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${holidayName ? 'holiday' : ''}" onclick="selectDay(${cellDate.getFullYear()}, ${cellDate.getMonth()}, ${cellDate.getDate()})"><span class="day-num">${cellDate.getDate()}</span>${holidayName ? `<span class="holiday-name">${holidayName}</span>` : ''}<div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem;">${itemsHtml}</div></div>`;
    }
    grid.classList.add('week-view');
  }
}

function renderDayDetails() {
  const selectedStr = formatDateStr(selectedDate), filterLawyer = $('filter-lawyer').value;
  const filteredHearings = filterLawyer ? hearingsData.filter(h => h.responsible_lawyer_id === filterLawyer) : hearingsData;
  const filteredEvents = filterLawyer ? eventsData.filter(e => e.created_by === filterLawyer) : eventsData;
  const dayCases = filteredHearings.filter(h => h.next_hearing_date === selectedStr), dayEvents = filteredEvents.filter(e => e.event_date === selectedStr);
  const holidayName = getHolidayName(selectedStr), totalItems = dayCases.length + dayEvents.length;
  const titleStr = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDate);
  $('selected-date-title').textContent = titleStr; $('selected-date-subtitle').textContent = totalItems > 0 ? `عدد المواعيد: ${totalItems}` : 'لا توجد مواعيد';
  const bannerContainer = $('holiday-banner-container'); bannerContainer.replaceChildren(); if (holidayName) bannerContainer.append(el('div', { class: 'holiday-banner', style: 'margin: 0 0 1rem 0; padding: 0.8rem; border-radius: 8px; background: #fee2e2; color: #991b1b; border: 1px solid #f87171; text-align: center; font-weight: 600;' }, `🏖️ إجازة رسمية: ${holidayName}`));
  const ul = $('day-hearings-list'); ul.replaceChildren();
  if (totalItems === 0) { ul.innerHTML = `<div class="empty-day"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15h6"/></svg><p>لا توجد جلسات أو مواعيد في هذا اليوم.</p></div>`; return; }
  
  dayCases.forEach(h => { 
    const waBtn = h.clients?.phone ? el('a', { href: formatWhatsApp(h.clients.phone), target: '_blank', class: 'wa-btn', onclick: (ev) => ev.stopPropagation(), title: 'واتساب' }, el('svg', { viewBox: '0 0 24 24' }, el('path', { d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' }))) : null;
    
    ul.append(el('li', { class: 'hearing-item', onclick: () => window.location.href = `cases.html?id=${h.id}&mode=view` }, 
      el('div', { class: 'hearing-title' }, el('span', { text: `قضية ${h.case_number} لسنة ${h.case_year}` }), el('span', { class: 'tag', text: CASE_TYPES[h.case_type] || 'أخرى' })), 
      el('div', { class: 'hearing-client' }, el('strong', { text: 'الموكل: ' }), h.clients?.full_name || 'غير معروف', waBtn), 
      el('div', { class: 'hearing-court' }, el('svg', { viewBox: '0 0 24 24', width: '14', height: '14', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, el('path', { d: 'M3 21h18M5 21V7l8-4 8 4v14' })), h.court || 'غير محددة')
    )); 
  });
  
  dayEvents.forEach(e => { 
    ul.append(el('li', { class: 'hearing-item custom-event' }, 
      el('div', { class: 'hearing-title' }, 
        el('span', { text: e.title }), 
        el('div', {}, el('span', { class: 'tag', text: e.event_time ? e.event_time.substring(0,5) : 'مهمة' }), el('button', { type: 'button', class: 'btn small danger', text: 'حذف', onclick: (ev) => { ev.stopPropagation(); deleteEvent(e.id); } }))
      ), 
      e.notes ? el('div', { class: 'hearing-client' }, e.notes) : null, 
      el('div', { class: 'hearing-court' }, 'ميعاد شخصي / مهمة')
    )); 
  });
}

async function deleteEvent(id) {
  if (!confirm('حذف هذا الميعاد؟')) return;
  await sb.from('custom_events').delete().eq('id', id);
  await loadData(); renderCalendar(); renderDayDetails();
  alert('تم الحذف');
}

window.openEventModal = () => { $('event-form').reset(); $('e-date').value = formatDateStr(selectedDate); $('event-dialog').showModal(); };
$('event-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true;
  const payload = { title: $('e-title').value.trim(), event_date: $('e-date').value, event_time: $('e-time').value || null, notes: $('e-notes').value.trim() || null };
  const { error } = await sb.from('custom_events').insert(payload); btn.disabled = false;
  if (error) { $('event-error').textContent = 'حدث خطأ أثناء الحفظ.'; $('event-error').hidden = false; return; }
  
  // إشعار إضافة ميعاد جديد
  await sendNotif('ميعاد جديد في الأجندة 📅', `تم إضافة ميعاد: "${payload.title}" بتاريخ ${payload.event_date} بواسطة ${me.full_name}`);

  $('event-dialog').close(); await loadData(); renderCalendar(); renderDayDetails();
});

function el(tag, props = {}, ...kids) { const n = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (v === undefined || v === null) continue; if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k === 'style') n.style.cssText = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); } kids.flat().filter(Boolean).forEach((c) => n.append(c)); return n; }

$('prev-month').addEventListener('click', () => { if (currentView === 'month') { currentDate.setMonth(currentDate.getMonth() - 1); if (currentDate.getMonth() !== selectedDate.getMonth()) selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); } else { selectedDate.setDate(selectedDate.getDate() - 7); currentDate = new Date(selectedDate); } renderCalendar(); renderDayDetails(); });
$('next-month').addEventListener('click', () => { if (currentView === 'month') { currentDate.setMonth(currentDate.getMonth() + 1); if (currentDate.getMonth() !== selectedDate.getMonth()) selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); } else { selectedDate.setDate(selectedDate.getDate() + 7); currentDate = new Date(selectedDate); } renderCalendar(); renderDayDetails(); });

async function init() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return goToLogin();
  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(); if (!profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
  me = profile; $('user-name').textContent = profile.full_name; $('user-avatar').textContent = profile.full_name.charAt(0); $('user-role').textContent = ROLE_LABELS[profile.role] || profile.role; if (isAdmin()) $('admin-link').hidden = false;
  currentDate = new Date(); selectedDate = new Date(); await loadData(); renderCalendar(); renderDayDetails(); $('app').hidden = false;
}
$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
init();