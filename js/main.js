/* Rani Jewellers — public site */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  let settings = rjGet('settings');
  let rates = rjGet('rates');
  let stock = rjGet('stock');
  let filter = 'All';

  // Shared gradients for jewellery icons
  document.body.insertAdjacentHTML('afterbegin', `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c1"/><stop offset=".45" stop-color="#e2b33a"/><stop offset="1" stop-color="#8a6510"/></linearGradient>
      <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9ced6"/><stop offset="1" stop-color="#6b7280"/></linearGradient>
    </defs></svg>`);

  const ICONS = {
    Necklace: '<path d="M20 20 C20 70 80 70 80 20" fill="none" stroke="F" stroke-width="5"/><g fill="F"><circle cx="26" cy="44" r="5"/><circle cx="36" cy="54" r="5"/><circle cx="50" cy="58" r="6"/><circle cx="64" cy="54" r="5"/><circle cx="74" cy="44" r="5"/></g><path d="M50 62 L42 76 L50 92 L58 76 Z" fill="F" stroke="#4a0e1c" stroke-width="1"/>',
    Earrings: '<g fill="none" stroke="F" stroke-width="4"><circle cx="30" cy="16" r="6"/><circle cx="70" cy="16" r="6"/></g><g fill="F"><path d="M14 52 Q30 26 46 52 Z"/><path d="M54 52 Q70 26 86 52 Z"/><circle cx="18" cy="60" r="3"/><circle cx="30" cy="62" r="3"/><circle cx="42" cy="60" r="3"/><circle cx="58" cy="60" r="3"/><circle cx="70" cy="62" r="3"/><circle cx="82" cy="60" r="3"/></g><path d="M30 22 V30 M70 22 V30" stroke="F" stroke-width="3"/>',
    Bangles: '<g fill="none" stroke="F"><ellipse cx="40" cy="50" rx="28" ry="30" stroke-width="9"/><ellipse cx="60" cy="50" rx="28" ry="30" stroke-width="9"/></g>',
    Ring: '<circle cx="50" cy="62" r="26" fill="none" stroke="F" stroke-width="8"/><path d="M36 30 L42 18 H58 L64 30 L50 42 Z" fill="#fdf6ff" stroke="F" stroke-width="3"/>',
    Chain: '<g fill="none" stroke="F" stroke-width="5"><ellipse cx="20" cy="50" rx="10" ry="6"/><ellipse cx="35" cy="50" rx="6" ry="10"/><ellipse cx="50" cy="50" rx="10" ry="6"/><ellipse cx="65" cy="50" rx="6" ry="10"/><ellipse cx="80" cy="50" rx="10" ry="6"/></g>',
    Pendant: '<path d="M30 10 Q50 30 70 10" fill="none" stroke="F" stroke-width="3"/><circle cx="50" cy="26" r="5" fill="none" stroke="F" stroke-width="3"/><path d="M50 32 C76 40 76 76 50 92 C24 76 24 40 50 32 Z" fill="F"/><circle cx="50" cy="60" r="10" fill="#7a1d34"/>',
    Anklet: '<path d="M10 40 Q50 70 90 40" fill="none" stroke="F" stroke-width="4"/><g fill="F"><circle cx="22" cy="56" r="5"/><circle cx="36" cy="63" r="5"/><circle cx="50" cy="66" r="5"/><circle cx="64" cy="63" r="5"/><circle cx="78" cy="56" r="5"/></g>',
    Coin: '<circle cx="50" cy="50" r="38" fill="F"/><circle cx="50" cy="50" r="30" fill="none" stroke="#8a6510" stroke-width="2"/><text x="50" y="58" text-anchor="middle" font-family="Georgia" font-size="22" font-weight="700" fill="#6b4a08">999</text>',
    Silverware: '<ellipse cx="50" cy="60" rx="40" ry="14" fill="F"/><ellipse cx="50" cy="56" rx="32" ry="9" fill="none" stroke="#4b5563" stroke-width="1.5"/><path d="M40 52 Q50 26 60 52 Z" fill="F"/><path d="M50 26 Q46 18 50 12 Q54 18 50 26" fill="#f59e0b"/>'
  };
  const icon = (cat, metal) => {
    const fill = metal === 'silver' ? 'url(#sg)' : 'url(#gg)';
    return `<svg viewBox="0 0 100 100">${(ICONS[cat] || ICONS.Pendant).replaceAll('"F"', `"${fill}"`)}</svg>`;
  };

  /* ---------- Shop details ---------- */
  function applyShop() {
    $$('[data-shop]').forEach(el => { el.textContent = settings[el.dataset.shop] || ''; });
    $$('[data-shop-tel]').forEach(el => el.href = 'tel:' + settings.phone.replace(/\s/g, ''));
    $$('[data-shop-wa]').forEach(el => {
      el.href = waLink(settings.whatsapp, `Namaste ${settings.shopName}, I'd like to know more about your jewellery.`);
      el.target = '_blank'; el.rel = 'noopener';
    });
    $('#gstNote').textContent = settings.gstPct + '%';
    $$('.bDays').forEach(el => el.textContent = settings.bookingDays);
    $$('.bPctTxt').forEach(el => el.textContent = settings.advancePct);
    $('#bPct').textContent = settings.advancePct;
  }

  /* ---------- Rates ---------- */
  function change(key) {
    const prev = rates.prev && rates.prev[key];
    if (!prev) return { txt: '', cls: '' };
    const d = rates[key] - prev;
    const pct = (d / prev * 100).toFixed(2);
    if (d === 0) return { txt: '— No change', cls: '' };
    return { txt: `${d > 0 ? '▲' : '▼'} ${inr(Math.abs(d))} (${Math.abs(pct)}%)`, cls: d > 0 ? 'up' : 'down' };
  }

  function renderRates() {
    const t = new Date(rates.updatedAt);
    $('#rateTime').textContent = t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    $('#heroRate').textContent = inr(rates.gold22);
    const c = change('gold22');
    $('#heroChange').textContent = c.txt ? c.txt + ' since last update' : '';
    $('#heroChange').className = c.cls;
    $('#heroMini').innerHTML = ['gold24', 'gold18', 'silver'].map(k =>
      `<div>${METALS[k].label}<b>${inr(rates[k])}</b><span class="${change(k).cls}" style="font-size:.7rem">/${METALS[k].unit}</span></div>`).join('');

    $('#rateGrid').innerHTML = Object.entries(METALS).map(([k, m]) => {
      const ch = change(k);
      return `<div class="rate-tile reveal in ${k === 'silver' ? 'silver' : ''}">
        <span class="purity">${m.purity} PURITY</span>
        <h4>${m.label}</h4>
        <div class="unit">per ${m.unit}</div>
        <div class="price">${inr(rates[k])}</div>
        <div class="chg ${ch.cls}">${ch.txt}</div>
        <div class="pg">Per gram: <b>${inr(m.perGram(rates), 2)}</b></div>
      </div>`;
    }).join('');

    const items = Object.entries(METALS).map(([k, m]) => {
      const ch = change(k);
      return `<span>${m.label} (${m.unit}) <b>${inr(rates[k])}</b> <i class="${ch.cls}" style="font-style:normal">${ch.txt.split(' (')[0]}</i></span>`;
    }).join('') + `<span>Updated <b>${$('#rateTime').textContent}</b></span><span>12 + 1 Scheme <b>— 13th month FREE</b></span>`;
    $('#ticker').innerHTML = items + items; // doubled for seamless loop
  }

  function fillMetalSelect(sel, keys) {
    sel.innerHTML = keys.map(k => `<option value="${k}">${METALS[k].label} (${METALS[k].purity})</option>`).join('');
  }

  function calc() {
    const k = $('#cMetal').value, w = +$('#cWeight').value || 0, mk = +$('#cMaking').value || 0;
    const p = itemPrice({ metal: k, weight: w, making: mk }, rates, settings.gstPct);
    $('#cOut').textContent = inr(p.total);
    $('#cBreak').textContent = `Metal ${inr(p.metal)} + Making ${inr(p.making)} + GST ${inr(p.gst)}`;
  }

  /* ---------- Stock ---------- */
  function renderFilters() {
    const cats = ['All', ...new Set(stock.map(s => s.category))];
    if (!cats.includes(filter)) filter = 'All';
    $('#filters').innerHTML = cats.map(c => `<button role="tab" class="${c === filter ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  }

  function renderStock() {
    const list = stock.filter(s => filter === 'All' || s.category === filter);
    if (!list.length) { $('#stockGrid').innerHTML = '<p class="empty">No items in this category right now.</p>'; return; }
    $('#stockGrid').innerHTML = list.map(s => {
      const p = itemPrice(s, rates, settings.gstPct);
      const m = METALS[s.metal];
      const st = s.qty <= 0 ? ['out', 'Sold out'] : s.qty <= 2 ? ['low', `Only ${s.qty} left`] : ['in', 'In stock'];
      const msg = `Namaste ${settings.shopName}, I'm interested in "${s.name}" (${m.label}, ${s.weight} g). Today's price shown: ${inr(p.total)}. Is it available?`;
      const img = s.image || (CATEGORY_PHOTOS[s.category] && photo(CATEGORY_PHOTOS[s.category], 600, 450));
      // Icon sits underneath; the photo covers it, and is removed if it fails to load
      return `<article class="item ${s.qty <= 0 ? 'soldout' : ''}">
        <div class="item-art ${s.metal === 'silver' ? 'silver' : ''}">
          ${icon(s.category, s.metal)}
          ${img ? `<img src="${esc(img)}" alt="${esc(s.name)}" loading="lazy" onerror="this.remove()">` : ''}
          <span class="badge l">${s.hallmark ? 'HUID · ' : ''}${m.purity}</span>
          <span class="badge r ${st[0]}">${st[1]}</span>
        </div>
        <div class="item-body">
          <h4>${esc(s.name)}</h4>
          <div class="item-meta"><span>${m.label}</span><span>${s.weight} g</span><span>Making ${s.making}%</span></div>
          <div class="item-price">${inr(p.total)} <small>incl. GST</small></div>
          <div class="item-actions">
            <a class="btn btn-gold" target="_blank" rel="noopener" href="${waLink(settings.whatsapp, msg)}">Enquire</a>
            <button class="btn btn-ghost" data-book="${s.id}" ${s.qty <= 0 ? 'disabled' : ''}>Book rate</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------- 12 + 1 Scheme ---------- */
  const CHIP_AMOUNTS = [1000, 2000, 5000, 10000, 25000];
  function renderScheme() {
    const amt = Math.max(0, +$('#sAmount').value || 0);
    $('#sRange').value = Math.min(Math.max(amt, 1000), 50000);
    $$('#schemeChips button').forEach(b => b.classList.toggle('active', +b.dataset.v === amt));
    $('#sPaid').textContent = inr(amt * 12);
    $('#sBonus').textContent = '+ ' + inr(amt);
    $('#sTotal').textContent = inr(amt * 13);
    const grams = (amt * 13) / (1 + settings.gstPct / 100) / METALS.gold22.perGram(rates);
    $('#sGrams').textContent = grams.toFixed(2) + ' g';
  }
  function buildScheme() {
    $('#schemeChips').innerHTML = CHIP_AMOUNTS.map(v => `<button type="button" data-v="${v}">${inr(v)}</button>`).join('');
    $('#sMonths').innerHTML = Array.from({ length: 13 }, (_, i) =>
      `<i class="${i === 12 ? 'free' : ''}" style="animation-delay:${i * 40}ms">${i === 12 ? 'FREE' : 'M' + (i + 1)}</i>`).join('');
    const now = new Date();
    $('#sStart').innerHTML = [0, 1, 2].map(o => {
      const d = new Date(now.getFullYear(), now.getMonth() + o, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      return `<option value="${label}">Start: ${label}</option>`;
    }).join('');
  }

  /* ---------- Rate booking ---------- */
  function renderBooking() {
    const k = $('#bMetal').value, g = Math.max(0, +$('#bGrams').value || 0);
    const perGram = METALS[k].perGram(rates);
    const value = perGram * g;
    const adv = value * settings.advancePct / 100;
    const till = new Date(Date.now() + settings.bookingDays * 864e5);
    const rise = +$('#bRise').value;
    $('#bRange').value = Math.min(g, 200);
    $('#bRate').textContent = inr(rates[k]) + ' /' + METALS[k].unit;
    $('#bValue').textContent = inr(value);
    $('#bAdvance').textContent = inr(adv);
    $('#bTill').textContent = till.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    $('#bRiseVal').textContent = rise;
    $('#bSave').textContent = inr(value * rise / 100);
  }

  function lookup() {
    const id = $('#lookupId').value.trim().toUpperCase();
    const out = $('#lookupOut');
    if (!id) { out.innerHTML = ''; return; }
    const b = rjGet('bookings').find(x => x.id === id);
    if (!b) { out.innerHTML = '<p class="no">No booking found with this ID on this device. Please call the shop to confirm.</p>'; return; }
    const expired = new Date(b.validTill) < new Date();
    out.innerHTML = `<p class="${expired ? 'no' : 'ok'}"><b>${b.id}</b> · ${b.status}${expired ? ' (expired)' : ''}</p>
      <p>${METALS[b.metal].label}, ${b.grams} g locked at <b>${inr(b.rate)}</b>/${METALS[b.metal].unit}</p>
      <p>Advance ${inr(b.advance)} · valid till ${new Date(b.validTill).toLocaleDateString('en-IN')}</p>`;
  }

  /* ---------- Helpers ---------- */
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 4000);
  }

  function renderAll() {
    applyShop(); renderRates(); calc(); renderFilters(); renderStock(); renderScheme(); renderBooking();
  }

  /* ---------- Events ---------- */
  fillMetalSelect($('#cMetal'), Object.keys(METALS));
  fillMetalSelect($('#bMetal'), Object.keys(METALS));
  $('#cMetal').value = 'gold22'; $('#bMetal').value = 'gold22';
  buildScheme();
  renderAll();

  ['#cMetal', '#cWeight', '#cMaking'].forEach(s => $(s).addEventListener('input', calc));

  // Shop-by-category tiles jump to the collection with that filter applied
  $('#catStrip').innerHTML = [
    ['Necklace', 'necklaceCase', 'Bridal & Necklaces'], ['Earrings', 'jhumka', 'Jhumkas & Earrings'],
    ['Bangles', 'bangleStack', 'Bangles & Kadas'], ['Ring', 'ringBox', 'Rings'],
    ['Chain', 'chainLinks', 'Chains'], ['Anklet', 'payal', 'Silver Payal']
  ].map(([cat, key, label]) => `<a href="#collection" class="cat" data-cat="${cat}">
      <img src="${photo(key, 500, 640)}" alt="${label}" loading="lazy"><span>${label}</span></a>`).join('');
  $('#catStrip').addEventListener('click', e => {
    const a = e.target.closest('[data-cat]'); if (!a) return;
    filter = stock.some(s => s.category === a.dataset.cat) ? a.dataset.cat : 'All';
    renderFilters(); renderStock();
  });

  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.cat; renderFilters(); renderStock();
  });

  $('#stockGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-book]'); if (!b) return;
    const s = stock.find(x => x.id === b.dataset.book);
    $('#bMetal').value = s.metal; $('#bGrams').value = s.weight;
    $('#bookingForm').dataset.item = s.name;
    renderBooking();
    $('#booking').scrollIntoView();
    toast(`Booking "${s.name}" — ${s.weight} g at today's rate`);
  });

  $('#schemeChips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#sAmount').value = b.dataset.v; renderScheme();
  });
  $('#sAmount').addEventListener('input', renderScheme);
  $('#sRange').addEventListener('input', e => { $('#sAmount').value = e.target.value; renderScheme(); });

  $('#schemeForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const amt = +$('#sAmount').value;
    if (amt < 500) { toast('Minimum instalment is ₹500'); return; }
    const entry = {
      id: rjId('SB'), name: f.get('name').trim(), phone: f.get('phone').trim(), nominee: f.get('nominee').trim(),
      amount: amt, start: f.get('start'), paid: 0, status: 'Requested', createdAt: new Date().toISOString()
    };
    const all = rjGet('scheme'); all.unshift(entry); rjSave('scheme', all);
    const msg = `Namaste ${settings.shopName}! I want to join the 12 + 1 Gold Scheme.\n\nEnrolment ref: ${entry.id}\nName: ${entry.name}\nMobile: ${entry.phone}\nMonthly: ${inr(amt)}\n${entry.start}\nMaturity value: ${inr(amt * 13)}${entry.nominee ? '\nNominee: ' + entry.nominee : ''}`;
    window.open(waLink(settings.whatsapp, msg), '_blank');
    e.target.reset(); buildSchemeStart();
    toast(`Enrolment ref ${entry.id} — complete it on WhatsApp`);
  });
  function buildSchemeStart() { $('#sStart').selectedIndex = 0; }

  ['#bMetal', '#bRise'].forEach(s => $(s).addEventListener('input', renderBooking));
  $('#bGrams').addEventListener('input', renderBooking);
  $('#bRange').addEventListener('input', e => { $('#bGrams').value = e.target.value; renderBooking(); });

  $('#bookingForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const k = $('#bMetal').value, g = +$('#bGrams').value;
    if (!(g > 0)) { toast('Enter the weight you want to book'); return; }
    const value = METALS[k].perGram(rates) * g;
    const b = {
      id: rjId('RB'), name: f.get('name').trim(), phone: f.get('phone').trim(),
      metal: k, grams: g, rate: rates[k], value: Math.round(value),
      advance: Math.round(value * settings.advancePct / 100),
      item: e.target.dataset.item || '',
      validTill: new Date(Date.now() + settings.bookingDays * 864e5).toISOString(),
      status: 'Pending advance', createdAt: new Date().toISOString()
    };
    const all = rjGet('bookings'); all.unshift(b); rjSave('bookings', all);
    const msg = `Namaste ${settings.shopName}! I want to book today's rate.\n\nBooking ID: ${b.id}\nName: ${b.name}\nMobile: ${b.phone}\nMetal: ${METALS[k].label}\nWeight: ${g} g${b.item ? '\nItem: ' + b.item : ''}\nLocked rate: ${inr(b.rate)} /${METALS[k].unit}\nMetal value: ${inr(b.value)}\nAdvance (${settings.advancePct}%): ${inr(b.advance)}\nValid till: ${new Date(b.validTill).toLocaleDateString('en-IN')}`;
    window.open(waLink(settings.whatsapp, msg), '_blank');
    $('#lookupId').value = b.id; lookup();
    delete e.target.dataset.item;
    e.target.querySelectorAll('input[name=name], input[name=phone]').forEach(i => i.value = '');
    toast(`Booking ID ${b.id} — pay advance to confirm`);
  });

  $('#lookupBtn').addEventListener('click', lookup);
  $('#lookupId').addEventListener('keydown', e => { if (e.key === 'Enter') lookup(); });

  // Mobile menu
  $('#burger').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  $('#year').textContent = new Date().getFullYear();

  // Live updates when the owner edits in another tab
  window.addEventListener('storage', () => {
    settings = rjGet('settings'); rates = rjGet('rates'); stock = rjGet('stock'); renderAll();
  });
})();
