const gulp = require('gulp');
const css = require('gulp-clean-css');
const del = require('del');
const less = require('gulp-less');
const preprocess = require('gulp-preprocess');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack-stream');
const wp = require('webpack');

const config = require('./config');

function assets() {
  return gulp.src([`${config.paths.src}/assets/**/*`])
    .pipe(gulp.dest(`${config.paths.dest}/assets`))
}

function copy() {
  return gulp.src([`${config.paths.src}/proxy.js`])
    .pipe(preprocess({ context: config.replace }))
    .pipe(gulp.dest(config.webpack.output.path));
}

function clean(done) {
  del([
    `${config.paths.dest}/**/*`,
    `!${config.paths.dest}/README.md`
  ]).then(() => done());
}

function html() {
  return gulp.src([`${config.paths.src}/index.html`])
    .pipe(preprocess({ context: config.replace }))
    .pipe(gulp.dest(config.paths.dest));
}

function scripts() {
  return gulp.src([`${config.paths.src}/index.ts`])
    .pipe(webpack(config.webpack, wp))
    .pipe(preprocess({ context: config.replace }))
    .pipe(gulp.dest(config.webpack.output.path));
}

function styles() {
  return gulp.src([`${config.paths.src}/style.less`])
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(css())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.paths.dest));
}

const build = gulp.series(
  clean,
  gulp.parallel(assets, copy, html, scripts, styles)
);

gulp.task('build', build);
gulp.task('default', build);
