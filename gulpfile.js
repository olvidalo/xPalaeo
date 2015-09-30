var	path = require('path'),
	fs = require('fs'),
	gulp = require('gulp'),
 	sass = require('gulp-sass'),
	connect = require('gulp-connect'),
	secrets = require('./secrets.json')
    utils = require('gulp-util'),
    usemin = require('gulp-usemin'),
    rev = require('gulp-rev'),
    rsync = require('gulp-rsync'),
    gssh = require('gulp-ssh'),
    clean = require('gulp-clean'),
    uglify = require('gulp-uglify'),
    log = utils.log
;

gulp.task('usemin', function() {
  return gulp.src('./*.html')
    .pipe(usemin({
      css: [ rev() ],
      html: [ /*rev()*/ /*minifyHtml({ empty: true }) */],
      js: [ uglify(), rev() ],
      inlinejs: [ /*uglify() */],
      inlinecss: [ /*rev()*/ /*minifyCss(), 'concat'*/ ]
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', function() {
  return gulp.src('dist/', {read: false}).pipe(clean());
});

gulp.task('webserver', function() {
  connect.server({
  	root: 'dist',
  	port: 8888
  });
  gulp.watch('sass/**/*.scss',['styles']);
  gulp.watch('js/**/*.js', ['ngdocs']);
  gulp.watch('bower_components/**/*', ['usemin']);
  gulp.watch('./index.html', ['usemin']);
});

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss')
	    .pipe(sass().on('error', sass.logError))
	    .pipe(gulp.dest('./dist/css/', ['styles']));
});

gulp.task('scripts', function() {
	gulp.src(['js/**/*.js', '!js/xpalaeo.conf.js'])
	    .pipe(gulp.dest('./dist/js/', ['scripts']));
});

gulp.task('templates', function() {
	gulp.src('templates/**/*.html')
	    .pipe(gulp.dest('./dist/templates/', ['templates']));
});

gulp.task('ngdocs', [], function () {
  var gulpDocs = require('gulp-ngdocs');
  var options = {
  	html5Mode: false
  };
  return gulp.src('js/**/*.js')
    .pipe(gulpDocs.process(options))
    .pipe(gulp.dest('./dist/docs'));
});

gulp.task('ace', [], function () {
	var baseOfAce = "dist/vendor/js/ace";
	gulp.src("bower_components/ace-builds/src-min-noconflict/theme-solarized_light.js")
			.pipe(gulp.dest(baseOfAce));

	gulp.src("bower_components/ace-builds/src-min-noconflict/mode-xml.js")
			.pipe(gulp.dest(baseOfAce));

	gulp.src("bower_components/ace-builds/src-min-noconflict/worker-xml.js")
			.pipe(gulp.dest(baseOfAce));

});

gulp.task('deploy', ['build'], function() {
    ssh = new gssh({
    	sshConfig: secrets.servers.dev,
    	ignoreErrors: false
    });

    return gulp.src('dist/**')
    		.pipe(ssh.dest('/var/www/virtual/mts/xpalaeo.mts.aldebaran.uberspace.de'));
});

gulp.task('deploy-docs', ['ngdocs'], function() {
    ssh = new gssh({
    	sshConfig: secrets.servers.dev,
    	ignoreErrors: false
    });

    return gulp.src('docs/**')
    		.pipe(ssh.dest('/var/www/virtual/mts/xpalaeo.mts.aldebaran.uberspace.de/docs'));
});

gulp.task('build', ['usemin', 'styles', 'scripts', 'templates', 'ace']);

gulp.task('default', ['build', 'webserver']);
