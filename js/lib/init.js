var $log = function(msg) {
//    $('#page-title').innerHTML = msg;
};

var $app = new Framework7({
    init: false
    // material: true
});

var $db = window.localStorage;
var $$ = Dom7;
var $mainView = $app.addView('.view-main', {
    domCache: true, //enable inline pages
    dynamicNavbar: true
});

$app.onPageInitOrBeforeAnimation = function(page, cb) {
    $app.onPageInit(page, cb);
    $app.onPageBeforeAnimation(page, cb);
};
$app.currentFilter = null;
