$app.onPageInit('new-scenario', function(page) {
    $('#save').onclick = function() {
        var name = $('#scenario-name').value;
        if (!name) {
            return;
        }
        var description = $('#scenario-description').value;
        $gateway.saveState($app.currentFilter || '', name, description);
    };
});

