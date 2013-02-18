'use strict';

WebPaige.
factory('Profile', function ($resource, $config, $q, $route, $timeout, Storage, $rootScope) 
{

  /**
   * TODO
   * lose route parameter later on from here
   * 
   * Profile resource
   */
  var Profile = $resource(
    $config.host + '/node/:id/resource',
    {
      //user: $route.current.params.userId
    },
    {
      get: {
        method: 'GET',
        params: {id:''}
      },
      save: {
        method: 'PUT',
        params: {}
      }
    }
  );


  /**
   * Get profile of given user
   */
  Profile.prototype.get = function (id, localize) 
  {    
    var deferred = $q.defer();
    /**
     * Get profile data
     */
    Profile.get({id: id}, function (result) 
    {
      /**
       * If localize is true save it to localStorage
       */
      if (localize)
      {
        Storage.add('resources', angular.toJson(result));
      };
      deferred.resolve(result);
    });

    return deferred.promise;
  };


  /**
   * Get local resource data
   */
  Profile.prototype.local = function()
  {
    return angular.fromJson(Storage.get('resources'));
  };


  /**
   * Save profile
   */
  Profile.prototype.save = function (id, resources) 
  {
    var deferred = $q.defer();
    /**
     * Save profile data
     */
    Profile.save({id: id}, resources, function(result) 
    {
      /**
       * Return result
       */
      deferred.resolve(result);
    });
    /**
     * Return promise
     */
    return deferred.promise;
  };



  return new Profile;
});