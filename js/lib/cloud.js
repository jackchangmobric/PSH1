var $cloud = (function() {
    var host = $config.cloud;

    var m = function(method) {
        return host + '/' + method;
    };

    return {
        register: function(opt) {
            return $http.get(m('user.register'), opt);
        },
        login: function(opt) {
            return $http.get(m('user.login'), opt);
        },
        pull: function(opt) {
            return $http.get(m('user.pulldb'), opt);
        },
        push: function(opt, data) {
            return $http.put(m('user.pushdb'), opt, JSON.stringify(data));
        },
        query: function(mac) {
            return $http.get(m('gateway.info'), { mac: mac });
        }
    };

})();
