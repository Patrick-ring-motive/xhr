
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
    function assignProto(target, src) {
        const proto = src?.prototype ?? Object(src);
        try {
            objDefProp(target, 'prototype', proto);
        } catch {
            try {
                target.prototype = proto;
            } catch { }
            if (target.prototype != proto) {
                assignAll(target.prototype, proto);
            }
        }
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
    const parser = new DOMParser();
    const textDoc = x => parser.parseFromString(x, 'text/html');
    function docText(doc) {
        try {
            return new XMLSerializer().serializeToString(doc);
        } catch (e) {
            console.warn(e, ...arguments);
            return doc?.outerHTML?.toString?.() ?? doc?.firstElementChild?.outerHTML?.toString?.() ?? String(doc);
        }
    }

    (() => {
        const $XMLHttpRequest = Symbol('XMLHttpRequest');
        const $XMLHttpResponse = Symbol('XMLHttpResponse');
        if (globalThis.XMLHttpRequest) {
            globalThis[$XMLHttpResponse] = function XMLHttpResponse(xhr) {
                const res = xhr?.response;
            }
            objDefProp(globalThis, $XMLHttpRequest, globalThis.XMLHttpRequest);
            globalThis.XMLHttpRequest = function XMLHttpRequest() {
                const $xhr = new globalThis[$XMLHttpRequest](...arguments);
                let $this;
                try {
                    if (new.target) {
                        $this = this;
                    } else {
                        $this = Object.create(null);
                    }

                    objDefProp($this, 'toString', function toString() { return $xhr.toString(...arguments); });
                    objDefProp($this, 'valueOf', function valueOf() { return $xhr; });
                    objDefProp($this, 'toLocaleString', function toLocaleString() { return $xhr.toLocaleString(...arguments); });
                    objDefProp($this, Symbol.toPrimitive, function toPrimitive() { return $xhr; });
                    objDefProp($this, Symbol.toStringTag, function toStringTag() { return $xhr.toString(...arguments); });
                    objDefProp($this, '&xhr', $xhr);

                    for (let x of ['channel',
                        'mozAnon',
                        'mozBackgroundRequest',
                        'mozSystem',
                        'readyState',
                        'response',
                        'responseType',
                        'responseURL',
                        'status',
                        'statusText',
                        'timeout',
                        'upload',
                        'withCredentials',
                        'onreadystatechange'
                    ]) {
                        Object.defineProperty($this, x, {
                            get() {
                                try {
                                    return $xhr[x];
                                } catch (e) {
                                    console.warn(e, this, ...arguments);
                                    return e;
                                }
                            },
                            set(val) {
                                try {
                                    $xhr[x] = val;
                                } catch (e) {
                                    console.warn(e, this, ...arguments);
                                    return e;
                                }
                            },
                            enumerable: true,
                            configurable: true,
                        });
                    }
                    Object.defineProperty($this, 'responseText', {
                        get() {
                            try {
                                if ($xhr.responseType == 'document') {
                                    return docText($xhr.response);
                                }
                                if (typeof $xhr.response == 'arrayBuffer') {
                                    return text($xhr.response);
                                }
                                if (typeof $xhr.response == 'json') {
                                    return JSON.stringify($xhr.response);
                                }
                                if (typeof $xhr.response == 'blob') {
                                    return $xhr.response.text();
                                }
                                return $xhr.responseText || $xhr.statusText;
                            } catch (e) {
                                console.warn(e, this, ...arguments);
                                return e.message;
                            }
                        },
                        set(val) {
                            try {
                                $xhr['responseText'] = val;
                            } catch (e) {
                                console.warn(e, this, ...arguments);
                                return e.message;
                            }
                        },
                        enumerable: true,
                        configurable: true,
                    });
                    Object.defineProperty($this, 'responseXML', {
                        get() {
                            try {
                                if ($xhr.responseType == 'document') {
                                    return $xhr.responseXML || $xhr.response || textDoc($xhr.statusText);
                                }
                                if (typeof $xhr.response == 'arrayBuffer') {
                                    return textDoc(text($xhr.response));
                                }
                                if (typeof $xhr.response == 'json') {
                                    return textDoc(JSON.stringify($xhr.response));
                                }
                                if (typeof $xhr.response == 'blob') {
                                    return async () => textDoc(await $xhr.response.text());
                                }
                                return textDoc($xhr.responseText || $xhr.statusText);
                            } catch (e) {
                                console.warn(e, this, ...arguments);
                                return textDoc(Object.getOwnPropertyNames(e).map(x => `${x}: ${e[x]}`).join('\n'));
                            }
                        },
                        set(val) {
                            try {
                                $xhr['responseText'] = val;
                            } catch (e) {
                                console.warn(e, this, ...arguments);
                                return e.message;
                            }
                        },
                        enumerable: true,
                        configurable: true,
                    });
                    objDefEnum($this, 'addEventListener', function addEventListener(...args) {
                        const type = args?.shift?.();
                        const listener = args?.shift?.();
                        return $xhr.addEventListener(type, listener.bind($this), ...args);
                    });
                    objDefEnum($this, 'abort', function abort() { return $xhr.abort(...arguments); });
                    objDefEnum($this, 'getAllResponseHeaders', function getAllResponseHeaders() { return $xhr.getAllResponseHeaders(...arguments); });
                    objDefEnum($this, 'getResponseHeader', function getResponseHeader() { return $xhr.getResponseHeader(...arguments); });
                    objDefEnum($this, 'open', function open() { return $xhr.open(...arguments); });
                    objDefEnum($this, 'overrideMimeType', function overrideMimeType() { return $xhr.overrideMimeType(...arguments); });
                    objDefEnum($this, 'send', function send() { return $xhr.send(...arguments); });
                    objDefEnum($this, 'setAttributionReporting', function setAttributionReporting() { return $xhr.setAttributionReporting(...arguments); });
                    objDefEnum($this, 'setRequestHeader', function setRequestHeader() { return $xhr.setRequestHeader(...arguments); });
                    objDefEnum($this, 'dispatchEvent', function dispatchEvent() { return $xhr.dispatchEvent(...arguments); });
                    dispatchEvent
                    for (let x of [
                        'onabort',
                        'onerror',
                        'onload',
                        'onloadend',
                        'onloadstart',
                        'onprogress',
                        'ontimeout',
                        'onerror'
                    ]) {
                        Object.defineProperty($this, x, {
                            get() {
                                try {
                                    return $xhr[x];
                                } catch (e) {
                                    console.warn(e, this, ...arguments);
                                    return e;
                                }
                            },
                            set(val) {
                                try {
                                    $this.addEventListner(x, val);
                                } catch (e) {
                                    console.warn(e, this, ...arguments);
                                    return e;
                                }
                            },
                            enumerable: true,
                            configurable: true,
                        });
                    }
                    Object.setPrototypeOf($this, globalThis[$XMLHttpRequest].prototype);
                } catch (e) {
                    console.warn(e, $this, ...arguments);
                }
                return Object.setPrototypeOf($this, $xhr);
            }
            assignProto(globalThis.XMLHttpRequest,
                globalThis[$XMLHttpRequest]);
            Object.setPrototypeOf(XMLHttpRequest, globalThis[$XMLHttpRequest]);
        }
    })();

})();

//Object.getOwnPropertyNames(e).reduce((x,y)=>(x[y]=e[y],x),{})