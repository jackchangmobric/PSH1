$app.onPageInit('new-room', function(page) {
    var rid = page.query.room;
    if (rid) {
        $('#device-list').setAttribute('data-room-id', rid);
    }
    else {
        $('#device-list').setAttribute('data-room-id', 'r_' + new Date().getTime());
    }
});

$app.onPageInit('new-room', function(page) {
    var rid = page.query.room;
    if (rid) {
        $gateway.each(null, function(type, mac, dev) {
            $('#device-list ul').innerHTML += $templates('#device-select', {
                mac: mac,
                '::type': type,
                name: dev.name || dev.dev,
                checked: (dev.room === rid) ? 'checked' : ''
            });
        });
        var rooms = JSON.parse($db.getItem('user-room') || '{}');
        var room = rooms[rid];
        if (!room) {
            return;
        }

        $('#dimension-w').value = room.width;
        $('#dimension-d').value = room.depth;
        $('#room-name').value = room.name;
    }
    else {
        $gateway.each(function(type, mac, dev) { return !dev.room; }, function(type, mac, dev) {
            $('#device-list ul').innerHTML += $templates('#device-select', {
                mac: mac,
                '::type': type,
                name: dev.name || dev.dev,
                checked: ''
            });
        });        
    }
});

$app.onPageInit('new-room', function(page) {
    $('#save').onclick = function() {
        var rid = $('#device-list').getAttribute('data-room-id');
        var rw = $('#dimension-w').value;
        var rd = $('#dimension-d').value;
        var name = $('#room-name').value;
        setTimeout(function() {
            var rooms = JSON.parse($db.getItem('user-room') || '{}');
            rooms[rid] = {
                name: name,
                width: rw,
                depth: rd
            };
            $db.setItem('user-room', JSON.stringify(rooms));
        }, 0);

        var list = [].map.call($('#device-list ul input[type=checkbox]', true), function(i) {
            if (!i.checked) {
                return null;
            }
            return i.name;
        }).filter(function(v) { return v; });
        $gateway.set('room', rid, list, true);
    };
});
