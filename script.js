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
    
    if(!globalThis?.namespaces?.['xhr-intercede']){
    const openKey = Symbol('open');
    intercede(globalThis.XMLHttpRequest?.prototype, 'open', openKey, function open(method, url, asynch, user, password) {
        try {
            objDefProp(this,'&request',{
                method : String(method || 'GET').toUpperCase(), 
                url : String(url),
                async : asynch,
                user : user,
                password : password,
                headers : new Map()
            });
            return this[openKey](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            this.error = e;
            return e;
        }
    });
    const sendKey = Symbol('send');
    intercede(XMLHttpRequest.prototype, 'send', sendKey, function send() {
        try {
            if (`${this.requestURL}`.includes('googlead')) {
                return console.warn(this, ...arguments);
            }
            if(arguments[0]){
                (this?.['&request']??{}).body = arguments[0];
            }
            return this[sendKey](...arguments);
        } catch (e) {
            this?.finish?.(e);
            console.warn(e, this, ...arguments);
            this.error = e;
            return e;
        }
    });


    const setRequestHeaderKey = Symbol('setRequestHeader');
    intercede(XMLHttpRequest.prototype, 'setRequestHeader', setRequestHeaderKey, function setRequestHeader(header, value) {
        try {
            this[setRequestHeaderKey](header, value);
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
    const abortKey = Symbol('abort');
    intercede(XMLHttpRequest.prototype, 'abort', abortKey, function abort() {
        try {
            return this[abortKey](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            this.error = e;
            return e;
        }
    });
    const getAllResponseHeadersKey = Symbol('getAllResponseHeaders');
    intercede(XMLHttpRequest.prototype, 'getAllResponseHeaders', getAllResponseHeadersKey, function getAllResponseHeaders() {
        try {
            return this[getAllResponseHeadersKey](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            return Object.getOwnPropertyNames(e).map(x => `${x}: ${e[x]}`).join('\n');
        }
    });
    const getResponseHeaderKey = Symbol('getResponseHeader');
    intercede(XMLHttpRequest.prototype, 'getResponseHeader', getResponseHeaderKey, function getResponseHeader() {
        try {
            return this[getResponseHeaderKey](...arguments);
        } catch (e) {
            console.warn(e, this, ...arguments);
            return e.message;
        }
    });
    const overrideMimeTypeKey = Symbol('overrideMimeType');
    intercede(XMLHttpRequest.prototype, 'overrideMimeType', overrideMimeTypeKey, function overrideMimeType() {
        try {
            return this[overrideMimeTypeKey](...arguments);
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
globalThis.namespaces ??= {};
globalThis.namespaces['xhr-intercede'] ||= Object(true);
}

})();
