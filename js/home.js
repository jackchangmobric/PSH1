$app.onPageInitOrBeforeAnimation('home', function(page) {
    $log('home-init');

    var parent = page.container;
    $gateway.updated(function hideEmptyDeviceList() {
        [].forEach.call($(parent, '.typed-device-list[data-device-type]', true), function(tbl) {
            if ($(tbl, '[data-dev-id]', true).length === 0) {
                tbl.style.display = 'none';                
            }
            else {
                tbl.style.display = null;
            }
        });
    });

    $gateway.updated(function attachEventHandler(typedDevices) {
        [].forEach.call(Object.keys(typedDevices), function(type) {
            var cb = homeHandleChangeEvent[type];
            if (!cb) {
                return;
            }
            [].forEach.call($(parent, '.device-info-' + type, true), cb);
        });
    });

    $gateway.watch(null, function updateDeviceList(type, devices) {
        var deviceList = $(parent, '.page-content .typed-device-list[data-device-type=' + type + ']');
        if (!deviceList) {
            var dl = $templates('#typed-device-list', { '::deviceType': type, type: type });
            $(parent, '.page-content').innerHTML += dl;
        }
        else {
            [].filter.call($(deviceList, '[data-dev-id]', true), function(el) {
                var oid = el.getAttribute('data-dev-mac');
                return !devices[oid];
            }).forEach(function(el) {
                el.parentNode.removeChild(el);
            });
        }

        setTimeout(function createDeviceInfoItem() {
            (deviceList) || (deviceList = $(parent, '.page-content .typed-device-list[data-device-type=' + type + ']'));

            var count = Object.keys(devices).length;
            if (count !== 0) {
                var qc = $(deviceList, '.quick-control');
                if (qc.childNodes.length === 0) {
                    qc.innerHTML = $templates('#device-quick-control-' + type, {});
                    setTimeout(function attachQuickControlEventListener() {
                        var cb = homeHandleQuickControlEvent[type];
                        if (!cb) {
                            return;
                        }
                        [].forEach.call($(qc, '.quick-control-item', true), function(item) {
                            cb(item);
                        });
                    });
                }
            }

            var tbl = $(deviceList, 'ul');
            var tid = '#device-info-' + type;
            [].forEach.call(Object.keys(devices), function(name) {
                var dev = devices[name];
                var mac = dev.mac;
                var type = dev.type;
                var oid = 'm_' + dev.mac;
                if (!$(parent, '[data-dev-id=' + oid + ']')) {
                    dev.name = dev.dev;
                    dev.oid = oid;
                    tbl.innerHTML += $templates(tid, dev);
                    el = $('[data-dev-id=' + oid + ']');
                }
            });
        }, 0);  

        setTimeout(function updateDataBinding() {
            [].forEach.call(Object.keys(devices), function(name) {
                var dev = devices[name];
                var oid = 'm_' + dev.mac;
                var el = $(parent, '[data-dev-id=' + oid + ']');
                [].forEach.call(el.querySelectorAll('[data-binding]'), function(i) {
                    var scr = i.getAttribute('data-binding');
                    eval('(function(o) {' + scr  + '})').call(i, dev);
                });
            });
        }, 0);
    });
});
