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
        if (this.checkInterceptor(interceptorTypes[callbackName], xhr)) {
            this.dispatchEvent(callbackName, this.applyOwnInterceptor(interceptorTypes[callbackName], data), xhr);
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
