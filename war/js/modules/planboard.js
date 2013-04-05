'use strict';


/** 
 * Planboard Controller
 */
function planboardCtrl ($rootScope, $scope, $q, $window, $location, data, Slots, Dater, Storage, Sloter) 
{
  /**
   * Fix styles
   */
  $rootScope.fixStyles();

  
  /**
   * Set default currents
   */
  var self = this,
      periods = Dater.getPeriods(),
      groups  = Storage.local.groups(),
      current = {
        layouts: {
          user:     true,
          group:    true,
          members:  false
        },
        day:      Dater.current.today(),
        week:     Dater.current.week(),
        month:    Dater.current.month(),
        group:    groups[0].uuid,
        division: 'all'
      };


  /**
   * Reset views for default views
   */
  function resetViews ()
  {
    $scope.views = {
      slot: {
        add:  false,
        edit: false
      },
      group:  false,
      wish:   false,
      member: false
    };
  };

  resetViews();


  /**
   * Slot form toggler
   */
  $scope.toggleSlotForm = function ()
  {
    if ($scope.views.slot.add)
    {
      $scope.resetInlineForms();
    }
    else
    {
      $scope.slot = {};

      resetViews();

      $scope.views.slot.add = true;
    };
  };


  /**
   * Reset inline forms
   */
  $scope.resetInlineForms = function ()
  {
    $scope.slot = {};

    $scope.original = {};

    resetViews();
  };


  /**
   * Reset and init slot container which
   * is used for adding or changing slots
   */
  $scope.slot = {};


  /**
   * Pass time slots data
   */
  $scope.data = data;


  /**
   * Set defaults for timeline
   */
  $scope.timeline = {
    current: current,
    options: {
      start:  new Date(periods.weeks[current.week].first.day),
      end:    new Date(periods.weeks[current.week].last.day),
      min:    new Date(periods.weeks[current.week].first.day),
      max:    new Date(periods.weeks[current.week].last.day)
    },
    range: {
      start:  periods.weeks[current.week].first.day,
      end:    periods.weeks[current.week].last.day
    },
    scope: {
      day:    false,
      week:   true,
      month:  false
    },
    config: {
      bar:        $rootScope.config.timeline.config.bar,
      wishes:     $rootScope.config.timeline.config.wishes,
      legenda:    {},
      legendarer: $rootScope.config.timeline.config.legendarer,
      states:     $rootScope.config.timeline.config.states,
      divisions:  $rootScope.config.timeline.config.divisions,
      densities:  $rootScope.config.timeline.config.densities
    }
  };


  /**
   * Legenda defaults
   */
  angular.forEach($rootScope.config.timeline.config.states, function (state, index)
  {
    $scope.timeline.config.legenda[index] = true;
  });


  /**
   * Timeline group legenda default configuration
   */
  $scope.timeline.config.legenda.groups = {
    more: true,
    even: true,
    less: true
  };


  /**
   * Prepeare timeline range for dateranger widget
   */
  $scope.daterange =  Dater.readable.date($scope.timeline.range.start) + 
                      ' / ' + 
                      Dater.readable.date($scope.timeline.range.end);


  /**
   * States for dropdown
   */
  var states = {};

  angular.forEach($scope.timeline.config.states, function (state, key) { states[key] = state.label; });

  $scope.states = states;


  /**
   * Groups for dropdown
   */
  $scope.groups = groups;


  /**
   * Groups for dropdown
   */
  $scope.divisions = $scope.timeline.config.divisions;


  /**
   * Watch for changes in timeline range
   */
  $scope.$watch(function ()
  {
    var range = self.timeline.getVisibleChartRange(),
        diff  = Dater.calculate.diff(range);

    /**
     * Scope is a day
     * 
     * TODO
     * try later on!
     * new Date(range.start).toString('d') == new Date(range.end).toString('d')
     */
    if (diff <= 86400000)
    {
      $scope.timeline.scope = {
        day:    true,
        week:   false,
        month:  false
      };
    }
    /**
     * Scope is less than a week
     */
    else if (diff < 604800000)
    {
      $scope.timeline.scope = {
        day:    false,
        week:   true,
        month:  false
      };
    }
    /**
     * Scope is more than a week
     */
    else if (diff > 604800000)
    {
      $scope.timeline.scope = {
        day:    false,
        week:   false,
        month:  true
      };
    };

    $scope.timeline.range = {
      start:  new Date(range.start).toString(),
      end:    new Date(range.end).toString()
    };

    $scope.daterange =  Dater.readable.date($scope.timeline.range.start) + 
                        ' / ' + 
                        Dater.readable.date($scope.timeline.range.end);
  });


  /**
   * Timeline (The big boy)
   */
  var timeliner = {

    /**
     * Init timeline
     */
    init: function ()
    {
      self.timeline = new links.Timeline(document.getElementById('mainTimeline'));

      links.events.addListener(self.timeline, 'rangechanged',  timelineGetRange);
      links.events.addListener(self.timeline, 'add',           timelineOnAdd);
      links.events.addListener(self.timeline, 'delete',        timelineOnRemove);
      links.events.addListener(self.timeline, 'change',        timelineOnChange);
      links.events.addListener(self.timeline, 'select',        timelineOnSelect);

      this.render($scope.timeline.options);      
    },

    /**
     * Render or re-render timeline
     */
    render: function (options)
    {
      $scope.timeline = {
        current:  $scope.timeline.current,
        scope:    $scope.timeline.scope,
        config:   $scope.timeline.config,
        options: {
          start:  new Date(options.start),
          end:    new Date(options.end),
          min:    new Date(options.start),
          max:    new Date(options.end)
        }
      };

      angular.extend($scope.timeline.options, $rootScope.config.timeline.options);

      self.timeline.draw(
        Sloter.process(
          $scope.data,
          $scope.timeline.config,
          $scope.divisions,
          $rootScope.app.resources.role
        ), 
        $scope.timeline.options
      );

      self.timeline.setVisibleChartRange($scope.timeline.options.start, $scope.timeline.options.end);
    },

    /**
     * Grab new timeline data from backend and render timeline again
     */
    load: function (stamps)
    {
      var _this = this;

      $rootScope.statusBar.display($rootScope.ui.planboard.refreshTimeline);

      Slots.all({
        groupId:  $scope.timeline.current.group,
        division: $scope.timeline.current.division,
        layouts:  $scope.timeline.current.layouts,
        month:    $scope.timeline.current.month,
        stamps:   stamps
      })
      .then(function (data)
      {
        if (data.error)
        {
          $rootScope.notifier.error('Error with gettings timeslots.');
          console.warn('error ->', result);
        }
        else
        {
          $scope.data = data;

          _this.render(stamps);
        };

        $rootScope.statusBar.off();
      });
    },

    /**
     * Refresh timeline as it is
     */
    refresh: function ()
    {
      $scope.slot = {};

      resetViews();

      $scope.views.slot.add = true;

      this.load({
        start:  data.periods.start,
        end:    data.periods.end
      });
    },

    /**
     * Redraw timeline
     */
    redraw: function ()
    {
      self.timeline.redraw();
    },

    /**
     * Cancel add
     */
    cancelAdd: function ()
    {
      self.timeline.cancelAdd();
    }
  };
 

  /**
   * Init timeline
   */
  timeliner.init();


  /**
   * Timeliner listener
   */
  $rootScope.$on('timeliner', function () 
  {
    timeliner.load({
      start:  new Date(arguments[1].start).getTime(),
      end:    new Date(arguments[1].end).getTime()
    });
  });


  /**
   * Handle new requests for timeline
   */
  $scope.requestTimeline = function (section)
  {
    switch (section)
    {
      case 'group':
        $scope.timeline.current.layouts.group = !$scope.timeline.current.layouts.group;

        if ($scope.timeline.current.layouts.members && !$scope.timeline.current.layouts.group)
          $scope.timeline.current.layouts.members = false;
      break;

      case 'members':
        $scope.timeline.current.layouts.members = !$scope.timeline.current.layouts.members;

        if ($scope.timeline.current.layouts.members && !$scope.timeline.current.layouts.group)
          $scope.timeline.current.layouts.group = true;
      break;
    };

    timeliner.load({
      start:  data.periods.start,
      end:    data.periods.end
    });
  };


  /**
   * Day & Week & Month toggle actions
   */
  $scope.timelineScoper = function (period)
  {
    $scope.timeline.current.day   = current.day;
    $scope.timeline.current.week  = current.week;
    $scope.timeline.current.month = current.month;

    switch (period)
    {
      case 'day':
        $scope.timeline.scope = {
          day:    true,
          week:   false,
          month:  false
        };

        timeliner.load({
          start:  periods.days[$scope.timeline.current.day].first.timeStamp,
          end:    periods.days[$scope.timeline.current.day].last.timeStamp,
        });
      break;

      case 'week':
        $scope.timeline.scope = {
          day:    false,
          week:   true,
          month:  false
        };

        timeliner.load({
          start:  periods.weeks[$scope.timeline.current.week].first.timeStamp,
          end:    periods.weeks[$scope.timeline.current.week].last.timeStamp,
        });
      break;

      case 'month':
        $scope.timeline.scope = {
          day:    false,
          week:   false,
          month:  true
        };

        timeliner.load({
          start:  periods.months[$scope.timeline.current.month].first.timeStamp,
          end:    periods.months[$scope.timeline.current.month].last.timeStamp,
        });
      break;
    };
  };


  /**
   * Go one period in past
   */
  $scope.timelineBefore = function (timelineScope)
  {
    if ($scope.timeline.scope.day)
    {
      if ($scope.timeline.current.day != 1)
      {
        $scope.timeline.current.day--;

        timeliner.load({
          start:  periods.days[$scope.timeline.current.day].first.timeStamp,
          end:    periods.days[$scope.timeline.current.day].last.timeStamp,
        });
      };
    }

    else if ($scope.timeline.scope.week)
    {
      if ($scope.timeline.current.week != 1)
      {
        $scope.timeline.current.week--;

        timeliner.load({
          start:  periods.weeks[$scope.timeline.current.week].first.timeStamp,
          end:    periods.weeks[$scope.timeline.current.week].last.timeStamp,
        });
      };
    }

    else if ($scope.timeline.scope.month)
    {
      if ($scope.timeline.current.month != 1)
      {
        $scope.timeline.current.month--;

        timeliner.load({
          start:  periods.months[$scope.timeline.current.month].first.timeStamp,
          end:    periods.months[$scope.timeline.current.month].last.timeStamp,
        });
      };
    };
  };


  /**
   * Go one period in future
   */
  $scope.timelineAfter = function (timelineScope)
  {
    if ($scope.timeline.scope.day)
    {
      /**
       * Total days in a month can change so get it start periods cache
       */
      if ($scope.timeline.current.day != periods.days.total)
      {
        $scope.timeline.current.day++;

        timeliner.load({
          start:  periods.days[$scope.timeline.current.day].first.timeStamp,
          end:    periods.days[$scope.timeline.current.day].last.timeStamp,
        });
      };
    }

    else if ($scope.timeline.scope.week)
    {
      if ($scope.timeline.current.week != 53)
      {
        $scope.timeline.current.week++;

        timeliner.load({
          start:  periods.weeks[$scope.timeline.current.week].first.timeStamp,
          end:    periods.weeks[$scope.timeline.current.week].last.timeStamp,
        });
      };
    }

    else if ($scope.timeline.scope.month)
    {
      if ($scope.timeline.current.month != 12)
      {
        $scope.timeline.current.month++;

        timeliner.load({
          start:  periods.months[$scope.timeline.current.month].first.timeStamp,
          end:    periods.months[$scope.timeline.current.month].last.timeStamp,
        });
      };
    };
  };


  /**
   * Timeline zoom in
   */
  $scope.timelineZoomIn = function () { self.timeline.zoom($rootScope.config.timeline.config.zoom, Date.now()) };


  /**
   * Timeline zoom out
   */
  $scope.timelineZoomOut = function () { self.timeline.zoom(-$rootScope.config.timeline.config.zoom, Date.now()) };


  /**
   * Timeline get ranges
   */
  function timelineGetRange ()
  {
    var range = self.timeline.getVisibleChartRange();

    $scope.$apply(function ()
    {
      $scope.timeline.range = {
        start:  new Date(range.from).toString(),
        end:    new Date(range.till).toString()
      };

      $scope.daterange = {
        start:  Dater.readable.date(new Date(range.start).getTime()),
        end:    Dater.readable.date(new Date(range.end).getTime())
      };

    });
  };


  /**
   * Get information of the selected slot
   */
  function selectedSlot ()
  {
    var selection;

    if (selection = self.timeline.getSelection()[0])
    {
      var values  = self.timeline.getItem(selection.row),
          content = angular.fromJson(values.content.match(/<span class="secret">(.*)<\/span>/)[1]);

      $scope.original = {
        start:        values.start,
        end:          values.end,
        content: {
          recursive:  content.recursive,
          state:      content.state,
          id:         content.id
        }
      };

      resetViews();

      switch (content.type)
      {
        case 'slot':
          $scope.views.slot.edit = true;
        break;

        case 'group':
          $scope.views.group = true;
        break;

        case 'wish':
          $scope.views.wish = true;
        break;

        case 'member':
          $scope.views.member = true;
        break;
      };

      $scope.slot = {
        start: {
          date: new Date(values.start).toString($rootScope.config.formats.date),
          time: new Date(values.start).toString($rootScope.config.formats.time)
        },
        end: {
          date: new Date(values.end).toString($rootScope.config.formats.date),
          time: new Date(values.end).toString($rootScope.config.formats.time)
        },
        state:      content.state,
        recursive:  content.recursive,
        id:         content.id
      };

      /**
       * TODO
       * Check if this can be combined with switch later on!
       * Set extra data based slot type for inline form
       */
      switch (content.type)
      {
        case 'group':
          $scope.slot.diff  = content.diff;
          $scope.slot.group = content.group;
        break;

        case 'wish':
          $scope.slot.wish    = content.wish;
          $scope.slot.group   = content.group;
          $scope.slot.groupId = content.groupId;
        break;

        case 'member':
          $scope.slot.member = content.mid;
        break;
      }

      return values;
    };
  };


  /**
   * Timeline on select
   */
  function timelineOnSelect ()
  {
    $scope.$apply(function ()
    {
      $scope.selectedOriginal = selectedSlot();
    });
  };


  /**
   * Timeline on add
   */
  function timelineOnAdd ()
  {
    var news = $('.timeline-event-content')
                .contents()
                .filter(function ()
                { 
                  return this.nodeValue == 'New' 
                }),
        values = self.timeline.getItem(self.timeline.getSelection()[0].row);
      
    if (news.length > 1) self.timeline.cancelAdd();

    $scope.$apply(function()
    {
      resetViews();

      $scope.views.slot.add = true;

      $scope.slot = {
        start: {
          date: new Date(values.start).toString($rootScope.config.formats.date),
          time: new Date(values.start).toString($rootScope.config.formats.time)
        },
        end: {
          date: new Date(values.end).toString($rootScope.config.formats.date),
          time: new Date(values.end).toString($rootScope.config.formats.time)
        },
        recursive: (values.group.match(/recursive/)) ? true : false,
        /**
         * INFO
         * First state is hard-coded
         * Maybe use the first one from array later on?
         */
        state: 'com.ask-cs.State.Available'
      };
    });
  };


  /**
   * Add slot trigger start view
   */
  $scope.add = function (slot)
  {
    var now     = Date.now().getTime(),
        values  = {
                    start:      Dater.convert.absolute(slot.start.date, slot.start.time, true),
                    end:        Dater.convert.absolute(slot.end.date, slot.end.time, true),
                    recursive:  (slot.recursive) ? true : false,
                    text:       slot.state
                  };

    if (values.start * 1000 <= now || values.end * 1000 <= now)
    {
      $rootScope.notifier.error('You can not input timeslots in past.');

      // timeliner.cancelAdd();
      timeliner.refresh();
    }
    else
    {
      $rootScope.statusBar.display($rootScope.ui.planboard.addTimeSlot);

      Slots.add(values, $rootScope.app.resources.uuid)
      .then(
        function (result)
        {
          if (result.error)
          {
            $rootScope.notifier.error('Error with adding a new timeslot.');
            console.warn('error ->', result);
          }
          else
          {
            $rootScope.notifier.success($rootScope.ui.planboard.slotAdded);
          };

          timeliner.refresh();
        }
      );
    };
  };


  /**
   * Timeline on change
   */
  function timelineOnChange (direct, original, slot, options)
  {
    if (!direct)
    {
      var values  = self.timeline.getItem(self.timeline.getSelection()[0].row),
          options = {
            start:    values.start,
            end:      values.end,
            content:  angular.fromJson(values.content.match(/<span class="secret">(.*)<\/span>/)[1])
          };
    };

    var now = Date.now().getTime();

    if (options.start <= now || options.end <= now)
    {
      $rootScope.notifier.error('You can not change timeslots in past.');

      timeliner.refresh();
    }
    else
    {
      $rootScope.statusBar.display($rootScope.ui.planboard.changingSlot);

      Slots.change($scope.original, options, $rootScope.app.resources.uuid)
      .then(
        function (result)
        {
          if (result.error)
          {
            $rootScope.notifier.error('Error with changing timeslot.');
            console.warn('error ->', result);
          }
          else
          {
            $rootScope.notifier.success($rootScope.ui.planboard.slotChanged);
          };

          timeliner.refresh();
        }
      );
    };
  };


  /**
   * Change slot
   */
  $scope.change = function (original, slot)
  {
    timelineOnChange(true, original, slot, 
    {
      start:  Dater.convert.absolute(slot.start.date, slot.start.time, false),
      end:    Dater.convert.absolute(slot.end.date, slot.end.time, false),
      content: angular.toJson({
        recursive:  slot.recursive, 
        state:      slot.state 
      })
    });
  };


  /**
   * Set wish
   */
  $scope.setWish = function (slot)
  {
    $rootScope.statusBar.display($rootScope.ui.planboard.changingWish);

    Slots.setWish(
    {
      id:     slot.groupId,
      start:  Dater.convert.absolute(slot.start.date, slot.start.time, true),
      end:    Dater.convert.absolute(slot.end.date, slot.end.time, true),
      recursive:  slot.recursive,
      wish:       slot.wish
    })
    .then(
      function (result)
      {
        if (result.error)
        {
          $rootScope.notifier.error('Error with changing wish value.');
          console.warn('error ->', result);
        }
        else
        {
          $rootScope.notifier.success($rootScope.ui.planboard.wishChanged);
        };

        timeliner.refresh();
      }
    );
  };


  /**
   * Timeline on delete
   */
  function timelineOnRemove ()
  {
    var now = Date.now().getTime();

    if ($scope.original.start.getTime() <= now || $scope.original.end.getTime() <= now)
    {
      $rootScope.notifier.error('You can not delete timeslots in past.');

      timeliner.refresh();
    }
    else
    {
      // var news = $('.timeline-event-content')
      //             .contents()
      //             .filter(function()
      //             { 
      //               return this.nodeValue == 'New' 
      //             });
        
      // if (news)
      // {
      //   $scope.$apply(function ()
      //   {
      //     $scope.resetInlineForms();
      //   });
      // }
      // else
      // {
        $rootScope.statusBar.display($rootScope.ui.planboard.deletingTimeslot);

        Slots.remove($scope.original, $rootScope.app.resources.uuid)
        .then(
          function (result)
          {
            if (result.error)
            {
              $rootScope.notifier.error('Error with removing timeslot.');
              console.warn('error ->', result);
            }
            else
            {
              $rootScope.notifier.success($rootScope.ui.planboard.timeslotDeleted);
            };

            timeliner.refresh();
          }
        );
      // };
    };
  };


  /**
   * Delete trigger start view
   */
  $scope.remove = function () 
  {
    timelineOnRemove()
  };


  /**
   * Redraw timeline on window resize
   */
  $window.onresize = function () { self.timeline.redraw() };


  /**
   * Group aggs barCharts toggler
   */
  $scope.barCharts = function ()
  {
    $scope.timeline.config.bar = !$scope.timeline.config.bar;

    timeliner.render({
      start:  $scope.timeline.range.start,
      end:    $scope.timeline.range.end
    });
  };
  

  /**
   * Group wishes toggler
   */
  $scope.groupWishes = function ()
  {
    $scope.timeline.config.wishes = !$scope.timeline.config.wishes;

    timeliner.render({
      start:  $scope.timeline.range.start,
      end:    $scope.timeline.range.end
    });
  };
  

  /**
   * Timeline legenda toggler
   */
  $scope.showLegenda = function () { $scope.timeline.config.legendarer = !$scope.timeline.config.legendarer; };


  /**
   * Alter legenda settings
   */
  $scope.alterLegenda = function (legenda)
  {
    $scope.timeline.config.legenda = legenda;

    timeliner.render({
      start:  $scope.timeline.range.start,
      end:    $scope.timeline.range.end
    });
  };


  /**
   * Send shortage message
   */
  $scope.sendShortageMessage = function (slot)
  {
    $rootScope.statusBar.display($rootScope.ui.planboard.preCompilingStortageMessage);

    Storage.session.add('escalation', angular.toJson({
      group: slot.group,
      start: {
        date: slot.start.date,
        time: slot.start.time
      },
      end: {
        date: slot.end.date,
        time: slot.end.time
      },
      diff: slot.diff
    }));

    $location.path('/messages').search({ escalate: true }).hash('compose');
  };


  /**
   * Prevent re-rendering issues with timeline
   */
  $scope.destroy = {
    timeline: function ()
    {
      // Not working !! :(
      // Sloter.pies($scope.data);
    },
    statistics: function ()
    {
      setTimeout(function ()
      {
        timeliner.redraw();
      }, 10);
    }
  };

};


/**
 * Resolve planboard
 */
planboardCtrl.resolve = {
  data: function ($route, Slots, Storage, Dater) 
  {
    var periods = Storage.local.periods(),
        current = Dater.current.week(),
        initial = periods.weeks[current],
        groups  = Storage.local.groups();

    return Slots.all({
      groupId:  groups[0].uuid,
      division: 'all',
      stamps: {
        start:  initial.first.timeStamp,
        end:    initial.last.timeStamp
      },
      month: Dater.current.month(),
      layouts: {
        user:     true,
        group:    true,
        members:  false
      }
    });
  }
};


planboardCtrl.$inject = ['$rootScope', '$scope', '$q', '$window', '$location', 'data', 'Slots', 'Dater', 'Storage', 'Sloter'];


/**
 * 
 * TimeSlots Resource
 */
WebPaige.
factory('Slots', function ($rootScope, $config, $resource, $q, $route, $timeout, Storage, Dater, Sloter, Stats) 
{
  /**
   * Define Slot Resource from back-end
   */
  var Slots = $resource(
    $config.host + '/askatars/:user/slots',
    {
      user: ''
    },
    {
      query: {
        method: 'GET',
        params: {start:'', end:''},
        isArray: true
      },
      change: {
        method: 'PUT',
        params: {start:'', end:'', text:'', recursive:''}        
      },
      save: {
        method: 'POST',
        params: {}
      },
      remove: {
        method: 'DELETE',
        params: {}
      }
    }
  );


  /**
   * Group aggs resource
   */
  var Aggs = $resource(
    $config.host + '/calc_planning/:id',
    {
    },
    {
      query: {
        method: 'GET',
        params: {id: '', start:'', end:''},
        isArray: true
      }
    }
  );


  /**
   * Wishes resource
   */
  var Wishes = $resource(
    $config.host + '/network/:id/wish',
    {
    },
    {
      query: {
        method: 'GET',
        params: {id: '', start:'', end:''},
        isArray: true
      },
      save: {
        method: 'PUT',
        params: {id: ''}
      },
    }
  );


  /**
   * Get group wishes
   */
  Slots.prototype.wishes = function (options) 
  {
    var deferred = $q.defer(),
        params = {
          id: options.id,
          start: options.start,
          end: options.end
        };

    Wishes.query(params, 
      function (result) 
      {
        deferred.resolve(result);
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Set group wish
   */
  Slots.prototype.setWish = function (options) 
  {
    var deferred = $q.defer(),
        params = {
          start: options.start,
          end: options.end,
          wish: options.wish,
          recurring: options.recursive
        };

    Wishes.save({id: options.id}, params, 
      function (result) 
      {
        deferred.resolve(result);
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Get group aggs
   */
  Slots.prototype.aggs = function (options) 
  {
    var deferred = $q.defer(),
        params = {
          id: options.id,
          start: options.start,
          end: options.end
        };

    if (options.division != undefined) params.stateGroup = options.division;

    Aggs.query(params, 
      function (result) 
      {
        var stats = Stats.aggs(result);

        Slots.prototype.wishes(params)
        .then(function (wishes)
        {
          deferred.resolve({
            id:       options.id,
            division: options.division,
            wishes:   wishes,
            data:     result,
            ratios:   stats.ratios,
            durations: stats.durations
          });
        });
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Get group aggs for pie charts
   */
  Slots.prototype.pie = function (options) 
  {
    var deferred  = $q.defer(),
        now       = Math.floor(Date.now().getTime() / 1000),
        current;

    Aggs.query({
      id: options.id,
      start: options.start,
      end: options.end
    }, 
      function (results)
      {
        angular.forEach(results, function (slot, index)
        {
          if (now >= slot.start && now <= slot.end) current = slot;
        });

        deferred.resolve({
          id:       options.id,
          name:     options.name,
          current:  current, 
          ratios:   Stats.pies(results)
        });      
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Get slot bundels; user, group aggs and members
   */
  Slots.prototype.all = function (options) 
  {
    /**
     * Define vars
     */
    var deferred = $q.defer(),
        periods = Dater.getPeriods(),
        params = {
          user:   angular.fromJson(Storage.get('resources')).uuid, // user hardcoded!!
          start:  options.stamps.start / 1000,
          end:    options.stamps.end / 1000
        },
        data = {};
    
    Slots.query(params, 
      function (user) 
      {
        if (options.layouts.group)
        {
          var groupParams = {
              id:     options.groupId,
              start:  params.start,
              end:    params.end,
              month:  options.month
          };

          if (options.division != 'all') groupParams.division = options.division;

          Slots.prototype.aggs(groupParams)
          .then(function(aggs)
          {
            if (options.layouts.members)
            {
              var members = angular.fromJson(Storage.get(options.groupId)),
                  calls = [];

              angular.forEach(members, function(member, index)
              {
                calls.push(Slots.prototype.user({
                  user: member.uuid,
                  start:params.start,
                  end:  params.end,
                  type: 'both'
                }));
              });

              $q.all(calls)
              .then(function(members)
              {
                deferred.resolve({
                  user:     user,
                  groupId:  options.groupId,
                  aggs:     aggs,
                  members:  members,
                  synced:   new Date().getTime(),
                  periods: {
                    start:  options.stamps.start,
                    end:    options.stamps.end
                  }
                });
              });
            }
            else
            {
              deferred.resolve({
                user:     user,
                groupId:  options.groupId,
                aggs:     aggs,
                synced:   new Date().getTime(),
                periods: {
                  start:  options.stamps.start,
                  end:    options.stamps.end
                }
              });
            };
          });
        }
        else
        {
          deferred.resolve({
            user:   user,
            synced: new Date().getTime(),
            periods: {
              start:  options.stamps.start,
              end:    options.stamps.end
            }
          });
        };
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Fetch user slots
   * This is needed as a seperate promise object
   * for making the process wait in Slots.all call bundle
   */
  Slots.prototype.user = function (params) 
  {
    var deferred = $q.defer();

    Slots.query(params, 
      function (result) 
      {
        deferred.resolve({
          id:   params.user,
          data: result,
          stats: Stats.member(result)
        });
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Return local slots
   */
  Slots.prototype.local = function () { return angular.fromJson(Storage.get('slots')); };


  /**
   * Slot adding process
   */
  Slots.prototype.add = function (slot, user) 
  {
    var deferred = $q.defer();

    Slots.save({user: user}, slot,
      function (result) 
      {
        deferred.resolve(result);
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * TODO
   * Add back-end
   *
   * Check whether slot is being replaced on top of an another
   * slot of same sort. If so combine them silently and show them as
   * one slot but keep aligned with back-end, like two or more slots 
   * in real.
   * 
   * Slot changing process
   */
  Slots.prototype.change = function (original, changed, user) 
  {
    var deferred = $q.defer();

    Slots.change(angular.extend(naturalize(changed), {user: user}), naturalize(original), 
      function (result) 
      {
        deferred.resolve(result);
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };


  /**
   * Slot delete process
   */
  Slots.prototype.remove = function (slot, user) 
  {
    var deferred = $q.defer();

    Slots.remove(angular.extend(naturalize(slot), {user: user}), 
      function (result) 
      {
        deferred.resolve(result);
      },
      function (error)
      {
        deferred.resolve({error: error});
      }
    );

    return deferred.promise;
  };
  

  /**
   * Naturalize Slot for back-end injection
   */
  function naturalize (slot)
  {
    var content = angular.fromJson(slot.content);

    return {
      start:      new Date(slot.start).getTime() / 1000,
      end:        new Date(slot.end).getTime() / 1000,
      recursive:  content.recursive,
      text:       content.state,
      id:         content.id
    }
  };


  /**
   * Check whether slot extends from saturday to sunday and if recursive?
   * 
   * Produce timestamps for sunday 00:00 am through the year and
   * check whether intended to change recursive slot has one of those
   * timestamps, if so slice slot based on midnight and present as two
   * slots in timeline.
   */
  // function checkForSatSun (slot) { };


  /**
   * Check for overlaping slots exists?
   * 
   * Prevent any overlaping slots by adding new slots or changing
   * the current ones in front-end so back-end is almost always aligned with
   * front-end.
   */
  // function preventOverlaps (slot) { };


  /**
   * Slice a slot from a give point
   */
  // function slice (slot, point) { };


  /**
   * Combine two slots
   */
  // function combine (slots) { };


  return new Slots;
});


/**
 * Planboard data processors
 */
WebPaige.
factory('Sloter', ['$rootScope', 'Storage', function ($rootScope, Storage) 
{
  return {

    /**
     * Getters
     */
    get: {
      groups: function ()
      {
        var groups = {};

        angular.forEach(Storage.local.groups(), function (group, index)
        {
          groups[group.uuid] = group.name;
        });

        return groups;
      },

      members: function ()
      {
        var members = {};

        angular.forEach(Storage.local.members(), function (member, index)
        {
          members[member.uuid] = member.name;
        });

        return members;
      }
    },

    /**
     * Wrap for sorting in list
     */
    wrapper: function (rank) { return '<span style="display:none;">' + rank + '</span>' },

    /**
     * Wrap secrets in slot contents
     */
    secret: function (content) { return '<span class="secret">' + content + '</span>' },

    /**
     * Add loading bars on both ends
     */
    addLoading: function (data, timedata, rows)
    {
      angular.forEach(rows, function(row, index)
      {
        timedata.push({
          start: data.periods.end,
          end: 1577836800000,
          group: row,
          content: 'loading',
          className: 'state-loading-right',
          editable: false
        });

        timedata.push({
          start: 0,
          end: data.periods.start,
          group: row,
          content: 'loading',
          className: 'state-loading-left',
          editable: false
        });
      });

      return timedata;
    },

    /**
     * Handle user slots
     */
    user: function (data, timedata, config)
    {
      var _this = this;

      angular.forEach(data.user, function (slot, index)
      {
        angular.forEach(config.legenda, function (value, legenda)
        {
          if (slot.text == legenda && value)
          {
            timedata.push({
              start: Math.round(slot.start * 1000),
              end: Math.round(slot.end * 1000),
              group: (slot.recursive) ? _this.wrapper('b') + $rootScope.ui.planboard.weeklyPlanning + _this.wrapper('recursive') : 
                                        _this.wrapper('a') + $rootScope.ui.planboard.planning + _this.wrapper('planning'),
              content: _this.secret(angular.toJson({
                type: 'slot',
                id: slot.id, 
                recursive: slot.recursive, 
                state: slot.text 
                })),
              className: config.states[slot.text].className,
              editable: true
            });
          };
        });       
      });

      timedata = _this.addLoading(data, timedata, [
        _this.wrapper('b') + $rootScope.ui.planboard.weeklyPlanning + _this.wrapper('recursive'),
        _this.wrapper('a') + $rootScope.ui.planboard.planning + _this.wrapper('planning')
      ]);

      return timedata;
    },
  
    /**
     * TODO
     * Look for ways to combine with user
     * 
     * Profile timeline data processing
     */
    profile: function (data, config)
    {
      var _this = this,
          timedata = [];

      angular.forEach(data, function (slot, index)
      {
        angular.forEach(config.legenda, function (value, legenda)
        {
          if (slot.text == legenda && value)
          {
            timedata.push({
              start: Math.round(slot.start * 1000),
              end: Math.round(slot.end * 1000),
              group: (slot.recursive) ? _this.wrapper('b') + $rootScope.ui.planboard.weeklyPlanning + _this.wrapper('recursive') : 
                                        _this.wrapper('a') + $rootScope.ui.planboard.planning + _this.wrapper('planning'),
              content: _this.secret(angular.toJson({
                type: 'slot',
                id: slot.id, 
                recursive: slot.recursive, 
                state: slot.text 
                })),
              className: config.states[slot.text].className,
              editable: true
            });  
          };
        });       
      });

      timedata.push({
        start: 0,
        end: 1,
        group: _this.wrapper('b') + $rootScope.ui.planboard.weeklyPlanning + _this.wrapper('recursive'),
        content: '',
        className: null,
        editable: false
      });

      timedata.push({
        start: 0,
        end: 1,
        group: _this.wrapper('a') + $rootScope.ui.planboard.planning + _this.wrapper('planning'),
        content: '',
        className: null,
        editable: false
      });

      return timedata;
    },

    /**
     * Handle group name whether divisions selected
     */
    namer: function (data, divisions, privilage)
    {
      var groups  = this.get.groups(),
          name    = groups[data.aggs.id],
          link    = '<a href="#/groups?uuid=' + 
                    data.aggs.id + 
                    '#view">' +
                    name +
                    '</a>',
                    title;

      if (data.aggs.division == 'all' || data.aggs.division == undefined)
      {
        title = (privilage == 1) ? link : '<span>' + name + '</span>';
      }
      else
      {
        var label;

        angular.forEach(divisions, function(division, index) { if (division.id == data.aggs.division) label = division.label; });

        title = (privilage == 1) ? link : '<span>' + name + '</span>';

        title += ' <span class="label">' + label + '</span>';
      };

      return title;
    },

    /**
     * Handle group aggs (with divisions) with bars
     */
    bars: function (data, timedata, config, name)
    {
      var _this = this,
          maxh = 0;

      angular.forEach(data.aggs.data, function(slot, index) { if (slot.wish > maxh)  maxh = slot.wish; });

      angular.forEach(data.aggs.data, function(slot, index)
      {
        var maxNum      = maxh,
            num         = slot.wish,
            xwish       = num,
            height      = Math.round(num / maxNum * 80 + 20), // a percentage, with a lower bound on 20%
            minHeight   = height,
            style       = 'height:' + height + 'px;',
            requirement = '<div class="requirement" style="' + 
                          style + 
                          '" ' + 


                          'title="'+'Minimum aantal benodigden'+': ' + 


                          num + 
                          ' personen"></div>';

        num = slot.wish + slot.diff;

        var xcurrent = num;

        height = Math.round(num / maxNum * 80 + 20);

        if (slot.diff >= 0 && slot.diff < 7)
        {
          switch(slot.diff)
          {
            case 0:
              var color = config.densities.even;
            break
            case 1:
              var color = config.densities.one;
            break;
            case 2:
              var color = config.densities.two;
            break;
            case 3:
              var color = config.densities.three;
            break;
            case 4:
              var color = config.densities.four;
            break;
            case 5:
              var color = config.densities.five;
            break;
            case 6:
              var color = config.densities.six;
            break;
          }
        }
        else if (slot.diff >= 7)
        {
          var color = config.densities.more;
        }
        else
        {
          var color = config.densities.less;
        };

        var span = '<span class="badge badge-inverse">' + slot.diff + '</span>';

        if (xcurrent > xwish) height = minHeight;

        style = 'height:' + height + 'px;' + 'background-color: ' + color + ';';

        var actual = '<div class="bar" style="' + 
                      style + 
                      '" ' + 

                      ' title="Huidig aantal beschikbaar: ' + 

                      num + 
                      ' personen">' + 
                      span + 
                      '</div>';

        if (  (slot.diff > 0 && config.legenda.groups.more) ||
              (slot.diff == 0 && config.legenda.groups.even) || 
              (slot.diff < 0 && config.legenda.groups.less) )
        {
          timedata.push({
            start:    Math.round(slot.start * 1000),
            end:      Math.round(slot.end * 1000),
            group:    _this.wrapper('c') + name,
            content:  requirement + 
                      actual +
                      _this.secret(angular.toJson({
                        type: 'group',
                        diff: slot.diff,
                        group: name
                      })),
            className: 'group-aggs',
            editable: false
          });
        };

        timedata = _this.addLoading(data, timedata, [
          _this.wrapper('c') + name
        ]);
      });

      return timedata;
    },

    /**
     * Process plain group aggs
     */
    aggs: function (data, timedata, config, name)
    {
      var _this = this;

      angular.forEach(data.aggs.data, function (slot, index)
      {
        var cn;

        if (slot.diff >= 0 && slot.diff < 7)
        {
          switch (slot.diff)
          {
            case 0: cn = 'even';  break
            case 1: cn = 1;       break
            case 2: cn = 2;       break
            case 3: cn = 3;       break
            case 4: cn = 4;       break
            case 5: cn = 5;       break
            case 6: cn = 6;       break
          }
        }
        else if (slot.diff >= 7)
        {
          cn = 'more';
        }
        else
        {
          cn = 'less'
        };

        if (  (slot.diff > 0 && config.legenda.groups.more) ||
              (slot.diff == 0 && config.legenda.groups.even) || 
              (slot.diff < 0 && config.legenda.groups.less) )
        {
          timedata.push({
            start: Math.round(slot.start * 1000),
            end: Math.round(slot.end * 1000),
            group: _this.wrapper('c') + name,
            content: cn +
                      _this.secret(angular.toJson({
                        type: 'group',
                        diff: slot.diff,
                        group: name
                      })),
            className: 'agg-' + cn,
            editable: false
          });
        };

        timedata = _this.addLoading(data, timedata, [
          _this.wrapper('c') + name
        ]);
      });

      return timedata;
    },

    /**
     * Wish slots
     */
    wishes: function (data, timedata, name)
    {
      var _this = this;

      angular.forEach(data.aggs.wishes, function (wish, index)
      {
        if ( wish.count >= 7 )
        {
          var cn = 'wishes-more';
        }
        else if ( wish.count == 0 )
        {
          var cn = 'wishes-even';
        }
        else
        {
          var cn = 'wishes-' + wish.count;
        };

        timedata.push({
          start: Math.round(wish.start * 1000),
          end: Math.round(wish.end * 1000),
          group: _this.wrapper('c') + name + ' (Wishes)',
          content: '<span class="badge badge-inverse">' + wish.count + '</span>' + 
                    _this.secret(angular.toJson({
                      type: 'wish',
                      wish: wish.count,
                      group: name,
                      groupId: data.aggs.id
                    })),
          className: cn,
          editable: false
        });

        timedata = _this.addLoading(data, timedata, [
          _this.wrapper('c') + name + ' (Wishes)'
        ]);
      });

      return timedata;
    },

    /**
     * Process members
     */
    members: function (data, timedata, config, privilage)
    {
      var _this   = this,
          members = this.get.members();          

      angular.forEach(data.members, function (member, index)
      {
        var link = (privilage == 1) ? 
                      _this.wrapper('d') + 
                      '<a href="#/profile/' + 
                      member.id + 
                      '#timeline">' + 
                      members[member.id] + 
                      '</a>' :
                      _this.wrapper('d') + 
                      members[member.id];

        angular.forEach(member.data, function (slot, i)
        {
          angular.forEach(config.legenda, function (value, legenda)
          {
            if (slot.text == legenda && value)
            {
              timedata.push({
                start: Math.round(slot.start * 1000),
                end: Math.round(slot.end * 1000),
                group: link,
                content: _this.secret(angular.toJson({ 
                  type: 'member',
                  id: slot.id, 
                  mid: member.id,
                  recursive: slot.recursive, 
                  state: slot.text 
                  })),
                className: config.states[slot.text].className,
                editable: false
              });
            };
          });
        });

        timedata.push({
          start:    0,
          end:      0,
          group:    link,
          content:  null,
          className:null,
          editable: false
        });

        timedata = _this.addLoading(data, timedata, [ link ]);

        /**
         * TODO
         * Good place to host this here?
         */
        angular.forEach(member.stats, function (stat, index)
        {
          var state = stat.state.split('.');
          state.reverse();
          stat.state = 'bar-' + state[0];
        });
      });

      return timedata;
    },

    /**
     * Produce pie charts
     */
    pies: function (data)
    {
      document.getElementById("groupPie").innerHTML = '';

      var ratios    = [],
          colorMap  = {
            more: '#415e6b',
            even: '#ba6a24',
            less: '#a0a0a0'
          },
          colors    = [],
          xratios   = [];

      angular.forEach(data.aggs.ratios, function (ratio, index)
      {
        if (ratio != 0)
        {
          ratios.push({
            ratio: ratio, 
            color: colorMap[index]
          });
        };
      });

      ratios = ratios.sort(function (a, b) { return b.ratio - a.ratio });

      angular.forEach(ratios, function (ratio, index)
      {
        colors.push(ratio.color);
        xratios.push(ratio.ratio);
      });

      var r   = Raphael("groupPie"),
          pie = r.piechart(120, 120, 100, xratios, { colors: colors });
    },
    
    /**
     * Timeline data processing
     */
    process: function (data, config, divisions, privilage)
    {
      var _this     = this,
          timedata  = [];

      if (data.user) timedata = _this.user(data, timedata, config);

      if (data.aggs)
      {
        var name = _this.namer(data, divisions, privilage);

        if (config.bar) 
        {
          timedata = _this.bars(data, timedata, config, name);
        }
        else
        {
          timedata = _this.aggs(data, timedata, config, name);
        };
      };

      if (config.wishes) timedata = _this.wishes(data, timedata, name);

      if (data.members) timedata = _this.members(data, timedata, config, privilage);

      if (data.aggs && data.aggs.ratios) _this.pies(data);

      return timedata;
    }

  }
}]);


/**
 * Planboard data processors
 */
WebPaige.
factory('Stats', ['$rootScope', 'Storage', function ($rootScope, Storage) 
{
  return {

    /**
     * Group agg stats
     */
    aggs: function (data)
    {
      var stats = {
            less: 0,
            even: 0,
            more: 0        
          },
          durations = {
            less: 0,
            even: 0,
            more: 0,
            total: 0
          },
          total = data.length;

      angular.forEach(data, function (slot, index)
      {
        if (slot.diff < 0)
        {
          stats.less++;
        }
        else if (slot.diff == 0)
        {
          stats.even++;
        }
        else
        {
          stats.more++;
        };

        var slotDiff = slot.end - slot.start;

        if (slot.diff < 0)
        {
          durations.less = durations.less + slotDiff;
        }
        else if (slot.diff == 0)
        {
          durations.even = durations.even + slotDiff;
        }
        else
        {
          durations.more = durations.more + slotDiff;
        };

        durations.total = durations.total + slotDiff;
      });

      return {
        ratios: {
          less: Math.round((stats.less / total) * 100),
          even: Math.round((stats.even / total) * 100),
          more: Math.round((stats.more / total) * 100)
        },
        durations: durations
      }
    },

    /**
     * Group pie stats
     */
    pies: function (data)
    {
      var stats = {
            less: 0,
            even: 0,
            more: 0        
          },
          total = data.length;

      angular.forEach(data, function (slot, index)
      {
        if (slot.diff < 0)
        {
          stats.less++;
        }
        else if (slot.diff == 0)
        {
          stats.even++;
        }
        else
        {
          stats.more++;
        };
      });

      return {
        less: Math.round((stats.less / total) * 100),
        even: Math.round((stats.even / total) * 100),
        more: Math.round((stats.more / total) * 100)
      };
    },

    /**
     * Member stats
     */
    member: function (data)
    {
      var stats = {},
          total = 0;

      angular.forEach(data, function (slot, index)
      {
        if (stats[slot.text])
        {
          stats[slot.text]++;
        }
        else
        {
          stats[slot.text] = 1;
        };

        total++;
      });

      //console.warn('stats ->', stats, total);

      var ratios = [];

      angular.forEach(stats, function (stat, index)
      {
        ratios.push({
          state: index,
          ratio: (stat / total) * 100
        });

        //console.warn(stat, index);
        //ratios[index] = (stat / total) * 100;
      });

      //console.warn('ratios ->', ratios);

      // var confirm = 0;
      // angular.forEach(ratios, function(ratio, index)
      // {
      //   confirm = confirm + ratio;
      // });
      // console.warn('confirm ->', confirm);
      
      return ratios;
    }

  }
}]);