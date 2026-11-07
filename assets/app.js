(() => {
  'use strict';
  const form = document.querySelector('#filters');
  if (!form) return;
  const cards = [...document.querySelectorAll('#resource-grid article')];
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja');
  const fields = ['q', 'subject', 'unit', 'type'];
  const units = [...form.elements.unit.options].map(option => option.cloneNode(true));
  const populateUnits = () => {
    const value = form.elements.unit.value;
    const subject = form.elements.subject.value;
    const allowed = new Set(cards.filter(card => !subject || card.dataset.subject === subject).map(card => card.dataset.unit));
    form.elements.unit.replaceChildren(...units.filter(option => !option.value || allowed.has(option.value)).map(option => option.cloneNode(true)));
    form.elements.unit.value = allowed.has(value) ? value : '';
  };
  const apply = (updateURL = true) => {
    const values = Object.fromEntries(fields.map(key => [key, form.elements[key].value]));
    const tokens = normalize(values.q).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const match = (!values.subject || values.subject === card.dataset.subject)
        && (!values.unit || values.unit === card.dataset.unit)
        && (!values.type || card.dataset.types.split(' ').includes(values.type))
        && tokens.every(token => normalize(card.textContent).includes(token));
      card.hidden = !match;
      if (match) count++;
    });
    document.querySelector('#result-count').textContent = `${count}件の教材・参考資料`;
    document.querySelector('#empty-state').hidden = count > 0;
    if (updateURL) {
      const url = new URL(location.href);
      fields.forEach(key => values[key] ? url.searchParams.set(key, values[key]) : url.searchParams.delete(key));
      try { history.replaceState(null, '', url); } catch { /* file preview: filtering still works */ }
    }
  };
  const readURL = () => {
    const params = new URLSearchParams(location.search);
    form.elements.q.value = params.get('q') || '';
    form.elements.subject.value = params.get('subject') || '';
    if (form.elements.subject.selectedIndex < 0) form.elements.subject.value = '';
    populateUnits();
    ['unit', 'type'].forEach(key => {
      form.elements[key].value = params.get(key) || '';
      if (form.elements[key].selectedIndex < 0) form.elements[key].value = '';
    });
    apply(false);
  };
  form.hidden = false;
  form.addEventListener('submit', event => { event.preventDefault(); apply(); });
  form.addEventListener('input', event => { if (event.target.name === 'subject') populateUnits(); apply(); });
  form.addEventListener('reset', () => setTimeout(() => { populateUnits(); apply(); }, 0));
  window.addEventListener('popstate', readURL);
  readURL();
})();
