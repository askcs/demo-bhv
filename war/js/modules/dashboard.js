'use strict';

/**
 * Dashboard Controller
 */
function dashboardCtrl($scope, $rootScope, $q, Dashboard, Slots, Dater, Storage)
{  
  /**
   * Fix styles
   */
  $rootScope.fixStyles();


  /**
   * Get periods
   */
  var periods = Dater.getPeriods(),
      current = Dater.current.week();


  /**
   * Defaults for weeks
   */
  $scope.current = true;


  /**
   * Default settings for pie
   * widget settings modal
   */
  $scope.modal = {
    header: 'Groep overzicht instellingen',
    groups: Storage.local.groups()
  };


  /**
   * Save settings
   */
  $scope.saveSettings = function ()
  {
    console.warn('modal changing ->');
  };


  /**
   * Get current week groups overview
   */
  getWeekStats();


  /**
   * Produce pie charts for groups
   * for current week or next week
   */
  $scope.weeker = function ()
  {
    $scope.current = !$scope.current;

    getWeekStats();
  };


  /**
   * TODO
   * Work on it!
   * 
   * Reset loaders
   */
  function resetLoaders ()
  {
    $scope.loading = {
      pies: {
        status:   false,
        message:  ''
      },
      alerts: {
        status:   false,
        message:  ''
      }
    };
  };

  resetLoaders();


  /**
   * Get weekly stats
   */
  function getWeekStats ()
  {
    $scope.loading.pies = {
      status:   true,
      message:  'Loading group stats..' 
    };

    var week = ($scope.current) ? current : current + 1;

    $scope.periods = {
      first:  periods.weeks[week].first.day,
      last:   periods.weeks[week].last.day,
      start:  periods.weeks[week].first.timeStamp,
      end:    periods.weeks[week].last.timeStamp
    };

    $rootScope.statusBar.display($rootScope.ui.dashboard.loadingPie);

    Dashboard.pies({
      start:  $scope.periods.start,
      end:    $scope.periods.end
    })
    .then(function (pies)
    {
      if (pies.error)
      {
        $rootScope.notifier.error('Error with getting group overviews.');
        console.warn('error ->', result);
      }
      else
      {
        if ($scope.current)
        {
          angular.forEach(pies, function (pie, index)
          {
            if (pie.current.diff > 0)
            {
              pie.current.cls = 'more';
            }
            else if (pie.current.diff == 0)
            {
              pie.current.cls = 'even';
            }
            else if (pie.current.diff < 0)
            {
              pie.current.cls = 'less';
            };

            console.log('date ->', pie.current.start, '->', Date(new Date(pie.current.start)).toString('dd-MM-yyyy HH:mm'));

          });
        };

        resetLoaders();

        $rootScope.statusBar.off();

        $scope.pies = pies;
      };
    })
    .then( function (result)
    {
      setTimeout( function () 
      {
        angular.forEach($scope.pies, function (pie, index)
        {
          document.getElementById('weeklyPie-' + pie.id).innerHTML = '';

          var ratios = [];

          if (pie.ratios.more != 0) ratios.push(pie.ratios.more);
          if (pie.ratios.even != 0) ratios.push(pie.ratios.even);
          if (pie.ratios.less != 0) ratios.push(pie.ratios.less);

          var r = Raphael('weeklyPie-' + pie.id),
              pie = r.piechart(40, 40, 40, ratios, {
                colors: $rootScope.config.pie.colors
              });
        });
      }, 100);
    });
  };


  /**
   * P2000 annnouncements
   */
  Dashboard.p2000().
  then(function (result)
  {
    if (result.error)
    {
      $rootScope.notifier.error('Error with getting p2000 alarm messages.');
      console.warn('error ->', result);
    }
    else
    {
      $scope.alarms = result;

      $scope.alarms.list = $scope.alarms.short;
    };
  });
	

  /**
   * Defaults for toggler
   */
  $scope.more = {
    status: false,
    text:   'show more' 
  };


  /**
   * Show more or less alarms
   */
  $scope.toggle = function (more)
  {
    $scope.alarms.list = (more) ? $scope.alarms.short :  $scope.alarms.long;

    $scope.more.text = (more) ? 'show more' : 'show less';

    $scope.more.status = !$scope.more.status;
  };

};


dashboardCtrl.$inject = ['$scope', '$rootScope', '$q', 'Dashboard', 'Slots', 'Dater', 'Storage'];


/**
 * Dashboard modal
 */
WebPaige.
factory('Dashboard', function ($rootScope, $resource, $config, $q, $route, $timeout, Storage, Slots, Dater, Announcer) 
{
  var Dashboard = $resource(
    'http://knrm.myask.me/rpc/client/p2000.php',
    {
    },
    {
      p2000: {
        method: 'GET',
        params: {},
        isArray: true
      }
    }
  );


  /**
   * Get group aggs for pie charts
   */
  Dashboard.prototype.pies = function (periods) 
  {
    var deferred  = $q.defer(),
        groups    = angular.fromJson(Storage.get('groups')),
        now       = new Date.now().getTime(),
        calls     = [];

    angular.forEach(groups, function (group, index)
    {
      calls.push(Slots.pie({
        id:     group.uuid,
        name:   group.name,
        start:  periods.start / 1000,
        end:    periods.end / 1000
      }));
    });

    $q.all(calls)
    .then(function (results)
    {
      deferred.resolve(results);
    });

    return deferred.promise;
  };


  /**
   * Get p2000 announcements
   */
  Dashboard.prototype.p2000 = function () 
  {
    var deferred = $q.defer();

    // Dashboard.p2000(null, 
    //    function (result) 
    //    {
    //      deferred.resolve(result);

    //      console.log('result ->', result);
    //    },
    //    function (error)
    //    {
    //      deferred.resolve({error: error});
    //    }
    //  );

    $.ajax({
      url: $config.profile.p2000.url,
      dataType: 'jsonp',
      success: function (results)
      {
        deferred.resolve( Announcer.process(results) );
      },
      error: function ()
      {
        deferred.resolve({error: error});
      }
    });

    return deferred.promise;
  };


  return new Dashboard;
});


/**
 * Process alarms
 */
WebPaige.
factory('Announcer', function () 
{
  return {
    /**
     * TODO
     * Modify p2000 script in ask70 for date conversions!!
     *
     * p2000 messages processor
     */
    process: function (results)
    {
      var alarms  = {
            short:  [],
            long:   [] 
          },
          limit   = 4,
          count   = 0;

      angular.forEach(results, function (alarm, index)
      {
        if (alarm.body)
        {
          if (alarm.body.match(/Prio 1/) || alarm.body.match(/PRIO 1/))
          {
            alarm.body = alarm.body.replace('Prio 1 ', '');
            alarm.prio = {
              1:    true,
              test: false
            };
          };

          if (alarm.body.match(/Prio 2/) || alarm.body.match(/PRIO 2/))
          {
            alarm.body = alarm.body.replace('Prio 2 ', '');
            alarm.prio = {
              2:    true,
              test: false
            };
          };

          if (alarm.body.match(/Prio 3/) || alarm.body.match(/PRIO 3/))
          {
            alarm.body = alarm.body.replace('Prio 3 ', '');
            alarm.prio = {
              3:    true,
              test: false
            }
          };

          if (alarm.body.match(/PROEFALARM/))
          {
            alarm.prio = {
              test: true
            };
          };

          // var dates     = alarm.day.split('-'),
          //     swap      = dates[0] + 
          //                 '-' + 
          //                 dates[1] + 
          //                 '-' + 
          //                 dates[2],
          //     dstr      = swap + ' ' + alarm.time,
          //     datetime  = new Date(alarm.day + ' ' + alarm.time).toString('dd-MM-yy HH:mm:ss'),
          //     timeStamp = new Date(datetime).getTime();
          // alarm.datetime = datetime;
          // alarm.timeStamp = timeStamp;

          if (count < 4) alarms.short.push(alarm);

          alarms.long.push(alarm);

          count++;
        }
      });

      return alarms;
    }
  }
});


