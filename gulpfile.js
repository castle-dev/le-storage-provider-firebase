'use strict'

var gulp = require('gulp');
var util = require('gulp-util');
var jsdoc = require('gulp-jsdoc');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');
var mocha = require('gulp-mocha');

gulp.task('clean', function () {
  return gulp.src('docs', { read : false })
  .pipe(clean());
})

gulp.task('docs', function () {
  return gulp.src(['README.md', 'src/**/*.js'])
  .pipe(jsdoc('./docs', { path: 'ink-docstrap', theme: 'cyborg' }));
});

gulp.task('test:unit', function () {
  return gulp.src('test/unit/**/*.js', {read: false})
  .pipe(mocha({reporter: 'nyan'}))
  .on('error', util.log);
});

gulp.task('watch', function () {
  gulp.watch(['src/**/*.js'], ['test:unit', 'docs']);
  gulp.watch(['test/**/*.js'], ['test:unit']);
})

gulp.task('tdd', function (done) {
  runSequence('test:unit', 'watch', done)
});

gulp.task('test', ['test:unit']);
