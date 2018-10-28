/* eslint-disable no-var,prefer-arrow-callback,vars-on-top, import/no-extraneous-dependencies */

'use strict';

require('babel-register');

var fs = require('fs');
var path = require('path');
var resolve = require('resolve');
var semver = require('semver');
var IgnorePlugin = require('webpack').IgnorePlugin;

var reactVersions = fs.readdirSync(path.join(__dirname, 'packages/react-versions'))
  .map(function absoluteDir(dir) {
    return path.join(__dirname, 'packages/react-versions', dir);
  });

function getPlugins(directory) {
  const adapter13 = new IgnorePlugin(/enzyme-adapter-react-13$/);
  const adapter14 = new IgnorePlugin(/enzyme-adapter-react-14$/);
  const adapter154 = new IgnorePlugin(/enzyme-adapter-react-15\.4$/);
  const adapter15 = new IgnorePlugin(/enzyme-adapter-react-15$/);
  const adapter161 = new IgnorePlugin(/enzyme-adapter-react-16.1$/);
  const adapter162 = new IgnorePlugin(/enzyme-adapter-react-16.2$/);
  const adapter163 = new IgnorePlugin(/enzyme-adapter-react-16.3$/);
  const adapter16 = new IgnorePlugin(/enzyme-adapter-react-16$/);

  console.log(directory);
  console.log(resolve.sync('react', { basedir: directory }));

  /* eslint
    global-require: 0
    import/no-dynamic-require: 0
  */
  const reactVersion = require(resolve.sync(
    'react/package.json',
    { basedir: directory }
  )).version;

  var plugins = [
    adapter13,
    adapter14,
    adapter154,
    adapter15,
    adapter16,
  ];

  function is(range) {
    return semver.satisfies(reactVersion, range);
  }

  function not(x) {
    return function notPredicate(y) {
      return y !== x;
    };
  }

  // we want to ignore all of the adapters *except* the one we are currently using
  if (is('0.13.x')) {
    plugins = plugins.filter(not(adapter13));
  } else if (is('0.14.x')) {
    plugins = plugins.filter(not(adapter14));
  } else if (is('^15.5.0')) {
    plugins = plugins.filter(not(adapter15));
  } else if (is('^15.0.0-0')) {
    plugins = plugins.filter(not(adapter154));
  } else if (is('~16.0.0-0 || ~16.1')) {
    plugins = plugins.filter(not(adapter161));
  } else if (is('~16.2')) {
    plugins = plugins.filter(not(adapter162));
  } else if (is('~16.3.0-0')) {
    plugins = plugins.filter(not(adapter163));
  } else if (is('^16.4.0-0')) {
    plugins = plugins.filter(not(adapter16));
  }

  return plugins;
}

function makeWebpack(directory) {
  return {
    devtool: 'inline-source-map',
    resolve: {
      extensions: ['', '.js', '.jsx', '.json'],
      alias: {
        // dynamic require calls in sinon confuse webpack so we ignore it
        sinon: 'sinon/pkg/sinon',
      },
      modules: [
        path.join(directory, 'node_modules'),
        'node_modules',
      ],
    },
    module: {
      noParse: [
        // dynamic require calls in sinon confuse webpack so we ignore it
        /node_modules\/sinon\//,
        /node_modules\/react\//,
      ],
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.json$/,
          loader: 'json-loader',
        },
      ],
    },
    plugins: getPlugins(directory),
  };
}

module.exports = function karma(config) {
  config.set({
    basePath: '.',

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-webpack',
      'karma-sourcemap-loader',
    ],

    customLaunchers: {
      Chrome_travis: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
      },
    },

    frameworks: ['mocha'],

    reporters: ['dots'],

    files: [
      'packages/enzyme-test-suite/test/*.{jsx,js}',
    ],

    exclude: [
      'packages/enzyme-test-suite/test/_helpers/index.jsx',
    ],

    browsers: [
      process.env.TRAVIS ? 'Chrome_travis' : 'Chrome',
      'Firefox',
    ],

    preprocessors: {
      'packages/enzyme-test-suite/test/*.{jsx,js}': ['webpack', 'sourcemap'],
    },

    webpack: makeWebpack(reactVersions[0]),

    webpackServer: {
      noInfo: true,
    },
  });
};
