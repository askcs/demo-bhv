'use strict';

/**
 * Declare app level module which depends on filters, and services
 */
var WebPaige = angular.module('WebPaige', 
  [ 'WebPaige.settings', 
    'WebPaige.filters', 
    'StorageModule',
    'timerModule',
    'WebPaige.directives', 
    '$strap.directives', 
    'SlotServices']);


/**
 * Configure app
 * There is also configuration tree defined in services
 * for default values
 */
WebPaige.config(function($locationProvider, $routeProvider, $httpProvider)
  {
    $httpProvider.defaults.headers.common['X-SESSION_ID'] ='798ac7fda2c357a74072397ea29682239be26ce706e5cbcd4b9e95d501230879';

    $routeProvider
    	/**
    	 * Dashboard
    	 */
    	.when('/dashboard', {
	    	templateUrl: 'partials/dashboard.html', 
	    	controller: dashboardCtrl
	    })
      /**
       * Planboard
       */
      .when('/planboard', {
          templateUrl: 'partials/planboard.html', 
          controller: planboardCtrl,
          resolve: planboardCtrl.resolve    
      })
      /**
       * Messages
       */
      .when('/messages', {
          templateUrl: 'partials/messages.html', 
          controller: messagesCtrl
      })
      /**
       * Groups&Users
       */
      .when('/groups', {
          templateUrl: 'partials/groups.html', 
          controller: groupsCtrl
      })
      /**
       * Profile
       */
      .when('/profile', {
          templateUrl: 'partials/profile.html', 
          controller: profileCtrl
      })
      /**
       * Settings
       */
      .when('/settings', {
          templateUrl: 'partials/settings.html', 
          controller: settingsCtrl
      })
      /**
       * Angular-Strap
       */
      .when('/angular-strap', {
          templateUrl: 'partials/angular-strap.html', 
          controller: StrapCtrl
      })
    /**
     * Redirect
     */
  	.otherwise({
    	redirectTo: '/dashboard'
    });

  });



/**
 * Initial run functions
 */
WebPaige.run(
['$rootScope', '$location', '$timeout', 
function($rootScope, $location, $timeout)
{
  
  /**
   * TODO
   * This values should be originating from
   * resource call data just after login
   */
  $rootScope.user = {
    uuid: 'apptestknrm'
  };

  /**
   * TODO
   */
  $rootScope.page = new Object;

  /**
   * Detect route change start
   */
  $rootScope.$on("$routeChangeStart", function (event, next, current) 
  {
    /**
     * TODO
     * Define a dynamic way for page titles
     */
    $rootScope.page.title = $location.url();

    $rootScope.alertType = "";
    $rootScope.alertMessage = "Loading...";
    $rootScope.active = "progress-striped active progress-warning";
  });
  
  /**
   * Route change successfull
   */
  $rootScope.$on("$routeChangeSuccess", function (event, current, previous) 
  {
    $rootScope.alertType = "alert-success";
    $rootScope.alertMessage = "Successfully changed routes :]";
    $rootScope.active = "progress-success";

    $rootScope.newLocation = $location.path();
  });

  /**
   * Route change is failed!
   */
  $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) 
  {
    alert("ROUTE CHANGE ERROR: " + rejection);
    $rootScope.alertType = "alert-error";
    $rootScope.alertMessage = "Failed to change routes :[";
    $rootScope.active = "";
  });

  /**
   * General status messages
   */
  $rootScope.alertType = "alert-info";
  $rootScope.alertMessage = "Welcome to the resolve demo";


}]);