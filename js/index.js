function onMapReady() { app.initialize(); };

var app = (function() {     
    var points = {};
    var map = null;
    var focus = null;
    var markerClusters = {};
    var ws = null;
    var bounds = null;

    return {
        // Application Constructor
        initialize: function() {
            this.initViews();
            this.bindEvents();
            this.connect();
        },
        connect: function() {
            ws = new WebSocket('ws://52.191.194.212');
            ws.open = function() {
                console.info('connected')
            };
            ws.onmessage = function(evt) {
                var pt = JSON.parse(evt.data);
                if (!pt.nid) {
                    return;
                }

                var critical = [$('#br-critical').value * 1, $('#hr-critical').value * 1];
                var warning = [$('#br-warning').value * 1, $('#hr-warning').value * 1];
                if (pt.br > critical[0] || pt.hr > critical[1]) {
                    pt.state = 4;
                    pt.stateS = 'critical';
                }
                else if (pt.br > warning[0] || pt.hr > warning[1]) {
                    pt.state = 2;
                    pt.stateS = 'warning';
                }
                else {
                    pt.state = 1;
                    pt.stateS = 'normal';
                }
                pt.lastReportTime = new Date(pt.lastReport);

                pt.lat *= 1;
                pt.lng *= 1;

                if (bounds) {
                    var north = Math.max(bounds.pt1.lat, bounds.pt2.lat);
                    var south = Math.min(bounds.pt1.lat, bounds.pt2.lat);
                    var east = Math.max(bounds.pt1.lng, bounds.pt2.lng);
                    var west = Math.min(bounds.pt1.lng, bounds.pt2.lng);
                    if (pt.lng < west || pt.lng > east || pt.lat < south || pt.lat > north) {
                        pt.escaped = 1;
                    }
                    else {
                        pt.escaped = 0;
                    }
                }
                if ($('#_device-detail').getAttribute('data-nid') === pt.nid) {
                    $('#_device-detail input', true).forEach(function(i) {
                        if (!i.name) { return; }
                        console.info(i.name);
                        i.value = pt[i.name].toString();
                    });
                    if (pt.br > critical[0]) {
                        $('#_device-detail input[name=br]').setAttribute('data-state', 'critical');
                    }
                    else if (pt.br > warning[0]) {
                        $('#_device-detail input[name=br]').setAttribute('data-state', 'warning');
                    }
                    else {
                        $('#_device-detail input[name=br]').removeAttribute('data-state');                        
                    }
                    if (pt.hr > critical[1]) {
                        $('#_device-detail input[name=hr]').setAttribute('data-state', 'critical');
                    }
                    else if (pt.hr > warning[1]) {
                        $('#_device-detail input[name=hr]').setAttribute('data-state', 'warning');
                    }
                    else {
                        $('#_device-detail input[name=hr]').removeAttribute('data-state');                                                
                    }
                }


                points[pt.nid] = pt;
                if (pt.nid === focus && $('#autoFollow').checked) {
                    map.setCenter({
                        lat: pt.lat,
                        lng: pt.lng
                    });
                }
                app.redraw();
            };
        },
        initViews: function() {
            // init sheet close
            $('.sheet > h1', true).forEach(function(a) {
                a.addEventListener('click', function() { $activate(a.parentNode, false); });
            });

            // init togglers
            $('*[data-toggle-target]', true).forEach(function(a) {
                a.addEventListener('click', function() {
                    $toggle($('#' + this.getAttribute('data-toggle-target')));
                });
            })
            
            // init group button
            $('.group-button', true).forEach(function(b) {
                var onclick = function() {
                    self = this;
                    $(b, '.button', true).forEach(function(_a) {
                        $activate(_a, _a === self);
                    });
                };
                $(b, '.button', true).forEach(function(a) { 
                    if (a.hasAttribute('data-always-on')) {
                        return;
                    }
                    a.addEventListener('touchstart', onclick); 
                });
                onclick.call($(b, '.button', true)[0]);
            });

            // init auto setting save
            $('[data-setting]', true).forEach(function(a) {
                var key = a.getAttribute('data-setting');
                var onchange = function() {
                    var v = {};
                    $('[data-setting="' + key + '"] input', true).forEach(function(i) {
                        if (i.type === 'button') { return; }
                        v[i.id] = (isNaN(i.value)) ? i.value : i.value * 1;
                    });
                    $kv.set(key, v);
                };
                $('[data-setting="' + key + '"] input', true).forEach(function(i) {
                    i.addEventListener('change', onchange);
                });
            });            
        },
        bindEvents: function() {
            document.addEventListener('deviceready', this.onDeviceReady, false);

            map = new google.maps.Map(document.getElementById('map'), {
                disableDefaultUI: true,
                mapTypeControl: false,
                gestureHandling: 'greedy',
                zoom: 14,
                center: {lat: -28.024, lng: 140.887}
            });

            $('#search').addEventListener('focus', function() {
                $('#toolbar > input[type=button]', true).forEach(function(a) {
                    if (a.id === 'clear-search') { 
                        $activate(a, true);
                    }
                    else {
                        $activate(a, false);
                    }
                });
            });
            $('#search').addEventListener('blur', function() {
                $activate($('#clear-search'), false);
                    setTimeout(function() {
                    $('#toolbar > input[type=button]', true).forEach(function(a) {
                        if (a.id !== 'clear-search') { 
                            $activate(a, true);
                        }
                    });
                }, 0);
            });

            $('#show-list').addEventListener('touchstart', function() {
                $('#auto-complete').innerHTML = Object.keys(points)
                    .map(function(nid) {
                        return points[nid];
                    })
                    .sort(function(a, b) {
                        if (a.escaped) {
                            return -1;
                        }
                        else {
                            return b.state - a.state;
                        }
                    })
                    .map(function(dev) {
                        return $string('<div data-state="{{state}}" data-nid="{{nid}}">{{nid}}</div>', dev);
                    }).join('');
                $toggle($('#auto-complete'));
            });

            $('#search').addEventListener('keyup', function() {
                var v = $('#search').value;
                if (!v) {
                    $activate($('#auto-complete'), false);
                    return;
                }

                var l = Object.keys(points).filter(function(nid) {
                    return nid.indexOf(v) !== -1;
                });
                if (l.length === 0) {
                    $activate($('#auto-complete'), false);
                }
                else {
                    $('#auto-complete').innerHTML = l.map(function(nid) {
                        return $string('<div data-nid="{{nid}}">{{nid}}</div>', points[nid]);
                    }).join('');
                    $activate($('#auto-complete'), true);                    
                }
            });


            $('#buzz').addEventListener('touchstart', function() {
                var nid = $('#_device-detail').getAttribute('data-nid');
                if (!nid) {
                    return;
                }

                ws.send(JSON.stringify({
                    nid: nid,
                    cmd: 'buzz'
                }));
            });

            $('#clear-search').addEventListener('touchend', function() {
                setTimeout(function() {
                    $('#search').blur();
                }, 0);
                $('#search').value = '';
                focus = null;
                $activate($('#auto-complete'), false);
            });

            $('#auto-complete').addEventListener('touchstart', function(e) {
                var nid = e.target.getAttribute('data-nid');
                if (!nid) {
                    return;
                }

                $activate($('#auto-complete'), false);                    
                $('#search').value = nid;
                focus = nid;
                map.setCenter({
                    lat: points[nid].lat,
                    lng: points[nid].lng
                });
            });

            $('#use-current-location').addEventListener('click', function() {
                $('#lat').value = Math.round(map.getCenter().lat() * 10000) / 10000;
                $('#lng').value = Math.round(map.getCenter().lng() * 10000) / 10000;
                $('#lat').dispatchEvent(new Event('change'));
            });

            $('#state-filter [data-display-mask]', true).forEach(function(i) {
                i.addEventListener('click', function() {
                    app.redraw();
                });
            });

            (function() {
                var fence = null;
                
                bounds = $kv.get('geofence');
                if (!!bounds.pt1 && !!bounds.pt2) {
                    fence = new google.maps.Rectangle({
                        strokeColor: '#0033FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#0033FF',
                        fillOpacity: 0.2,
                        map: map,
                        bounds: {
                            north: Math.max(bounds.pt1.lat, bounds.pt2.lat),
                            south: Math.min(bounds.pt1.lat, bounds.pt2.lat),
                            east: Math.max(bounds.pt1.lng, bounds.pt2.lng),
                            west: Math.min(bounds.pt1.lng, bounds.pt2.lng)
                        }
                    });
                }

                $('#add-geofence').addEventListener('touchstart', function() {
                    if (fence) {
                        fence.setMap(null);
                    }
                    $activate($('#geofence-canvas'), true);
                });

                var point2LatLng = function (pt) {
                    var tr = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
                    var bl = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
                    var scale = Math.pow(2, map.getZoom());
                    var wp = new google.maps.Point(pt.clientX / scale + bl.x, pt.clientY / scale + tr.y);
                    return map.getProjection().fromPointToLatLng(wp).toJSON();
                };
                var pt1 = null;
                var pt2 = null;
                var rect = null;
                $('#geofence-canvas').addEventListener('touchstart', function(e) {
                    if (!$('#geofence-canvas').hasAttribute('data-active')) {
                        return;
                    }

                    if (rect) {
                        rect.setMap(null);
                        rect = pt1 = pt2 = null;
                    }
                    pt1 = pt2 = point2LatLng(e.changedTouches[0]);
                    rect = new google.maps.Rectangle({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.2,
                        map: map,
                        bounds: {
                            north: pt1.lat,
                            south: pt1.lat,
                            east: pt1.lng,
                            west: pt1.lng
                        }
                    });
                });
                $('#geofence-canvas').addEventListener('touchmove', function(e) {
                    pt2 = point2LatLng(e.changedTouches[0]);
                    rect.setOptions({
                        bounds: {
                            north: Math.max(pt1.lat, pt2.lat),
                            south: Math.min(pt1.lat, pt2.lat),
                            east: Math.max(pt1.lng, pt2.lng),
                            west: Math.min(pt1.lng, pt2.lng)
                        }
                    });
                });
                $('#geofence-canvas').addEventListener('touchend', function(e) {
                });
                $('#create-new-fence').addEventListener('touchstart', function(e) {
                    $kv.set('geofence', bounds = {
                        pt1: pt1,
                        pt2: pt2
                    });
                    $activate($('#geofence-canvas'), false);
                    if (fence) {
                        fence.setMap(null);
                    }
                    fence = rect;
                    fence.setOptions({
                        strokeColor: '#0033FF',
                        fillColor: '#0033FF',
                    });
                    pt1 = pt2 = rect = null;
                }, true);
                $('#cancel-new-fence').addEventListener('touchstart', function(e) {
                    if (rect) {
                        rect.setMap(null);
                    }

                    if (fence) {
                        fence.setMap(map);
                    }
                    $activate($('#geofence-canvas'), false);
                    pt1 = pt2 = rect = null;
                }, true);
            })();
        },
        redraw: function() {
            if (Object.keys(markerClusters).length === 0) {
                for (var i = 0; i < $('#state-filter [data-display-mask]', true).length - 1; ++i) {
                    var p = Math.pow(2, i);
                    markerClusters[p] = new MarkerClusterer(map, [], {
                        imagePath: 'img/mc-' + p + 'm'
                    });
                }
            }
            Object.keys(markerClusters).forEach(function(k) {
                markerClusters[k].clearMarkers();
            });

            var mask = $('#state-filter [data-active]').getAttribute('data-display-mask') * 1;
            Object.keys(points).map(function(k) { return points[k]; }).forEach(function(pt, i) {
                var marker = new google.maps.Marker({
                    position: { lat: pt.lat * 1, lng: pt.lng * 1 },
                    label: pt.nid,
                    icon: 'img/m' + pt.state + '.png'
                });
                markerClusters[pt.state].addMarkers([marker], false);
                marker.addListener('click', function(e) {
                    var pt = points[this.label];
                    $('#_device-detail input', true).forEach(function(i) {
                        if (!i.name) { return; }
                        i.value = pt[i.name].toString();
                    });
                    $('#_device-detail').setAttribute('data-nid', this.label);
                    $activate($('#_device-detail'), true);
                });
            });
            $('#escaped').innerHTML = Object.keys(points).filter(function(k) {
                return points[k].escaped;
            }).length;

            $('#all').innerHTML = Object.keys(points).length;
            $('[data-display-mask]', true).forEach(function(m) {
                var mc = markerClusters[m.getAttribute('data-display-mask')];
                if (mc) {
                    m.innerHTML = mc.getMarkers().length;
                }
            });
            Object.keys(markerClusters).forEach(function(k) {
                if (!(k & mask)) {
                    markerClusters[k].clearMarkers();
                }
                markerClusters[k].redraw();
            });
        },
        loadSettings: function() {
            $('[data-setting]', true).forEach(function(a) {
                var key = a.getAttribute('data-setting');
                var val = $kv.get(key);
                Object.keys(val).forEach(function(k) {
                    $('#' + k).value = val[k];
                });
            });
        },
        getCurrentLocation: function() {
            return new Promise(function(ok, ng) {
                var hl = $kv.get('homeLocation');
                if (hl && hl.lat  !== undefined && hl.lng !== undefined) {
                    map.setCenter(hl);
                    return ok();
                }

                navigator.geolocation.getCurrentPosition(function(pos) {
                    console.info(pos);
                    map.setCenter({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    ok();
                    // alert('Latitude: '          + position.coords.latitude          + '\n' +
                    //       'Longitude: '         + position.coords.longitude         + '\n' +
                    //       'Altitude: '          + position.coords.altitude          + '\n' +
                    //       'Accuracy: '          + position.coords.accuracy          + '\n' +
                    //       'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
                    //       'Heading: '           + position.coords.heading           + '\n' +
                    //       'Speed: '             + position.coords.speed             + '\n' +
                    //       'Timestamp: '         + position.timestamp                + '\n');
                }, function(err) {
                    ng(err.message);
                });
            });
        },
        onDeviceReady: function(id) {
            Promise.all([
                app.loadSettings(),
                app.getCurrentLocation(),
            ]).then(function() {
                app.redraw();
            });
        }
    }; 
})();
