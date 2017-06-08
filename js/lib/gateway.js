var $gateway = (function() {
    var types = ['light_wrgb', 'lighting', 'ac_switch'];
    var devices = {};
    var filter = null;
    var updating = [];
    var watchers = {};
    var updated = [];
    var wid = new Date().getTime();

    var fullUri = function(config, method) {
        var srv = JSON.parse(config).gateway || '10.10.1.1:8080';
        var url = '/' + method;
        url = 'http://' + srv + url;
        return url;
    };

    var refresh = function(devList) {
        var df = [].reduce.call(Object.keys(devices), function(dfo, t) {
            var l = devices[t];
            var lf = [].reduce.call(Object.keys(l), function(p, m) {
                var d = l[m];
                if ((!filter) || (filter(t, m, d))) {
                    p[m] = d;
                }
                return p;
            }, {});
            dfo[t] = lf;
            return dfo;
        }, {});

        Object.keys(watchers).forEach(function(wid) {
            var a = watchers[wid];
            var t = a[0];
            var cb = a[1];
            if (t) {
                cb(t, df[t] || {});
            }
            else {
                [].forEach.call(Object.keys(df), function(t) {
                    cb(t, df[t] || {});
                });
            }
        });

        setTimeout(function() {
            updated.map(function(cb) { return cb; }).forEach(function(cb, idx) { 
                try { cb(devices); } 
                catch (exp) { console.info(exp); }
            }); 
        }, 0);
    };

    var waiting = false;
    var timer = setInterval(function() {  
        var config = $db.getItem('user');
        if (!config) { return; }
        if (waiting) { return; }

        var o = {};
        Promise.all(types.map(function(type) {
            var url = fullUri(config, type + '.get_dev_list');
            return $api.get(url)
                .then(function(r) {
                    if (!r.objects) {
                        return;
                    }

                    r.objects.forEach(function(dev) {
                        if (!dev) { return; }

                        var l = (o[type]) || (o[type] = {});
                        var a = attributes[dev.mac];
                        (a) && ([].forEach.call(Object.keys(a), function(k) {
                            dev[k] = a[k];
                        }));
                        dev.type = type;
                        l[dev.mac] = dev;
                    });
                })
                .catch(function(e) {
                    console.error(e);
                    return Promise.resolve();
                });
        }))
        .then(function() { updating.forEach(function(cb) { cb(); }); })
        .then(function() { devices = o; })
        .then(refresh)
        .then(function() { waiting = false; });
        waiting = true;
    }, 1000);

    $app.onPageInitOrBeforeAnimation('*', function() {
        watchers = [].reduce.call(Object.keys(watchers), function(p, wid) {
            var w = watchers[wid];
            if (w[2]) { p[wid] = w; }
            return p;
        }, {});
    });

    var attributes = JSON.parse($db.getItem('device-attributes') || '{}');
    var states = JSON.parse($db.getItem('device-states') || '{}');
    return {
        send: function(method, options) {
            var config = $db.getItem('user');
            if (!config) { return Promise.resolve(true); }

            var url = fullUri(config, method);
            if (options) {
                url += '?' + [].map.call(Object.keys(options), function(k) {
                    return k + '=' + options[k];
                }).join('&')
            }
            return $api.get(url)
                .then(function(r) {
                    return (r.success) ? Promise.resolve(true) : Promise.resolve(false);
                })
                .catch(function(e) {
                    console.error(e);
                    return Promise.resolve(false);
                });
        },
        set: function(key, value, list) {
            list.forEach(function(mac) {
                var kv = (attributes[mac]) || (attributes[mac] = {});
                kv[key] = value;
            });
            $db.setItem('device-attributes', JSON.stringify(attributes));
        },
        count: function(filter) {
            var count = 0;
            Object.keys(devices).forEach(function(type) {
                var list = devices[type];
                Object.keys(list).forEach(function(mac) {
                    if (!filter || filter(type, mac, list[mac])) {
                        count += 1;
                    }
                });
            });
            return count;
        },
        each: function(filter, cb) {
            Object.keys(devices).forEach(function(type) {
                var list = devices[type];
                Object.keys(list).forEach(function(mac) {
                    if (!filter || filter(type, mac, list[mac])) {
                        cb(type, mac, list[mac]);
                    }
                });
            });
        },
        saveState: function(namespace, name) {
            var s = {};
            Object.keys(devices).forEach(function(type) {
                var list = devices[type];
                Object.keys(list).forEach(function(mac) {
                    if (!filter || filter(type, mac, list[mac])) {
                        s[mac] = list[mac];
                    }
                });
            });

            if (Object.keys(s) === 0) {
                return;
            }

            var l = (states[namespace]) || (states[namespace] = {});
            l[name] = s;
            $db.setItem('device-states', JSON.stringify(states));
        },
        savedStates: function(namespace) {
            var l = states[namespace];
            if (!l) {
                return [];
            }
            return [].map.call(Object.keys(l), function(v) { return v; });
        },
        getState: function(namespace, name) {
            var l = states[namespace];
            if (!l) {
                return null;
            }
            return l[name];
        },
        filter: function(cb) {
            filter = cb;
            refresh();
        },
        updating: function(cb, add) {
            if (add || add === undefined) { updating.push(cb); }
            else { var idx = updating.indexOf(cb); (idx !== -1) && (updating.splice(idx, 1)); }
        },
        updated: function(cb, add) {
            if (add || add === undefined) { updated.push(cb); }
            else { var idx = updated.indexOf(cb); (idx !== -1) && (updated.splice(idx, 1)); }
        },
        watch: function(type, cb, persistent) {
            var id = wid++;
            watchers[id] = [type, cb, persistent];
            return id;
        },
        unwatch: function(id) {
            delete watchers[id];
        }
    };
})();
