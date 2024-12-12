(() => {
    const q = (varFn) => {
        try {
            return varFn?.();
        } catch (e) {
            if (e.name != 'ReferenceError') {
                throw e;
            }
        }
    }
    const globalObject = q(() => globalThis) ?? q(() => self) ?? q(() => global) ?? q(() => window) ?? this ?? {};
    for (let x of ['globalThis', 'self', 'global']) {
        globalObject[x] = globalObject;
    }
    self.q = q;
    self.newQ = (...args) => {
        const fn = args?.shift?.();
        return fn && new fn(...args);
    };

    globalThis.objDoProp = function(obj, prop, def, enm, mut) {
        return Object.defineProperty(obj, prop, {
            value: def,
            writable: mut,
            enumerable: enm,
            configurable: mut,
        });
    };
    globalThis.objDefProp = (obj, prop, def) => objDoProp(obj, prop, def, false, true);
    globalThis.objDefEnum = (obj, prop, def) => objDoProp(obj, prop, def, true, true);
    globalThis.objFrzProp = (obj, prop, def) => objDoProp(obj, prop, def, false, false);
    globalThis.objFrzEnum = (obj, prop, def) => objDoProp(obj, prop, def, true, false);
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

    function stealth(shadow, original) {
        shadow = Object(shadow);
        original = Object(original);
        objDefProp(shadow, 'toString', function toString() { return original.toString(); });
        Object.setPrototypeOf(shadow, original);
        return shadow;
    }

    function intercede(root, name, key, fn) {
        root = Object(root);
        name = String(name);
        fn = Object(fn);
        objDefProp(root, key, root?.[name]);
        objDefEnum(root, name, fn);
        stealth(root?.[name], root?.[key]);
    }

    const serializer = newQ(globalThis.XMLSerializer);
    const serializeXML = node => serializer?.serializeToString?.(node);
    const bytes = buff => new Uint8Array(buff);
    const encoder = newQ(globalThis.TextEncoder);
    const encode = str => encoder?.encode?.(str) ?? bytes([...str].map(x => x.charCodeAt()));
    const buffer = str => encode(str).buffer;
    const decoder = newQ(globalThis.TextDecoder);
    const decode = byte => decoder?.decode?.(byte) ?? String.fromCharCode(...byte);
    const text = buff => decode(bytes(buff));

    if (!globalThis?.namespaces?.['xhr-intercede']) {
        (()=>{
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
        (globalThis.XMLHttpRequest?.prototype ?? {}).finish = (function finish(e) {
            objDefEnum(this, 'readyState', this.readyState ??= 0);
            while (this.readyState < 3) {
                objDefEnum(this, 'readyState', ++this.readyState);
                this.dispatchEvent(new Event('readystatechange'));
            }

            this.readyState = 4;
            objDefEnum(this, 'readyState', 4);
            this.status = 500;
            objDefEnum(this, 'status', 500)
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
        globalThis.namespaces ??= {};
        globalThis.namespaces['xhr-intercede'] ||= Object(true);
    }

})();


