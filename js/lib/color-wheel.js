;(function(window, undefined) {
    "use strict";

    function extend() {
        for(var i=1; i < arguments.length; i++) {
            for(var key in arguments[i]) {
                if(arguments[i].hasOwnProperty(key)) {
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    }

    var pluginName = "tinycolorpicker"
    ,   defaults   = {
            backgroundUrl : null
        }
    ;

    function Plugin($container, options) {
        /**
         * The options of the colorpicker extended with the defaults.
         *
         * @property options
         * @type Object
         */
        this.options = extend({}, defaults, options);

        /**
         * @property _defaults
         * @type Object
         * @private
         * @default defaults
         */
        this._defaults = defaults;

        /**
         * @property _name
         * @type String
         * @private
         * @final
         * @default 'tinycolorpicker'
         */
        this._name = pluginName;

        var self          = this
        ,   $track        = $container.querySelectorAll(".track")[0]
        ,   $dropdown     = $container.querySelectorAll(".dropdown")[0]
        ,   $color        = $container.querySelectorAll(".color")[0]
        ,   $colorInner   = $container.querySelectorAll(".colorInner")[0]
        ,   $canvas       = null

        ,   context      = null
        ,   hasCanvas    = !!document.createElement("canvas").getContext
        ,   changeEvent  = document.createEvent("HTMLEvents")
        ;

        changeEvent.initEvent("change", true, true);

        /**
         * The current active color in hex.
         *
         * @property colorHex
         * @type String
         * @default ""
         */
        this.colorHex = "";

        /**
         * The current active color in rgb.
         *
         * @property colorRGB
         * @type String
         * @default ""
         */
        this.colorRGB = "";

        /**
         * @method _initialize
         * @private
         */
        function _initialize() {
            if(hasCanvas) {
                $canvas = document.createElement("canvas");
                $track.appendChild($canvas);

                context = $canvas.getContext("2d");

                _setImage();
            }

            _setEvents();

            return self;
        }

        /**
         * @method _setImage
         * @private
         */
        function _setImage() {
            var colorPicker   = new Image()
            ,   style         = $track.currentStyle || window.getComputedStyle($track, false)
            ,   backgroundUrl = style.backgroundImage.replace(/"/g, "").replace(/url\(|\)$/ig, "")
            ;

            colorPicker.crossOrigin = "Anonymous";
            $track.style.backgroundImage = "none";

            colorPicker.onload = function() {
                $canvas.width = this.width;
                $canvas.height = this.height;

                context.drawImage(colorPicker, 0, 0, this.width, this.height);
            };

            colorPicker.src = self.options.backgroundUrl || backgroundUrl;
        }

        /**
         * @method _setEvents
         * @private
         */
        function _setEvents() {
            if(hasCanvas) {
                var closeCanvas = function(code) {
                    self.close();
                    document.removeEventListener('mousedown', closeCanvas);
                };
                $color.addEventListener('touchstart', function(event) {
                    event.stopPropagation();
                    if ($container.disabled) {
                        return;
                    }

                    $dropdown.style.display = 
                    $track.style.display = 'block';
                    document.addEventListener('touchstart', closeCanvas, {capture:false,passive: true});
                }, {passive: true});

                $dropdown.addEventListener('touchstart', function(event) {
                    event.stopPropagation();
                }, {passive:true});

                $canvas.addEventListener('touchstart', function(event) {
                    if ($track.disabled) {
                        return;
                    }
                    _getColorCanvas(event.touches[0]);
                    event.stopPropagation();
                }, {passive:true});

                $canvas.addEventListener('touchmove', function(event) {
                    if ($track.disabled) {
                        return;
                    }
                    _getColorCanvas(event.touches[0]);
                    event.stopPropagation();
                }, {passive:true});

                $canvas.addEventListener('touchend', function(event) {
                    if ($track.disabled) {
                        return;
                    }
                    closeCanvas();
                    event.stopPropagation();
                }, {passive:true});
            }
        }

        /**
         * @method _getColorCanvas
         * @private
         */
        function _getColorCanvas(event) {
            var offset    = event.target.getBoundingClientRect()
            ,   colorData = context.getImageData(event.clientX - offset.left, event.clientY - offset.top, 1, 1).data
            ;

            self.setColor("rgb(" + colorData[0] + "," + colorData[1] + "," + colorData[2] + ")");
            $container.colorData = changeEvent.colorData = colorData.slice(0, 3);
            $container.colorHex = changeEvent.colorHex = self.colorHex;
            $container.colorRGB = changeEvent.colorRGB = self.colorRGB;

            $container.dispatchEvent(changeEvent);
        }

        /**
         * Set the color to a given hex or rgb color.
         *
         * @method setColor
         * @chainable
         */
        this.setColor = function(color) {
            if(color.indexOf("#") >= 0) {
                self.fromHex(color);
            }
            else {
                self.fromRGB(color);
            }

            ($colorInner) && ($colorInner.style.backgroundColor = self.colorHex);
        };

        /**
         * Close the picker
         *
         * @method close
         * @chainable
         */
        this.close = function() {
            $dropdown.style.display = 
            $track.style.display = 'none';
        };

        this.fromHex = function(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            var r = parseInt(result[1], 16);
            var g = parseInt(result[2], 16);
            var b = parseInt(result[3], 16);

            $container.colorHex = self.colorHex = hex;
            $container.colorRGB = self.colorRGB = 'rgb(' + r + ',' + g + ',' + b + ')';
            $container.colorData = self.colorData = [r,g,b];
        };

        this.fromRGB = function(rgb) {
            var result = rgb.match(/\d+/g);
            var r = result[0];
            var g = result[0];
            var b = result[0];

            function hex(x) {
                var digits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F");
                return isNaN(x) ? "00" : digits[(x - x % 16 ) / 16] + digits[x % 16];
            }

            $container.colorHex = self.colorHex = '#' + hex(r) + hex(g) + hex(b);
            $container.colorRGB = rgb;
            $container.colorData = self.colorData = [r,g,b];
        };

       return _initialize();
    }

    /**
     * @class window.tinycolorpicker
     * @constructor
     * @param {Object} $container
     * @param {Object} options
        @param {String} [options.backgroundUrl=''] It will look for a css image on the track div. If not found it will look if there's a url in this property.
     */
    var tinycolorpicker = function($container, options) {
        return new Plugin($container, options);
    };

    if(typeof define == 'function' && define.amd) {
        define(function(){ return tinycolorpicker; });
    }
    else if(typeof module === 'object' && module.exports) {
        module.exports = tinycolorpicker;
    }
    else {
        window.tinycolorpicker = tinycolorpicker;
    }
})(window);