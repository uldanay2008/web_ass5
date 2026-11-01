/* Assignment 6: jQuery. Existing Assignment 4/5 handlers load first. */
if (typeof window.jQuery === 'undefined') {
    console.error('jQuery could not load. Check your internet connection and reload.');
} else {
    $(document).ready(function () {
        'use strict';
        console.log('jQuery is ready!'); // Task 0
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Task 7. One notification, with old timers/animations cancelled.
        let toastTimer;
        function notify(message) {
            clearTimeout(toastTimer);
            $('#winx-toast').stop(true, true).prop('hidden', false).text(message).fadeIn(reduceMotion ? 0 : 160);
            toastTimer = setTimeout(function () {
                $('#winx-toast').fadeOut(reduceMotion ? 0 : 300, function () { $(this).prop('hidden', true); });
            }, 2600);
        }
        $('[data-favorite]').on('click', function () {
            notify($(this).attr('aria-pressed') === 'true' ? 'Product added to favorites.' : 'Product removed from favorites.');
        });

        // Tasks 1 and 2. Search feeds the same catalog updater as category/favorites.
        const $search = $('#product-search');
        const $suggestions = $('#product-suggestions');
        let activeSuggestion = -1;
        function closeSuggestions() {
            $suggestions.empty().prop('hidden', true);
            $search.attr('aria-expanded', 'false').removeAttr('aria-activedescendant');
            activeSuggestion = -1;
        }
        function searchProducts(showSuggestions) {
            const query = String($search.val() || '').trim().toLowerCase();
            document.dispatchEvent(new CustomEvent('winx:search', { detail: query }));
            refreshViewport();
            closeSuggestions();
            const $matches = $('.catalog-item').filter(function () { return !this.hidden; });
            $('#search-feedback').text(query ? $matches.length + ' matching products in the current filters.' : '');
            if (!query || !showSuggestions) return;
            const names = [...new Set($matches.map(function () { return $(this).find('h3').text(); }).get())].slice(0, 6);
            names.forEach(function (name, index) {
                // .text() keeps search suggestions as plain text, never executable HTML.
                $('<li>').attr({ id: 'suggestion-' + index, role: 'option', 'aria-selected': 'false' })
                    .text(name).appendTo($suggestions);
            });
            $suggestions.prop('hidden', names.length === 0);
            $search.attr('aria-expanded', String(names.length > 0));
        }
        $search.on('input', function () { searchProducts(true); });
        $suggestions.on('mousedown', '[role="option"]', function (event) { event.preventDefault(); });
        $suggestions.on('click', '[role="option"]', function () {
            $search.val($(this).text()); searchProducts(false); $search.trigger('focus');
        });
        $search.on('keydown', function (event) {
            const $options = $suggestions.children();
            if (event.key === 'Escape') { closeSuggestions(); return; }
            if (!$options.length) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                activeSuggestion = event.key === 'ArrowDown'
                    ? (activeSuggestion + 1) % $options.length
                    : (activeSuggestion <= 0 ? $options.length - 1 : activeSuggestion - 1);
                $options.attr('aria-selected', 'false').eq(activeSuggestion).attr('aria-selected', 'true');
                $search.attr('aria-activedescendant', $options.eq(activeSuggestion).attr('id'));
            } else if (event.key === 'Enter' && activeSuggestion >= 0) {
                event.preventDefault(); $options.eq(activeSuggestion).trigger('click');
            }
        });
        $search.on('blur', closeSuggestions);
        $('[data-filter], [data-favorite]').on('click', function () { searchProducts(false); });
        $('#favorites-only').on('change', function () { searchProducts(false); });

        // Task 3. Restore original TEXT each time, then build safe text/mark nodes.
        const $faqText = $('.faq-question, .faq-answer p');
        $faqText.each(function () {
            const $node = $(this);
            $node.data('search-original', this.classList.contains('faq-question') ? this.firstChild.textContent : $node.text());
        });
        function highlightText(node, original, query) {
            const fragment = document.createDocumentFragment();
            const lower = original.toLowerCase();
            let from = 0;
            let match = query ? lower.indexOf(query) : -1;
            while (match !== -1) {
                fragment.append(document.createTextNode(original.slice(from, match)));
                fragment.append($('<mark>').text(original.slice(match, match + query.length))[0]);
                from = match + query.length;
                match = lower.indexOf(query, from);
            }
            fragment.append(document.createTextNode(original.slice(from)));
            const icon = $(node).children('span').detach();
            $(node).empty().append(fragment).append(icon);
        }
        $('#faq-search').on('input', function () {
            const query = String($(this).val() || '').trim().toLowerCase();
            let matches = 0;
            $faqText.each(function () {
                const original = $(this).data('search-original');
                if (query) matches += original.toLowerCase().split(query).length - 1;
                highlightText(this, original, query);
            });
            $('.faq-item').each(function () {
                const $button = $(this).find('.faq-question');
                if (query) {
                    if ($(this).data('search-open') === undefined) $(this).data('search-open', $button.attr('aria-expanded') === 'true');
                    const open = $(this).find('mark').length > 0;
                    $button.attr('aria-expanded', String(open)).children('span').text(open ? ' −' : ' +');
                    $(this).find('.faq-answer').toggleClass('is-open', open).prop('inert', !open);
                } else if ($(this).data('search-open') !== undefined) {
                    const open = $(this).data('search-open');
                    $button.attr('aria-expanded', String(open)).children('span').text(open ? ' −' : ' +');
                    $(this).find('.faq-answer').toggleClass('is-open', open).prop('inert', !open);
                    $(this).removeData('search-open');
                }
            });
            $('#faq-search-count').text(query ? matches + ' matches highlighted.' : '');
        });

        // Tasks 4, 5 and 9: share one scroll callback, scheduled once per frame.
        function updateProgress() {
            const distance = document.documentElement.scrollHeight - window.innerHeight;
            const progress = distance > 0 ? Math.min(100, Math.max(0, window.scrollY / distance * 100)) : 100;
            $('#scroll-progress').css('width', progress + '%').attr('aria-valuenow', Math.round(progress));
        }
        function animateCounters() {
            $('.a6-counter').each(function () {
                const $counter = $(this);
                if ($counter.data('started') || this.getBoundingClientRect().top > window.innerHeight) return;
                $counter.data('started', true);
                const target = Number($counter.attr('data-target'));
                if (reduceMotion) { $counter.text(target); return; }
                $({ count: 0 }).animate({ count: target }, {
                    duration: 1200,
                    step: function (value) { $counter.text(Math.floor(value)); },
                    complete: function () { $counter.text(target); }
                });
            });
        }
        function loadVisibleImages() {
            $('img[data-src]').each(function () {
                const rect = this.getBoundingClientRect();
                if (!this.getClientRects().length || rect.top > window.innerHeight + 150 || rect.bottom < -150) return;
                const $img = $(this);
                $img.one('load', function () { $(this).addClass('a6-loaded'); refreshViewport(); });
                $img.one('error', function () { $(this).addClass('a6-image-error').attr('title', 'Image unavailable from its original source.'); });
                $img.attr('src', $img.attr('data-src')).removeAttr('data-src');
            });
        }
        let framePending = false;
        function refreshViewport() {
            if (framePending) return;
            framePending = true;
            window.requestAnimationFrame(function () {
                framePending = false; updateProgress(); animateCounters(); loadVisibleImages();
            });
        }
        $(window).on('scroll.a6 resize.a6 load.a6', refreshViewport);
        $(document).on('shown.bs.collapse slid.bs.carousel', refreshViewport);
        refreshViewport();

        // Task 6. Wait only after the existing validation and wizard accept submit.
        const form = document.getElementById('contact-form');
        if (form) {
            const $form = $(form);
            const $submit = $form.find('button[type="submit"]');
            let busy = false;
            let spinnerTimer;
            let originalHTML;
            function finishLoading() {
                busy = false; $form.removeAttr('aria-busy');
                if (originalHTML !== undefined) $submit.html(originalHTML).prop('disabled', false);
            }
            form.addEventListener('submit', function (event) {
                if (busy) { event.preventDefault(); event.stopImmediatePropagation(); }
            }, true);
            $form.on('submit.a6', function (event) {
                event.preventDefault();
                if ($form.find('[aria-invalid="true"]').length || !$('#contact-status').text().startsWith('Validation successful!')) return;
                busy = true; originalHTML = $submit.html();
                $form.attr('aria-busy', 'true');
                $submit.prop('disabled', true).html('<span class="a6-spinner" aria-hidden="true"></span> Please wait…');
                $('#contact-status').text('Checking your details… This is a demo.');
                spinnerTimer = setTimeout(function () {
                    finishLoading();
                    $('#contact-status').text('Demo complete! Your details were validated. No message was sent and no account was created.');
                    notify('Demo completed. No message was sent.');
                }, 1400);
            });
            $form.on('reset.a6', function () { clearTimeout(spinnerTimer); finishLoading(); });
        }

        // Task 8. Only display success after an actual clipboard write succeeds.
        let copyTimer;
        $('#copy-email').on('click', async function () {
            const $button = $(this);
            const text = $('#studio-email').text();
            $button.prop('disabled', true);
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const $field = $('<textarea>').val(text).addClass('a6-clipboard-helper').appendTo('body');
                    $field[0].select();
                    let copied = false;
                    try { copied = document.execCommand('copy'); } finally { $field.remove(); }
                    if (!copied) throw new Error('Clipboard is unavailable');
                }
                clearTimeout(copyTimer);
                $button.text('✓ Copied'); $('#copy-tooltip').prop('hidden', false); $('#copy-status').text('Email copied to clipboard.');
                notify('Email copied to clipboard!');
                copyTimer = setTimeout(function () { $button.text('Copy email'); $('#copy-tooltip').prop('hidden', true); }, 2500);
            } catch {
                $('#copy-status').text('Copy unavailable. Select and copy the email manually.');
                notify('Could not copy. Please copy the email manually.');
            } finally { $button.prop('disabled', false).trigger('focus'); }
        });
    });
}
