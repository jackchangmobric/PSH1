var $ = function(parent, sel, all) {
    if (typeof(parent) === 'string') {
        var els = document.querySelectorAll(parent);
        return (sel) ? [].map.call(els, function(el) { return el; }) : els[0];
    }
    else {
        var els = parent.querySelectorAll(sel);
        return (all) ? [].map.call(els, function(el) { return el; }) : els[0];        
    }
};
var $string = function(format, options) {
    for (var key in options) {
        var regex = new RegExp("\\{\\{" + key + "\\}\\}", "g");
        format = format.replace(regex, options[key]);
    }
    return format;
};

var $activate = function(a, en) { 
    if (!en) {
        a.removeAttribute('data-active');
    }
    else if (a.className !== 'sheet') {
        a.setAttribute('data-active', true);
    }
    else {
        $('.sheet', true).forEach(function(t) {
            if (t === a) {
                t.setAttribute('data-active', true);
            }
            else {
                t.removeAttribute('data-active');
            }
        });
    }
};
var $toggle = function (a) {
    $activate(a, !a.hasAttribute('data-active'));
};

var $bind = function(a, evt, handler, bubble) {
    if (typeof evt === 'string') {
        a.addEventListener(evt, handler, bubble);
    }
    else {
        evt.forEach(function(e) {
            a.addEventListener(e, handler, bubble);
        });
    }
};

var $kv = (function() {
    return {
        set: function(k, v) { window.localStorage.setItem(k, JSON.stringify(v)); },
        get: function(k) { return JSON.parse(window.localStorage.getItem(k) || '{}'); },
        del: function(k) { window.localStorage.removeItem(k); },
        clear: function() {
            Object.keys(window.localStorage).forEach(function(k) {
                window.localStorage.removeItem(k);
            });
        }
    };
})();