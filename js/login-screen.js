$log('login-screen');

$app.onPageInit('home', function (page) {
    $log('login-screen-init');

    var value = $db.getItem('user');
    $log('[' + value + ']');
    if (value) {
        return;
    }

    $('#sign-in').onclick = function() {
        var username = $('#username').value;
        var password = $('#password').value;
        if (username === 'demo@localhost' && password === 'demo') {
            $db.setItem('user', JSON.stringify({
                "name": "John Doe",
                "email": "johndoe@gmail.com",
                "gender": "male",
                "gateway": ""
            }));
            setTimeout(function() {
                $app.closeModal('#login-screen');                
            }, 1000);
            return;
        }
    };
    $app.popup('#login-screen');
});
