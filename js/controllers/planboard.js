'use strict';

/**
 * TODO
 * Clear list of dependencies
 *
 * Planboard Controller
 */
function planboardCtrl($rootScope, $scope, $config, $location, $route, data, Slots, Dater, Storage) 
{
  /**
   * Set default currents
   */
  var self = this,
      // Set preiods
      periods = Dater.getPeriods(),
      // Get groups
      groups = angular.fromJson(Storage.get('groups')),
      // Set current values
      current = {
        layouts: {
          user: true,
          group: true,
          members: false         
        },
        day: Date.today().getDayOfYear() + 1,
        week: new Date().getWeek(),
        month: new Date().getMonth() + 1,
        // Set first group as selected
        group: groups[0].uuid,
        // DEfault division
        division: 'all'
      };


  /**
   * Reset slot container
   * which is used for adding or changing
   * slots
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
      from: periods.weeks[current.week].first.day,
      till: periods.weeks[current.week].last.day
    },
    scope: {
      day: false,
      week: true,
      month: false
    },
    config: {
      bar: $config.timeline.config.bar,
      states: $config.timeline.config.states,
      divisions: $config.timeline.config.divisions,
      densities: $config.timeline.config.densities
    }
  };


  /**
   * TODO
   * Look for ways to implement in scope.timeline!!
   * Move date conversions to Dater
   */
  $scope.daterange =  new Date($scope.timeline.range.from).toString('dd-MM-yyyy') + 
                      ' / ' + 
                      new Date($scope.timeline.range.till).toString('dd-MM-yyyy');


  /**
   * TODO
   * States for dropdown
   */
  var states = {};
  angular.forEach($scope.timeline.config.states, function(state, key)
  {
    states[key] = state.label;
  });
  $scope.states = states;





  /**
   * Groups for dropdown
   */
  $scope.groups = groups;
  

  /**
   * Group aggs barCharts toggler
   */
  $scope.barCharts = function()
  {
    $scope.timeline.config.bar = !$scope.timeline.config.bar;
    timeliner({
      start:  $scope.timeline.range.from,
      end:    $scope.timeline.range.till
    });    
  };
  /*
  $scope.$watch('timeline.config.bar', function()
  {
    render();
  });
  */
  

  /**
   * Group wishes toggler
   */
  $scope.groupWishes = function()
  {
    $scope.timeline.bar = !$scope.timeline.bar;
    timeliner({
      start:  $scope.timeline.range.from,
      end:    $scope.timeline.range.till
    });    
  };


  /**
   * TODO
   * Groups for dropdown
   */
  $scope.divisions = $scope.timeline.config.divisions;
  




  /**
   * Watch for changes in timeline range
   */
  $scope.$watch(function()
  {
    /**
     * Get timeline range
     */
    var range = self.timeline.getVisibleChartRange();
    /**
     * Calculate difference
     */
    var diff = new Date(range.end).getTime() - new Date(range.start).getTime();
    /**
     * Scope is a day
     */
    // TODO
    // try later on!
    // new Date(range.start).toString('d') == new Date(range.end).toString('d')
    if (diff <= 86400000)
    {
      $scope.timeline.scope = {
        day: true,
        week: false,
        month: false
      };
    }
    /**
     * Scope is less than a week
     */
    else if (diff < 604800000)
    {
      $scope.timeline.scope = {
        day: false,
        week: true,
        month: false
      };
    }
    /**
     * Scope is more than a week
     */
    else if (diff > 604800000)
    {
      $scope.timeline.scope = {
        day: false,
        week: false,
        month: true
      };
    };
    /**
     * Set ranges
     */
    $scope.timeline.range = {
      from: new Date(range.start).toString($config.date.stringFormat),
      till: new Date(range.end).toString($config.date.stringFormat)
    };
    /**
     * Pass range to dateranger
     */
    $scope.daterange =  new Date($scope.timeline.range.from).toString('dd-MM-yyyy') + 
                        ' / ' + 
                        new Date($scope.timeline.range.till).toString('dd-MM-yyyy');
  });
 

  /**
   * TODO
   * Automatically initialize this function
   */
  render();


  /**
   * Renderer listener
   */
  $rootScope.$on('renderPlanboard', function () 
  {
    render();
  });


  /**
   * TODO
   * Define a better way with dealing localStorage and Resolver
   *
   * Controller render
   */
  function render()
  {
    /**
     * Where is my timeline landlord?
     */
    self.timeline = new links.Timeline(document.getElementById('myTimeline'));
    /**
     * Init timeline listeners
     */
    links.events.addListener(self.timeline, 'rangechanged',  timelineGetRange);
    links.events.addListener(self.timeline, 'edit',          timelineOnEdit);
    links.events.addListener(self.timeline, 'add',           timelineOnAdd);
    links.events.addListener(self.timeline, 'delete',        timelineOnDelete);
    links.events.addListener(self.timeline, 'change',        timelineOnChange);
    links.events.addListener(self.timeline, 'select',        timelineOnSelect);
    /**
     * Run timeline
     */
    timeliner($scope.timeline.options);
  };


  /**
   * Timeliner listener
   */
  $rootScope.$on('timeliner', function() 
  {
    /**
     * Convert arguments
     */
    var options = {
      start: arguments[1].from,
      end: arguments[1].till
    };
    /**
     * Check whether custom scope is outside of of timeline.current.month
     */
    if (options.start.getTime() <= periods.months[$scope.timeline.current.month].first.timeStamp || 
        options.end.getTime() >= periods.months[$scope.timeline.current.month].last.timeStamp)
    {
      /**
       * TODO
       * Unify this later on with route change preloader
       * Workaround for preloader
       */
      $rootScope.alertType = "";
      $rootScope.alertMessage = "Loading...";
      $rootScope.active = "progress-striped active progress-warning";
      /**
       * Fetch new data
       */
      Slots.all({
        groupId: $scope.timeline.current.group,
        division: $scope.timeline.current.division,
        layouts: $scope.timeline.current.layouts,
          
        month: $scope.timeline.current.month,
        stamps: {
          // start:  options.start.getTime(),
          // end:    options.end.getTime()
          start:  new Date($scope.timeline.range.start).getTime(),
          end:    new Date($scope.timeline.range.end).getTime()
        },
      })
      .then(function(data)
      {
        $scope.data = data;
        /**
         * Adjust timeline for new period
         */
        timeliner(options);
        /**
         * TODO
         * Workaround for preloader
         */
        $rootScope.alertType = "alert-success";
        $rootScope.alertMessage = "Successfully loaded :]";
        $rootScope.active = "progress-success";
      }); 
    }
    else
    {   
      /**
       * Timeline it baby!
       */
      timeliner(options);
    };
  });


  /**
   * Draw and limit timeline
   */
  function timeliner(options)
  {
    /**
     * Timeline options
     */
    $scope.timeline = {
      current: $scope.timeline.current,
      scope: $scope.timeline.scope,
      config: $scope.timeline.config,
      options: {
        start:  new Date(options.start),
        end:    new Date(options.end),
        min:    new Date(options.start),
        max:    new Date(options.end)
      }
    };
    /**
     * Merge options with defaults
     */
    angular.extend($scope.timeline.options, $config.timeline.options);
    /**
     * Draw timeline
     */
    self.timeline.draw(
      self.process(
        $scope.data, 
        $scope.timeline.config,
        angular.fromJson(Storage.get('groups')),
        angular.fromJson(Storage.get('members')),
        $scope.divisions
      ), 
      $scope.timeline.options
    );
    /**
     * Set range dynamically
     */
    self.timeline.setVisibleChartRange($scope.timeline.options.start, $scope.timeline.options.end);
  };


  /**
   * Timeline zoom in
   */
  $scope.timelineZoomIn = function()
  {
    self.timeline.zoom( $config.timeline.settings.zoomValue );
  };


  /**
   * Timeline zoom out
   */
  $scope.timelineZoomOut = function()
  {
    self.timeline.zoom( -$config.timeline.settings.zoomValue );
  };


  /**
   * Go one period in past
   */
  $scope.timelineBefore = function(timelineScope)
  {
    /**
     * Detect scopes
     *
     * 
     * 
     * Scope day
     */
    if ($scope.timeline.scope.day)
    {
      if ($scope.timeline.current.day != 1)
      {
        /**
         * Adjust timeline
         */
        timeliner({
          start:  periods.days[$scope.timeline.current.day - 1].first.day,
          end:    periods.days[$scope.timeline.current.day - 1].last.day
        });
        /**
         * Decrement day
         */
        $scope.timeline.current.day--;
      };
    }


    /**
     * Scope week
     */
    else if ($scope.timeline.scope.week)
    {
      if ($scope.timeline.current.week != 1)
      {
        /**
         * Adjust timeline
         */
        timeliner({
          start:  periods.weeks[$scope.timeline.current.week - 1].first.day,
          end:    periods.weeks[$scope.timeline.current.week - 1].last.day
        });
        /**
         * Decrement week
         */
        $scope.timeline.current.week--;
      };
    }


    /**
     * Scope month
     */
    else if ($scope.timeline.scope.month)
    {
      if ($scope.timeline.current.month != 1)
      {
        /**
         * Decrement current month
         */
        $scope.timeline.current.month--;
        /**
         * TODO
         * Unify this later on with route change preloader
         * Workaround for preloader
         */
        $rootScope.alertType = "";
        $rootScope.alertMessage = "Loading...";
        $rootScope.active = "progress-striped active progress-warning";
        /**
         * Fetch new data
         */
        Slots.all({
          groupId: $scope.timeline.current.group,
          division: $scope.timeline.current.division,
          
          month: $scope.timeline.current.month,
          stamps: {
            // start:  periods.months[$scope.timeline.current.month].first.timeStamp,
            // end:    periods.months[$scope.timeline.current.month].last.timeStamp
            start:  new Date($scope.timeline.range.from).getTime(),
            end:    new Date($scope.timeline.range.till).getTime()
          },

          layouts: $scope.timeline.current.layouts
        })
        .then(function(data)
        {
          $scope.data = data;
          /**
           * Adjust timeline for new period
           */
          timeliner({
            start:  periods.months[$scope.timeline.current.month].first.day,
            end:    periods.months[$scope.timeline.current.month].last.day
          });
          /**
           * TODO
           * Workaround for preloader
           */
          $rootScope.alertType = "alert-success";
          $rootScope.alertMessage = "Successfully loaded :]";
          $rootScope.active = "progress-success";
        });
      };
    };
  };


  /**
   * Go one period in future
   */
  $scope.timelineAfter = function(timelineScope)
  {
    /**
     * Detect scopes
     *
     * Scope day
     */
    if ($scope.timeline.scope.day)
    {
      /**
       * Total days in a month can change so get it from periods cache
       */
      if ($scope.timeline.current.day != periods.days.total)
      {
        /**
         * Adjust timeline
         */
        timeliner({
          start:  periods.days[$scope.timeline.current.day + 1].first.day,
          end:    periods.days[$scope.timeline.current.day + 1].last.day
        });
        /**
         * Increment day
         */
        $scope.timeline.current.day++;
      };
    }
    /**
     * Scope week
     */
    else if ($scope.timeline.scope.week)
    {
      if ($scope.timeline.current.week != 53)
      {
        /**
         * Adjust timeline
         */
        timeliner({
          start:  periods.weeks[$scope.timeline.current.week + 1].first.day,
          end:    periods.weeks[$scope.timeline.current.week + 1].last.day
        });
        /**
         * Increment week
         */
        $scope.timeline.current.week++;
      };
    }
    /**
     * Scope month
     */
    else if ($scope.timeline.scope.month)
    {
      if ($scope.timeline.current.month != 12)
      {
        /**
         * Increment current month
         */
        $scope.timeline.current.month++;
        /**
         * TODO
         * Unify this later on with route change preloader
         * Workaround for preloader
         */
        $rootScope.alertType = "";
        $rootScope.alertMessage = "Loading...";
        $rootScope.active = "progress-striped active progress-warning";
        /**
         * Fetch new data
         */
        Slots.all({
          groupId: $scope.timeline.current.group,
          division: $scope.timeline.current.division,
          
          month: $scope.timeline.current.month,
          stamps: {
            // start:  periods.months[$scope.timeline.current.month].first.timeStamp,
            // end:    periods.months[$scope.timeline.current.month].last.timeStamp
            start:  new Date($scope.timeline.range.from).getTime(),
            end:    new Date($scope.timeline.range.till).getTime()
          },

          layouts: $scope.timeline.current.layouts
        })
        .then(function(data)
        {
          $scope.data = data;
          /**
           * Adjust timeline for new period
           */
          timeliner({
            start:  periods.months[$scope.timeline.current.month].first.day,
            end:    periods.months[$scope.timeline.current.month].last.day
          });
          /**
           * TODO
           * Workaround for preloader
           */
          $rootScope.alertType = "alert-success";
          $rootScope.alertMessage = "Successfully loaded :]";
          $rootScope.active = "progress-success";
        });
      };
    };
  };


  /**
   * Handle new requests for timeline
   */
  $scope.requestTimeline = function(current, section)
  {
    switch (section)
    {
      case 'group':
          $scope.timeline.current.layouts.group = !$scope.timeline.current.layouts.group;
          /**
           * Check if when group is deselected when members is deselected as well
           */
          if ($scope.timeline.current.layouts.members && 
              !$scope.timeline.current.layouts.group)
          {
            $scope.timeline.current.layouts.members = false;
          };
        break;
      case 'members':
          $scope.timeline.current.layouts.members = !$scope.timeline.current.layouts.members;
          /**
           * Check if group is selected when members is selected
           */
          if ($scope.timeline.current.layouts.members && 
              !$scope.timeline.current.layouts.group)
          {
            $scope.timeline.current.layouts.group = true;
          };
        break;
    };
    /**
     * TODO
     * Unify this later on with route change preloader
     * Workaround for preloader
     */
    $rootScope.alertType = "";
    $rootScope.alertMessage = "Loading...";
    $rootScope.active = "progress-striped active progress-warning";
    /**
     * Fetch new data
     */
    Slots.all({
      groupId: $scope.timeline.current.group,
      division: $scope.timeline.current.division,

      month: $scope.timeline.current.month,
      stamps: {
        // start:  periods.months[$scope.timeline.current.month].first.timeStamp,
        // end:    periods.months[$scope.timeline.current.month].last.timeStamp
        start:  new Date($scope.timeline.range.from).getTime(),
        end:    new Date($scope.timeline.range.till).getTime()
      },

      layouts: $scope.timeline.current.layouts
    })
    .then(function(data)
    {
      $scope.data = data;
      render();
      /**
       * TODO
       * Workaround for preloader
       */
      $rootScope.alertType = "alert-success";
      $rootScope.alertMessage = "Successfully loaded :]";
      $rootScope.active = "progress-success";
    });
  };


  /**
   * Day & Week & Month toggle actions
   */
  $scope.timelineScoper = function(period)
  {
    /**
     * Reset currents
     */
    $scope.timeline.current.day = current.day;
    $scope.timeline.current.week = current.week;
    $scope.timeline.current.month = current.month;
    /**
     * Switch on periods
     */
    switch (period)
    {
      /**
       * Scope day
       */
      case 'day':
        $scope.timeline.scope = {
          day: true,
          week: false,
          month: false
        };
        /**
         * If we are not in the current month
         */
        if ($scope.timeline.current.month != new Date().toString('M'))
        {
          for (var i in periods.days)
          {
            if (periods.months[$scope.timeline.current.month].first.timeStamp <= 
                periods.days[i].first.timeStamp)
            {
              $scope.timeline.current.day = i;
              
              /**
               * Adjust timeline
               */
              timeliner({
                start:  periods.days[i].first.day,
                end:    periods.days[i].last.day
              });
              break;
            };
          };
        }
        else
        {
          /**
           * Adjust timeline
           */
          timeliner({
            start:  periods.days[$scope.timeline.current.day].first.day,
            end:    periods.days[$scope.timeline.current.day].last.day
          });
        };

        break;
      /**
       * Scope week
       */
      case 'week':
        $scope.timeline.scope = {
          day: false,
          week: true,
          month: false
        };
        /**
         * If we are not in the current month
         */
        if ($scope.timeline.current.month != new Date().toString('M'))
        {
          for (var i in periods.weeks)
          {
            if (periods.months[$scope.timeline.current.month].first.timeStamp <= 
                periods.weeks[i].first.timeStamp)
            { 
              $scope.timeline.current.week = i;

              /**
               * Adjust timeline
               */
              timeliner({
                start:  periods.weeks[i].first.day,
                end:    periods.weeks[i].last.day
              });
              break;
            };
          };
        }
        else
        {
          /**
           * Adjust timeline
           */
          timeliner({
            start:  periods.weeks[$scope.timeline.current.week].first.day,
            end:    periods.weeks[$scope.timeline.current.week].last.day
          });
        };

        break;
      /**
       * Scope month
       */
      case 'month':
        $scope.timeline.scope = {
          day: false,
          week: false,
          month: true
        };
        /**
         * Adjust timeline
         */
        timeliner({
          start:  periods.months[$scope.timeline.current.month].first.day,
          end:    periods.months[$scope.timeline.current.month].last.day
        });
        break;
    };
  };


  /**
   * Timeline get ranges
   */
  function timelineGetRange()
  {
    var range = self.timeline.getVisibleChartRange();
    $scope.$apply(function()
    {
      $scope.timeline.range = {
        from: new Date(range.start).toString($config.date.stringFormat),
        till: new Date(range.end).toString($config.date.stringFormat)
      };
      $scope.daterange =  new Date(new Date(range.start).getTime()).toString('dd-MM-yyyy') + 
                          ' / ' + 
                          new Date(new Date(range.end).getTime()).toString('dd-MM-yyyy');
    });
  };


  /**
   * Set timeline range manually
   */
  // $scope.setTimelineRange = function()
  // {
  //   /**
  //    * TODO
  //    * Lose jquery hook later on
  //    */
  //   var dates = $scope.daterange = $('input[name=daterange]').val();
  //   var dates = Dater.convertRangeDates(dates);
  //   timeliner({
  //     start:  dates.start,
  //     end:    dates.end
  //   });
  // };


  /**
   * TODO
   * Get slot information of selcted slot
   * Put that information in the scope!
   *
   * Get information of the selected slot
   */
  function selectedSlot()
  {
    var selection;
    if (selection = self.timeline.getSelection()[0])
    {
      var values = $scope.original = self.timeline.getItem(selection.row);
      var content = angular.fromJson(values.content);
      $scope.slot = {
        from: {
          date: Dater.readableDate(values.start, $config.date.format),
          time: Dater.readableTime(values.start, $config.time.format)
        },
        till: {
          date: Dater.readableDate(values.end, $config.date.format),
          time: Dater.readableTime(values.end, $config.time.format)
        },
        state: content.state,
        recursive: content.recursive,
        id: content.id
      };   
      return values;
    }
  };


  /**
   * Extract Slot ID of the selected slot
   */
  function selectedSlotID()
  {
    return angular.fromJson(selectedSlot().content).id;
  };


  /**
   * TODO
   * Finish it!
   * selectedOriginal is still needed?
   * 
   * Timeline on select
   */
  function timelineOnSelect()
  {
    $scope.$apply(function()
    {
      $scope.selectedOriginal = selectedSlot();
    });
  };


  /**
   * TODO
   * Finish it!
   * Find a way to dynamically present state menu
   * after the creation of slot with mouse, or just use 'available'
   * as default.
   * 
   * Timeline on add
   */
  function timelineOnAdd()
  {
    // DEPRECIATED
    // $scope.$apply(function()
    // {
    //   $scope.newSlots.push(selectedSlot());
    // });
  };


  /**
   * TODO
   * Redirect to add in Resource
   *
   * Add slot trigger from view
   */
  $scope.add = function(slot)
  {
    /**
     * TODO
     * Build prototype conversion
     * Date obejcts in return values of function
     * not working properly..
     */    
    Slots.add({
      start: Date.parse(slot.from.date + ' ' + slot.from.time),
      end: Date.parse(slot.till.date + ' ' + slot.till.time),
      recursive: (slot.recursive) ? true : false,
      text: slot.state,
      id: (slot.id) ? slot.id : 0
    });
    $scope.slot = {};
  };


  /**
   * TODO
   * Finish it!
   * 
   * Timeline on edit
   */
  function timelineOnEdit()
  {
    console.log('double click edit mode!');
  };


  /**
   * TODO
   * Find ways of combining with triggers from view
   * 
   * Timeline on change
   */
  function timelineOnChange()
  { 
    Slots.change($scope.original, selectedSlot());
  };


  /**
   * TODO
   * Redirect to change in Resource
   *
   * Change trigger from view
   */
  $scope.change = function(original, slot)
  {
    /**
     * TODO
     * Ugly fix! Define a common way converting obejcts
     */
    var slot = {
      start: Date.parse(slot.from.date + ' ' + slot.from.time),
      end: Date.parse(slot.till.date + ' ' + slot.till.time),
      recursive: (slot.recursive) ? true : false,
      text: slot.state,
      id: (slot.id) ? slot.id : 0,
      content: angular.toJson({ 
        id: slot.id, 
        recursive: slot.recursive, 
        state: slot.state 
        })
    };
    Slots.change($scope.original, slot);
  };


  /**
   * TODO
   * Find ways of combining with triggers from view
   * 
   * Timeline on delete
   * @return {[type]} [description]
   */
  function timelineOnDelete()
  {
    Slots.delete(selectedSlotID(), selectedSlot());
  };


  /**
   * TODO
   * Redirect to delete in Resource
   *
   * Delete trigger from view
   */
  $scope.delete = function(id)
  {
    Slots.delete(id, selectedSlot());
  };


  /**
   * TODO
   * Quick fix for tabs on the left!
   * Make a permanent fix for this
   */
  $scope.fixTabHeight = function(section)
  {
    var tabHeight = $('.tabs-left .nav-tabs').height();
    var contentHeight = $('.tabs-left .tab-content #' + section).height();
    if (tabHeight > contentHeight)
    {
      $('.tabs-left .tab-content #' + section).css({ height: $('.tabs-left .nav-tabs').height() });
    };
  };


};





















/**
 * TODO
 * Implement eventBus!
 * 
 * Resolve planboard
 */
planboardCtrl.resolve = {
  data: function ($route, Slots, Storage) 
  {
    /**
     * Fetch periods
     */
    var periods = angular.fromJson(Storage.get('periods')),
        /**
         * Set initial period for starting timeline
         */
        initial = periods.months[new Date().toString('M')],
        /**
         * Set first group and current month for the planboard link
         */
        groups = angular.fromJson(Storage.get('groups'));
    /**
     * Fetch the data from model
     */
    return Slots.all({
      // Startup group
      groupId: groups[0].uuid,
      // Startup division
      division: 'all',
      // Startup periods
      stamps: {
        start:  initial.first.timeStamp,
        end:    initial.last.timeStamp
      },

      month: new Date().toString('M'),

      // Startup layouts
      layouts: {
        user: true,
        group: true,
        members: false
      }
    });
  }
};




















/**
 * TODO
 * Organize prototypes!
 * 
 * Planboard prototypes
 */
planboardCtrl.prototype = {
  
  /**
   * Initialize the constructor
   */
  constructor: planboardCtrl,

  /**
   * TODO
   * Compacter
   *
   * Make values back-end friendly
   */
  backendFriendly: function(slot)
  {
    return {
      start: Date.parse(slot.from.date + ' ' + slot.from.time),
      end: Date.parse(slot.till.date + ' ' + slot.till.time),
      recursive: (slot.recursive) ? true : false,
      text: slot.state,
      id: (slot.id) ? slot.id : 0
    }
  },
  
  /**
   * TODO
   * List sorting functions?
   * Make it compact!
   *
   * Timeline data processing
   */
  process: function (data, config, ngroups, nmembers, divisions)
  {
    var timedata = [];

    /**
     * Get groups
     */
    var groups = {};
    angular.forEach(ngroups, function(group, index)
    {
      groups[group.uuid] = group.name;
    });

    /**
     * Get members
     */
    var members = {};
    angular.forEach(nmembers, function(member, index)
    {
      members[member.uuid] = member.name;
    });

    /**
     * Wrap hidden span for sorting workaround in timeline rows
     */
    function wrapper(rank)
    {
      return '<span style="display:none;">' + rank + '</span>';
    };

    /**
     * Process user slots
     */
    if (data.user)
    {
      angular.forEach(data.user, function(slot, index)
      {
        timedata.push({
          start: Math.round(slot.start * 1000),
          end: Math.round(slot.end * 1000),
          group: (slot.recursive) ? wrapper('b') + 'Wekelijkse planning' : 
                                    wrapper('a') + 'Planning',
          content: angular.toJson({ 
            id: slot.id, 
            recursive: slot.recursive, 
            state: slot.text 
            }),
          className: config.states[slot.text].className,
          editable: true
        });        
      });
      /**
       * Add empty slots for not displaying timeline bug
       */
      timedata.push({
        start: 0,
        end: 0,
        group: wrapper('b') + 'Wekelijkse planning',
        content: null,
        className: null,
        editable: false
      });
      timedata.push({
        start: 0,
        end: 0,
        group: wrapper('a') + 'Planning',
        content: null,
        className: null,
        editable: false
      });
    };

    /**
     * Process group slots
     */
    if (data.aggs)
    {
      /**
       * Check whether a division is selected
       */
      if (data.aggs.division == 'all' || data.aggs.division == undefined)
      {
        var name = groups[data.aggs.id];
      }
      else
      {
        var label;
        /**
         * Loop over the divisions
         */
        angular.forEach(divisions, function(division, index)
        {
          if (division.id == data.aggs.division)
          {
            label = division.label;
          }
        });
        /**
         * Set division in the name
         */
        var name = groups[data.aggs.id] + 
                    '<span class="label" style="margin-left:5px">' + 
                    label + 
                    '</span>';
      };

      /**
       * Group bar charts
       */
      if (config.bar)
      {
        /**
         * TODO
         * Optimize code below
         */
        var maxh = 0;
        /**
         * TODO
         * Still needed? Since the top range is fixed already?
         *
         * Calculate the max
         */
        angular.forEach(data.aggs.data, function(slot, index)
        {
          if (slot.wish > maxh)
          {
            maxh = slot.wish;
          };
        });
        /**
         * Loop through the slots
         */
        angular.forEach(data.aggs.data, function(slot, index)
        {
          /**
           * Calculate initial values
           */
          var maxNum = maxh,
              num = slot.wish,
              xwish = num,
              // a percentage, with a lower bound on 20%
              height = Math.round(num / maxNum * 80 + 20),
              minHeight = height,
              style = 'height:' + height + 'px;',
              requirement = '<div class="requirement" style="' + 
                            style + 
                            '" ' + 
                            'title="Minimum aantal benodigden: ' + 
                            num + 
                            ' personen"></div>';
          /**
           * ?
           */
          num = slot.wish + slot.diff;
          /**
           * ?
           */
          var xcurrent = num;
          /**
           * A percentage, with a lower bound on 20%
           */
          height = Math.round(num / maxNum * 80 + 20);
          /**
           * Base color based on density
           */
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
          /**
           * Show diff value in badge
           */
          var span = '<span class="badge badge-inverse">' + slot.diff + '</span>';
          /**
           * ?
           */
          if (xcurrent > xwish)
          {
            height = minHeight;
          };
          /**
           * Set the style for bar
           */
          style = 'height:' + height + 'px;' + 'background-color: ' + color + ';';
          /**
           * TODO
           * Strip hard-coded local texts
           *
           * Style for actual
           */
          var actual = '<div class="bar" style="' + 
                        style + 
                        '" ' + 
                        ' title="Huidig aantal beschikbaar: ' + 
                        num + 
                        ' personen">' + 
                        span + 
                        '</div>';
          /**
           * Push in pool
           */
          timedata.push({
            start: Math.round(slot.start * 1000),
            end: Math.round(slot.end * 1000),
            group: wrapper('c') + groups[data.aggs.id],
            content: requirement + actual,
            className: 'group-aggs',
            editable: false
          });
        });
      }
      /**
       * Normal view for group slots
       */
      else
      {
        /**
         * Loop throught the slots
         */
        angular.forEach(data.aggs.data, function(slot, index)
        {
          /**
           * Class indicator
           */
          var cn;
          /**
           * Base color based on density
           */
          if (slot.diff >= 0 && slot.diff < 7)
          {
            switch(slot.diff)
            {
              case 0:
                cn = 'even';
                break
              case 1:
                cn = 1;
                break
              case 2:
                cn = 2;
                break
              case 3:
                cn = 3;
                break
              case 4:
                cn = 4;
                break
              case 5:
                cn = 5;
                break
              case 6:
                cn = 6;
                break
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
          /**
           * Push in pool
           */
          timedata.push({
            start: Math.round(slot.start * 1000),
            end: Math.round(slot.end * 1000),
            group: wrapper('c') + name,
            content: cn,
            className: 'agg-' + cn,
            editable: false
          });
        });
      };
    };

    /**
     * Process members slots
     */
    if (data.members)
    {
      /**
       * Get members
       */
      //var members = angular.fromJson(Storage.get('members'));
      /**
       * Loop through members
       */
      angular.forEach(data.members, function(member, index)
      {
        /**
         * Loop through slots of member
         */
        angular.forEach(member.data, function(slot, i)
        {
          timedata.push({
            start: Math.round(slot.start * 1000),
            end: Math.round(slot.end * 1000),
            group: wrapper('d') + members[member.id],
            // group: (slot.recursive) ? wrapper('d') + members[member.id] + 'Wekelijkse planning' 
            //                         : wrapper('d') + members[member.id] + 'Planning',
            content: angular.toJson({ 
              id: slot.id, 
              recursive: slot.recursive, 
              state: slot.text 
              }),
            className: config.states[slot.text].className,
            editable: true
          });
        });
        /**
         * Add empty slots for forcing timeline to display the row
         * even if there is no data of the user
         */
        timedata.push({
          start: 0,
          end: 0,
          group: wrapper('d') + members[member.id],
          content: null,
          className: null,
          editable: false
        });
      });
    };

    return timedata;
  }

};

planboardCtrl.$inject = ['$rootScope', 
                          '$scope', 
                          '$config',
                          '$location',
                          '$route',
                          'data', 
                          'Slots', 
                          'Dater', 
                          'Storage'];



