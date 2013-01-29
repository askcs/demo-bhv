'use strict';








WebPaige.
factory('Groups', function ($resource, $config, $q, $route, $timeout, Storage, $rootScope) 
{


  var Groups = $resource(
    $config.host + '/network/:id',
    {
    },
    {
      query: {
        method: 'GET',
        params: {},
        isArray: true
      },
      get: {
        method: 'GET',
        params: {id:''}
      },
      save: {
        method: 'POST',
        params: {id:''}
      }
    }
  );


  var Members = $resource(
    $config.host + '/network/:id/members',
    {
    },
    {
      query: {
        method: 'GET',
        params: {id:'', fields: '[role]'},
        isArray: true
      },
      get: {
        method: 'GET',
        params: {id:''}
      },
      save: {
        method: 'POST',
        params: {}
      }
    }
  );


  Groups.prototype.all = function()
  {
    Groups.prototype.query()
    .then(function(groups)
    {
      var calls = [];
      angular.forEach(groups, function(group, index)
      {
        calls.push(Groups.prototype.get(group.uuid));
      });
      $q.all(calls)
      .then(function(result)
      {
        Groups.prototype.uniqueMembers();
        return {
          list: groups,
          members: calls
        }
      });
    });
  };
  

  Groups.prototype.query = function () 
  {    
    var deferred = $q.defer();
    var successCb = function (result) 
    {
      if (angular.equals(result, [])) 
      {
        deferred.reject("There are no groups!");
      }
      else 
      {
        Storage.add('groups', angular.toJson(result));
        deferred.resolve(result);
      }
    };
    Groups.query(successCb);
    return deferred.promise;
  };
  

  Groups.prototype.get = function (id) 
  {   
    var deferred = $q.defer(); 
    var successCb = function (result) 
    {
      Storage.add(id, angular.toJson(result));
      deferred.resolve({
        id: id,
        data: result
      });
    };
    Members.query({id: id}, successCb);
    return deferred.promise;
  };



  Groups.prototype.uniqueMembers = function()
  {
    angular.forEach(angular.fromJson(Storage.get('groups')), function(group, index)
    {
      var members = angular.fromJson(Storage.get('members')) || {};
      angular.forEach(angular.fromJson(Storage.get(group.uuid)), function(member, index)
      {
        members[member.uuid] = member;
      });
      Storage.add('members', angular.toJson(members));
    });
  };




  Groups.prototype.local = function()
  {
    return angular.fromJson(Storage.get('groups'));
  };



  Groups.prototype.save = function (group) 
  {
    console.log('group to be saved ->', group);

    var resources = angular.fromJson(Storage.get('resources'));

    var deferred = $q.defer();
    var successCb = function (result) 
    {
      deferred.resolve(result);
    };

    Groups.save({id: resources.uuid}, group, successCb);
    return deferred.promise;
  };


  return new Groups;
});





/**
 * ************************************************************************************************
 * ************************************************************************************************
 * ************************************************************************************************
 * ************************************************************************************************
 */







/**
 * Groups Controller
 */
function groupsCtrl($rootScope, $scope, $config, groups, Groups, timerService, $route, $routeParams, Storage)
{

	var self = this;

  $scope.addGroupView = true;

  /**
   * TODO
   * Put these ones in rendering function
   * @type {[type]}
   */
	$scope.groups = groups;
  $scope.members = {};
  angular.forEach(angular.fromJson(Storage.get('groups')), function(group, gindex)
  {
    $scope.members[group.uuid] = [];
    angular.forEach(angular.fromJson(Storage.get(group.uuid)), function (member, mindex)
    {
      $scope.members[group.uuid].push(member);
    });
  });



  $scope.searchMembers = function(q)
  {
        
  };



  $scope.groupSubmit = function(group)
  {
    if ($scope.addGroupView)
    {
      Groups.save(group).
      then(function()
      {
        $scope.groups = Groups.query();
        $scope.addGroupView = false;
      });
    };
  };



	
  // timerService.start('groupsTimer', function()
  // { 
  //   Group.query();
  // }, 60 * 30);

  $scope.fixTabHeight = function(uuid)
  {
    $('.tabs-left .tab-content #grp-' + uuid).css({ height: $('.tabs-left .nav-tabs').height() });
  };

};


/**
 * Groups resolver
 */
groupsCtrl.resolve = {
  groups: function ($rootScope, $config, Groups, $route) 
  {
    return Groups.query();
  }
};


/**
 * Groups prototypes
 */
groupsCtrl.prototype = {
  constructor: groupsCtrl
};



groupsCtrl.$inject = [  '$rootScope', 
                        '$scope', 
                        '$config', 
                        'groups', 
                        'Groups', 
                        'timerService', 
                        '$route', 
                        '$routeParams',
                        'Storage'];



