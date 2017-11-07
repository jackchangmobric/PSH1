var $startupItem = {};
$startupItem['import-from-gateway'] = function(options) {
    return new Promise(function(ok, ng) {
        console.info('auto import ' + options.gmac);
        // $gateway.changed(function(gmac) {
        //     console.info($gateway.online(gmac));
        //     if (options.gmac !== gmac) {
        //         return;
        //     }

        //     if (!$gateway.online(gmac)) {
        //         return;
        //     }

        var gmac = options.gmac;
        var importDevice = function() {
            $db.devices.$update(function(tbl) {
                $gateway.each(function(type, mac, dev) {
                    if (tbl[mac]) { return; }
                    if (dev.gateway !== gmac) { return; }
                    tbl[mac] = {
                        type:type,
                        name:'',
                        room:'',
                        x:0,
                        y:0
                    };
                });
            }).$save().then(ok).catch(ng);
            $gateway.updated(importDevice, false);
        };
        setTimeout(function() {
            $gateway.updated(importDevice, true);
        }, 0);
        // });

    });
};