"use strict";

// GULP Readme: https://github.com/gulpjs/gulp/tree/master/docs/recipes

const gulp = require('gulp');
const source = require('vinyl-source-stream');
const babel = require('gulp-babel');

const uglify = require('gulp-uglify');
const pump = require('pump');

const concat = require('gulp-concat');
const rename = require('gulp-rename');


gulp.task('default', ['watch']);
gulp.task('build', ['babel']);


/** =======================================
 * Javascript files, .jsx transpiling
 *  =======================================
 */
gulp.task('babel', () => {
    return gulp.src([
        'js/azimuth.jsx'
    ])
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('azimuth.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

// gulp.task('js-compress',['babel'], function(){
//     return gulp.src([
//         'js/vendor/jquery-1.12.0.min.js',
//         'js/vendor/bootstrap.min.js',
//         'js/plugins.js',
//
//         'js/vendor/greensock-js/TweenLite.js',
//         'js/vendor/greensock-js/plugins/CSSPlugin.js',
//
//         'js/local.min.js'
//     ])
//         .pipe(concat('all.min.js'))
//         // .pipe(uglify())
//         //.pipe(gulp.dest('js'))
//         .pipe(gulp.dest('dist/js'));
// });

// gulp.task('build', ['clean'], function() {
//     return gulp.src([
//         'index.html',
//         'robots.txt',
//         'humans.txt',
//         '404.html',
//         'browserconfig.xml',
//         'crossdomain.xml',
//         'favicon.ico'
//     ])
//         .pipe(gulp.dest('dist'));
// });

/** =======================================
 * File Watch setup
 *  =======================================
 */
gulp.task('watch', function () {
    gulp.watch(['js/azimuth.jsx'], ['babel']);
});