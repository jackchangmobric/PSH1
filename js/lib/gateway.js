var $gateway = (function(fake) {
    var types = ['light_wrgb', 'lighting', 'ac_switch'];
    var devices = {};
    var filter = null;
    var updating = [];
    var watchers = {};
    var updated = [];
    var wid = new Date().getTime();

    var fullUri = function(config, method) {
        var srv = config.gateway || '10.10.1.1:8080';
        var url = '/' + method;
        url = 'http://' + srv + url;
        return url;
    };

    var refresh = function() {
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
        var config = $db.user;
        if (!config) { return; }
        if (waiting) { return; }

        var o = {};
        Promise.all(types.map(function(type) {
            var url = fullUri(config, type + '.get_dev_list');
            var update = function(r) {
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
            };

            if (fake && fake[type]) {
                update(fake[type]);
                return Promise.resolve();
            }

            return $http.get(url)
                .then(update)
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

    $app.onPageChange('*', function() {
        watchers = [].reduce.call(Object.keys(watchers), function(p, wid) {
            var w = watchers[wid];
            if (w[2]) { p[wid] = w; }
            return p;
        }, {});
    });

    var attributes = $db.deviceAttributes;
    var savedStates = $db.savedStates;
    return {
        send: function(method, options) {
            var config = $db.user;
            if (!config) { return Promise.resolve(true); }

            var url = fullUri(config, method);
            if (options) {
                url += '?' + [].map.call(Object.keys(options), function(k) {
                    return k + '=' + options[k];
                }).join('&')
            }
            console.info(url);

            if (fake) {
                var type = method.split('.')[0];
                var mac = options.mac;
                var list = (fake[type]) ? (fake[type].objects) : null;
                if (list && mac) {
                    return new Promise(function(ok) {
                        setTimeout(function() {
                            list.forEach(function(dev) {
                                if (!dev) { return; }
                                if (dev.mac !== mac) { return; }
                                [].forEach.call(Object.keys(options), function(k) {
                                    if (k === 'mac') { return; }
                                    dev[k] = options[k];
                                });
                            });
                            ok(true);
                        }, 300);
                    });
                }
                return Promise.resolve();
            }


            return $http.get(url)
                .then(function(r) {
                    return (r.success) ? Promise.resolve(true) : Promise.resolve(false);
                })
                .catch(function(e) {
                    console.error(e);
                    return Promise.resolve(false);
                });
        },
        get: function(type, filter) {
            if (!type) {
                return Object.keys(devices).reduce(function(a, t) {
                    var list = devices[t];
                    return a.concat(Object.keys(list).map(function(mac) { 
                        return list[mac]; 
                    }));
                }, []);
            }
            
            if (typeof(type) === 'function') {
                var filtered = [];
                Object.keys(devices).forEach(function(t) {
                    var list = devices[t];
                    Object.keys(list).forEach(function(mac) {
                        var dev = list[mac];
                        if (type(type, mac, dev)) {
                            filtered.push(dev);
                        }
                    });
                });
                return filtered;
            }

            var list = devices[type];
            if (!list) { return null; }

            if (!filter) { return Object.keys(list).map(function(mac) { return list[mac]; }); }
            if (typeof(filter) === 'string') { return list[filter]; }
            return list.filter(filter);
        },
        count: function(filter) {
            return $gateway.get(filter).length;
        },
        each: function(filter, cb) {
            $gateway.get(filter).forEach(function(dev) {
                cb(dev.type, dev.mac, dev);
            });
        },
        attr: function(key, value, list, clearOther) {
            if (clearOther) {
                [].forEach.call(Object.keys(attributes), function(mac) {
                    var kv = attributes[mac];
                    if (kv[key] === value) {
                        delete kv[key];
                    }
                });
            }
            list.forEach(function(mac) {
                var kv = (attributes[mac]) || (attributes[mac] = {});
                kv[key] = value;
            });
            attributes.$save();
            refresh();
        },

        saveState: function(namespace, name, description) {
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
            l[name] = {
                description: description,
                states: s
            };
            savedStates.$save();
        },
        deleteState: function(namespace, name) {
            var l = (states[namespace]) || (states[namespace] = {});
            delete l[name];
            savedStates.$save();
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
            if (typeof(type) === 'string') {
                watchers[id] = [type, cb, persistent];
            }
            else {                
                watchers[id] = [null, type, cb];
            }
            return id;
        },
        unwatch: function(id) {
            delete watchers[id];
        }
    };
})
// ();
({
    ac_switch: {
        "success": "true",
        "objects": [
            { "dev": "1812", "mac": "7a624e1608001812", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "0", "": null },
            { "dev": "1813", "mac": "7a624e1608001813", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "0", "": null },
            { "dev": "1814", "mac": "7a624e1608001814", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "1", "": null },
            { "dev": "1815", "mac": "7a624e1608001815", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "1", "": null },
            { "dev": "1816", "mac": "7a624e1608001816", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "1", "": null },
            { "dev": "1817", "mac": "7a624e1608001817", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "1", "": null },
            { "dev": "1833", "mac": "7a624e1608001833", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "enable": "0", "": null },
            null
        ]
    },
    light_wrgb: {
        "success": "true",
        "objects": [
            { "dev": "1612", "mac": "7a624e1608001612", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "12", "levelR": "0", "levelG": "100", "levelB": "0", "": null },
            { "dev": "1613", "mac": "7a624e1608001613", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "100", "levelR": "100", "levelG": "0", "levelB": "0", "": null },
            { "dev": "1617", "mac": "7a624e1608001617", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "80", "levelR": "0", "levelG": "0", "levelB": "100", "": null },
            { "dev": "2612", "mac": "7a624e1608002612", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "12", "levelR": "0", "levelG": "100", "levelB": "0", "": null },
            { "dev": "2613", "mac": "7a624e1608002613", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "100", "levelR": "100", "levelG": "0", "levelB": "0", "": null },
            { "dev": "2617", "mac": "7a624e1608002617", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "80", "levelR": "0", "levelG": "0", "levelB": "100", "": null },
            { "dev": "3612", "mac": "7a624e1608003612", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "12", "levelR": "0", "levelG": "100", "levelB": "0", "": null },
            { "dev": "3613", "mac": "7a624e1608003613", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "100", "levelR": "100", "levelG": "0", "levelB": "0", "": null },
            { "dev": "3617", "mac": "7a624e1608003617", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "80", "levelR": "0", "levelG": "0", "levelB": "100", "": null },
            { "dev": "4612", "mac": "7a624e1608004612", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "12", "levelR": "0", "levelG": "100", "levelB": "0", "": null },
            { "dev": "4613", "mac": "7a624e1608004613", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "100", "levelR": "100", "levelG": "0", "levelB": "0", "": null },
            { "dev": "4617", "mac": "7a624e1608004617", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "levelW": "80", "levelR": "0", "levelG": "0", "levelB": "100", "": null },
            null
        ]
    },
    lighting: {
        "success": "true",
        "objects": [
            { "dev": "6613", "mac": "7a624e1608006613", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "level": "100", "": null },
            { "dev": "6617", "mac": "7a624e1608006617", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "level": "80", "": null },
            { "dev": "6612", "mac": "7a624e1608006612", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "level": "12", "": null },
            { "dev": "6613", "mac": "7a624e1608006613", "pan": "c000", "lt": "2016-10-28-10-58-58", "rr": "255", "rt": "255", "visibility": "1", "rtc": "2016-10-28-10-58-58", "level": "100", "": null },
        null]
    }
});
