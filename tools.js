/** @module Tools */

/**
 * Creates a function that delegates given event to specified selector only.
 *
 * @param {String} selector CSS query selector
 * @param {Function({Event})} fn Callback function run if selector matches
 * @returns {Function(): void} Function to be run on event
 */
const delegate = (selector, fn) => {
    return (e) => {
        if (e.target.closest(selector)) {
            fn(e);
        }
    };
};

/**
 * Create a debounce function that runs after set delay.
 *
 * @param {Function} fn Function to be run after debounce
 * @param {Number} delay Delay in milliseconds
 * @returns {Function(): void} Function to be called after interaction
 */
const debounce = (fn, delay = 300) => {
    let timeout;

    return (e) => {
        clearTimeout(timeout);

        timeout = setTimeout(() => fn(e), delay);
    };
};

/**
 * Compare two values for sort function.
 * @param a
 * @param b
 * @returns {number}
 */
const compare = (a, b) => {
    if (a > b) {
        return 1;
    } else if (a < b) {
        return -1;
    }

    return 0;
};

/**
 * Sort object by specified key.
 *
 * @param {String|Number} key Key of object or array given
 * @returns {Function({Object}, {Object}): Number} Function to be called on each comparison
 */
const sortBy = (key) => {
    return (a, b) => {
        return compare(a[key], b[key]);
    };
};

/**
 * Map options object deep.
 *
 * @param originalOptions {Object} Original options object
 * @param newOptions {Object} New options object that will overwrite correlating values
 * @returns {Object}
 */
const mapOptions = (originalOptions, newOptions) => {
    if (!originalOptions) {
        return newOptions;
    }

    let settings;

    if (Array.isArray(originalOptions)) {
        settings = originalOptions.map((x) => x);
    } else {
        settings = Object.assign({}, originalOptions);
    }

    Object.keys(newOptions).forEach((strKey) => {
        if (typeof newOptions[strKey] === 'object'
            && !(newOptions[strKey] instanceof Node)
            && !(newOptions[strKey] instanceof Function)
        ) {
            settings[strKey] = mapOptions(settings[strKey], newOptions[strKey]);
        } else {
            settings[strKey] = newOptions[strKey];
        }
    });

    return settings;
};

/**
 * Get settings according to media query.
 *
 * @param medias {Object[]}
 */
function getMediaOptions(medias, key = 'settings') {
    let matchingOption;

    // Go through each item, so the logic matches that of CSS as it will apply the last item.
    medias.forEach(function(item) {
        if (window.matchMedia(item.media).matches) {
            matchingOption = item[key];
        }
    });

    return matchingOption;
}

export {
    delegate,
    debounce,
    sortBy,
    compare,
    mapOptions,
    getMediaOptions,
};
