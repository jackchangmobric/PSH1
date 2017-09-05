$app.onPageInit('login', function (page) {
    var login = function(username, password) {
        return $cloud.login({email:username, password: password})
            .then(function(r) {
                if (r.status === 200) {
                    return r.data;
                }
                return Promise.reject(r);
            });
    };

    $('#sign-in').onclick = function() {
        var username = $('#username').value;
        var password = $('#password').value;
        login(username, password)
            .then(function(user) {
                $db.user.$copy(user).$save().then(function() {
                    location.reload();
                });
            })
            .catch(function(e) {
                $app.alert($('#error-' + e.status).innerHTML);
            });
    };

    var splash = $('#splash-image');
    if (!splash) { return; }

    var email = $db.user.email;
    if (email) {
        $db.sync().then(function() {
                console.info('got');
            $app.startup();
        })
        .catch(function(e) {
            console.info(e);
        });
    }

    splash.style.opacity = 0;
    setTimeout(function() {
        $('#app-space').style.opacity = 1;        
        splash.parentNode.removeChild(splash);
    }, 1000);
});
