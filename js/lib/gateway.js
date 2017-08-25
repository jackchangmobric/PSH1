var $gateway = (function(fake) {
    var types = ['light_wrgb', 'ac_switch', 'light_wy'];

    var filter = null;
    var updating = [];
    var watchers = {};
    var updated = [];
    var wid = Date.now();

    var refresh = function() {
        var df = Object.keys(deviceStatus).reduce(function(p, mac) {
            var dev = deviceStatus[mac];
            if ((!filter) || filter(dev.type, dev.mac, dev)) {
                ((p[dev.type]) || (p[dev.type] = {}))[dev.mac] = dev;
            }
            return p;
        }, {});

        Object.keys(watchers).forEach(function(_wid) {
            var a = watchers[_wid];
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
                try { cb(df); } 
                catch (exp) { console.info(exp); }
            }); 
        }, 0);
    };

    $app.onPageChange('*', function() {
        watchers = [].reduce.call(Object.keys(watchers), function(p, _wid) {
            var w = watchers[_wid];
            if (w[2]) { p[_wid] = w; } // persistence
            return p;
        }, {});
    });

    var gatewayStatus = (function() {
        var r = {};
        setInterval(function() {
            var list = Object.keys($db.gateways);
            if (list.length === 0) { return; }

            list.forEach(function(mac) {
                if (r[mac] !== undefined) { return; }
                r[mac] = { status: 0, inf: null, ips: [] };
            });
            Object.keys(r).forEach(function(mac) {
                if (list.indexOf(mac) === -1) { delete r[mac]; }
            });
        }, 1000);
        return r;
    })();

    var deviceStatus = (function() {
        var r = {};
        var protocols = [
            (function() {
                var cl = function() {};
                cl.prototype = {};
                cl.prototype.init = function(mac, ip) {
                    this.mac = mac;
                    this.ip = ip;
                    console.info('use http 8080 for ' + ip);
                    return Promise.resolve(this);
                };
                cl.prototype.update = function() {
                    var mac = this.mac;
                    var ip = this.ip
                    return Promise.all(types.map(function(type) {
                        var url = 'http://' + ip + ':8080/' + type + '.get_dev_list';
                        return new Promise(function(ok, ng) {
                            $http.get(url).then(function(resp) {
                                if (resp.success !== 'true') { return; }

                                resp.objects.forEach(function(dev) {
                                    if (!dev) { return; }
                                    dev.gateway = mac;
                                    dev.type = type;
                                    r[dev.mac] = dev;
                                });
                            });
                            ok();
                        });
                    }));
                };
                cl.prototype.set = function(mac, options) {
                    var dev = deviceStatus[mac];
                    if (!dev || !dev.type) { return Promise.reject('device not found'); }

                    var method = null;
                    switch (dev.type) {
                        case 'light_wrgb': method = 'light_wrgb.set_dim_level'; break;
                        case 'light_wy':   method = 'light_wy.set_dim_level'; break;
                        case 'ac_switch':  method = 'ac_switch.set_dev_status'; break;
                    }
                    if (!method) {
                        return Promise.reject('device type ' + dev.type + ' not supported');
                    }

                    var ip = this.ip
                    var url = 'http://' + ip + ':8080/' + method;
                    return $http.get(url, options);
                };

                return function() { return new cl(); };
            })(),
        ];
        var negotiate = function(mac, info) {
            $cloud.query(mac).then(function(r) {
                var ips = r.data.ip;
                if (!ips || ips.length === 0) { return Promise.reject(); }

                info.ips = ips;
                var i0 = 0;
                var nextIP = function() {
                    if (i0 === ips.length) { return info.status = 0; }

                    var ip = ips[i0++];
                    console.info('check ip ' + ip);
                    var i1 = 0;
                    var talk = function() {
                        if (i1 === protocols.length) { return nextIP(); }
                        protocols[i1++]().init(mac, ip)
                            .then(function(inst) {
                                info.inf = inst;
                                info.status = 1;
                            })
                            .catch(talk);
                    };
                    talk();
                };
                nextIP();
            })
            .catch(function() {
                info.status = 0;
            });
        };

        setInterval(function initialize() {
            Object.keys(gatewayStatus).forEach(function(mac) {
                var info = gatewayStatus[mac];
                if (info.status !== 0) { return; }
                negotiate(mac, info);
                info.status = 2; // checking...
            });
        }, 1000);        

        var waiting = false;
        setInterval(function updateAll() {
            if (waiting) { return; }

            var macs = Object.keys(gatewayStatus).filter(function(mac) { return gatewayStatus[mac].status === 1});
            if (macs.length === 0) {
                return;
            }
            Promise.all(macs.map(function(mac) {
                var info = gatewayStatus[mac];
                return info.inf.update().catch(function() {
                    info.inf = null;
                    info.status = 0;
                    return Promise.resolve();
                });
            }))
            .then(function() { updating.forEach(function(cb) { cb(); }); })
            .then(refresh)
            .then(function() { waiting = false; });

            waiting = true;
        }, 1000);
        return r;
    })();

    var savedStates = $db.savedStates;


    return {
        online: function(mac) {
            return (gatewayStatus[mac] === undefined) ? 0 : gatewayStatus[mac];
        },
        status: function(mac) {
            var info = gatewayStatus[mac];
            if (!info) {
                return 'initializing';
            }

            switch (info.status) {
                case 0: return 'offline';
                case 1: return 'online';
                case 2: return 'connecting';
                default: return 'unknown';
            }
        },
        ips: function(mac) {
            var info = gatewayStatus[mac];
            if (!info || !info.ips) {
                return [];
            }
            return info.ips;
        },
        dump: function() {
            console.info(deviceStatus);
        },
        get: function(type, filter) {
            if (typeof(filter) === 'string') { 
                var dev = deviceStatus[filter];
                if (!dev || dev.type !== type) {
                    return null;
                }
                return dev;
            }

            if (typeof(type) === 'function') { 
                filter = type; 
                type = null; 
            }
            return Object.keys(deviceStatus)
                .map(function(mac) { 
                    return deviceStatus[mac];
                })
                .filter(function(dev) {
                    if (type && (dev.type !== type)) { return false; }
                    if (!filter) { return true; }
                    return filter(dev.type, dev.mac, dev);
                });
        },
        count: function(filter) {
            return $gateway.get(filter).length;
        },
        each: function(filter, cb) {
            if (!cb) {
                cb = filter;
                filter = null;
            }

            $gateway.get(filter).forEach(function(dev) {
                cb(dev.type, dev.mac, dev);
            });
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
        },





        set: function(mac, options) {
            var dev = deviceStatus[mac];
            if (!dev) {
                return Promise.reject('device not found');
            }

            var gateway = gatewayStatus[dev.gateway];
            if (!gateway || !gateway.inf) {
                return Promise.reject('gateway not found');
            }
            console.info(options);

            // console.info('update ' + mac + ' through ' + dev.gateway);
            // console.info(options);
            return gateway.inf.set(mac, options);
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


    };
})();
