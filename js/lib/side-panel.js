$gateway.updated(function() {
    $('[data-device-counter=all].badge').innerHTML = $gateway.count()
});

$gateway.watch(null, function(type, devices) {
    $('[data-device-counter=' + type + '].badge').innerHTML = Object.keys(devices).length;
}, true);

[].forEach.call($('#device-type-filter li', true), function(el) {
    el.onclick = function() {
        var key = this.querySelector('[data-i18n-key]').getAttribute('data-i18n-key');
        var type = key.replace('device-type-', '');
        if (type === 'all') {
            $gateway.filter('');
        }
        else {
            $gateway.filter(function(t) { return t === type; });
        }
        $mainView.router.loadPage('#home');
        $app.currentFilter = (type === 'all') ? null : 'type:' + type;
        $('#page-title').innerHTML = $(el, '.item-title').innerHTML;
        $('.toolbar a[href="#floorplan"]').style.display = 'none';
        $('.navbar a#edit-room').style.display = 'none';
    };
});

$('#new-room').onclick = function() {
    $mainView.router.loadPage('new-room.html');
};

var loadRooms = function() {
    var rooms = JSON.parse($db.getItem('user-room') || '{}');
    $('#room-list').innerHTML = [].map.call(Object.keys(rooms), function(rid) {
        var room = rooms[rid];
        return $templates('#room-panel-item', {
            name: room.name,
            rid: rid,
            count: $gateway.count(function(type, mac, dev) {
                return dev.room === rid
            })
        });
    }).join('');
    setTimeout(function() {
        [].forEach.call($('#room-list [data-room-id]', true), function(el) {
            var rid = el.getAttribute('data-room-id');
            el.onclick = function() {
                $gateway.filter(function(type, mac, dev) {
                    return dev.room === rid;
                });
                $app.currentFilter = 'room:' + rid;
                $mainView.router.loadPage('#floorplan');
                $('#page-title').innerHTML = $(el, '.item-title').innerHTML;
                $('.toolbar a[href="#floorplan"]').style.display = null;
                $('.navbar a#edit-room').style.display = null;
                $('#edit-room').href = 'new-room.html?room=' + rid;
            };
        });
    });
    $gateway.updated(loadRooms, false);
};
$app.onPageBeforeRemove('new-room', loadRooms);
$gateway.updated(loadRooms);
