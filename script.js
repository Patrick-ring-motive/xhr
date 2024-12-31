/**
 * Immediately Invoked Function Expression to define and intercede various global and XMLHttpRequest behaviors.
 */
(() => {
    /**
     * Safely invokes a function if it exists, returning undefined on ReferenceError.
     * @param {Function} varFn - Function to invoke.
     * @returns {*} The return value of varFn if it exists and doesn't throw ReferenceError; otherwise undefined.
     */
    const q = (varFn) => {
        try {
            return varFn?.();
        } catch (e) {
            if (e.name != 'ReferenceError') {
                throw e;
            }
        }
    }

    /**
     * The global object reference, derived from the best available environment.
     * @type {Object}
     */
    const globalObject = q(() => globalThis) ?? q(() => self) ?? q(() => global) ?? q(() => window) ?? this ?? {};

    /**
     * Binds the global object to multiple references in the environment.
     */
    for (let x of ['globalThis', 'self', 'global']) {
        globalObject[x] = globalObject;
    }

    /**
     * Expose the q function on self.
     * @type {Function}
     */
    self.q = q;

    /**
     * Creates a new instance from the first argument (constructor) in args, with subsequent args as constructor params.
     * @function
     * @param {...*} args - The first element should be a constructor. The rest are passed as arguments to it.
     * @returns {*} A new instance or undefined if no valid constructor is provided.
     */
    self.newQ = (...args) => {
        const fn = args?.shift?.();
        return fn && new fn(...args);
    };

    /**
     * Defines a property on an object with specified descriptors.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @param {boolean} enm - Whether the property is enumerable.
     * @param {boolean} mut - Whether the property is writable and configurable.
     * @returns {Object} The modified object.
     */
    globalThis.objDoProp = function(obj, prop, def, enm, mut) {
        return Object.defineProperty(obj, prop, {
            value: def,
            writable: mut,
            enumerable: enm,
            configurable: mut,
        });
    };

    /**
     * Defines a non-enumerable, configurable property on an object.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @returns {Object} The modified object.
     */
    globalThis.objDefProp = (obj, prop, def) => objDoProp(obj, prop, def, false, true);

    /**
     * Defines an enumerable, configurable property on an object.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @returns {Object} The modified object.
     */
    globalThis.objDefEnum = (obj, prop, def) => objDoProp(obj, prop, def, true, true);

    /**
     * Defines a non-enumerable, non-configurable (frozen) property on an object.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @returns {Object} The modified object.
     */
    globalThis.objFrzProp = (obj, prop, def) => objDoProp(obj, prop, def, false, false);

    /**
     * Defines an enumerable, non-configurable (frozen) property on an object.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @returns {Object} The modified object.
     */
    globalThis.objFrzEnum = (obj, prop, def) => objDoProp(obj, prop, def, true, false);

    /**
     * Defines an enumerable accessor property on an object with get/set functions.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {Function} getFn - Getter function.
     * @param {Function} setFn - Setter function.
     * @returns {Object} The modified object.
     */
    const objDefEnumAcc = (obj, prop, getFn, setFn) => {
        let _prop;
        return Object.defineProperty(obj, prop, {
            get() {
                return getFn(_prop);
            },
            set(value) {
                _prop = setFn(value);
            },
            enumerable: true,
            configurable: true,
            writeable: true
        });
    }

    /**
     * Defines a non-enumerable accessor property on an object with get/set functions.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {Function} getFn - Getter function.
     * @param {Function} setFn - Setter function.
     * @returns {Object} The modified object.
     */
    const objDefPropAcc = (obj, prop, getFn, setFn) => {
        let _prop;
        return Object.defineProperty(obj, prop, {
            get() {
                return getFn?.(_prop);
            },
            set(value) {
                _prop = setFn?.(value);
            },
            enumerable: false,
            configurable: true,
            writeable: true
        });
    }

    /**
     * Creates a "stealth" object that mimics another object's prototype and uses its toString method.
     * @function
     * @param {Object} shadow - The shadow object to augment.
     * @param {Object} original - The original object whose prototype and toString are used.
     * @returns {Object} The shadow object with the new prototype and toString method.
     */
    function stealth(shadow, original) {
        shadow = Object(shadow);
        original = Object(original);
        objDefProp(shadow, 'toString', function toString() { return original.toString(); });
        Object.setPrototypeOf(shadow, original);
        return shadow;
    }

    /**
     * Replaces a method on an object with a custom function, preserving the original under a Symbol.
     * @function
     * @param {Object} root - The object containing the method to intercede.
     * @param {string} name - The name of the property (method) to replace.
     * @param {Symbol} key - Symbol used to store the original method.
     * @param {Function} fn - The custom function that replaces the original.
     */
    function intercede(root, name, key, fn) {
        root = Object(root);
        name = String(name);
        fn = Object(fn);
        objDefProp(root, key, root?.[name]);
        objDefEnum(root, name, fn);
        stealth(root?.[name], root?.[key]);
    }

    /**
     * An XMLSerializer instance created via newQ.
     * @type {XMLSerializer}
     */
    const serializer = newQ(globalThis.XMLSerializer);

    /**
     * Serializes an XML Node to a string using the `serializer`.
     * @function
     * @param {Node} node - The XML Node to serialize.
     * @returns {string} The serialized XML.
     */
    const serializeXML = node => serializer?.serializeToString?.(node);

    /**
     * Converts an ArrayBuffer or array-like object to a Uint8Array.
     * @function
     * @param {ArrayBuffer|ArrayLike<number>} buff - The buffer or array-like to convert.
     * @returns {Uint8Array} The Uint8Array.
     */
    const bytes = buff => new Uint8Array(buff);

    /**
     * A TextEncoder instance created via newQ.
     * @type {TextEncoder}
     */
    const encoder = newQ(globalThis.TextEncoder);

    /**
     * Encodes a string into UTF-8 bytes using the global encoder.
     * @function
     * @param {string} str - The string to encode.
     * @returns {Uint8Array} The UTF-8 encoded data.
     */
    const encode = str => encoder?.encode?.(str) ?? bytes([...str].map(x => x.charCodeAt()));

    /**
     * Encodes a string and returns the raw ArrayBuffer of the UTF-8 encoded data.
     * @function
     * @param {string} str - The string to encode.
     * @returns {ArrayBuffer} The encoded string as an ArrayBuffer.
     */
    const buffer = str => encode(str).buffer;

    /**
     * A TextDecoder instance created via newQ.
     * @type {TextDecoder}
     */
    const decoder = newQ(globalThis.TextDecoder);

    /**
     * Decodes a Uint8Array or ArrayBuffer-like object to a string using UTF-8.
     * @function
     * @param {Uint8Array|ArrayBuffer} byte - The data to decode.
     * @returns {string} The decoded string.
     */
    const decode = byte => decoder?.decode?.(byte) ?? String.fromCharCode(...byte);

    /**
     * Converts an ArrayBuffer to a string by decoding it as UTF-8.
     * @function
     * @param {ArrayBuffer} buff - The buffer to decode.
     * @returns {string} The decoded string.
     */
    const text = buff => decode(bytes(buff));

    /**
     * Intercedes XMLHttpRequest methods if not already done via the 'xhr-intercede' namespace.
     */
    if (!globalThis?.namespaces?.['xhr-intercede']) {
        (()=>{
        /**
         * Intercedes the XMLHttpRequest `open` method to capture request metadata.
         * @symbol $open - Stores the original open method.
         */
        const $open = Symbol('open');
        intercede(globalThis.XMLHttpRequest?.prototype??{}, 'open', $open, function open(method, url, asynch, user, password) {
            try {
                objDefProp(this, '&request', {
                    method: String(method || 'GET').toUpperCase(),
                    url: String(url),
                    async: asynch,
                    user: user,
                    password: password,
                    headers: new Map()
                });
                return this[$open](...arguments);
            } catch (e) {
                console.warn(e, this, ...arguments);
                this.error = e;
                return e;
            }
        });
        })();

        (()=>{
        /**
         * Intercedes the XMLHttpRequest `send` method to block certain requests or capture request body.
         * @symbol $send - Stores the original send method.
         */
        const $send = Symbol('send');
        intercede(XMLHttpRequest.prototype, 'send', $send, function send() {
            try {
                if (`${this?.['&request']?.url}`.includes('googlead')) {
                    return console.warn(this, ...arguments);
                }
                if (arguments[0]) {
                    (this?.['&request'] ?? {}).body = arguments[0];
                }
                return this[$send](...arguments);
            } catch (e) {
                this?.finish?.(e);
                console.warn(e, this, ...arguments);
                this.error = e;
                return e;
            }
        });
        })();

        (()=>{
        /**
         * Intercedes the XMLHttpRequest `setRequestHeader` method to record header values in the request metadata.
         * @symbol $setRequestHeader - Stores the original setRequestHeader method.
         */
        const $setRequestHeader = Symbol('setRequestHeader');
        intercede(XMLHttpRequest.prototype, 'setRequestHeader', $setRequestHeader, function setRequestHeader(header, value) {
            try {
                this[$setRequestHeader](header, value);
                if (this?.['&request']?.headers?.get?.(header)) {
                    this?.['&request']?.headers?.set?.(header, this?.['&request']?.headers?.get?.(header) + ', ' + value);
                } else {
                    this?.['&request']?.headers?.set?.(header, value);
                }
            } catch (e) {
                console.warn(e, this, ...arguments);
                this?.['&request']?.headers?.set?.(header, e);
            }
        });
        })();

        (()=>{
        /**
         * Intercedes the XMLHttpRequest `abort` method.
         * @symbol $abort - Stores the original abort method.
         */
        const $abort = Symbol('abort');
        intercede(XMLHttpRequest.prototype, 'abort', $abort, function abort() {
            try {
                return this[$abort](...arguments);
            } catch (e) {
                console.warn(e, this, ...arguments);
                this.error = e;
                return e;
            }
        });
        })();

        (()=>{
        /**
         * Intercedes the XMLHttpRequest `getAllResponseHeaders` method.
         * @symbol $getAllResponseHeaders - Stores the original getAllResponseHeaders method.
         */
        const $getAllResponseHeaders = Symbol('getAllResponseHeaders');
        intercede(XMLHttpRequest.prototype, 'getAllResponseHeaders', $getAllResponseHeaders, function getAllResponseHeaders() {
            try {
                return this[$getAllResponseHeaders](...arguments);
            } catch (e) {
                console.warn(e, this, ...arguments);
                return Object.getOwnPropertyNames(e).map(x => `${x}: ${e[x]}`).join('\n');
            }
        });
        })();

        (()=>{
        /**
         * Intercedes the XMLHttpRequest `getResponseHeader` method.
         * @symbol $getResponseHeader - Stores the original getResponseHeader method.
         */
        const $getResponseHeader = Symbol('getResponseHeader');
        intercede(XMLHttpRequest.prototype, 'getResponseHeader', $getResponseHeader, function getResponseHeader() {
            try {
                return this[$getResponseHeader](...arguments);
            } catch (e) {
                console.warn(e, this, ...arguments);
                return e.message;
            }
        });
        })();

        (()=>{
        /**
         * Intercedes the XMLHttpRequest `overrideMimeType` method.
         * @symbol $overrideMimeType - Stores the original overrideMimeType method.
         */
        const $overrideMimeType = Symbol('overrideMimeType');
        intercede(XMLHttpRequest.prototype, 'overrideMimeType', $overrideMimeType, function overrideMimeType() {
            try {
                return this[$overrideMimeType](...arguments);
            } catch (e) {
                console.warn(e, this, ...arguments);
                return e;
            }
        });
        })();

        (()=>{
        /**
         * Finishes an XMLHttpRequest with an error response, forcing readyState to 4 and setting the response to the error details.
         * @function finish
         * @param {Error} e - The error to handle.
         */
        (globalThis.XMLHttpRequest?.prototype ?? {}).finish = (function finish(e) {
            objDefEnum(this, 'readyState', this.readyState ??= 0);
            while (this.readyState < 3) {
                objDefEnum(this, 'readyState', ++this.readyState);
                this.dispatchEvent(new Event('readystatechange'));
            }

            this.readyState = 4;
            objDefEnum(this, 'readyState', 4);
            this.status = 500;
            objDefEnum(this, 'status', 500);
            this.statusText = e.message;
            objDefEnum(this, 'statusText', e.message);
            const resText = Object.getOwnPropertyNames(e ?? {}).map(x => `${x}: ${e?.[x]}`)?.join?.('\n')?.trim?.() || String(e);
            this.responseText = resText;
            objDefEnum(this, 'responseText', resText);
            this.dispatchEvent(new Event('readystatechange'));
            this.dispatchEvent(new Event('loadstart'));
            this.dispatchEvent(new Event('load'));
            this.dispatchEvent(new Event('loadend'));
            this.error = e;
        });
        })();

        /**
         * The global namespaces object, tracking interceded features.
         * @type {Object}
         */
        globalThis.namespaces ??= {};
        globalThis.namespaces['xhr-intercede'] ||= Object(true);
    }

})();