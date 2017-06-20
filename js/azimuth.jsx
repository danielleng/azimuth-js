'use strict';

const Azimuth = function() {
    /** ==========================================================================================
     * PRIVATE METHODS AND PROPERTIES
     * ===========================================================================================
     */
        // Global Variables.
        // These are not modified after Azimuth initializes successfully, and is globally referenced throughout Azimuth's code.
        // The config objects passed in during initialization is stored as reference in starConfigs and warpConfigs.
    let starConfigs;                // config object for Star Field
    let warpConfigs;                // config object for Warp Field
    let canvas;                     // Canvas element that this Azimuth object operates on
    let context;                    // Context from the Canvas element that this Azimuth object operates on
    let animationGridQuadrants;     // Used to quickly identify a specific star is in which quadrant

    // Global State Variables.
    // These are reset when Azimuth needs to restart from clean slate. (See this.reset() function for more details)
    let viewport = { width: 0, height: 0 };
    let frames = 0;             // The current animated frame. Incremented with each call to animate(), which is called in requestAnimationFrame
    let staticEntities = [];    // Array of stars/entities that don't need to be animated
    let animatables = [];       // Array of stars/entities that need to be animated
    let idPlaceholder = 0;      // ID value used to identify all animatable stars

    // Utility functions
    const Util = {
        getRandomInt: function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        },
        flipCoin: function() {
            return (Math.random() > 0.5);
        },
        hexToRgb: function(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        rgbToHex: function(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        updateViewportAndCanvas: function() {
            viewport.width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;

            viewport.height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;


            canvas.width = viewport.width;
            canvas.height = viewport.height;
        }
    };

    // Easing functions
    const Easer = {
        // t: current time, b: begInnIng value, c: change In value, d: duration
        easeInOutSine: function (t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },
        easeInSine: function (t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOutSine: function (t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        }
    };

    // Utility functions for creating and drawing Regular Stars, Blinker Stars and Warp Entities.
    const ArtBox = (function() {
        /**
         * PRIVATE METHODS AND PROPERTIES
         */
        const getRegularStarTemplate = (function () {
            /**
             * Rendering templates for Regular stars
             */
            const REGULAR_STAR_TEMPLATES = [
                {radius: 1, hue: '#5c6467'},  // gray
                {radius: 1, hue: '#b5bdc0'},  // light gray
                {radius: 1, hue: '#484848'},  // dark gray
                {radius: 1, hue: '#fff'},     // white

                {radius: 2, hue: '#fff'},     // white
                {radius: 2, hue: '#5c6467'}   // gray
            ];

            return function() {
                return REGULAR_STAR_TEMPLATES[Util.getRandomInt(0, REGULAR_STAR_TEMPLATES.length)];
            }
        })();
        const getBlinkerStarTemplate = (function () {
            /**
             * Rendering templates for Blinker stars
             */
            const BLINKER_STAR_TEMPLATES = [
                {radius: 4, hue: 'rgba(153, 153, 255, 0.9)'},
                {radius: 4, hue: 'rgba(75, 0, 130, 0.95)'},
                {radius: 4, hue: 'rgba(15, 10, 250, 0.3)'},
                {radius: 3, hue: 'rgba(75, 0, 130, 0.7)'},
                {radius: 4, hue: 'rgba(102, 153, 255, 0.9)'},
                {radius: 4, hue: 'rgba(56, 93, 190, 0.9)'},
                {radius: 3, hue: 'rgba(204, 153, 255, 1.0)'}
            ];

            return function() {
                return BLINKER_STAR_TEMPLATES[Util.getRandomInt(0, BLINKER_STAR_TEMPLATES.length)];
            };
        })();
        const getWarpEntityTemplate = (function () {
            // 10 pixels per second = 0.17 pixels per frame
            // 20 pixels per second = 0.33 pixels per frame
            // 30 pixels per second = 0.51 pixels per frame
            // 50 pixels per second = 0.85 pixels per frame
            // const speed = {
            //     veryslow: 0.17,
            //     slow: 0.33,
            //     normal:0.51,
            //     slightlyfast: 0.65,
            //     fast: 0.85,
            //     veryfast: 0.90
            // };
            const speed = {
                veryslow: 2.5,
                slow: 3,
                normal: 5,
                slightlyfast: 6,
                fast: 8,
                veryfast: 10
            };

            const WARP_ENTITY_TEMPLATES = [
                {width: 1, height: 3, speed: speed.slightlyfast},
                {width: 1, height: 5, speed: speed.veryfast},
                {width: 1, height: 7, speed: speed.slow},
                {width: 1, height: 8, speed: speed.fast},
                {width: 1, height: 9, speed: speed.normal},
                {width: 1, height: 10, speed: speed.slow},
                {width: 1, height: 11, speed: speed.fast},
                {width: 1, height: 12, speed: speed.veryfast}
            ];

            return function() {
                return WARP_ENTITY_TEMPLATES[Util.getRandomInt(0, WARP_ENTITY_TEMPLATES.length)];
            };
        })();

        const clearCircle = function (x, y, radius) {
            context.save();
            context.beginPath();
            context.arc(x, y, radius, 0, 2*Math.PI, true);
            context.clip();
            context.clearRect(x-radius, y-radius, radius*2, radius*2);
            context.restore();
        };
        const drawRegularStar = function (x, y, radius, color) {
            context.save();
            context.fillStyle = color;
            context.fillRect(x, y, radius, radius);
            context.restore();
        };
        const drawBlinkerStar = function (x, y, radius, color) {
            context.save();
            clearCircle(x, y, radius);
            let grd = context.createRadialGradient(x, y, radius, x, y, 0);
            grd.addColorStop(0, 'rgba(18,25,28,0.5)');
            grd.addColorStop(0.90, color);
            grd.addColorStop(0.95, 'rgba(255,255,255,0.9)');

            context.fillStyle = grd;
            context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
            context.restore();
        };

        // WarpEntity Class
        const WarpEntity = function(x, y, _width, _height, _speed) {
            this.x = x;
            this.y = y;
            this.width = _width;
            this.height = _height;
            this.speed = _speed;

            // Assuming our warp field config sets the animation from bottom of screen to top of screen
            this.maxTravelDistance = viewport.height - (viewport.height * 1.15);
            this.spawnPointY = viewport.height + 100;
        };
        WarpEntity.prototype.animate = function() {
            this.clear();
            if (this.y >= this.maxTravelDistance && this.y <= this.spawnPointY) {
                this.y -= this.speed;

            } else if (this.y < this.maxTravelDistance) {
                this.respawn(this.spawnPointY);
            }
            this.draw();
        };
        WarpEntity.prototype.clear = function() {
            context.clearRect(this.x, this.y, this.width, this.height + 5);
        };
        WarpEntity.prototype.draw = function() {
            context.save();
            context.fillStyle = 'white';
            context.fillRect(this.x, this.y, this.width, this.height);
            context.restore();
        };
        WarpEntity.prototype.respawn = function(spawnPointY) {
            this.x = Util.getRandomInt(1, viewport.width);
            this.y = spawnPointY;
        };

        /**
         * PUBLIC METHODS AND PROPERTIES
         */
        const clearCanvas = function () {
            console.log("Clearing entire canvas: w:" + viewport.width + ", h:" + viewport.height);
            context.save();
            context.clearRect(0, 0, viewport.width, viewport.height);
            context.restore();
        };
        const createRegularStar = function (x, y, radius, color) {
            let starTemplate = getRegularStarTemplate();
            let _radius = radius || starTemplate.radius;
            let _color = color || starTemplate.hue;

            let regularStar = {
                x: x,
                y: y,
                radius: _radius,
                color: _color
            };

            drawRegularStar(x, y, _radius, _color);
            staticEntities.push(regularStar);
        };
        const createBlinkerStar = function (x, y, radius, color, animationConfig) {
            // animationConfig = {maxRadius, animationDuration, animationDelay}
            let starTemplate = getBlinkerStarTemplate();
            let _radius = radius || starTemplate.radius;
            let _color = color || starTemplate.hue;

            let blinkerStar = {
                x: x,
                y: y,
                radius: _radius,
                color: _color,
                id: idPlaceholder++,
                drawBlinkerStar: drawBlinkerStar,

                animate: (function() {
                    // Minimum size of the animated Star in pixels
                    const minWidth = _radius;

                    // Maximum size of the animated star in pixels
                    const maxWidth = _radius * 3;

                    // How long to wait before running one animation cycle. (Minimum 10 seconds, maximum 45 seconds) (1 second = 60 frames)
                    const animationDelay = (animationConfig) ? animationConfig.animationDelay : Util.getRandomInt(200, 2100);

                    // How long to run the enlarging animation for.
                    const animationDurationIn = (animationConfig) ? animationConfig.animationDuration : Util.getRandomInt(600, 1200);

                    // How long to run the contracting animation for.
                    const animationDurationOut = animationDurationIn;

                    // Current Animating Cycle
                    let currentAnimationCycle = 0;

                    // When to run the next animation
                    let nextAnimationCycle = frames + animationDelay;

                    // Are we currently animating ? 
                    let animating = false;

                    // Whats the current animated radius of the star ?
                    let currentRadius = minWidth;

                    return function() {
                        if (!animating) {
                            if (frames >= nextAnimationCycle) {
                                animating = true;
                            }
                        } else {
                            // Animate expanding star.
                            if (currentAnimationCycle <= animationDurationIn) {
                                currentRadius = Easer.easeInSine(currentAnimationCycle, minWidth, (maxWidth - minWidth), animationDurationIn);
                                this.drawBlinkerStar(this.x, this.y, currentRadius, this.color);

                                // Animate contracting star.
                            } else if (currentAnimationCycle > animationDurationIn && currentAnimationCycle <= animationDurationOut * 2) {
                                this.drawBlinkerStar(
                                    this.x,
                                    this.y,
                                    Easer.easeOutSine(currentAnimationCycle - animationDurationOut, currentRadius, minWidth - currentRadius, animationDurationOut),
                                    this.color);

                                // End of animation cycle. Reset animation state.
                            } else if (currentAnimationCycle > animationDurationOut) {
                                this.drawBlinkerStar(this.x, this.y, this.radius, this.color);
                                animating = false;
                                currentAnimationCycle = 0;
                                nextAnimationCycle = frames + animationDelay;
                            }
                            // Update animation cycle
                            currentAnimationCycle++;
                        }
                    }
                })()
            };
            // Draw an initial star
            drawBlinkerStar(x, y, _radius, _color);
            // Add to list of animatables
            animatables.push(blinkerStar);
        };
        const deleteBlinkerStar = function(star) {
            let success = false;
            for (let i = 0; i < animatables.length; i++) {
                if (animatables[i].id && animatables[i].id === star.id) {
                    animatables.splice(i);
                    success = true;
                    break;
                }
            }
            return success;
        };
        const createWarpEntity = function(x, y, width, height, speed) {
            let template = getWarpEntityTemplate();
            let _width = width || template.width;
            let _height = height || template.height;
            let _speed = speed || template.speed;

            let warpEntity = new WarpEntity(x, y, _width, _height, _speed);
            animatables.push(warpEntity);
        };

        return {
            clearCanvas: clearCanvas,
            createRegularStar: createRegularStar,
            createBlinkerStar: createBlinkerStar,
            deleteBlinkerStar: deleteBlinkerStar,
            createWarpEntity: createWarpEntity
        }
    })();

    // Creates a Star Field. Only called internally in Azimuth.
    const createStarField = function (configs) {
        // renderSize, minStars, maxStars
        let renderSize, minStars, maxStars;
        if (configs) {
            renderSize = configs.renderSize || 100;
            minStars = configs.minStars || 3;
            maxStars = configs.maxStars || 8;
        } else {
            // Defaults
            renderSize = 100;
            minStars = 3;
            maxStars = 8;
        }

        let horizontalRenderBoxes = Math.ceil(viewport.width / renderSize);     // number of horizontal boxes
        let verticalRenderBoxes = Math.ceil(viewport.height / renderSize);      // number of vertical boxes

        for ( let v = 1; v <= verticalRenderBoxes; v++ ) {
            for ( let h = 1; h <= horizontalRenderBoxes; h++ ) {
                let numOfStars = Util.getRandomInt( minStars , maxStars );

                for ( let stars = 0; stars < numOfStars; stars++ ) {
                    let x = Util.getRandomInt((h-1) * renderSize, h * renderSize);
                    let y = Util.getRandomInt((v-1) * renderSize, v * renderSize);
                    ArtBox.createRegularStar(x, y);
                }

                //if (Util.flipCoin()) {
                if ( Util.getRandomInt(1, 16) === 1 ) {
                    let x = Util.getRandomInt((h-1) * renderSize, h * renderSize);
                    let y = Util.getRandomInt((v-1) * renderSize, v * renderSize);
                    ArtBox.createBlinkerStar(x, y);
                }
            }
        }
    };

    // Creates a Warp Field. Only called internally in Azimuth.
    const createWarpField = function (configs) {
        // renderSize, minEntities, maxEntities, animateNow
        let renderSize = configs.renderSize || 100;
        let minEntities = configs.minEntities || 10;
        let maxEntities = configs.maxEntities || 11;

        //let max = 10;
        for ( let entities = 0; entities < maxEntities; entities++ ) {
            setTimeout(function() {
                let x = Util.getRandomInt(1, viewport.width);
                ArtBox.createWarpEntity(x, viewport.height + 100);
            }, Util.getRandomInt(100, 3000));
        }
    };

    /** ==========================================================================================
     * PUBLIC METHODS AND PROPERTIES
     * ===========================================================================================
     */
    const reset = function() {
        // clear canvas.
        ArtBox.clearCanvas();

        // update viewport sizing.
        Util.updateViewportAndCanvas();

        // clear animatables and statics
        animatables.length = 0;
        staticEntities.length = 0;

        // reset frames to 0.
        frames = 0;

        // reset ID placeholder
        idPlaceholder = 0;

        // check if we have existing starConfigs config. If yes, pass in to createStarField
        createStarField(starConfigs);
        console.log("Reset complete.");

        // check if we have existing warpConfigs config. 
        createWarpField(warpConfigs);
    };
    const animate = function () {
        for (var i = 0; i < animatables.length; i++) {
            animatables[i].animate();
        }
        frames++;
    };
    const init = function (theCanvas, configs) {
        canvas = theCanvas;
        if (!canvas) {
            console.log("Cannot create Star or Warp Field. Please pass in a canvas object. Azimuth will not initialize.");
            return;
        }
        context = canvas.getContext('2d');
        if (!context) {
            console.log("Cannot retrieve 2D context from Canvas. Azimuth will not initialize.");
            return;
        }
        Util.updateViewportAndCanvas();

        if (configs) {
            // Check if we have a config object for star field
            if (configs.starConfigs) {
                starConfigs = configs.starConfigs;
                createStarField(configs.starConfigs);
            }
            // Check if we have a config object for warp field
            if (configs.warpConfigs) {
                warpConfigs = configs.warpConfigs;
                createWarpField(configs.warpConfigs);
            }
        } else {
            console.log("Config objects starConfigs and warpConfigs not passed in! Will not continue initialization.");
            return;
        }

        // Initialisation of library successful, remove the function. 
        // Add pointers to animate() and reset()
        this.init = null;
        this.animate = animate;
        this.reset = reset;
        console.log("Azimuth initialized. Animation can now begin via Azimuth.animate(). Please use RequestAnimationFrame.");
    };

    return {
        init: init
    }
};