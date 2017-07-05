var $strings = function(json) {
    var localize = function(page) {
        var def = json[page] || {};
        var elements = $('*[data-i18n-key]', true);
        [].forEach.call(elements, function(el) {
            var key = el.getAttribute('data-i18n-key');
            if (!key) {
                return;
            }

            var kv = key.split(':');
            var k = kv[0];
            var p = kv[1] || 'innerHTML';
            el[p] = def[k] || json[k] || k;
        });

        $templates(null, def);
    };

    $app.onPageInit('*', function(e) {
        localize(e.name);
    });
    $app.onPageBeforeAnimation('*', function(e) {
        localize(e.name);
    });
        $app.init();
        return;
    window.plugins.html5Video.initialize({
        'boot-video': 'img/boot2.m4v'
    });
    window.plugins.html5Video.play('boot-video', function(e) {
        $app.init();
    });

// console.info()
// window.plugins.videoPlayer.play("file:///path/to/my/video.mp4");
    // $mainView.router.loadPage('#floorplan');
};

var $templates = (function() {
    var cts = {};
    var lang = {};
    return function(id, context) {
        if (!id) {
            lang = Object.keys(context).reduce(function(p, k) {
                lang['_lang_' + k] = context[k];
                return lang;
            }, {});
            return ctx = {};
        }

// console.info(id);
        var ct = cts[id];
        if (!ct) {
            var htm = $$(id).html();
            if (!htm) {
                return (cts[id] = function() { return ''; })();
            }
            ct = cts[id] = Template7.compile(htm);
        }

        var ctx = {};
        Object.keys(lang).forEach(function(k) {
            ctx[k] = lang[k];
        });
        Object.keys(context).forEach(function(k) {
            if (k.startsWith('::')) {
                ctx[k.substring(2)] = lang['_lang_' + context[k]];
            }
            else {
                ctx[k] = context[k];                
            }
        });
        return ct(ctx);
    };
})();


// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    var load = function(lang) {
        lang = 'en-US';
        var el = document.createElement('script');
        el.type = 'text/javascript';
        el.onload = function() {
            // $log('got ' + el.src);
        };
        el.onerror = function() {
            // $log('err ' + el.src);
        };
        // $log('append2 ' + lang);
        document.querySelector('head').appendChild(el);        
        el.src = 'i18n/' + lang + '/strings.js';
    };
    // $log('deviceready');
    navigator.globalization.getPreferredLanguage(
        function(locale) { load(locale.value || 'en-US'); },
        function() { load('en-US'); }
    );
});