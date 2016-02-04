!function(){"use strict";function e(e){if("function"==typeof e){for(var r=n,t=0,i=r.length;i>t;t++){var o=r[t];if(e(o))return o}return null}return null}function r(r,t){var i=e(function(e){return e.target===r});if(i){var o=i.listeners[t];return o||(i.listeners[t]=[],o=i.listeners[t]),o}var a={target:r,listeners:{}};a.listeners[t]=[];var u=n.push(a);return n[u-1].listeners[t]}function t(e){if(Array.isArray(e)){var r={};e.forEach(function(e){var t=e.trim().toLowerCase(),n="on"+t;Object.defineProperty(this,n,{enumerable:!0,configurable:!1,get:function(){return r[t]||null},set:function(e){var n=r[t];n&&this.removeEventListener(t,n),"function"==typeof e&&(r[t]=e,this.addEventListener(t,e))}})},this)}}var n=[];t.prototype.addEventListener=function(e,t){if("function"==typeof t){var n=r(this,e);return Array.isArray(n)&&n.push(t),!0}return!1},t.prototype.removeEventListener=function(e,t){var n=r(this,e);if(Array.isArray(n)){var i=n.indexOf(t);return i>-1?(n.splice(i,1),!0):!1}return!1},t.prototype.dispatchEvent=function(e){var t=r(this,e),n=this,i=Array.prototype.slice.call(arguments,1);Array.isArray(t)&&t.forEach(function(e){"function"==typeof e&&e.apply(n,i)})},t.prototype.removeAllListeners=function(){var r=this,t=e(function(e){return e.target===r});if(t){var i=n.indexOf(t);if(i>-1){var o=n.splice(i,1);return 1===o.length}return!1}return!1};for(var i=t.prototype,o=Object.keys(t.prototype),a=0,u=o.length;u>a;a++)Object.defineProperty(i,o[a],{enumerable:!1,configurable:!1,writable:!1});window&&(window.EventTargetExtendable=t),"function"==typeof define&&null!==define.amd&&define("EventTargetExtendable",[],function(){return t})}();
(function (global) {

    'use strict';

    function setHeaders (xhr, headers) {
        var resultHeaders = {},
            defaultHeadersKeys = Object.keys(XHR.defaults.headers),
            userHeadersKeys,
            resultHeadersKeys,
            header,
            value,
            i, l;
        for (i = 0, l = defaultHeadersKeys.length; i < l; i++) {
            header = defaultHeadersKeys[i];
            resultHeaders[header.toLowerCase()] = XHR.defaults.headers[header];
        }
        if (typeof headers === 'object') {
            userHeadersKeys = Object.keys(headers);
            for (i = 0, l = userHeadersKeys.length; i < l; i++) {
                header = userHeadersKeys[i];
                resultHeaders[header.toLowerCase()] = headers[header];
            }
        }
        resultHeadersKeys = Object.keys(resultHeaders);
        for (i = 0, l = resultHeadersKeys.length; i < l; i++) {
            header = resultHeadersKeys[i];
            value = resultHeaders[header];
            if (typeof value !== 'undefined' && value !== null) {
                xhr.setRequestHeader(header, String(value));
            }
        }
    }


    function XHR (config, promise) {
        if (!config) {
            throw new Error('Config object is required.');
        } else {
            var xhr = new XMLHttpRequest(),
                result = promise ? promise.addToQueue(xhr) : new XHR.XHRPromise(xhr),
                queryParams = '',
                async = true,
                dataForSend = null;

            // setting HTTP method
            config.method = typeof config.method === 'string' ? config.method : XHR.defaults.method;

            // applying attributes to instance of XMLHttpRequest
            if (typeof config.attributes === 'object' && config.attributes) {
                var attributes = Object.keys(config.attributes);
                attributes.forEach(function (attribute) {
                    xhr[attribute] = config.attributes[attribute];
                });
            }

            // setting query params
            if (typeof config.params === 'object' && config.params) {
                var params = [],
                    paramsKeys = Object.keys(config.params);
                paramsKeys.forEach(function (param) {
                    var value = config.params[param];
                    if (Array.isArray(value)) {
                        value.forEach(function (val) {
                            params.push(param + '=' + val);
                        });
                    } else if (typeof value === 'object' && value) {
                        params.push(param + '=' + JSON.stringify(value));
                    } else if (typeof value !== 'undefined') {
                        params.push(param + '=' + value);
                    }
                });
                if (params.length) {
                    queryParams = '?' + params.join('&');
                }
            }

            // setting async
            if (config.async !== undefined) {
                async = !!config.async;
            }

            // setting data
            if (config.data !== undefined) {
                var d = config.data;
                if (d instanceof (global.ArrayBufferView || global.ArrayBuffer) || d instanceof global.Blob ||
                    d instanceof global.Document || d instanceof global.FormData) {
                    dataForSend = d;
                } else {
                    if (typeof d === 'object' && d) {
                        dataForSend = JSON.stringify(d);
                    } else {
                        dataForSend = String(d);
                    }
                }
            }

            // adding event listeners
            xhr.addEventListener('error', function (e) {
                result.applyCallback('error', e, xhr);
            });
            xhr.addEventListener('progress', function (e) {
                result.applyCallback('progress', e, xhr);
            });
            xhr.addEventListener('loadstart', function (e) {
                result.applyCallback('loadstart', e, xhr);
            });
            xhr.addEventListener('loadend', function (e) {
                result.applyCallback('loadend', e, xhr);
            });
            xhr.addEventListener('abort', function (e) {
                result.applyCallback('abort', e, xhr);
            });
            xhr.addEventListener('load', function (e) {
                result.applyCallback('load', e, xhr);
                var response = xhr.response;
                if (xhr.responseType === '' || xhr.responseType === 'text') {
                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (e) {
                        response = xhr.responseText;
                    }
                }
                if (xhr.status >= 200 && xhr.status < 400) {
                    if (result.queue.length) {
                        var config = result.getNext();
                        if (typeof config === 'function' && !result.xhrCollection.aborted) {
                            if (result.checkInterceptor('response', xhr)) {
                                var configObject = config(response);
                                if (configObject) {
                                    XHR(configObject, result);
                                } else {
                                    result.applyCallback('success', response, xhr);
                                }
                            }
                        }
                    } else {
                        result.applyCallback('success', response, xhr);
                    }
                } else if (xhr.status >= 400 && xhr.status < 600) {
                    result.applyCallback('error', response, xhr);
                }
            }, false);

            // waits for opening
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.OPENED) {
                    xhr.onreadystatechange = null;
                    // setting default and user headers
                    setHeaders(xhr, config.headers);
                    // sending
                    setTimeout(function () {
                        if (xhr.readyState === XMLHttpRequest.OPENED || !result.xhrCollection.aborted) {
                            xhr.send(dataForSend);
                        } else {
                            result.applyCallback('abort');
                        }
                    }, 0);
                }
            };

            xhr.open(config.method, config.url + queryParams, async);

            return result.actions;
        }
    }

    Object.defineProperty(XHR, 'defaults', {
        value: {
            method: 'GET',
            headers: {},
            attributes: {
                responseType: '',
                timeout: 0
            }
        },
        configurable: false,
        writable: false
    });

    Object.defineProperty(XHR, 'interceptors', {
        value: {
            response: null,
            responseError: null
        },
        configurable: true,
        writable: true
    });

    global.XHR = XHR;

    if (typeof define === 'function' && define.amd !== null) {
        define('XHR', [], function () {
            return XHR;
        });
    }

}(window));

(function (XHR) {

    'use strict';

    var interceptorTypes = {
        success: 'response',
        error: 'responseError'
    };

    function XHRPromise (xhr) {
        var _this = this;
        this.inProgress = true;
        this.xhrCollection = new XHR.XHRCollection(this);
        this.xhrCollection.push(xhr);
        this.silent = false;
        this.interceptors = {};
        this.queue = [];
        this.callbacks = {
            error: null,
            loadstart: null,
            progress: null,
            loadend: null,
            abort: null,
            load: null,
            success: null
        };
        this.actions = {
            isInProgress: function isInProgress () {
                return _this.inProgress;
            },
            interceptors: function interceptors (data) {
                _this.interceptors = data;
                return _this.actions;
            },
            silent: function silent () {
                _this.silent = true;
                return _this.actions;
            },
            error: function error (callback) {
                _this.addEventListener('error', callback);
                return _this.actions;
            },
            loadStart: function loadStart (callback) {
                _this.addEventListener('loadstart', callback);
                return _this.actions;
            },
            progress: function progress (callback) {
                _this.addEventListener('progress', callback);
                return _this.actions;
            },
            loadEnd: function loadEnd (callback) {
                _this.addEventListener('loadend', callback);
                return _this.actions;
            },
            abort: function abort (callback) {
                _this.addEventListener('abort', callback);
                return _this.actions;
            },
            load: function load (callback) {
                _this.addEventListener('load', callback);
                return _this.actions;
            },
            success: function success (callback) {
                _this.addEventListener('success', callback);
                return _this.actions;
            },
            then: function (callback) {
                _this.queue.push(callback);
                return _this.actions;
            },
            getXHR: function getXHR () {
                return _this.xhrCollection;
            }
        };

    }

    XHRPromise.prototype = Object.create(EventTargetExtendable.prototype, {
        constructor: {
            value: XHRPromise
        }
    });

    XHRPromise.prototype.applyCallback = function applyCallback (callbackName, data, xhr) {
        var callback = this.callbacks[callbackName];
        if (this.checkInterceptor(interceptorTypes[callbackName], xhr)) {
            if (typeof callback === 'function') {
                this.dispatchEvent(callbackName, this.applyOwnInterceptor(interceptorTypes[callbackName], data), xhr);
            }
            if (callbackName === 'success' || callbackName === 'error' || callbackName === 'abort') {
                this.inProgress = false;
                this.removeAllListeners();
            }
        }
    };

    XHRPromise.prototype.checkInterceptor = function checkInterceptor (interceptorName, xhr) {
        if (interceptorName && typeof XHR.interceptors[interceptorName] === 'function') {
            return XHR.interceptors[interceptorName](xhr) || this.silent;
        }
        return true;
    };

    XHRPromise.prototype.applyOwnInterceptor = function applyOwnInterceptor (interceptorName, data) {
        var interceptor = this.interceptors[interceptorName];
        if (typeof interceptor === 'function') {
            return interceptor(data);
        } else {
            return data;
        }
    };

    XHRPromise.prototype.getNext = function getNext () {
        return this.queue.shift();
    };

    XHRPromise.prototype.addToQueue = function addToQueue (xhr) {
        this.xhrCollection.push(xhr);
        return this;
    };

    XHR.XHRPromise = XHRPromise;

}(window.XHR));

(function (XHR) {

    'use strict';

    function XHRCollection (result) {
        Array.call(this);
        this.result = result;
        this.aborted = false;
    }

    XHRCollection.prototype = Object.create(Array.prototype, {
        constructor: {
            value: XHRCollection
        },
        abort: {
            value: function abort () {
                this.forEach(function (xhr) {
                    if (xhr instanceof XMLHttpRequest) {
                        xhr.abort();
                    } else {
                        clearTimeout(xhr);
                        this.result.applyCallback('abort');
                    }
                }, this);
                this.aborted = true;
            }
        }
    });

    XHR.XHRCollection = XHRCollection;

}(XHR));




