var $cloud = (function() {
    var host = $config.cloud;
    var done = false;
    var fake = false;
    var pending = null;

    var m = function(method) {
        console.info(host + '/' + method);
        return host + '/' + method;
    };

    var init = function() {
        if (done) { return Promise.resolve(); }
        if (!pending) {
            console.info('cloud init');
            pending = new Promise(function(ok) { $$(document).on('deviceready', function() {
                $http.timeout(5000).get(m('test'))
                    .then(function() { 
                        console.info('cloud ok');
                        done = true; 
                    })
                    .then(ok)
                    .catch(function() {
                        console.info('cloud ng');
                        fake = true;
                        // host = $config.cloud = 'http://127.0.0.1:8001'; 
                        done = true;
                        ok();
                    });
            }); });
        }
        return pending;
    };

    var response = function(status, description, data) {
        return { status: status, description: description, data: data || {} };
    };

    return {
        register: function(opt) {
            return init().then(function() { 
                if (fake) {
                    var db = window.localStorage;
                    db.setItem('@user', JSON.stringify(opt));
                    return Promise.resolve(response(200));
                }
                return $http.get(m('user.register'), opt); 
            });
        },
        login: function(opt) {
            return init().then(function() { 
                if (fake) {
                    console.info(opt);
                    var db = window.localStorage;
                    var json = db.getItem('@user');
                    if (!json) {
                        return Promise.reject(response(404, 'db not found'));
                    }
                    var user = JSON.parse(json);
                    if (user.email !== opt.email || user.password !== user.password) {
                        return Promise.reject(response(404, 'invalid email or password'));
                    }
                    return Promise.resolve(response(200, null, user));
                }
                return $http.get(m('user.login'), opt); 
            });
        },
        pull: function(opt) {
            return init().then(function() { 
                if (fake) {
                    var db = window.localStorage;
                    return Promise.resolve(response(200, null, [
                        'gateways', 'rooms', 'devices', 'modes'
                    ].reduce(function(p, name) {
                        var json = db.getItem('@' + name);
                        p[name] = JSON.parse(json || '{}');
                        return p;
                    }, {})));
                }
                return $http.get(m('user.pulldb'), opt); 
            });
        },
        push: function(opt, data) {
            return init().then(function() { 
                if (fake) {
                    var db = window.localStorage;
                    db.setItem('@' + opt.table, JSON.stringify(data));
                    return Promise.resolve(response(200));                    
                }
                return $http.put(m('user.pushdb'), opt, JSON.stringify(data)); 
            });
        },
        query: function(mac) {
            return init().then(function() { 
                if (fake) {
                    return Promise.resolve(response(200, null, {
                        ip: ['127.0.0.1']
                    }));
                }
                return $http.get(m('gateway.info'), { mac: mac }); 
            });
        }
    };

})();
