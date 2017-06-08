$('#store-state').onclick = function() {
    $mainView.router.loadPage('new-scenario.html');
};

$app.onPageInitOrBeforeAnimation('scenario', function() {
    var filter = $app.currentFilter || '';
    var states = $gateway.savedStates(filter);
    $('#scenario-list').innerHTML = '';

    states.forEach(function(name) {
        var saved = $gateway.getState(filter, name);
        var item = $templates('#scenario-item', {
            name:name, 
            description:saved.description
        });
        $('#scenario-list').innerHTML += item;
    })

    setTimeout(function() {
        [].forEach.call($('.scenario-item .item-title', true), function(el) {
            el.onclick = function() {
                var saved = $gateway.getState(filter, this.innerHTML);
                var states = saved.states;
                [].forEach.call(Object.keys(states), function(mac) {
                    var state = states[mac];
                    var cb = applySavedScenario[state.type];
                    if (!cb) {
                        return;
                    }
                    cb(state);
                });
            };
        });
        [].forEach.call($('.scenario-item .item-title', true), function(el) {
            el.onclick = function() {
                var saved = $gateway.getState(filter, this.innerHTML);
                var states = saved.states;
                [].forEach.call(Object.keys(states), function(mac) {
                    var state = states[mac];
                    var cb = applySavedScenario[state.type];
                    if (!cb) {
                        return;
                    }
                    cb(state);
                });
            };
        });
        [].forEach.call($('.swipeout-actions-right .delete', true), function(el) {
            var filter = $app.currentFilter || '';
            el.onclick = function() {
                var name = el.getAttribute('data-scenario-name');
                $gateway.deleteState(filter, name);
                var item = $('.swipeout[data-scenario-name="' + name + '"]');
                console.info(item.tagName);
                item.parentNode.removeChild(item);
            };
        });
    }, 0);
});