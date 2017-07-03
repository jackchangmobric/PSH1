var $log = function(msg) {
    console.log(msg);
//    $('#page-title').innerHTML = msg;
};

var $app = new Framework7({
    init: false
});

var $$ = Dom7;
var $mainView = $app.addView('.view-main', {
});

$app.onPageChange = function(page, cb) {
    $app.onPageInit(page, cb);
};

$app.onPageChange('*', function(e) {
    $app.onload = function(cb) {
        setTimeout(function() { cb(e); }, 0);
    };
    $(e.container, 'script', true).forEach(function(scr) {
        var type = scr.type || 'text/javascript';
        if (type.toLowerCase() !== 'text/javascript') {
            return;
        }
        eval(scr.innerText);
    });
});

$app.touchstart = (function() {
    var cb = [];
    document.addEventListener('touchstart', function(e) {
        cb.forEach(function(fn) { fn(e); });
    });
    $app.onPageChange('*', function() {
        cb = [];
    });
    return function(fn) { cb.push(fn) };
})();
$app.touchend = (function() {
    var cb = [];
    document.addEventListener('touchend', function(e) {
        cb.forEach(function(fn) { fn(e); });
    });
    $app.onPageChange('*', function() {
        cb = [];
    });
    return function(fn) { cb.push(fn) };
})();
$app.touchmove = (function() {
    var cb = [];
    document.addEventListener('touchmove', function(e) {
        cb.forEach(function(fn) { fn(e); });
    });
    $app.onPageChange('*', function() {
        cb = [];
    });
    return function(fn) { cb.push(fn) };
})();

var $db = (function() {
    var db = window.localStorage;
    var parse = function(s) {
        if (!s) { return {}; }
        try { return JSON.parse(s); }
        catch (e) { console.log(e); return {}; }
    };

    var dbs = [];

    var table = (function() {
        function cl(n, vals) {
            [].forEach.call(Object.keys(vals), function(k) {
                this[k] = vals[k];
            }, this);
            Object.defineProperty(this, '$name', { value: n });
        };
        cl.prototype = {
            $copy: function(o) {
                [].forEach.call(Object.keys(o), function(k) {
                    this[k] = o[k];
                }, this);
                return this;
            },
            $update: function(cb) {
                cb(this);
                return this;
            },
            $save: function() {
                var self = this;
                var o = [].reduce.call(Object.keys(this), function(o, k) {
                    (k[0] !== '$') && (o[k] = self[k]);
                    return o;
                }, {});
                db.setItem(this.$name, JSON.stringify(o));
                return this;
            }
        };
        return cl;
    })();
    var mk = function(name) {
        dbs.push(name);
        return new table(name, parse(db.getItem(name)));
    };

    return {
        user: mk('user-info'),
        rooms: mk('room-list'),
        deviceAttributes: mk('device-attributes'),
        savedStates: mk('device-saved-states'),
        reset: function() {
            dbs.forEach(function(name) {
                db.removeItem(name);
            });
        }
    };
})();
