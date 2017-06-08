$app.onPageInitOrBeforeAnimation('floorplan', function(page) {
    var parent = page.container;
    var container = $(parent, '.page-content > div');
    var dnditem = [null,null,null,null,null];
    if (container.childNodes.length === 0) {
        document.addEventListener('touchend', function(e) {
            var el = dnditem[0];
            if (!el) { return; }
            var mac = el.getAttribute('data-dev-mac');
            var x = el.style.left.replace('px', '') * 1;
            var y = el.style.top.replace('px', '') * 1;
            $gateway.set('pos', [x,y], [mac]);
            dnditem[0] = null;
        });
        document.addEventListener('touchmove', function(e) {
            var el = dnditem[0];
            if (!el) { return; }
            var dx = e.touches[0].pageX - dnditem[1];
            var dy = e.touches[0].pageY - dnditem[2];
            el.style.left = dx + dnditem[3] + 'px';
            el.style.top = dy + dnditem[4] + 'px';
        });
    }

    $gateway.updated(function attachEventHandler(typedDevices) {
        [].forEach.call(Object.keys(typedDevices), function(type) {
            var cb = floorplanHandleChangeEvent[type];
            if (!cb) {
                return;
            }
            [].forEach.call($(container, '.room-control-' + type + '[data-dev-id]', true), cb);
        });
    });
    $gateway.watch(null, function updateDeviceList(type, devices) {
        [].filter.call($(container, '.room-control-' + type + '[data-dev-id]', true), function(el) {
            var oid = el.getAttribute('data-dev-id').substring(2);
            return !devices[oid];
        }).forEach(function(el) {
            el.parentNode.removeChild(el);
        });

        [].forEach.call(Object.keys(devices), function(mac) {
            var dev = devices[mac];
            var oid = 'm_' + dev.mac;
            var el = $(container, '[data-dev-id="' + oid + '"]')
            if (el) {
                return;
            }

            var pos = (dev.pos) ? 'absolute' : null;
            var x = (pos) ? dev.pos[0] + 'px' : null;
            var y = (pos) ? dev.pos[1] + 'px' : null;            
            var item = $templates('#room-control-' + type, {
                oid:oid,
                mac:mac,
                pos: pos,
                x: x,
                y: y
            });
            container.innerHTML += item;
        });

        setTimeout(function updateDataBinding() {
            [].forEach.call(Object.keys(devices), function(name) {
                var dev = devices[name];
                var oid = 'm_' + dev.mac;
                var el = $(container, ' .room-control-item[data-dev-id="' + oid + '"]');
                [].forEach.call(el.querySelectorAll('[data-binding]'), function(i) {
                    var scr = i.getAttribute('data-binding');
                    eval('(function(o) {' + scr  + '})').call(i, dev);
                });
                if (el.draggable) {
                    return;
                }

                el.addEventListener('touchstart', function(e) {
                    dnditem[0] = el;
                    dnditem[1] = e.touches[0].pageX;
                    dnditem[2] = e.touches[0].pageY;
                    var x = dnditem[3] = el.offsetLeft;
                    var y = dnditem[4] = el.offsetTop;
                    el.style.position = 'absolute';
                    el.style.left = x;
                    el.style.top = y;
                }, {passive:true});
                el.draggable = true;
            });
        }, 0);
    });
});

