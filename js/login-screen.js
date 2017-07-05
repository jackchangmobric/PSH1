$app.onPageInit('login', function (page) {
    var user = {
        email: 'demo@localhost',
        name: 'John Doe',
        phone: '123-456-7890'
    };
    var login = function(username, password) {
        return new Promise(function(ok, ng) {
            if (username === 'demo@localhost' && password === 'demo') {
                return setTimeout(function() { ok(user); }, 1000);
            }
            if (username === '' && password === '') {
                return setTimeout(function() { ok(user); }, 1000);
            }
            setTimeout(ng, 1000);
        });
    };

    var email = $db.user.email;
    if (email) {
        var rooms = Object.keys($db.rooms);
        if (rooms.length === 1) {
            console.info('goto ' + rooms[0]);
            $mainView.router.loadPage('pages/room-view.html?rid=' + rooms[0]); 
        }
        else if (rooms.length) {
            console.info('goto room list');
            $mainView.router.loadPage('pages/room-list.html');  
        }
        else {
            $mainView.router.loadPage('pages/new-room.html?rid=foobar');            
        }
    }
    else {
        $('#sign-in').onclick = function() {
            var username = $('#username').value;
            var password = $('#password').value;
            login(username, password)
                .then(function(user) {
                    $db.user.$copy(user).$save();
                    $mainView.router.loadPage('pages/new-room.html');
                })
                .catch(function() {

                });
        };
    }
    $('#boot-video').style.opacity = 0;
    setTimeout(function() {
        $('#app-space').style.opacity = 1;        
        $('#boot-video').parentNode.removeChild($('#boot-video'));
    }, 1000);
});
