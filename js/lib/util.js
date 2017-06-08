var rgbString = function(obj) {
    var r = obj.levelR;
    var g = obj.levelG;
    var b = obj.levelB;
    var rx = Math.round(r * 2.55).toString(16); if (rx.length === 1) { rx = '0' + rx; }
    var gx = Math.round(g * 2.55).toString(16); if (gx.length === 1) { gx = '0' + gx; }
    var bx = Math.round(b * 2.55).toString(16); if (bx.length === 1) { bx = '0' + bx; }
    return rx + gx + bx;
};
var wString = function(obj) {
    var w = obj.levelW;
    var wx = Math.round(w * 2.55).toString(16); if (wx.length === 1) { wx = '0' + wx; }
    return wx + wx + wx;
};
var statusToChecked = function(obj) {
    return obj.enable === '1';
};
