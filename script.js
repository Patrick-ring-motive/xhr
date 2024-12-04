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

    function stealth(shadow, original) {
        shadow = Object(shadow);
        original = Object(original);
        objDefProp(shadow, 'toString', function toString() { return original.toString(); });
        Object.setPrototypeOf(shadow, original);
        return shadow;
    }

    function intercede(root, name, fn) {
        root = Object(root);
        name = String(name);
        fn = Object(fn);
        const key = Symbol(name);
        objDefProp(root, key, root?.[name]);
        objDefEnum(root, name, fn);
        stealth(root?.[name], root?.[key]);
    }

    intercede(globalThis.XMLHttpRequest?.prototype, 'open', function open(method, url, asynch, user, password) {
        try {
            this.requestMethod = method;
            this.requestURL = url;
            this.requestAsync = asynch;
            this.requestHeaders ??= new Map();
            return this[openKey](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            this.error = e;
            return e;
        }
    });

    intercede(XMLHttpRequest.prototype, 'send', function send() {
        try {
            if (`${this.requestURL}`.includes('googlead')) {
                return console.warn(this, ...arguments);
            }
            return this[sendKey](...arguments);
        } catch (e) {
            this?.finish?.(e);
            console.warn(e, this, ...arguments);
            this.error = e;
            return e;
        }
    });



    intercede(XMLHttpRequest.prototype, 'setRequestHeader', function setRequestHeader(header, value) {
        this.requestHeaders ??= new Map();
        try {
            this['&setRequestHeader'](header, value);
            if (this.requestHeaders.get(header)) {
                this.requestHeaders.set(header, this.requestHeaders.get(header) + ', ' + value);
            } else {
                this.requestHeaders.set(header, value);
            }
        } catch (e) {
            console.warn(e, this, ...arguments);
            this.requestHeaders.set(header, e);
        }
    });
    intercede(XMLHttpRequest.prototype, 'abort', function abort() {
        try {
            return this['&abort'](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            this.error = e;
            return e;
        }
    });
    intercede(XMLHttpRequest.prototype, 'getAllResponseHeaders', function getAllResponseHeaders() {
        try {
            return this['&getAllResponseHeaders'](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            return Object.getOwnPropertyNames(e).map(x => `${x}: ${e[x]}`).join('\n');
        }
    });
    intercede(XMLHttpRequest.prototype, 'getResponseHeader', function getResponseHeader() {
        try {
            return this['&getResponseHeader'](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            return e.message;
        }
    });
    intercede(XMLHttpRequest.prototype, 'overrideMimeType', function overrideMimeType() {
        try {
            return this['&overrideMimeType'](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            return e;
        }
    });


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
