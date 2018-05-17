var app = (function() {     
    var history = [];
    var historyLength = 100;
    var selected = null;

    return {
        // Application Constructor
        initialize: function() {
            this.initViews();
            this.bindEvents();
            this.connect();
        },
        initViews: function() {
            // init sheet close
            $('.sheet > h1', true).forEach(function(a) {
                a.addEventListener('click', function() { $activate(a.parentNode, false); });
            });

            // init togglers
            $('*[data-toggle-target]', true).forEach(function(a) {
                a.addEventListener('click', function() {
                    console.info(a);
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

            // $('#search').addEventListener('focus', function() {
            //     $('#toolbar > input[type=button]', true).forEach(function(a) {
            //         if (a.id === 'clear-search') { 
            //             $activate(a, true);
            //         }
            //         else {
            //             $activate(a, false);
            //         }
            //     });
            // });
            // $('#search').addEventListener('blur', function() {
            //     $activate($('#clear-search'), false);
            //         setTimeout(function() {
            //         $('#toolbar > input[type=button]', true).forEach(function(a) {
            //             if (a.id !== 'clear-search') { 
            //                 $activate(a, true);
            //             }
            //         });
            //     }, 0);
            // });

            // $('#show-list').addEventListener('touchstart', function() {
            //     $('#auto-complete').innerHTML = Object.keys(points)
            //         .map(function(nid) {
            //             return points[nid];
            //         })
            //         .sort(function(a, b) {
            //             if (a.escaped) {
            //                 return -1;
            //             }
            //             else {
            //                 return b.state - a.state;
            //             }
            //         })
            //         .map(function(dev) {
            //             return $string('<div data-state="{{state}}" data-nid="{{nid}}">{{nid}}</div>', dev);
            //         }).join('');
            //     $toggle($('#auto-complete'));
            // });

            // $('#search').addEventListener('keyup', function() {
            //     var v = $('#search').value;
            //     if (!v) {
            //         $activate($('#auto-complete'), false);
            //         return;
            //     }

            //     var l = Object.keys(points).filter(function(nid) {
            //         return nid.indexOf(v) !== -1;
            //     });
            //     if (l.length === 0) {
            //         $activate($('#auto-complete'), false);
            //     }
            //     else {
            //         $('#auto-complete').innerHTML = l.map(function(nid) {
            //             return $string('<div data-nid="{{nid}}">{{nid}}</div>', points[nid]);
            //         }).join('');
            //         $activate($('#auto-complete'), true);                    
            //     }
            // });


            // $('#buzz').addEventListener('touchstart', function() {
            //     var nid = $('#_device-detail').getAttribute('data-nid');
            //     if (!nid) {
            //         return;
            //     }

            //     ws.send(JSON.stringify({
            //         nid: nid,
            //         cmd: 'buzz'
            //     }));
            // });

            // $('#clear-search').addEventListener('touchend', function() {
            //     setTimeout(function() {
            //         $('#search').blur();
            //     }, 0);
            //     $('#search').value = '';
            //     focus = null;
            //     $activate($('#auto-complete'), false);
            // });

            // $('#auto-complete').addEventListener('touchstart', function(e) {
            //     var nid = e.target.getAttribute('data-nid');
            //     if (!nid) {
            //         return;
            //     }

            //     $activate($('#auto-complete'), false);                    
            //     $('#search').value = nid;
            //     focus = nid;
            //     map.setCenter({
            //         lat: points[nid].lat,
            //         lng: points[nid].lng
            //     });
            // });

            // $('#use-current-location').addEventListener('click', function() {
            //     $('#lat').value = Math.round(map.getCenter().lat() * 10000) / 10000;
            //     $('#lng').value = Math.round(map.getCenter().lng() * 10000) / 10000;
            //     $('#lat').dispatchEvent(new Event('change'));
            // });

            // $('#state-filter [data-display-mask]', true).forEach(function(i) {
            //     i.addEventListener('click', function() {
            //         app.redraw();
            //     });
            // });

            // (function() {
            //     var fence = null;
                
            //     bounds = $kv.get('geofence');
            //     if (!!bounds.pt1 && !!bounds.pt2) {
            //         fence = new google.maps.Rectangle({
            //             strokeColor: '#0033FF',
            //             strokeOpacity: 0.8,
            //             strokeWeight: 2,
            //             fillColor: '#0033FF',
            //             fillOpacity: 0.2,
            //             map: map,
            //             bounds: {
            //                 north: Math.max(bounds.pt1.lat, bounds.pt2.lat),
            //                 south: Math.min(bounds.pt1.lat, bounds.pt2.lat),
            //                 east: Math.max(bounds.pt1.lng, bounds.pt2.lng),
            //                 west: Math.min(bounds.pt1.lng, bounds.pt2.lng)
            //             }
            //         });
            //     }

            //     $('#add-geofence').addEventListener('touchstart', function() {
            //         if (fence) {
            //             fence.setMap(null);
            //         }
            //         $activate($('#geofence-canvas'), true);
            //     });

            //     var point2LatLng = function (pt) {
            //         var tr = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
            //         var bl = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
            //         var scale = Math.pow(2, map.getZoom());
            //         var wp = new google.maps.Point(pt.clientX / scale + bl.x, pt.clientY / scale + tr.y);
            //         return map.getProjection().fromPointToLatLng(wp).toJSON();
            //     };
            //     var pt1 = null;
            //     var pt2 = null;
            //     var rect = null;
            //     $('#geofence-canvas').addEventListener('touchstart', function(e) {
            //         if (!$('#geofence-canvas').hasAttribute('data-active')) {
            //             return;
            //         }

            //         if (rect) {
            //             rect.setMap(null);
            //             rect = pt1 = pt2 = null;
            //         }
            //         pt1 = pt2 = point2LatLng(e.changedTouches[0]);
            //         rect = new google.maps.Rectangle({
            //             strokeColor: '#FF0000',
            //             strokeOpacity: 0.8,
            //             strokeWeight: 2,
            //             fillColor: '#FF0000',
            //             fillOpacity: 0.2,
            //             map: map,
            //             bounds: {
            //                 north: pt1.lat,
            //                 south: pt1.lat,
            //                 east: pt1.lng,
            //                 west: pt1.lng
            //             }
            //         });
            //     });
            //     $('#geofence-canvas').addEventListener('touchmove', function(e) {
            //         pt2 = point2LatLng(e.changedTouches[0]);
            //         rect.setOptions({
            //             bounds: {
            //                 north: Math.max(pt1.lat, pt2.lat),
            //                 south: Math.min(pt1.lat, pt2.lat),
            //                 east: Math.max(pt1.lng, pt2.lng),
            //                 west: Math.min(pt1.lng, pt2.lng)
            //             }
            //         });
            //     });
            //     $('#geofence-canvas').addEventListener('touchend', function(e) {
            //     });
            //     $('#create-new-fence').addEventListener('touchstart', function(e) {
            //         $kv.set('geofence', bounds = {
            //             pt1: pt1,
            //             pt2: pt2
            //         });
            //         $activate($('#geofence-canvas'), false);
            //         if (fence) {
            //             fence.setMap(null);
            //         }
            //         fence = rect;
            //         fence.setOptions({
            //             strokeColor: '#0033FF',
            //             fillColor: '#0033FF',
            //         });
            //         pt1 = pt2 = rect = null;
            //     }, true);
            //     $('#cancel-new-fence').addEventListener('touchstart', function(e) {
            //         if (rect) {
            //             rect.setMap(null);
            //         }

            //         if (fence) {
            //             fence.setMap(map);
            //         }
            //         $activate($('#geofence-canvas'), false);
            //         pt1 = pt2 = rect = null;
            //     }, true);
            // })();
        },
        redraw: function() {
            var drawchart = function(canvas, reset, color, values, title, range) {
                var ctx = canvas.getContext('2d');
                if (reset) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;                    
                }
                var w = canvas.width;
                var h = canvas.height;
                var m = 8;
                var max = range[0];
                var min = range[1];
                var mid = (max + min) / 2;
                var xstep = (w) / values.length;
                var yrange = (h - 2 * m);
                var ybase = max - min;
                var xyset = values.map(function(v, i) {
                    var y = yrange * (max - v) / ybase;
                    return [xstep * i, m + y];
                });

                if (reset) {
                    var gstep = range[2];
                    var gcenter = range[3];
                    for (var i = Math.ceil(min / gstep) * gstep; i < max; i += gstep) {
                        if (i === gcenter) {
                            ctx.strokeStyle = '#777';  
                        }
                        else {
                            ctx.strokeStyle = '#555';
                        }
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(0, m + yrange * (max - i) / ybase);
                        ctx.lineTo(w, m + yrange * (max - i) / ybase);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }

                ctx.lineWidth = 4;
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(xyset[0][0], xyset[0][1]);
                for (var i = 1; i < xyset.length; ++i) {
                    ctx.lineTo(xyset[i][0], xyset[i][1]);
                }
                ctx.stroke();
                ctx.closePath();


                if (reset) {
                    ctx.beginPath();
                    ctx.font = '24px Verdana';
                    ctx.fillStyle = 'white';
                    ctx.fillText(title, 0, 20);
                    ctx.closePath();                    
                }
            };

            var last = history[historyLength - 1][selected];
            drawchart($('#temperature'), true, 'orange', history.map(function(o) {
                return o[selected].t;
            }), '溫度 - ' + last.t + ' ºC', [60, -20, 10, 0]);

            drawchart($('#humidity'), true, 'lightblue', history.map(function(o) {
                return o[selected].h;
            }), '相對濕度 - ' + last.h + ' %', [100, 0, 10, 40]);

            drawchart($('#g-force'), true, 'lightgreen', history.map(function(o) {
                return o[selected].g.g_x;
            }), '震動 - ' + last.g.sum + ' g', [2, 0, 0.4, 1]);
            drawchart($('#g-force'), false, 'lightblue', history.map(function(o) {
                return o[selected].g.g_y;
            }), '', [2, 0]);
            drawchart($('#g-force'), false, 'lightyellow', history.map(function(o) {
                return o[selected].g.g_z;
            }), '', [2, 0]);
            drawchart($('#g-force'), false, 'red', history.map(function(o) {
                return o[selected].g.sum;
            }), '', [2, 0]);


            // if (Object.keys(markerClusters).length === 0) {
            //     for (var i = 0; i < $('#state-filter [data-display-mask]', true).length - 1; ++i) {
            //         var p = Math.pow(2, i);
            //         markerClusters[p] = new MarkerClusterer(map, [], {
            //             imagePath: 'img/mc-' + p + 'm'
            //         });
            //     }
            // }
            // Object.keys(markerClusters).forEach(function(k) {
            //     markerClusters[k].clearMarkers();
            // });

            // var mask = $('#state-filter [data-active]').getAttribute('data-display-mask') * 1;
            // Object.keys(points).map(function(k) { return points[k]; }).forEach(function(pt, i) {
            //     var marker = new google.maps.Marker({
            //         position: { lat: pt.lat * 1, lng: pt.lng * 1 },
            //         label: pt.nid,
            //         icon: 'img/m' + pt.state + '.png'
            //     });
            //     markerClusters[pt.state].addMarkers([marker], false);
            //     marker.addListener('click', function(e) {
            //         var pt = points[this.label];
            //         $('#_device-detail input', true).forEach(function(i) {
            //             if (!i.name) { return; }
            //             i.value = (pt[i.name] || '').toString();
            //         });
            //         $('#_device-detail').setAttribute('data-nid', this.label);
            //         $activate($('#_device-detail'), true);
            //     });
            // });
            // $('#escaped').innerHTML = Object.keys(points).filter(function(k) {
            //     return points[k].escaped;
            // }).length;

            // $('#all').innerHTML = Object.keys(points).length;
            // $('[data-display-mask]', true).forEach(function(m) {
            //     var mc = markerClusters[m.getAttribute('data-display-mask')];
            //     if (mc) {
            //         m.innerHTML = mc.getMarkers().length;
            //     }
            // });
            // Object.keys(markerClusters).forEach(function(k) {
            //     if (!(k & mask)) {
            //         markerClusters[k].clearMarkers();
            //     }
            //     markerClusters[k].redraw();
            // });
        },
        alert: function(e) {
            alert(e);
        },
        selectDevice: function(e) {
            var mac = this.getAttribute('data-mac').substr(1);
            if (selected !== mac) {
                selected = mac;
                app.redraw();
            }
            console.info(mac);
        },
        connect: function(id) {
            setInterval(function() {
                http.get('http://10.10.1.1:8081/etag.get_dev_list')
                // Promise.resolve({
                //     success: "true",
                //     objects: [
                //         {
                //             mac: 'abcdef',
                //             h: 30 + Math.random() + '',
                //             t: 27 + Math.random() + '',
                //             g: {
                //                 g_x: 1.3 + Math.random() * 0.1 + '',
                //                 g_y: 0.01 + Math.random() * 0.05 + '',
                //                 g_z: 0.02 + Math.random() * 0.05 + ''
                //             },
                //             lt: '2018-04-13-13-08-58'
                //         }, null
                //     ]
                // })
                    .then(function(r) {
                        if (r.success != 'true') {
                            return;
                        }

                        var devs = r.objects.filter(function(o) { return !!o; });
                        devs.forEach(function(o) {
                            o.h = Math.round(o.h * 100) / 100;
                            o.t = Math.round(o.t * 100) / 100;
                            o.g.g_x = Math.round(o.g.g_x * 100) / 100;
                            o.g.g_y = Math.round(o.g.g_y * 100) / 100;
                            o.g.g_z = Math.round(o.g.g_z * 100) / 100;
                        })
                        if (history.length === historyLength) {
                            for (var i = 1; i < historyLength; ++i) {
                                history[i - 1] = history[i];
                            }
                            history[historyLength - 1] = devs.reduce(function(p, c) {
                                p[c.mac] = c;
                                return p;
                            }, {});
                        }
                        else {
                            var en = devs.reduce(function(p, c) {
                                p[c.mac] = c;
                                return p;
                            }, {});
                            for (var i = 0; i < historyLength; ++i) {
                                history[i] = en;
                            }
                        }

                        devs.forEach(function(dev) {
                            if (!selected) {
                                selected = dev.mac;
                            }

                            dev.g.sum = Math.round(Math.sqrt(
                                dev.g.g_x * dev.g.g_x +
                                dev.g.g_y * dev.g.g_y +
                                dev.g.g_z * dev.g.g_z
                            ) * 100) / 100;
                            var a = $('#_device-list .devitem[data-mac=m' + dev.mac + ']');
                            if (!a) {
                                $('#_device-list > div').innerHTML += 
                                    '<fieldset class="devitem" data-mac="m' + dev.mac + '">' +
                                        '<legend data-bind="mac"></legend>' +
                                        '<label>溫度</label>' +
                                        '<input data-bind="t" readonly="readonly"><br>' +
                                        '<label>相對濕度</label>' +
                                        '<input data-bind="h" readonly="readonly"><br>' +
                                        '<label>震動</label>' +
                                        '<input data-bind="g.sum" readonly="readonly"><br>' +
                                        '<label>最後回報時間</label>' +
                                        '<input data-bind="lt" readonly="readonly"><br>' +
                                    '</fieldset>';
                            }
                        });
                        setTimeout(function() {
                            devs.forEach(function(dev) {
                                var a = $('#_device-list .devitem[data-mac=m' + dev.mac + ']');
                                if (!a.onclick) {
                                    a.onclick = app.selectDevice;
                                }
                                $(a, '[data-bind]', true).forEach(function(i) {
                                    if (i.readOnly) {
                                        i.value = eval('dev.' + i.getAttribute('data-bind'));
                                    }
                                    else {
                                        i.innerHTML = eval('dev.' + i.getAttribute('data-bind')); 
                                    }
                                });
                            });
                        }, 0);
                        app.redraw();
                    })
                    .catch(function(e) {
                        app.alert(e);
                    });
            }, 1000);
        }
    }; 
})();
