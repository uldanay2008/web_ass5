'use strict';
// Task 1: validate fields and show a separate message for each error.
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const fields = ['name', 'email', 'password', 'confirm-password', 'message'];
        let firstInvalid = null;
        document.getElementById('contact-status').textContent = '';
        fields.forEach((id) => {
            const input = document.getElementById(id);
            let error = '';
            if (!input.value.trim()) error = 'This field is required.';
            else if (id === 'email' && !input.validity.valid) error = 'Enter a valid email address.';
            else if (id === 'password' && input.value.length < 8) error = 'Password must contain at least 8 characters.';
            else if (id === 'confirm-password' && input.value !== document.getElementById('password').value) error = 'Passwords do not match.';
            document.getElementById(id + '-error').textContent = error;
            input.setAttribute('aria-describedby', id + '-error');
            input.setAttribute('aria-invalid', String(Boolean(error)));
            if (error && !firstInvalid) firstInvalid = input;
        });
        if (firstInvalid) firstInvalid.focus();
        else document.getElementById('contact-status').textContent = 'Validation successful! This demo does not send your message or store your password.';
    });
}
// Task 2: each answer opens and closes independently.
document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded));
        button.querySelector('span').textContent = expanded ? ' −' : ' +';
        const answer = document.getElementById(button.getAttribute('aria-controls'));
        answer.classList.toggle('is-open', expanded);
        answer.inert = !expanded;
    });
});
// Task 3: native dialog supports keyboard focus and Escape.
const dialog = document.getElementById('subscribe-dialog');
if (dialog) {
    document.getElementById('open-subscribe').addEventListener('click', () => dialog.showModal());
    document.getElementById('close-subscribe').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    document.getElementById('subscribe-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('subscribe-email');
        const valid = Boolean(email.value.trim()) && email.validity.valid;
        email.setAttribute('aria-invalid', String(!valid));
        email.setAttribute('aria-describedby', 'subscribe-error');
        document.getElementById('subscribe-error').textContent = valid ? '' : 'Enter a valid email address.';
        document.getElementById('subscribe-status').textContent = valid ? 'Email validated! This demo does not register a subscription.' : '';
        if (!valid) email.focus();
    });
}
// Task 4: cycle through readable pastel backgrounds.
const colors = ['#f4d8df', '#e4d9f5', '#d8ece5', '#c47b7b'];
let colorIndex = 0;
const backgroundButton = document.getElementById('change-background');
if (backgroundButton) backgroundButton.addEventListener('click', () => {
    document.body.style.backgroundColor = colors[colorIndex];
    colorIndex = (colorIndex + 1) % colors.length;
});
// Task 5: show the visitor's local time and refresh every second.
const dateTime = document.getElementById('current-datetime');
function updateDateTime() {
    const now = new Date();
    dateTime.dateTime = now.toISOString();
    dateTime.textContent = now.toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
    });
}
if (dateTime) { updateDateTime(); setInterval(updateDateTime, 1000); }
// Extra features: category filters and favorites saved in this browser.
const catalogItems = [...document.querySelectorAll('.catalog-item')];
if (catalogItems.length) {
    const storageKey = 'winx-studio-favorites';
    const knownIds = new Set(catalogItems.map(item => item.dataset.product));
    let favorites = new Set();
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(saved)) favorites = new Set(saved.filter(id => knownIds.has(id)));
    } catch {
        document.getElementById('storage-status').textContent = 'Saved favorites could not be loaded. You can still save items for this visit.';
    }
    let category = 'all';
    let searchQuery = '';
    document.addEventListener('winx:search', event => {
        searchQuery = String(event.detail || '').trim().toLowerCase();
        updateCatalog();
    });
    const onlyFavorites = document.getElementById('favorites-only');
    const filterButtons = document.querySelectorAll('[data-filter]');
    function updateCatalog() {
        let visible = 0;
        catalogItems.forEach(item => {
            const saved = favorites.has(item.dataset.product);
            item.hidden = !(category === 'all' || item.dataset.category === category) || (onlyFavorites.checked && !saved) || !item.querySelector('h3').textContent.toLowerCase().includes(searchQuery);
            if (!item.hidden) visible++;
            const button = item.querySelector('[data-favorite]');
            button.setAttribute('aria-pressed', String(saved));
            button.textContent = saved ? '♥ Saved' : '♡ Save';
            button.setAttribute('aria-label', (saved ? 'Remove ' : 'Save ') + item.querySelector('h3').textContent + (saved ? ' from favorites' : ' to favorites'));
        });
        filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
        document.getElementById('product-count').textContent = visible + ' products shown · ' + favorites.size + ' saved';
        document.getElementById('products-empty').hidden = visible !== 0;
    }
    filterButtons.forEach(button => button.addEventListener('click', () => {
        category = button.dataset.filter;
        updateCatalog();
    }));
    onlyFavorites.addEventListener('change', updateCatalog);
    document.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.favorite;
        if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
        try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); }
        catch { document.getElementById('storage-status').textContent = 'Storage is unavailable. Favorites will last only for this visit.'; }
        updateCatalog();
    }));
    updateCatalog();
}
