var $log = function(msg) {
   $('#log-item').innerHTML = msg;
};

var $app = new Framework7({
    init: false
});

var $$ = Dom7;
var $mainView = $app.addView('.view-main', {
});

$app.onPageInit('*', function() {
    $app.closeModal();
});
$app.onPageBeforeAnimation('*', function(e) {
    $app.closeModal();
});

$app.onPageChange = function(page, cb) {
    $app.onPageInit(page, cb);
};

var $page = null;
$app.onPageChange('*', function(e) {
    if ($page) {
        $page.onunload(false);
    }

    $page = {
        onload: function(cb, d) {
            setTimeout(function() { cb(e); }, d || 0);
        },
        onunload: (function() {
            var evt = e;
            var functions = [];
            return function(cb) {
                if (cb === false) {
                    functions.forEach(function(cb) {
                        try { cb(evt); }
                        catch (e) { console.info(e); }
                    });
                }
                else {
                    functions.push(cb);
                }
            };
        })()
    };

    // console.info('change to ' + e.name);
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
$app.addStartupItem = function(key, options, oneShot) {
    $db.pendingItems.$update(function(tbl) {
        tbl[Date.now()] = {
            key: key,
            options: options,
            oneShot: oneShot
        };
    }).$save(true);
};
$app.startup = function() {
    return Promise.all(Object.keys($db.pendingItems).map(function(id) {
        var item = $db.pendingItems[id];
        var key = item.key;
        var func = $startupItem[key];
        if (!func) {
            return Promise.resolve();
        }

        return func(item.options).then(function() {
            if (item.oneShot) {
                $db.pendingItems.$update(function(tbl) {
                    delete tbl[id];
                }).$save(true);
            }
        }).catch(function(e) {
            console.info(e);
            return Promise.resolve();
        });
    })).then(function() {
        $mainView.router.loadPage('pages/room-list.html');        
    });
};

var $db = (function() {
    var db = window.localStorage;
    var parse = function(s) {
        if (!s) { return {}; }
        try { return JSON.parse(s); }
        catch (e) { console.log(e); return {}; }
    };

    var table = (function() {
        function cl(n, vals) {
            [].forEach.call(Object.keys(vals), function(k) {
                if (k !== '_') { this[k] = vals[k]; }
            }, this);
            if (vals._) {
                Object.defineProperty(this, '_', { value: vals._, configurable: true });
            }
            else {
                Object.defineProperty(this, '_', { value: 0, configurable: true });                
            }
            Object.defineProperty(this, '$name', { value: n });
        };
        cl.prototype = {
            $copy: function(o) {
                [].forEach.call(Object.keys(o), function(k) {
                    this[k] = o[k];
                }, this);
                return this;
            },
            $replace: function(o) {
                [].forEach.call(Object.keys(this), function(k) {
                    delete this[k];
                });
                return this.$copy(o);
            },
            $update: function(key, cb) {
                if (!cb) { cb = key; key = null; }
                cb((key) ? this[key] : this);
                return this;
            },
            $save: function(local) {
                console.info('save ' + this.$name + ' ' + local);
                delete this._;
                Object.defineProperty(this, '_', { value: Date.now(), configurable: true });                
                var self = this;
                var o = [].reduce.call(Object.keys(this), function(o, k) {
                    (k[0] !== '$') && (o[k] = self[k]);
                    return o;
                }, {_:this._});
                db.setItem(this.$name, JSON.stringify(o));

                var self = this;
                if (!local) {
                    return $cloud.push({
                        email:$db.user.email,
                        password:$db.user.password,
                        table:this.$name}, 
                    o).then(function() {
                        return self;
                    });
                }
                return Promise.resolve(self);
            }
        };
        return cl;
    })();

    var mk = function(inst, name) {
        inst[name] = new table(name, parse(db.getItem(name)));
    };

    var inst = {
        sync: function() {
            return new Promise(function(ok, ng) {
                setTimeout(function() {
                    $cloud.pull({email:$db.user.email,password:$db.user.password})
                        .then(function(r) {
                            if (r.status !== 200) { return Promise.reject(r); }
                            return r.data;
                        })
                        .then(function(objects) {
                            console.info(objects);
                            return Promise.all(Object.keys($db).map(function(key) {
                                var r = objects[key];
                                if (!r) { return Promise.resolve(); }

                                var l = $db[key];
                                var tl = l._ * 1;
                                var tr = r._ * 1;
                                if (tr === tl) { return Promise.resolve(); }

                                console.info(tl + ',' + tr+',' + ((tr > tl) ? 'replace' : 'update'));
                                if (tr > tl) { return l.$replace(r).$save(true); }
                                else { return l.$save(); }
                            }));
                        })
                        .then(ok).catch(ng);
                }, 0);
            });
        },
        reset: function() {
            Object.keys(db)
                .filter(function(n) { return n[0] !== '@'; })
                .forEach(function(n) {
                    db.removeItem(n);
                });
            return Promise.resolve();
        }
    };
    mk(inst, 'user');
    mk(inst, 'rooms');
    mk(inst, 'gateways');
    mk(inst, 'devices');
    mk(inst, 'modes');
    mk(inst, 'pendingItems');

    return inst;
})();


