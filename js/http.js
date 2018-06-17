var $http = (function() { 
    var url = function(method, options) {
        var uri = method;
        if (options) {
            uri += ('?' + Object.keys(options).map(function(k) { return [k, options[k]].join('='); }).join('&'));
        }
        console.info(uri);
        return uri;
    };
    var timeout = null;
    var inst = {
        timeout: function(val) {
            timeout = val;
            return inst;
        },
        get: function(method, options) {
            var uri = url(method, options);
            // console.info(uri);
            var xhttp = new XMLHttpRequest();
            return new Promise(function(ok, ng) {
                xhttp.timeout = timeout; timeout = null;
                xhttp.onreadystatechange = function() {
                    if (xhttp.readyState !== 4) {
                        return;
                    }

                    if (xhttp.status !== 200) {
                        //ng(xhttp.status + ' ' + xhttp.statusText);
                        ng(uri + ' ' + xhttp.responseText);
                    }
                    else {
                        ok(JSON.parse(xhttp.responseText));
                    }
                };
                xhttp.onerror =
                xhttp.onabort = function(e) {
                    ng(e);
                };
                xhttp.open("GET", uri, true);
                xhttp.send();       
            });
        },
        put: function(method, options, data) {
            var uri = url(method, options);
            var xhttp = new XMLHttpRequest();
            return new Promise(function(ok, ng) {
                xhttp.timeout = timeout; timeout = null;
                xhttp.onreadystatechange = function() {
                    if (xhttp.readyState !== 4) {
                        return;
                    }
                    
                    if (xhttp.status !== 200) {
                        ng(xhttp.statusText);
                    }
                    else {
                        ok(JSON.parse(xhttp.responseText));
                    }
                };
                xhttp.open("PUT", uri, true);
                xhttp.send(data);        
            });
        }
    }; 
    return inst;
})();