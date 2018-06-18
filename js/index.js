function onMapReady() { app.initialize(); };

//'' + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + '-' + opt.nid

var dateString = function(date) {
    return [date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()].join('/') + ' ' +
           [('00' + date.getHours()).substr(-2),
            ('00' + date.getMinutes()).substr(-2)].join(':');
};

var mmax = 2100;
var mmin = 500;

var app = (function() {     
    var points = {};
    var markers = {};
    var map = null;
    var focus = null;
    var ws = null;

    var updating = false;
    var pthistory = [];
    var showDetails = function(pt) {
        $('#_device-detail input', true).forEach(function(i) {
            if (!i.name) { return; }
            i.value = (pt[i.name] || '').toString();
        });

        if (updating) { return; }

        var now = Date.now();
        for (var i = 6; i >= 0; --i) {
            var d = new Date(now - i * 86400000);
            ws.send(JSON.stringify({
                nid:pt.nid,
                date: '' + d.getFullYear() + (d.getMonth() + 1) + d.getDate()
            }));
        }
        pthistory = [];
        updating = true;
    };

    var drawbar = function(canvas, values, umin, umax) {
        var ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        var gap = 0.3;
        var min = (umin !== undefined) ? umin : 0;
        var max = (umax !== undefined) ? umax : values.reduce(function(p, c) { return Math.max(p, c); }, 0) * 1.1;
        var w = canvas.width / (((values.length + 1) * gap) + values.length);
        var h = canvas.height / (max - min);
        console.info(w, h, values)
        ctx.fillStyle = 'orange';
        for (var i = 0; i < values.length; ++i) {
            ctx.beginPath();
            ctx.rect(w * (i + (i + 1) * gap), canvas.height - h * values[i], w, h * values[i]);
            ctx.fill();
        }
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.stroke();
        ctx.closePath();
    };

    var drawline = function(canvas, values, umin, umax) {
        var ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        var min = (umin !== undefined) ? umin : 0;
        var max = (umax !== undefined) ? umax : values.reduce(function(p, c) { return Math.max(p, c); }, 0) * 1.1;
        var w = canvas.width / (values.length - 1);
        var h = canvas.height / (max - min);
        ctx.strokeStyle = 'orange';
        ctx.strokeWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - values[0] * h);
        for (var i = 1; i < values.length; ++i) {
            ctx.lineTo(w * i, canvas.height - values[i] * h);
        }
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.stroke();
        ctx.closePath();
    };

    var redraw = function() {
        console.info('redraw ' + pthistory.length);
        if (pthistory.length !== 7) { return; }

        var k = $('#chart-display').getAttribute('data-value');
        var r = $('#chart-display').getAttribute('data-range').split(',').map(function(v) { return v * 1; });
        var avg = pthistory.map(function(o) {
            var l = o.filter(function(c) { return c; });
            if (l.length === 0) { return 0; }
            return l.reduce(function(p, c) {
                    if (!c) { return p; }
                    return p + c[k] * 1;
                }, 0) / l.length;
        });

        drawbar($('#weekly-chart'), avg, r[0], r[1]);

        var pts = [];
        var lnow = Date.now() - 86400000;
        pthistory.forEach(function(l) {
            pts = pts.concat(l.filter(function(c) { return c && c.lastReport >= lnow; }));
        });
        var dl = pts.sort(function(a, b) { return a.lastReport - b.lastReport; });
        drawline($('#daily-chart'), dl.map(function(a) { return a[k]; }), r[0], r[1]);

        updating = false;
    };

    return {
        // Application Constructor
        initialize: function() {
            this.initViews();
            this.bindEvents();
            this.connect();
        },
        connect: function() {
            ws = new WebSocket('ws://52.191.194.212');
            ws.onopen = function() {
                console.info('connected');
                // ws.send(JSON.stringify({nid:'466011801360317', date:'2018616'}));
            };
            ws.onmessage = function(evt) {
                var pt = JSON.parse(evt.data);
                if (pt.date) {
                    if (updating) {
                        var pe = (pt.data) ? pt.data.filter(function(o) { return o; }) : [];
                        pe.forEach(function(p) {
                            p.t /= 10;
                            p.h /= 10;
                            p.m *= 1;
                            p.m = (p.m) ? mmax - p.m : 0;
                        })
                        pthistory.push(pe);
                    }
                    return redraw();
                }

                if (!pt.nid) {
                    return;
                }

                console.info(pt);

                pt.lat *= 1;
                pt.lng *= 1;
                pt.h /= 10;
                pt.t /= 10;
                pt.lastReportTime = dateString(new Date(pt.lastReport * 1));
                // pt.m2 = 100 - Math.round(Math.sqrt(pt.m2) / pt.m * 1000) / 10;
                pt.m *= 1;
                pt.m = (pt.m) ? mmax - pt.m : 0;

                if ($('#_device-detail').getAttribute('data-nid') === pt.nid) {
                    showDetails(pt);
                }

                var compare = function(p, k) {
                    if (p[k] * 1 > $('#' + k + '-h').value * 1) {
                        return 4;
                    }
                    if (p[k] * 1 < $('#' + k + '-l').value * 1) {
                        return 2;
                    }
                    return 1;
                };

                pt.state = Math.max(Math.max(
                    compare(pt, 'm'),
                    compare(pt, 't')),
                    compare(pt, 'h'));

                points[pt.nid] = pt;
                app.redraw();
            };
        },
        initViews: function() {
            // document.body.requestFullscreen();
            // init sheet close
            $('.sheet > h1', true).forEach(function(a) {
                $bind(a, 'click', function() { $activate(a.parentNode, false); });
            });



            // init togglers
            $('*[data-toggle-target]', true).forEach(function(a) {
                $bind(a, 'click', function() {
                    $toggle($('#' + this.getAttribute('data-toggle-target')));
                });
            })
            
            // init group button
            $('.group-button', true).forEach(function(b) {
                var onclick = function() {
                    self = this;
                    $(b, '.button', true).forEach(function(_a) {
                        $activate(_a, _a === self);
                        b.setAttribute('data-value', self.getAttribute('data-value'))
                        b.setAttribute('data-range', self.getAttribute('data-range'))
                    });
                };
                $(b, '.button', true).forEach(function(a) { 
                    if (a.hasAttribute('data-always-on')) {
                        return;
                    }
                    $bind(a, ['mouseup', 'touchstart'], onclick); 
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
                    $bind(i, 'change', onchange);
                });
            });            
        },
        bindEvents: function() {
            setTimeout(this.onDeviceReady, 0);

            map = new google.maps.Map(document.getElementById('map'), {
                disableDefaultUI: true,
                mapTypeControl: false,
                gestureHandling: 'greedy',
                zoom: 14,
                center: {lat: -28.024, lng: 140.887}
            });

            $('#chart-display .button', true).forEach(function(btn) {
                $bind(btn, ['mouseup', 'touchend'], function() {
                    redraw();
                });
            });

            $bind($('#search'), 'focus', function() {
                $('#toolbar > input[type=button]', true).forEach(function(a) {
                    if (a.id === 'clear-search') { 
                        $activate(a, true);
                    }
                    else {
                        $activate(a, false);
                    }
                });
            });
            $bind($('#search'), 'blur', function() {
                $activate($('#clear-search'), false);
                    setTimeout(function() {
                    $('#toolbar > input[type=button]', true).forEach(function(a) {
                        if (a.id !== 'clear-search') { 
                            $activate(a, true);
                        }
                    });
                }, 0);
            });

            $bind($('#search'), 'keyup', function() {
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

            $bind($('#clear-search'), 'touchend', function() {
                setTimeout(function() {
                    $('#search').blur();
                }, 0);
                $('#search').value = '';
                focus = null;
                $activate($('#auto-complete'), false);
            });

            $bind($('#auto-complete'), ['mouseup', 'touchstart'], function(e) {
                var nid = e.target.getAttribute('data-nid');
                console.info(e);
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

            $bind($('#use-current-location'), 'click', function() {
                $('#lat').value = Math.round(map.getCenter().lat() * 10000) / 10000;
                $('#lng').value = Math.round(map.getCenter().lng() * 10000) / 10000;
                $('#lat').dispatchEvent(new Event('change'));
            });
        },
        redraw: function() {
            Object.keys(points).map(function(k) { return points[k]; }).forEach(function(pt, i) {
                var marker = markers[pt.nid];
                if (marker) {
                    marker.setPosition({ lat: pt.lat * 1, lng: pt.lng * 1 });                    
                }
                else {
                    marker = markers[pt.nid] = new google.maps.Marker({
                        map: map,
                        position: { lat: pt.lat * 1, lng: pt.lng * 1 },
                        label: pt.nid,
                        icon: 'img/m' + pt.state + '.png'
                    });
                }
                marker.addListener('click', function(e) {
                    var pt = points[this.label];
                    showDetails(pt);
                    $('#_device-detail').setAttribute('data-nid', this.label);
                    $activate($('#_device-detail'), true);
                });
            });
        },
        loadSettings: function() {
            $('[data-setting]', true).forEach(function(a) {
                var key = a.getAttribute('data-setting');
                var val = $kv.get(key);
                console.info(key, val)
                Object.keys(val).forEach(function(k) {
                    $('#' + k).value = val[k];
                });
            });
            return Promise.resolve();
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
