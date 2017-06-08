$app.onPageInitOrBeforeAnimation('*', function(e) {
    if (!e.name) {
        return;
    }

    var tid = '/#' + e.name;
    [].forEach.call($('.toolbar .link i', true), function(el) {
        var name = el.innerHTML.replace('_fill', '');
        if (el.parentNode.href.endsWith(tid)) {
            el.innerHTML = name + '_fill';
        }
        else {
            el.innerHTML = name;
        }
    });
});
