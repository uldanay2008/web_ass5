/*
 * Assignment 5 additions for the ORIGINAL web_ass4 website.
 * Load AFTER js/script.js. The original script and stylesheet stay unchanged.
 * No dependencies; no requests containing form data; no password storage.
 */
(() => {
    'use strict';

    const scriptUrl = document.currentScript.src;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Reusable helper: behavior belongs in JS, visual rules in assignment5.css.
    function animate(element) {
        if (!element || reducedMotion.matches) return;
        element.classList.remove('as5-pop');
        void element.offsetWidth; // Restart the animation after another click.
        element.classList.add('as5-pop');
        element.addEventListener('animationend', () => {
            element.classList.remove('as5-pop');
        }, { once: true });
    }

    function makeButton(text, className = 'btn btn-outline-danger btn-sm') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        return button;
    }

    // 1. Keyboard events + switch: only handle keys INSIDE the existing menu.
    function initKeyboardNavigation() {
        const menu = document.getElementById('mainNav');
        if (!menu) return;
        const links = Array.from(menu.querySelectorAll('.nav-link'));

        menu.addEventListener('keydown', (event) => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const index = links.indexOf(document.activeElement);
            if (index === -1) return;
            let nextIndex;
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    nextIndex = (index + 1) % links.length;
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    nextIndex = (index - 1 + links.length) % links.length;
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = links.length - 1;
                    break;
                default:
                    return; // Tab and Enter keep their normal browser behavior.
            }
            event.preventDefault();
            links[nextIndex].focus();
        });
    }

    // 2. DOM selection, textContent, attributes, object methods, arrays and loops.
    // Added under the EXISTING welcome paragraph, without replacing its content.
    function initRating() {
        const introduction = document.querySelector('.about-section > p');
        if (!introduction || document.getElementById('as5-rating')) return;

        const rating = {
            value: 0,
            maximum: 5,
            set(value) {
                if (Number.isInteger(value) && value >= 1 && value <= this.maximum) {
                    this.value = value;
                }
            },
            getMessage() {
                return `Your rating: ${this.value} / ${this.maximum}. Thank you!`;
            }
        };
        const container = document.createElement('div');
        container.id = 'as5-rating';
        container.className = 'as5-rating';
        const message = document.createElement('p');
        message.id = 'as5-rating-message';
        message.className = 'as5-rating-message';
        message.setAttribute('role', 'status');
        message.textContent = 'Rate Winx Studio: choose 1–5 stars.';
        const group = document.createElement('div');
        group.className = 'as5-rating-stars';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Rate Winx Studio from 1 to 5');

        // An explicit for loop creates the collection of buttons dynamically.
        const scores = [];
        for (let value = 1; value <= rating.maximum; value++) {
            scores.push(value);
        }
        // forEach is a higher-order function: the arrow function is its callback.
        scores.forEach((value) => {
            const star = makeButton('☆', 'as5-rating-star');
            star.dataset.rating = String(value);
            star.setAttribute('aria-label', `Rate ${value} out of ${rating.maximum}`);
            star.setAttribute('aria-pressed', 'false');
            group.append(star);
        });
        container.append(message, group);
        introduction.after(container);

        const stars = container.querySelectorAll('[data-rating]');
        stars.forEach((star) => {
            star.addEventListener('click', () => {
                rating.set(Number(star.dataset.rating));
                stars.forEach((item) => {
                    const value = Number(item.dataset.rating);
                    const filled = value <= rating.value;
                    item.textContent = filled ? '★' : '☆';
                    item.classList.toggle('as5-selected', filled);
                    item.setAttribute('aria-pressed', String(value === rating.value));
                });
                message.textContent = rating.getMessage();
                animate(star);
            });
        });
    }

    // 3. Sound: one Audio object, restarted instead of layering multiple tracks.
    function initSound() {
        const tools = document.querySelector('footer .interactive-tools');
        if (!tools || document.getElementById('as5-play-sound')) return;
        const audio = new Audio(new URL('../audio/assignment5-chime.wav', scriptUrl).href);
        audio.preload = 'none';
        audio.volume = 0.3;
        let requestNumber = 0;
        const button = makeButton('Play sound', 'winx-action');
        button.id = 'as5-play-sound';
        const status = document.createElement('span');
        status.id = 'as5-sound-status';
        status.className = 'as5-sound-status';
        status.setAttribute('role', 'status');
        tools.insertBefore(button, tools.querySelector('p'));
        tools.append(status);

        button.addEventListener('click', async () => {
            const request = ++requestNumber;
            audio.pause();
            audio.currentTime = 0;
            status.textContent = '';
            animate(button);
            try {
                await audio.play();
            } catch (error) {
                // A second click may interrupt a previous pending play().
                if (request !== requestNumber || error.name === 'AbortError') return;
                status.textContent = 'Sound is unavailable. Check the audio file and try again.';
            }
        });
        window.addEventListener('pagehide', () => audio.pause());
    }

    // 4. Optional multi-step mode for the ORIGINAL contact form.
    // Existing fields stay in the same DOM positions. Only visibility changes.
    function initContactSteps() {
        const form = document.getElementById('contact-form');
        if (!form || document.getElementById('as5-form-tools')) return;
        const submit = form.querySelector('button[type="submit"]');
        const status = document.getElementById('contact-status');
        const ids = ['name', 'email', 'password', 'confirm-password', 'message'];
        if (!submit || !status || ids.some((id) => !form.querySelector('#' + id))) return;

        const groupFor = (id) => form.querySelector('#' + id)?.closest('.mb-3');
        const steps = [
            {
                title: 'Your details',
                fields: ['name', 'email'],
                elements: [groupFor('name'), groupFor('email'), groupFor('service')]
            },
            {
                title: 'Password validation',
                fields: ['password', 'confirm-password'],
                elements: [groupFor('password'), groupFor('confirm-password'), form.querySelector('.form-hint')]
            },
            {
                title: 'Your message',
                fields: ['message'],
                elements: [form.querySelector('fieldset'), groupFor('message'), groupFor('news')]
            }
        ];
        if (steps.some((step) => step.elements.some((element) => !element))) return;

        const tools = document.createElement('div');
        tools.id = 'as5-form-tools';
        tools.className = 'as5-form-tools';
        const progress = document.createElement('p');
        progress.id = 'as5-step-status';
        progress.className = 'form-hint';
        progress.setAttribute('role', 'status');
        progress.hidden = true;
        const actions = document.createElement('div');
        actions.className = 'as5-form-actions';
        const modeButton = makeButton('Fill step by step');
        modeButton.id = 'as5-step-mode';
        modeButton.setAttribute('aria-pressed', 'false');
        const backButton = makeButton('Back');
        backButton.id = 'as5-back';
        const nextButton = makeButton('Next', 'btn btn-danger btn-sm');
        nextButton.id = 'as5-next';
        const resetButton = makeButton('Reset form');
        resetButton.id = 'as5-reset';
        actions.append(modeButton, backButton, nextButton, resetButton);
        tools.append(progress, actions);
        form.append(tools);

        const wizard = {
            enabled: false,
            currentStep: 0,
            // onChange is an explicit callback supplied by the caller.
            goTo(index, onChange) {
                if (index < 0 || index >= steps.length) return;
                this.currentStep = index;
                onChange(index);
            }
        };

        function setHidden(element, hidden) {
            element.hidden = hidden;
            element.classList.toggle('as5-hidden', hidden);
        }

        function renderStep(index) {
            for (let number = 0; number < steps.length; number++) {
                for (const element of steps[number].elements) {
                    setHidden(element, wizard.enabled && number !== index);
                }
            }
            setHidden(progress, !wizard.enabled);
            progress.textContent = `Step ${index + 1} of ${steps.length} — ${steps[index].title}`;
            modeButton.textContent = wizard.enabled ? 'Show full form' : 'Fill step by step';
            modeButton.setAttribute('aria-pressed', String(wizard.enabled));
            setHidden(backButton, !wizard.enabled || index === 0);
            setHidden(nextButton, !wizard.enabled || index === steps.length - 1);
            setHidden(submit, wizard.enabled && index !== steps.length - 1);
        }

        function showStep(index) {
            renderStep(index);
            const firstInput = form.querySelector('#' + steps[index].fields[0]);
            firstInput.focus({ preventScroll: true });
            animate(steps[index].elements[0]);
        }

        // Same rules and error elements as Assignment 4; no form cloning.
        function validateFields(fieldIds) {
            let firstInvalid = null;
            fieldIds.forEach((id) => {
                const input = form.querySelector('#' + id);
                let error = '';
                if (!input.value.trim()) error = 'This field is required.';
                else if (id === 'email' && !input.validity.valid) error = 'Enter a valid email address.';
                else if (id === 'password' && input.value.length < 8) error = 'Password must contain at least 8 characters.';
                else if (id === 'confirm-password' && input.value !== form.querySelector('#password').value) error = 'Passwords do not match.';
                form.querySelector('#' + id + '-error').textContent = error;
                input.setAttribute('aria-describedby', id + '-error');
                input.setAttribute('aria-invalid', String(Boolean(error)));
                if (error && !firstInvalid) firstInvalid = input;
            });
            return firstInvalid;
        }

        function nextStep() {
            status.textContent = '';
            const invalid = validateFields(steps[wizard.currentStep].fields);
            if (invalid) {
                invalid.focus();
                return;
            }
            // Passing showStep (not showStep()) demonstrates a callback.
            wizard.goTo(wizard.currentStep + 1, showStep);
        }

        modeButton.addEventListener('click', () => {
            wizard.enabled = !wizard.enabled;
            status.textContent = '';
            wizard.goTo(wizard.currentStep, showStep);
        });
        nextButton.addEventListener('click', nextStep);
        backButton.addEventListener('click', () => {
            status.textContent = '';
            wizard.goTo(wizard.currentStep - 1, showStep);
        });
        resetButton.addEventListener('click', () => form.reset());
        form.addEventListener('reset', () => {
            status.textContent = '';
            form.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
            ids.forEach((id) => {
                const input = form.querySelector('#' + id);
                input.removeAttribute('aria-invalid');
            });
            wizard.goTo(0, renderStep);
        });

        // Capture phase runs before the ORIGINAL submit validation handler.
        // Enter on an early step means Next, not premature submission.
        form.addEventListener('submit', (event) => {
            if (!wizard.enabled) return;
            if (wizard.currentStep < steps.length - 1) {
                event.preventDefault();
                event.stopImmediatePropagation();
                nextStep();
                return;
            }
            // Reveal an earlier invalid field before the old handler focuses it.
            const invalid = validateFields(ids);
            if (invalid) {
                const index = steps.findIndex((step) => step.fields.includes(invalid.id));
                wizard.goTo(index, renderStep);
            }
        }, true);

        // The existing listener still performs final validation and reports that
        // this is a demo. We only add an event-triggered success animation.
        form.addEventListener('submit', () => {
            if (status.textContent && !form.querySelector('[aria-invalid="true"]')) animate(status);
        });
        renderStep(0); // Full original form remains visible on initial load.
    }

    function init() {
        initKeyboardNavigation();
        initRating();
        initSound();
        initContactSteps();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
