var q = require('q');

function isDate(object) {
  return Object.prototype.toString.call(object) === '[object Date]'
}
/**
 * A provider for integrating le-storage-service and firebase
 * @class StorageProvider
 * @param {string} ref the firebase root reference
 * @returns {Object} StorageProvider
 */
var StorageProvider = function(ref) {
  if (!ref) {
    throw new Error('Firebase reference required');
  }
  var _ref = ref;

  function convertClientDatesToServerTimes(data) {
    var deferred = q.defer();

    function translateDatesRecursive(obj, path, offset) {
      if (!path) {
        path = [];
      }
      for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
          if (isDate(obj[property])) {
            var time = obj[property].getTime() + offset;
            var src = data;
            if (!data._times) {
              data._times = {};
            }
            var dest = data._times;
            for (var i = 0; i < path.length; i++) {
              src = src[path[i]];
              if (typeof dest[path[i]] === 'undefined') {
                dest[path[i]] = {};
              }
              dest = dest[path[i]];
            }
            delete src[property];
            dest[property] = time;
          } else if (typeof obj[property] === 'object') {
            var currentPath = path.slice(); // copy the path array
            currentPath.push(property);
            translateDatesRecursive(obj[property], currentPath, offset);
          }
        }
      }
      deferred.resolve(data);
    }
    // recurse through the properties
    _ref.child(".info/serverTimeOffset").once('value', function(ss) {
      var offset = ss.val() || 0;
      translateDatesRecursive(data, [], offset);
    });
    return deferred.promise;
  };

  function convertServerTimesToClientDates(data) {
    var deferred = q.defer();

    function translateTimesRecursive(obj, path, offset) {
      for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
          if (typeof obj[property] === 'object') {
            var currentPath = path.slice(0); // copy the path array
            currentPath.push(property);
            translateTimesRecursive(obj[property], currentPath, offset);
          } else {
            var coeff = 1000; // round times to the nearest second
            var date = new Date(obj[property] - offset);
            var time = new Date(Math.round(date.getTime() / coeff) * coeff);
            var dest = data;
            var src = data._times;
            for (var i = 0; i < path.length; i++) {
              src = src[path[i]];
              if (typeof dest[path[i]] === 'undefined') {
                dest[path[i]] = {};
              }
              dest = dest[path[i]];
            }
            delete src[property];
            dest[property] = time;
          }
        }
      }
      deferred.resolve(data);
    }
    if (data && data._times) {
      // recurse through the properties
      _ref.child(".info/serverTimeOffset").once('value', function(ss) {
        var offset = ss.val() || 0;
        translateTimesRecursive(data._times, [], offset);
        delete data._times;
      });
    } else {
      deferred.resolve(data);
    }
    return deferred.promise;
  };
  /**
   * Stores the data in firebase
   *
   * Either pushes or sets, depending
   * on whether or this is a new save
   * or an update. The promise is resolved
   * with the record's id. All Date objects
   * are converted to server timestamps before
   * sending to firebase.
   * @function save
   * @memberof StorageProvider
   * @instance
   * @param {string} collection the namespace to store the data under
   * @param {string} id the unique identifier for this data
   * @param {Object} data the data to store
   * @returns {Promise}
   */
  this.save = function(collection, id, data) {
    var deferred = q.defer();
    convertClientDatesToServerTimes(data)
      .then(function(convertedData) {
        if (id) { // update
          try {
            _ref.child(collection).child(id).set(convertedData, function(err) {
              if (err) {
                deferred.reject(err);
              } else {
                deferred.resolve(id);
              }
            });
          } catch (err) {
            deferred.reject(err);
          }
        } else { // create
          try {
            var newRef = _ref.child(collection).push(convertedData, function(err) {
              if (err) {
                deferred.reject(err);
              } else {
                deferred.resolve(newRef.key());
              }
            });
          } catch (err) {
            deferred.reject(err);
          }
        }
      })
    return deferred.promise;
  };
  /**
   * Reads data from firebase
   *
   * The server timestamps are converted
   * back to client Dates before resolving
   * @function load
   * @memberof StorageProvider
   * @instance
   * @param {string} collection the namespace to load the data from
   * @param {string} id the unique identifier for this data
   * @returns {Promise} promise resolves with the loaded data
   */
  this.load = function(collection, id) {
    var deferred = q.defer();
    try {
      _ref.child(collection).child(id).once('value', function(snapshot) {
        convertServerTimesToClientDates(snapshot.val())
          .then(function(convertedData) {
            deferred.resolve(convertedData);
          });
      }, function(err) {
        deferred.reject(err);
      });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  };
  /**
   * Set a sync listener for updates from firebase
   * @function sync
   * @memberof StorageProvider
   * @instance
   * @param {string} collection the namespace to load the data from
   * @param {string} id the unique identifier for this data
   * @param {Function} callback the callback that receives updates to the data
   * @returns {Promise} promise resolves with the loaded data
   */
  this.sync = function(collection, id, callback) {
    try {
      _ref.child(collection).child(id).on('value', function(snapshot) {
        convertServerTimesToClientDates(snapshot.val())
          .then(function(convertedData) {
            callback(convertedData);
          })
      });
    } finally {}
    return this.load(collection, id);
  };

  /**
   * Removes sync listeners
   * @function unsync
   * @memberof StorageProvider
   * @instance
   * @param {string} collection the namespace to load the data from
   * @param {string} id the unique identifier for this data
   */
  this.unsync = function(collection, id) {
    _ref.child(collection).child(id).off();
  };
  /**
   * Look up data by collection
   * @function query
   * @memberof StorageProvider
   * @instance
   * @param {string} collection the namespace to load the data from
   * @param {string} sortBy (optional) the property to sort the results by
   * @param {string} equalTo (optional) the property to filter the sort property by
   * @param {number} limit (optional) the maximum number of results to return
   * @param {Function} callback the function to send results to once found
   * */
  this.query = function(collection, sortBy, equalTo, limit, callback) {
    var query = _ref.child(collection);
    if (sortBy) {
      query = query.orderByChild(sortBy);
      if (equalTo) {
        query = query.equalTo(equalTo);
      }
    }
    if (limit) {
      query = query.limitToFirst(limit);
    }
    query.on("child_added", function(snapshot) {
      callback(snapshot.key());
    });
  }
  /**
   * Look up data by type
   * @function query
   * @memberof StorageProvider
   * @instance
   * @param {string} type the namespace to load the data from
   * @param {string} sortBy (optional) the property to sort the results by
   * @param {string} equalTo (optional) the property to filter the sort property by
   * @param {number} limit (optional) the maximum number of results to return
   *
   * @return {promise} resolves the data ready to be placed in records
   * */
  this.queryOnce = function(type, sortBy, equalTo, limit) {
    var deferred = q.defer();
    var query = _ref.child(type);
    var dataToReturn = {};
    var promises = [];
    if (sortBy) {
      query = query.orderByChild(sortBy);
      if (equalTo) {
        query = query.equalTo(equalTo);
      }
    }
    if (limit) {
      query = query.limitToFirst(limit);
    }
    query.once("value", function(snapshot) {
      for (var recordID in snapshot.val()) {
        (function(recordID) {
          promises.push(convertServerTimesToClientDates(snapshot.val()[recordID]).then(function(convertedData) {
            dataToReturn[recordID] = convertedData;
          }));
        })(recordID);
      }
      q.all(promises).then(function() {
        deferred.resolve(dataToReturn);
      }, function(err) {
        deferred.reject(err);
      });
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }
};

module.exports = StorageProvider;
