var update = {
    'user-gui': function(obj, caller) {
        document.body.className = [
            'layout-' + (obj.layout || 'default'),
             'theme-' + (obj.theme || 'blue')
        ].join(' ');
    }
}

$app.onPageInit('home', function(page) {
    var pref = JSON.parse($db.getItem('user-gui') || '{}');
    var cb = update['user-gui'];
    (cb) && (cb(pref, 2));
});

// auto bind
$app.onPageInit('settings', function(page) {
    var settings = {};
    [].forEach.call($('.auto-setting', true), function(i) {
        var root = i.getAttribute('data-setting-root');
        var obj = (settings[root]) || (settings[root] = JSON.parse($db.getItem(root) || '{}'));
        var key = i.getAttribute('data-setting-key');
        i.value = obj[key] || i .getAttribute('data-default-value');
    });
});

// auto save
$app.onPageInit('settings', function(page) {
    var onchange = function(e) {
        var root = e.target.getAttribute('data-setting-root');
        var obj = [].reduce.call($('[data-setting-root=' + root + ']', true), function(p, c) {
            p[c.getAttribute('data-setting-key')] = c.value;
            return p;
        }, {});
        var cb = update[root];
        (cb) && (cb(obj, 1));
        $db.setItem(root, JSON.stringify(obj));
    };
    [].forEach.call($('.auto-setting', true), function(i) {
        i.onchange = onchange;
    });
});

// sign-out
$app.onPageInit('settings', function(page) {
    $('#sign-out').onclick = function() {
        $db.removeItem('user');
        $db.removeItem('user-gui');
        $mainView.router.loadPage('index.html');
    };
});
