/**
 * Immediately Invoked Function Expression that sets up global helpers and intercepts XMLHttpRequests.
 */
(() => {
    /**
     * Safely invokes a function if it exists, returning undefined on ReferenceError.
     * @function
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

    // Bind the global object to multiple references in the environment.
    for (let x of ['globalThis', 'self', 'global']) {
        globalObject[x] = globalObject;
    }

    /**
     * Expose the q function on self.
     * @type {Function}
     */
    self.q = q;

    /**
     * Creates a new instance from the first argument (constructor) in args, with subsequent args as constructor parameters.
     * @function
     * @param {...*} args - The first element should be a constructor. The rest are passed as arguments to it.
     * @returns {*} A new instance or undefined if no valid constructor is provided.
     */
    self.newQ = (...args) => {
        const fn = args?.shift?.();
        return fn && new fn(...args);
    };

    /**
     * Defines a property on an object with the specified descriptors.
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @param {boolean} enm - Whether the property is enumerable.
     * @param {boolean} mut - Whether the property is writable/configurable.
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
     * Defines a non-enumerable, non-configurable property on an object (frozen).
     * @function
     * @param {Object} obj - Target object.
     * @param {string} prop - Property name.
     * @param {*} def - Property value.
     * @returns {Object} The modified object.
     */
    globalThis.objFrzProp = (obj, prop, def) => objDoProp(obj, prop, def, false, false);

    /**
     * Defines an enumerable, non-configurable property on an object (frozen).
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
     * Retrieves the names of all own properties on an object.
     * @function
     * @param {Object} x - The target object.
     * @returns {string[]} The names of the object's own properties.
     */
    globalThis.objectNames = (x) => Object.getOwnPropertyNames(x);

    /**
     * Retrieves the symbols of all own properties on an object.
     * @function
     * @param {...Object} arguments - Objects for which to get the property symbols.
     * @returns {Symbol[]} The symbols of the object's own properties.
     */
    globalThis.objectSymbols = function() {
      return Object.getOwnPropertySymbols(...arguments);
    };

    /**
     * Defines multiple non-enumerable, configurable properties on an object.
     * @function
     * @param {Object} obj - Target object.
     * @param {Object} [props={}] - An object whose keys are property names and values are the properties to set.
     * @returns {Object} The modified object.
     */
    globalThis.objDefProps = function objDefProps(obj, props = {}) {
      for (let prop in props) {
        objDefProp(obj, prop, props[prop]);
      }
      return obj;
    };

    /**
     * Retrieves the prototype of an object.
     * @function
     * @param {...Object} arguments - Objects from which to get the prototype.
     * @returns {Object} The prototype of the object.
     */
    globalThis.objGetProto = function() {
      return Object.getPrototypeOf(...arguments);
    };

    /**
     * Sets the prototype of an object.
     * @function
     * @param {...Object} arguments - The target object and the new prototype.
     * @returns {Object} The target object with the updated prototype.
     */
    globalThis.objSetProto = function() {
      return Object.setPrototypeOf(...arguments);
    };

    /**
     * Assigns the prototype of src to target. If direct assignment fails, tries assigning properties individually.
     * @function
     * @param {Object} target - The object whose prototype will be set.
     * @param {Object|Function} src - The source whose prototype will be used.
     */
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

    /**
     * An XMLSerializer instance created via newQ.
     * @type {XMLSerializer}
     */
    const serializer = newQ(globalThis.XMLSerializer);

    /**
     * Serializes an XML Node to a string using the global serializer.
     * @function
     * @param {Node} node - The XML Node to serialize.
     * @returns {string} The serialized XML string.
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
     * @param {string} s - The string to encode.
     * @returns {Uint8Array} The UTF-8 encoded data.
     */
    const encode = s => encoder?.encode?.(s) ?? bytes([...s].map(x => x.charCodeAt()));

    /**
     * Encodes a string and returns the raw ArrayBuffer of the UTF-8 encoded data.
     * @function
     * @param {string} s - The string to encode.
     * @returns {ArrayBuffer} The encoded string as an ArrayBuffer.
     */
    const buffer = s => encode(s).buffer;

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
     * Attempts to decode data into text via UTF-8. Falls back to fromCharCode on error.
     * @function
     * @param {Uint8Array|ArrayBuffer} byte - The data to decode.
     * @returns {string} The decoded string (best effort).
     */
    const zdecode = byte => {
        try {
            return decoder.decode(byte);
        } catch {
            try {
                return String.fromCharCode(...byte);
            } catch {
                return String(bytes);
            }
        }
    };

    /**
     * Converts an ArrayBuffer to a string by decoding it as UTF-8.
     * @function
     * @param {ArrayBuffer} buff - The buffer to decode.
     * @returns {string} The decoded string.
     */
    const text = buff => decode(bytes(buff));

    /**
     * A DOMParser used for converting text into HTML documents.
     * @type {DOMParser}
     */
    const parser = new DOMParser();

    /**
     * Parses a string as HTML and returns the resulting Document.
     * @function
     * @param {string} x - The string to parse as HTML.
     * @returns {Document} The parsed HTML document.
     */
    const textDoc = x => parser.parseFromString(x, 'text/html');

    /**
     * Attempts to serialize a Document or Element to a string. Falls back to outerHTML or string representation on error.
     * @function
     * @param {Document|Element} doc - The DOM node to serialize.
     * @returns {string} The serialized string representation.
     */
    function docText(doc) {
        try {
            return new XMLSerializer().serializeToString(doc);
        } catch (e) {
            console.warn(e, ...arguments);
            return doc?.outerHTML?.toString?.() 
                ?? doc?.firstElementChild?.outerHTML?.toString?.() 
                ?? String(doc);
        }
    }

    /**
     * Intercepts global XMLHttpRequest and replaces it with a custom wrapper for advanced handling.
     */
    (() => {
        /**
         * A symbol for storing the native XMLHttpRequest constructor.
         * @constant
         * @type {Symbol}
         */
        const $XMLHttpRequest = Symbol('XMLHttpRequest');

        /**
         * A symbol for storing the response wrapper constructor.
         * @constant
         * @type {Symbol}
         */
        const $XMLHttpResponse = Symbol('XMLHttpResponse');

        if (globalThis.XMLHttpRequest) {
            /**
             * A placeholder function for constructing an XMLHttpResponse wrapper if needed.
             * @constructor
             * @param {XMLHttpRequest} xhr - The underlying XHR to wrap.
             */
            globalThis[$XMLHttpResponse] = function XMLHttpResponse(xhr) {
                const res = xhr?.response;
            }

            ///////
            /**
             * Creates a "stream-like" object that accumulates chunks as text, enabling chainable string usage.
             * @function
             * @param {ReadableStream|Promise<ReadableStream>} stream - A readable stream or a promise that resolves to one.
             * @returns {Promise<string>} A promise that resolves to the combined text, with string-like properties.
             */
            const streang = function streang(stream) {
                const $txt = [];
                let $this = (async () => {
                    if(stream instanceof Promise){
                        stream = await stream;
                    }
                    for await (const chunk of stream) {
                        try{
                            $txt.push(zdecode(chunk));
                        }catch(e){
                            console.warn(e,chunk,stream);
                            $txt.push(` ${e.message} `);
                        }
                    }
                    const done = new String($txt.join(''));
                    objDefProp(done,'done',true);
                    return done;
                })();

                objDefProp($this, 'toString', function toString() { return $txt.join(''); });
                objDefProp($this, 'valueOf', function valueOf() { return $txt.join(''); });
                objDefProp($this, 'toLocaleString', function toLocaleString() { return $txt.join(''); });
                objDefProp($this, Symbol.toPrimitive, function toPrimitive() { return $txt.join(''); });
                objDefProp($this, Symbol.toStringTag, function toStringTag() { return $txt.join(''); });

                Object.defineProperty($this, 'length', {
                    get() {
                        return $txt.join('').length;
                    },
                    set(val) {},
                    enumerable: true,
                    configurable: true,
                });

                /**
                 * Internal helper to assign string-like functionality to the target based on the source prototype.
                 * @function
                 * @param {Object} target - The target object to modify.
                 * @param {Object} src - The source whose methods/properties are being adopted.
                 * @returns {Object} The augmented target object.
                 */
                function _streang(target, src) {
                  let excepts = ["prototype", "constructor", "__proto__"];
                  let enums = [];
                  let source = src;
                  while (source) {
                    for (let key in source) {
                      try {
                        if (excepts.includes(key) || enums.includes(key)) {
                          continue;
                        }
                        (() => {
                          const $source = source;
                          if (typeof $source[key] == 'function') {
                            objDefEnum(target, key, function() {
                              try {
                                return $txt.join('')[key](...arguments);
                              } catch (e) {
                                console.warn(e, this, ...arguments);
                              }
                            });
                          } else {
                            Object.defineProperty(target, key, {
                              get() {
                                try {
                                  return $txt.join('')[key];
                                } catch (e) {
                                  console.warn(e, this, ...arguments);
                                }
                              },
                              set(value) {
                                try {
                                  $source[key] = value;
                                } catch (e) {
                                  console.warn(e, this, ...arguments);
                                }
                              },
                              enumerable: true,
                              configurable: true,
                            });
                          }
                        })();
                        enums.push(key);
                      } catch (e) {
                        continue;
                      }
                    }
                    let props = [];
                    for (let key of objectNames(source)) {
                      try {
                        if (enums.includes(key) || excepts.includes(key) || props.includes(key)) {
                          continue;
                        }
                        (() => {
                          const $source = source;
                          if (typeof $source[key] == 'function') {
                            objDefProp(target, key, function() {
                              try {
                                return $txt.join('')[key](...arguments);
                              } catch (e) {
                                console.warn(e, this, ...arguments);
                              }
                            });
                          } else {
                            Object.defineProperty(target, key, {
                              get() {
                                try {
                                  return $txt.join('')[key];
                                } catch (e) {
                                  console.warn(e, this, ...arguments);
                                }
                              },
                              set(value) {
                                try {
                                  $source[key] = value;
                                } catch (e) {
                                  console.warn(e, this, ...arguments);
                                }
                              },
                              enumerable: false,
                              configurable: true,
                            });
                          }
                        })();
                      } catch {
                        continue;
                      }
                      props.push(key);
                    }
                    for (let key of objectSymbols(source)) {
                      try {
                        if (enums.includes(key) || excepts.includes(key) || props.includes(key)) {
                          continue;
                        }
                        (() => {
                          const $source = source;
                          if (typeof $source[key] == 'function') {
                            objDefProp(target, key, function() {
                              try {
                                return $txt.join('')[key](...arguments);
                              } catch (e) {
                                console.warn(e, this, ...arguments);
                              }
                            });
                          } else {
                            Object.defineProperty(target, key, {
                              get() {
                                try {
                                  return $txt.join('')[key];
                                } catch (e) {
                                  console.warn(e, this, ...arguments);
                                }
                              },
                              set(value) {
                                try {
                                  $source[key] = value;
                                } catch (e) {
                                  console.warn(e, this, ...arguments);
                                }
                              },
                              enumerable: false,
                              configurable: true,
                            });
                          }
                        })();
                      } catch {
                        continue;
                      }
                      props.push(key);
                    }
                    source = objGetProto(source);
                  }
                  return target;
                }

                return _streang($this,String.prototype);
            }
            //////

            /**
             * Stores the native XMLHttpRequest constructor on a Symbol, then wraps XMLHttpRequest with custom behavior.
             */
            objDefProp(globalThis, $XMLHttpRequest, globalThis.XMLHttpRequest);

            /**
             * A custom constructor function for XMLHttpRequest that delegates to the real constructor but adds intercepts.
             * @constructor
             */
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

                    for (let x of [
                        'channel',
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
                                    return streang($xhr.response.stream());
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
                                    return textDoc(streang($xhr.response.stream()));
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

                    //dispatchEvent

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
                                    $this.addEventListener(x, val);
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

            // Reassigning the prototypes properly so the custom constructor behaves correctly.
            assignProto(globalThis.XMLHttpRequest, globalThis[$XMLHttpRequest]);
            Object.setPrototypeOf(XMLHttpRequest, globalThis[$XMLHttpRequest]);
        }
    })();

})();

//Object.getOwnPropertyNames(e).reduce((x,y)=>(x[y]=e[y],x),{})


async function mutFetch(){
  const res = await fetch(...argumevts);
  Object.defineProperty(res, 'headers', { value: new Headers(res.headers) });
  return new Response(res.body, res);
}