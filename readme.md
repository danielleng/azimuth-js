# Azimuth.js

## v1.0.0 Alpha

Automatically generate beautiful animated star fields and warp fields on HTML5 Canvas elements.
```
let cvs = document.getElementById('canvas');
let starField = new Azimuth();

starField.init(cvs, {
    starConfigs: {
        renderSize: 100,
        minStars: 1,
        maxStars: 8
    },
    warpConfigs: {
        renderSize: 10,
        minEntities: 5,
        maxEntities: 10
    }
});
```

```
// Listen for window resizing events with a debounce method, then reset Azimuth accordingly
$( window ).resize( debounce(function() {
    if (starField) {
        starField.reset();
    })
);
```
Example of **debounce** function available in [Underscore.js](http://underscorejs.org/#debounce) .

## Demos Running Azimuth.js

1. My personal website: http://dleng.xyz

## Getting Started

### Installing

1. Clone the repository.
2. Change directory into repository root, run `npm init`
3. After npm packages install successfully, you are ready to start developing Azimuth. See Deployment section below for details on generating minified copy.
4. See list of Github tasks for development.

## Running the tests

Tests are currently being written and will be updated in the repository soon.

## Deployment

To produce a minified copy of Azimuth, run `gulp build`. The file will be created in `dist/js`

## Notes on ES6 Development

The source code is written in ES6 syntax, and transpiled into ES5 using Babel via Gulp. (See gulpfile.js)


## Authors

* **Daniel Leng** - *Initial work* - [dleng.xyz](http://dleng.xyz)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgements

1. Simple Javascript Easing Functions - by [Gaëtan Renaudeau](https://gist.github.com/gre/1650294)