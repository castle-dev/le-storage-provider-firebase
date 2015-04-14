le-storage-provider-firebase
=========

A module for integrating le-storage-service and firebase

![Build Status](https://api.travis-ci.org/castle-dev/le-storage-provider-firebase.svg?branch=develop "Build Status")

[![Dependency Status](https://david-dm.org/castle-dev/le-storage-provider-firebase.svg)](https://david-dm.org/castle-dev/le-converter-service)

## Installation

  `npm install le-storage-provider-firebase --save`

## Usage

```
  var StorageProviderFirebase = require('le-storage-provider-firebase');
  var url = /* your Firebase url */;
  var provider = new StorageProviderFirebase(url);
```

## Tests

* `npm test` to run unit tests once
* `gulp tdd` to run unit tests on every file change

## Contributing

Please follow the project's [conventions](https://github.com/castle-dev/le-storage-provider-firebase/blob/master/CONTRIBUTING.md) or your changes will not be accepted

## Release History

* 1.0.0 Add StorageProviderFirebase
* 0.1.3 Configure Travis CI to publish docs to GitHub Pages
* 0.1.2 Add Dependency Status Badge
* 0.1.1 Add Travis CI
z 0.1.0 Initial release
