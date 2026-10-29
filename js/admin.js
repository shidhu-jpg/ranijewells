/* Rani Jewellers — owner panel
   Note: the PIN is a convenience lock only (checked in the browser).
   Use a real backend with auth before storing sensitive customer data online. */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const CATEGORIES = ['Necklace', 'Earrings', 'Bangles', 'Ring', 'Chain', 'Pendant', 'Anklet', 'Coin', 'Silverware'];
  const BOOK_STATUS = ['Pending advance', 'Confirmed', 'Completed', 'Cancelled'];
  const SCHEME_STATUS = ['Requested', 'Active', 'Matured', 'Redeemed', 'Closed'];
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let settings = rjGet('settings');

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* ---------- Login ---------- */
  function unlock() {
    $('#login').hidden = true; $('#login').style.display = 'none';
    $('#app').hidden = false;
    renderAll();
  }
  if (sessionStorage.getItem('rj_admin') === '1') unlock();
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('#pin').value === rjGet('settings').pin) { sessionStorage.setItem('rj_admin', '1'); unlock(); }
    else { $('#err').textContent = 'Wrong PIN'; $('#pin').value = ''; }
  });
  $('#logout').addEventListener('click', () => { sessionStorage.removeItem('rj_admin'); location.reload(); });

  /* ---------- Tabs ---------- */
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#tabs button').forEach(x => x.classList.toggle('active', x === b));
    $$('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab);
  });

  /* ---------- Rates ---------- */
  function renderRates() {
    const r = rjGet('rates');
    const f = $('#rateForm');
    Object.keys(METALS).forEach(k => f[k].value = r[k]);
    $('#rUpdated').textContent = new Date(r.updatedAt).toLocaleString('en-IN');
  }
  $('#rateForm').addEventListener('submit', e => {
    e.preventDefault();
    const old = rjGet('rates'), f = e.target;
    const next = { prev: {}, updatedAt: new Date().toISOString() };
    Object.keys(METALS).forEach(k => { next[k] = Math.round(+f[k].value); next.prev[k] = old[k]; });
    rjSave('rates', next);
    renderAll();
    toast('Rates published ✓');
  });
  $('#auto22').addEventListener('click', () => {
    const f = $('#rateForm'), g24 = +f.gold24.value;
    if (!g24) return toast('Enter the 24K rate first');
    f.gold22.value = Math.round(g24 * 0.916);
    f.gold18.value = Math.round(g24 * 0.75);
  });

  /* ---------- Stock ---------- */
  function renderStock() {
    const stock = rjGet('stock'), rates = rjGet('rates');
    const q = $('#stockSearch').value.toLowerCase();
    const inStock = stock.filter(s => s.qty > 0);
    const goldWt = stock.filter(s => s.metal !== 'silver').reduce((a, s) => a + s.weight * s.qty, 0);
    const value = stock.reduce((a, s) => a + itemPrice(s, rates, settings.gstPct).total * s.qty, 0);
    $('#stockStats').innerHTML = `
      <div class="stat"><span>Designs listed</span><b>${stock.length}</b></div>
      <div class="stat"><span>In stock</span><b>${inStock.length}</b></div>
      <div class="stat"><span>Sold out</span><b>${stock.length - inStock.length}</b></div>
      <div class="stat"><span>Gold in stock</span><b>${goldWt.toFixed(1)} g</b></div>
      <div class="stat"><span>Stock value today</span><b>${inr(value)}</b></div>`;

    $('#stockBody').innerHTML = stock
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      .map(s => `<tr data-id="${s.id}">
        <td><input data-f="name" value="${esc(s.name)}"></td>
        <td><select data-f="category">${CATEGORIES.map(c => `<option ${c === s.category ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
        <td><select data-f="metal">${Object.entries(METALS).map(([k, m]) => `<option value="${k}" ${k === s.metal ? 'selected' : ''}>${m.label}</option>`).join('')}</select></td>
        <td><input class="num" data-f="weight" type="number" step="0.01" min="0" value="${s.weight}"></td>
        <td><input class="num" data-f="making" type="number" step="0.5" min="0" value="${s.making}"></td>
        <td><input class="num" data-f="qty" type="number" min="0" value="${s.qty}"></td>
        <td><input data-f="hallmark" type="checkbox" ${s.hallmark ? 'checked' : ''} style="width:auto"></td>
        <td><input data-f="image" value="${esc(s.image || '')}" placeholder="https://…"></td>
        <td><b>${inr(itemPrice(s, rates, settings.gstPct).total)}</b></td>
        <td><button class="mini danger" data-del>Delete</button></td>
      </tr>`).join('') || '<tr><td colspan="10" class="muted">No items.</td></tr>';
  }
  $('#stockBody').addEventListener('change', e => {
    const tr = e.target.closest('tr'), f = e.target.dataset.f; if (!tr || !f) return;
    const stock = rjGet('stock'), item = stock.find(s => s.id === tr.dataset.id);
    item[f] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? +e.target.value : e.target.value.trim();
    rjSave('stock', stock); renderStock(); toast('Saved');
  });
  $('#stockBody').addEventListener('click', e => {
    if (!e.target.matches('[data-del]')) return;
    const id = e.target.closest('tr').dataset.id, stock = rjGet('stock');
    const item = stock.find(s => s.id === id);
    if (!confirm(`Delete "${item.name}"?`)) return;
    rjSave('stock', stock.filter(s => s.id !== id)); renderStock();
  });
  $('#addItem').addEventListener('click', () => {
    const stock = rjGet('stock');
    stock.unshift({ id: rjId('s'), name: 'New item', category: 'Necklace', metal: 'gold22', weight: 10, making: 12, qty: 1, hallmark: true });
    rjSave('stock', stock); $('#stockSearch').value = ''; renderStock();
    $('#stockBody input').select();
  });
  $('#stockSearch').addEventListener('input', renderStock);

  /* ---------- Dialog for walk-in entries ---------- */
  function openForm(title, fields, onSave) {
    const d = document.createElement('dialog');
    d.style.cssText = 'border:0;border-radius:20px;padding:26px;width:min(440px,92vw);box-shadow:var(--shadow)';
    d.innerHTML = `<form method="dialog"><h3>${title}</h3>${fields.map(f => `<label style="margin-bottom:10px">${f.label}${
      f.options ? `<select name="${f.name}">${f.options.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`
                : `<input name="${f.name}" type="${f.type || 'text'}" ${f.required ? 'required' : ''} value="${f.value ?? ''}" ${f.type === 'number' ? 'step="any" min="0"' : ''}>`
    }</label>`).join('')}<div class="toolbar" style="margin-top:16px"><button class="btn btn-maroon" value="ok">Save</button><button class="btn btn-ghost-dark" value="cancel" formnovalidate>Cancel</button></div></form>`;
    document.body.append(d); d.showModal();
    d.addEventListener('close', () => {
      if (d.returnValue === 'ok') onSave(Object.fromEntries(new FormData(d.querySelector('form'))));
      d.remove();
    });
  }

  function csv(name, rows) {
    const text = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = name; a.click();
  }

  /* ---------- Bookings ---------- */
  function renderBookings() {
    const all = rjGet('bookings'), rates = rjGet('rates'), now = new Date();
    const q = $('#bookSearch').value.toLowerCase();
    const live = all.filter(b => ['Pending advance', 'Confirmed'].includes(b.status) && new Date(b.validTill) >= now);
    const liveGrams = live.filter(b => b.metal !== 'silver').reduce((a, b) => a + b.grams, 0);
    // Exposure: how much more the shop owes if all live bookings convert at the locked rate
    const exposure = live.reduce((a, b) => a + (METALS[b.metal].perGram(rates) - METALS[b.metal].perGram({ ...rates, [b.metal]: b.rate })) * b.grams, 0);
    $('#bookStats').innerHTML = `
      <div class="stat"><span>Total bookings</span><b>${all.length}</b></div>
      <div class="stat"><span>Active</span><b>${live.length}</b></div>
      <div class="stat"><span>Gold locked</span><b>${liveGrams.toFixed(1)} g</b></div>
      <div class="stat"><span>Advance collected</span><b>${inr(all.filter(b => b.status !== 'Pending advance' && b.status !== 'Cancelled').reduce((a, b) => a + b.advance, 0))}</b></div>
      <div class="stat"><span>Rate difference (active)</span><b class="${exposure > 0 ? 'down' : ''}">${inr(exposure)}</b></div>`;

    $('#bookBody').innerHTML = all
      .filter(b => !q || [b.id, b.name, b.phone].join(' ').toLowerCase().includes(q))
      .map(b => {
        const expired = new Date(b.validTill) < now && ['Pending advance', 'Confirmed'].includes(b.status);
        const diff = rates[b.metal] - b.rate;
        return `<tr data-id="${b.id}">
          <td><b>${b.id}</b><br><small class="muted">${fmtDate(b.createdAt)}</small></td>
          <td>${esc(b.name)}<br><a href="${waLink(b.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1'), `Namaste ${b.name}, regarding your rate booking ${b.id} at ${settings.shopName}.`)}" target="_blank" class="muted">${esc(b.phone)}</a></td>
          <td>${METALS[b.metal].label}<br>${b.grams} g${b.item ? `<br><small class="muted">${esc(b.item)}</small>` : ''}</td>
          <td>${inr(b.rate)}</td>
          <td>${inr(rates[b.metal])}<br><small class="${diff > 0 ? 'down' : diff < 0 ? 'up' : ''}">${diff > 0 ? '+' : ''}${inr(diff)}</small></td>
          <td>${inr(b.advance)}</td>
          <td>${fmtDate(b.validTill)}${expired ? '<br><span class="pill red">Expired</span>' : ''}</td>
          <td><select data-status>${BOOK_STATUS.map(s => `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
          <td><button class="mini danger" data-del>Delete</button></td>
        </tr>`;
      }).join('') || '<tr><td colspan="9" class="muted">No bookings yet. Online bookings made on this device appear here; add walk-ins with the button above.</td></tr>';
  }
  $('#bookBody').addEventListener('change', e => {
    if (!e.target.matches('[data-status]')) return;
    const all = rjGet('bookings'); all.find(b => b.id === e.target.closest('tr').dataset.id).status = e.target.value;
    rjSave('bookings', all); renderBookings(); toast('Status updated');
  });
  $('#bookBody').addEventListener('click', e => {
    if (!e.target.matches('[data-del]')) return;
    const id = e.target.closest('tr').dataset.id;
    if (!confirm(`Delete booking ${id}?`)) return;
    rjSave('bookings', rjGet('bookings').filter(b => b.id !== id)); renderBookings();
  });
  $('#addBooking').addEventListener('click', () => {
    const rates = rjGet('rates');
    openForm('Walk-in rate booking', [
      { name: 'name', label: 'Customer name', required: true },
      { name: 'phone', label: 'Mobile', required: true },
      { name: 'metal', label: 'Metal', options: Object.entries(METALS).map(([k, m]) => [k, m.label]) },
      { name: 'grams', label: 'Weight (g)', type: 'number', required: true, value: 10 },
      { name: 'item', label: 'Item (optional)' }
    ], v => {
      const value = METALS[v.metal].perGram(rates) * +v.grams;
      const all = rjGet('bookings');
      all.unshift({
        id: rjId('RB'), name: v.name, phone: v.phone, metal: v.metal, grams: +v.grams, rate: rates[v.metal],
        value: Math.round(value), advance: Math.round(value * settings.advancePct / 100), item: v.item,
        validTill: new Date(Date.now() + settings.bookingDays * 864e5).toISOString(),
        status: 'Confirmed', createdAt: new Date().toISOString()
      });
      rjSave('bookings', all); renderBookings(); toast('Booking added');
    });
  });
  $('#bookSearch').addEventListener('input', renderBookings);
  $('#exportBookings').addEventListener('click', () => csv('rate-bookings.csv', [
    ['ID', 'Date', 'Name', 'Phone', 'Metal', 'Grams', 'Locked rate', 'Value', 'Advance', 'Valid till', 'Status', 'Item'],
    ...rjGet('bookings').map(b => [b.id, fmtDate(b.createdAt), b.name, b.phone, METALS[b.metal].label, b.grams, b.rate, b.value, b.advance, fmtDate(b.validTill), b.status, b.item])
  ]));

  /* ---------- 12 + 1 Scheme ---------- */
  function renderScheme() {
    const all = rjGet('scheme'), q = $('#schemeSearch').value.toLowerCase();
    const active = all.filter(m => ['Active', 'Matured'].includes(m.status));
    $('#schemeStats').innerHTML = `
      <div class="stat"><span>Members</span><b>${all.length}</b></div>
      <div class="stat"><span>Active</span><b>${active.length}</b></div>
      <div class="stat"><span>Ready to redeem</span><b>${all.filter(m => m.status === 'Matured').length}</b></div>
      <div class="stat"><span>Collected so far</span><b>${inr(all.reduce((a, m) => a + m.amount * m.paid, 0))}</b></div>
      <div class="stat"><span>Bonus liability</span><b>${inr(active.reduce((a, m) => a + m.amount, 0))}</b></div>`;

    $('#schemeBody').innerHTML = all
      .filter(m => !q || [m.id, m.name, m.phone].join(' ').toLowerCase().includes(q))
      .map(m => `<tr data-id="${m.id}">
        <td><b>${m.id}</b></td>
        <td>${esc(m.name)}<br><small class="muted">${esc(m.phone)}${m.nominee ? ' · Nominee: ' + esc(m.nominee) : ''}</small></td>
        <td>${inr(m.amount)}</td>
        <td>${esc(m.start).replace('Start: ', '')}</td>
        <td><b>${m.paid}</b> / 12<div class="progress"><i style="width:${m.paid / 12 * 100}%"></i></div></td>
        <td>${inr(m.amount * m.paid)}</td>
        <td>${m.paid >= 12 ? `<span class="pill green">${inr(m.amount * 13)}</span>` : inr(m.amount * 13)}</td>
        <td><select data-status>${SCHEME_STATUS.map(s => `<option ${s === m.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td class="row-actions">
          <button class="mini ok" data-pay ${m.paid >= 12 ? 'disabled' : ''}>+ Paid</button>
          <button class="mini" data-undo ${m.paid <= 0 ? 'disabled' : ''}>−</button>
          <button class="mini danger" data-del>Delete</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="9" class="muted">No members yet.</td></tr>';
  }
  $('#schemeBody').addEventListener('click', e => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const all = rjGet('scheme'), m = all.find(x => x.id === tr.dataset.id);
    if (e.target.matches('[data-pay]')) {
      m.paid = Math.min(12, m.paid + 1);
      if (m.paid >= 12) m.status = 'Matured'; else if (m.status === 'Requested') m.status = 'Active';
      toast(`${m.name}: instalment ${m.paid} recorded`);
    } else if (e.target.matches('[data-undo]')) {
      m.paid = Math.max(0, m.paid - 1);
      if (m.status === 'Matured' && m.paid < 12) m.status = 'Active';
    } else if (e.target.matches('[data-del]')) {
      if (!confirm(`Delete member ${m.name}?`)) return;
      all.splice(all.indexOf(m), 1);
    } else return;
    rjSave('scheme', all); renderScheme();
  });
  $('#schemeBody').addEventListener('change', e => {
    if (!e.target.matches('[data-status]')) return;
    const all = rjGet('scheme'); all.find(m => m.id === e.target.closest('tr').dataset.id).status = e.target.value;
    rjSave('scheme', all); renderScheme();
  });
  $('#addMember').addEventListener('click', () => {
    const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    openForm('Add scheme member', [
      { name: 'name', label: 'Member name', required: true },
      { name: 'phone', label: 'Mobile', required: true },
      { name: 'amount', label: 'Monthly instalment (₹)', type: 'number', required: true, value: 5000 },
      { name: 'start', label: 'Start month', value: month },
      { name: 'nominee', label: 'Nominee (optional)' }
    ], v => {
      const all = rjGet('scheme');
      all.unshift({ id: rjId('SB'), name: v.name, phone: v.phone, nominee: v.nominee, amount: +v.amount, start: v.start, paid: 0, status: 'Active', createdAt: new Date().toISOString() });
      rjSave('scheme', all); renderScheme(); toast('Member added');
    });
  });
  $('#schemeSearch').addEventListener('input', renderScheme);
  $('#exportScheme').addEventListener('click', () => csv('12plus1-members.csv', [
    ['Ref', 'Name', 'Phone', 'Nominee', 'Monthly', 'Start', 'Paid months', 'Collected', 'Redeem value', 'Status'],
    ...rjGet('scheme').map(m => [m.id, m.name, m.phone, m.nominee, m.amount, m.start, m.paid, m.amount * m.paid, m.amount * 13, m.status])
  ]));

  /* ---------- Settings ---------- */
  function renderSettings() {
    const f = $('#settingsForm');
    Object.keys(RJ_DEFAULTS.settings).forEach(k => { if (f[k]) f[k].value = settings[k]; });
  }
  $('#settingsForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    ['advancePct', 'bookingDays', 'gstPct'].forEach(k => data[k] = +data[k]);
    settings = { ...settings, ...data };
    rjSave('settings', settings); renderAll(); toast('Settings saved ✓');
  });
  $('#backup').addEventListener('click', () => {
    const dump = {}; Object.keys(RJ_KEYS).forEach(k => dump[k] = rjGet(k));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
    a.download = `rani-jewellers-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  });
  $('#restore').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const dump = JSON.parse(await file.text());
      if (!confirm('Replace all current data with this backup?')) return;
      Object.keys(RJ_KEYS).forEach(k => { if (dump[k]) rjSave(k, dump[k]); });
      settings = rjGet('settings'); renderAll(); toast('Backup restored ✓');
    } catch { toast('That file is not a valid backup'); }
    e.target.value = '';
  });

  function renderAll() { renderRates(); renderStock(); renderBookings(); renderScheme(); renderSettings(); }
})();
