$('#store-state').onclick = function() {
    var name = prompt('Enter Name');
    console.info(name)
    if (!name) {
        return;
    }
    $gateway.saveState($app.currentFilter || '', name);
};

$app.onPageInitOrBeforeAnimation('scenario', function() {
    var filter = $app.currentFilter || '';
    var states = $gateway.savedStates(filter);
    $('#scenario-list').innerHTML = '';

    states.forEach(function(name) {
        var item = $templates('#scenario-item', {name:name, description:''});
        $('#scenario-list').innerHTML += item;
    })

    setTimeout(function() {
        [].forEach.call($('.scenario-item .item-title', true), function(el) {
            el.onclick = function() {
                var states = $gateway.getState(filter, this.innerHTML);
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
    }, 0);
});