import * as Tools from './tools.js';

/**
 * Customizable select menu.
 */
class CustomSelect {
    /**
     * Construct.
     *
     * @param {HTMLElement} el Document node
     * @param {Object} options Object to overwrite default settings.
     */
    constructor(el, options = {}) {
        this._defaultSettings = {
            namespace: 'custom-select',
        };

        this._settings = Tools.mapOptions(this._defaultSettings, options);

        this.el = el;
        this.el.classList.add(this.getNamespace('-original'));

        this.customSelect = document.createElement('dl');
        this.customSelect.classList.add(this.getNamespace());

        this.label = document.createElement('dt');
        this.label.classList.add(this.getNamespace('__label'));

        this.labelInner = document.createElement('span');
        this.labelInner.classList.add(this.getNamespace('__label-inner'));
        this.label.appendChild(this.labelInner);

        let icon = document.createElement('span');
        icon.classList.add(this.getNamespace('__label-icon'));

        this.label.appendChild(icon);

        this.customOptions = document.createElement('dd');
        this.customOptions.classList.add(this.getNamespace('__options'));

        this.customSelect.appendChild(this.label);
        this.customSelect.appendChild(this.customOptions);

        /**
         * Select options Array
         * @type Array
         * @property {Object[]} selectOptions[].attributes Key value pairs of element attributes. Eg. value.
         * @property {String|Object} selectOptions[].inner Content of the option or object for optgroup.
         * @property {String} selectOptions[].inner.label Label for the optgroup element.
         * @property {Array} selectOptions[].inner.items Label for the optgroup element.
         */
        this.selectOptions = this._createOptionsObjectFromElements(Array.from(el.children));
        this.customSelect.setAttribute('tabindex', this.el.tabIndex);

        // Reset aria attributes afterwards.
        this.el.ariaHidden = true;
        this.el.tabIndex = '-1';

        if (this.el.nextElementSibling) {
            this.el.parentNode.insertBefore(this.customSelect, this.el.nextElementSibling);
        } else {
            this.el.parentNode.appendChild(this.customSelect);
        }

        // Focus on custom selection if focus is set on main select.
        this.el.addEventListener('focus', () => {
            this.customSelect.focus();
        });

        this.customSelect.addEventListener('click', () => {
            this.open();
            this.customSelect.querySelector('[role="listbox"]').focus();
        });
        this.customSelect.addEventListener('focusout', Tools.delegate(this.getNamespaceClass(), (e) => {
            if (e.target.closest(this.getNamespaceClass()) === this.customSelect) {
                return;
            }

            this.close();
        }));

        this.customSelect.addEventListener('click', Tools.delegate(
            '[data-value]',
            (e) => {
                this.select(e.target.closest('[data-value]').dataset.value);
            }
        ));

        this.customSelect.addEventListener('change', () => {
            this.el.value = this.getCurrentValue();

            this.labelInner.innerHTML = this._getCurrentOptionElement().innerHTML;

            // Dispatch event for other listeners on select item itself.
            this.el.dispatchEvent(new Event('change', {
                bubbles: true,
            }));
        });

        // Bind and set to property to remove event listener later on.
        this.toggle = this._keypressListener = this._keypressListener.bind(this);

        // Bind and set to property to remove event listener later on.
        this.toggle = this.toggle.bind(this);

        // Bind and set to property to remove event listener later on.
        this._clickOutsideListener = this._clickOutsideListener.bind(this);

        this.render();

        this.select();
    }

    /**
     * Render current select options.
     */
    render() {
        let html = this._getSelectOptionMarkupFromObject(this.selectOptions);
        let menuHtml = this._getMenuOptionsMarkupFromObject(this.selectOptions);

        this.el.innerHTML = html;

        this.customOptions.innerHTML = menuHtml;

        let selectedOption = this._getCurrentOptionElement();

        this.select(selectedOption.value);
    }

    /**
     * Get the current selected option node.
     *
     * @returns {HTMLElement} The currently selected `<option>` element.
     * @private
     */
    _getCurrentOptionElement() {
        // Just get the node, so the fallback in the last line will trigger if no element matches the selector.
        let selected = this.el.querySelector(`[value="${this._value}"]`);

        return selected ? selected : this.el.querySelector('[selected],option');
    }

    /**
     * Create select tag markup fron object.
     *
     * @param {Array} options Array of objects.
     * @returns {String}
     * @private
     */
    _getSelectOptionMarkupFromObject(options) {
        let html = options.reduce((prev, current) => {
            let optionHtml;
            let attributes = current.attributes ? this._getAttributeString(current.attributes) : '';

            if (typeof current.inner === 'string') {
                optionHtml = `<option ${attributes}>${current.inner}</option>`;
            } else {
                optionHtml = `
                            <optgroup ${attributes} label="${current.inner.label}">
                                ${this._getSelectOptionMarkupFromObject(current.inner.items)}
                            </optgroup>`;
            }

            return prev + optionHtml;
        }, '');

        return html;
    }

    /**
     * Get menu items markup.
     *
     * @param {Array} options Array of objects.
     * @returns {String} HTML of custom select.
     * @private
     */
    _getMenuOptionsMarkupFromObject(options) {
        let html = options.reduce((prev, current) => {
            let menuHTML;
            let attributes = current.attributes ? this._getAttributeString(current.attributes, 'data-') : '';

            if (typeof current.inner === 'string') {
                menuHTML = `<li ${attributes}
                                class="${this.getNamespace('__option')}"
                                role="option"
                                aria-selected="false">
                                ${current.inner}
                            </li>`;
            } else {
                menuHTML = `<li class="${this.getNamespace('__group')}">
                                <span class="${this.getNamespace('__group-label')}">${current.inner.label}</span>
                                ${this._getMenuOptionsMarkupFromObject(current.inner.items)}
                            </li>`;
            }

            return prev + menuHTML;
        }, '');

        return `<ul role="listbox"
                    tabindex="${this.customSelect.tabIndex}"
                    class="${this.getNamespace('__options-inner')}">${html}</ul>`;
    }

    /**
     * Get attributes as string. Each attribute will also be generated as data-attribute.
     *
     * @param {Object} attributes Key value pairs of attributes
     * @returns {String} String containing the attributes to be added to a node.
     * @private
     */
    _getAttributeString(attributes, prefix = '') {
        return Object.keys(attributes)
            .reduce((prev, key) => ` ${prev} ${prefix}${key}="${attributes[key]}"`, '')
            .trim();
    }

    /**
     * Open options menu.
     */
    open() {
        this.customSelect.classList.add(this.getNamespace('--is-open'));

        document.addEventListener('click', this._clickOutsideListener);
        window.addEventListener('keydown', this._keypressListener);
    }

    /**
     * Close options menu.
     */
    close() {
        console.log('close');
        this.customSelect.classList.remove(this.getNamespace('--is-open'));

        document.removeEventListener('click', this._clickOutsideListener);
        window.removeEventListener('keydown', this._keypressListener);
    }

    /**
     * Toggle the open state of the select menu.
     */
    toggle() {
        if (this.customSelect.matches(this.getNamespaceClass('--is-open'))) {
            this.close();
        } else {
            this.close();
        }
    }

    /**
     * Listen for click events outside the current instance.
     *
     * @param {Event} e The click event on the document.
     * @private
     */
    _clickOutsideListener(e) {
        console.log(e);
        // Handle this event explicitly without delegate.
        if (e.target.closest(this.getNamespaceClass()) !== this.customSelect) {
            this.close();
        }
    }

    /**
     * Switch further actions on keypress on opened select.
     *
     * @param {Event} e
     * @private
     */
    _keypressListener(e) {
        // Use keycode instead of key because of space key.
        switch (e.keyCode) {
            case 13: // Enter
            case 32: // Space
                e.stopPropagation();
                e.preventDefault();
                this.select(this.customSelect.querySelector('[aria-selected="true"]').dataset.value);
                break;
            case 38: // Arrow up
                e.preventDefault();
                this._focusPrevious();
                break;
            case 40: // Arrow down
                e.preventDefault();
                this._focusNext();
                break;
        }
    }

    /**
     * Focus on next item.
     *
     * @private
     */
    _focusNext() {
        let selectables = Array.from(this.customSelect.querySelectorAll('[aria-selected]'));
        let indexOf = selectables.findIndex(el => el.ariaSelected === 'true');
        let next = Math.min(indexOf + 1, selectables.length - 1);

        selectables[next].focus();

        this._applyAriaSelected(selectables[next].dataset.value);
    }

    /**
     * Focus on previous item.
     *
     * @private
     */
    _focusPrevious() {
        let selectables = Array.from(this.customSelect.querySelectorAll('[aria-selected]'));
        let indexOf = selectables.findIndex(el => el.ariaSelected === 'true');
        let previous = Math.max(indexOf - 1, 0);

        selectables[previous].focus();

        this._applyAriaSelected(selectables[previous].dataset.value);
    }

    /**
     * Apply aria selected on items.
     *
     * @param value
     * @private
     */
    _applyAriaSelected(value = this._value) {
        let selectedCustomOption = this.customSelect.querySelector('[aria-selected="true"]');

        if (selectedCustomOption) {
            selectedCustomOption.ariaSelected = 'false';
        }

        let current = this.customSelect.querySelector(`[data-value="${value}"]`);

        // Set selected on first option if no value matches.
        current = current ? current : this.customSelect.querySelector(this.getNamespaceClass('__option'));
        current.ariaSelected = 'true';
    }

    /**
     * Select specified value.
     *
     * @param {String} value Value to be selected.
     */
    select(value) {
        this._value = value;

        this._applyAriaSelected(value);

        this.customSelect.dispatchEvent(new CustomEvent('change',
            {
                detail: {
                    CustomSelect: this,
                },
            }
        ));

        this.close();
    }

    /**
     * Set available options of select and update custom select.
     *
     * @param {Object[]} options Array of objects {@link CustomSelect#selectOptions}
     */
    setOptions(options) {
        this.selectOptions = options;

        this.render();
    }

    /**
     * Get current value.
     *
     * @returns {String}
     */
    getCurrentValue() {
        return this._value;
    }

    /**
     * Get name of current select field.
     *
     * @returns {String}
     */
    getName() {
        return this.el.name || this.el.id;
    }

    /**
     * Create initial options object from children.
     *
     * @param children
     * @returns {Object} @see {@link CustomSelect#selectOptions}
     * @private
     */
    _createOptionsObjectFromElements(children) {
        let obj = children.map((el) => this._createOptionsObjectFromSingleElement(el));

        return obj;
    }

    /**
     * Create single item options object.
     *
     * @param el
     * @returns {Object} @see {@link CustomSelect#selectOptions}
     * @private
     */
    _createOptionsObjectFromSingleElement(el) {
        let inner;

        if (el.children.length) {
            inner = {
                label: el.label,
                items: this._createOptionsObjectFromElements(Array.from(el.children)),
            };
        } else {
            inner = el.innerHTML;
        }

        let obj = {
            inner,
            attributes: el.getAttributeNames().reduce((prev, attr) => {
                prev[attr] = el[attr];

                return prev;
            }, {}),
        };

        return obj;
    }

    /**
     * Get the namespace class. Eg. for dynamic css class naming.
     *
     * @param suffix {string} String appended after the namespace class.
     * @param prefix {string} String prepended before the namespace class.
     * @returns {string}
     */
    getNamespace(suffix = '', prefix = '') {
        return prefix + (this._settings ? this._settings.namespace : this.settings.namespace) + suffix;
    }

    /**
     * Get the namespace class with prepended dot. Eg. for query selectors.
     *
     * @param suffix {string} String appended after the namespace class.
     * @param prefix {string} String prepended before the namespace class.
     * @returns {string}
     */
    getNamespaceClass(suffix = '', prefix = '') {
        return '.' + this.getNamespace(suffix, prefix);
    }
}

export default CustomSelect;
