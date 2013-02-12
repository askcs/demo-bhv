'use strict';

/**
 * TODO
 * Clear list of dependencies
 * 
 * TimeSlots Resource
 */
WebPaige.
factory('Slots', function ($resource, $config, $q, $route, $timeout, Storage, $rootScope, Dater) 
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
      delete: {
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
      }
    }
  );
















  /**
   * Get group aggs
   */
  Slots.prototype.aggs = function (options) 
  {
    /**
     * Default params
     */
    var deferred = $q.defer(),
        params = {
          id: options.id,
          start: options.start,
          end: options.end
        };
    /**
     * If specific division is selected
     */
    if (options.division != undefined)
    {
      params.stateGroup = options.division;
    };
    /**
     * Fetch aggs
     */
    Aggs.query(params, function (result) 
    {
      deferred.resolve({
        id: options.id,
        division: options.division,
        data: result
      });
    });
    return deferred.promise;
  };











  // /**
  //  * Get group aggs
  //  */
  // Slots.prototype.aggs___ = function (options) 
  // {
  //   /**
  //    * Default params
  //    */
  //   var deferred = $q.defer(),
  //       params = {
  //         id: options.id,
  //         start: options.start,
  //         end: options.end
  //       };
  //       //,aggs = angular.fromJson(Storage.get('aggs')) || {};

  //   /**
  //    * Check if box exists otherwsie create it
  //    */
  //   if (aggs[params.id] && aggs[params.id][options.month])
  //   {
  //     deferred.resolve({
  //         id: params.id,
  //         division: options.division,
  //         data: aggs[params.id][options.month]
  //     });
  //   }
  //   else
  //   {
  //     /**
  //      * If specific division is selected
  //      */
  //     if (options.division != undefined)
  //     {
  //       params.stateGroup = options.division;
  //     };

  //     /**
  //      * Fetch aggs
  //      */
  //     Aggs.query(params, function (result) 
  //     {
  //       /**
  //        * Check if box exists otherwsie create it
  //        */
  //       if (aggs[params.id])
  //       {
  //         aggs[params.id][options.month] = result;
  //       }
  //       else
  //       {
  //         aggs[params.id] = {};
  //         aggs[params.id][options.month] = result;
  //       };
  //       /**
  //        * Save data to localstorage
  //        */
  //       Storage.add('aggs', angular.toJson(aggs));
          
  //       deferred.resolve({
  //         id: options.id,
  //         division: options.division,
  //         data: result
  //       });
  //     });
      
  //   };

  //   return deferred.promise;
  // };















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
          /**
           * TODO
           * This causes an issue of rendering someone else's timeline
           */
          user:   angular.fromJson(Storage.get('resources')).uuid,
          start:  options.stamps.start / 1000,
          end:    options.stamps.end / 1000
        },
        data = {};

    // /**
    //  * Is it monthly view or custom range?
    //  */
    // if (options.custom)
    // {
    //   params.start = options.periods.start / 1000;
    //   params.end = options.periods.end / 1000;
    // }
    // else
    // {
    //   params.start = periods.months[options.month].first.timeStamp / 1000;
    //   params.end = periods.months[options.month].last.timeStamp / 1000;
    // }

    /**
     * Fetch first user slots
     */
    Slots.query(params, function(user) 
    {
      /**
       * Check whether group is selected
       */
      if (options.layouts.group)
      {
        /**
         * Given params
         */
        var groupParams = {
            id: options.groupId,
            start: params.start,
            end: params.end,
            month: options.month
        };

        /**
         * If specific division is selected
         */
        if (options.division != 'all')
        {
          groupParams.division = options.division;
        };

        /**
         * Fetch group aggs
         */
        Slots.prototype.aggs(groupParams)
        .then(function(aggs)
        {
          /**
           * Check whether members are selected
           */
          if (options.layouts.members)
          {
            /**
             * Get members of given group
             */
            var members = angular.fromJson(Storage.get(options.groupId));
            /**
             * Reset calls
             */
            var calls = [];
            /**
             * Loop through the members
             */
            angular.forEach(members, function(member, index)
            {
              /**
               * Push members in calls pool
               */
              calls.push(Slots.prototype.user({
                user: member.uuid,
                //start: periods.months[options.month].first.timeStamp / 1000,
                //end: periods.months[options.month].last.timeStamp / 1000,
                start: params.start,
                end: params.end,
                type: 'both'
              }));
            });
            /**
             * Run pool of calls
             */
            $q.all(calls)
            .then(function(members)
            {
              /**
               * Return promised values
               */
              deferred.resolve({
                user: user,
                groupId: options.groupId,
                aggs: aggs,
                members: members,
                synced: new Date().getTime()
              });

            });
          }
          else
          {
            deferred.resolve({
              user: user,
              groupId: options.groupId,
              aggs: aggs,
              synced: new Date().getTime()
            });
          };
        });

      }
      else
      {
        deferred.resolve({
          user: user,
          synced: new Date().getTime()
        });

        // /**
        //  * Add to localStorage
        //  */
        // var slots = angular.fromJson(Storage.get('slots')) || {};
        // /**
        //  * Check if box exists otherwsie create it
        //  */
        // if (slots[params.user])
        // {
        //   slots[params.user][options.month] = user;
        // }
        // else
        // {
        //   slots[params.user] = {};
        //   slots[params.user][options.month] = user;
        // };
        // /**
        //  * Save data to localstorage
        //  */
        // Storage.add('slots', angular.toJson(slots));

      };

    });

    /**
     * Return what promised
     */
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
    Slots.query(params, function (result) 
    {
      deferred.resolve({
        id: params.user,
        data: result
      });
    });
    return deferred.promise;
  };



















  /**
   * Return local slots
   * @return {array of objects} [slots from localStorage]
   */
  Slots.prototype.local = function()
  {
    return angular.fromJson(Storage.get('slots'));
  };


  /**
   * TODO
   * FInish it!
   * 
   * Slot adding process
   * @slot {object} params [slot information passed from controller]
   */
  Slots.prototype.add = function (slot) 
  {
    /**
     * TODO
     * IMPORTANT
     * Always check before wheter changes or saved
     * slot is overlaping with other ones!
     */
    

    var localSlots = angular.fromJson(Storage.get('slots'));

    var slot = {
      start: new Date(slot.start).getTime() / 1000,
      end: new Date(slot.end).getTime() / 1000,
      recursive: (slot.recursive) ? true : false,
      text: slot.text,
      id: slot.id
    };

    localSlots.push(slot);

    Storage.add('slots', angular.toJson(localSlots));
    $rootScope.$broadcast('renderPlanboard', 'slot added to localStorage');
    $rootScope.notify( { message: 'Slot added in localStorage.' } );

    /**
     * TODO
     */
    Slots.save(null, slot, function()
    {
      $rootScope.$broadcast('renderPlanboard', 'slot added to back-end');
      $rootScope.notify( { message: 'Slot added in back-end.' } );
    });
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
   * @changed  {object} changed [changed slot information]
   */
  Slots.prototype.change = function (original, changed) 
  {
    /**
     * TODO
     * IMPORTANT
     * Always check before wheter changes or saved
     * slot is overlaping with other ones!
     */

    /**
     * TODO
     * Should the conversion done here or in controller?
     */
    var original = naturalize(original);
    var changed = naturalize(changed);
    var localSlots = [];
    angular.forEach(angular.fromJson(Storage.get('slots')), 
    function(slot, index)
    {
      if (slot.id == changed.id)
      {
        var slot = {
          start: changed.start,
          end: changed.end,
          recursive: changed.recursive,
          text: changed.text,
          id: changed.id
        };
      };
      localSlots.push(slot);    
    });
    Storage.add('slots', angular.toJson(localSlots));
    $rootScope.$broadcast('renderPlanboard', 'slot changed in localStorage');
    $rootScope.notify( { message: 'Slot changed in localStorage.' } );
    /**
     * TODO
     */
    Slots.change(changed, original, function()
    {
      $rootScope.$broadcast('renderPlanboard', 'slot changed in back-end');
      $rootScope.notify( { message: 'Slot changed in back-end.' } );
    });
  };


  /**
   * TODO
   * Add back-end
   * 
   * Slot delete process
   * @id  {integer} [id of slot]
   */
  Slots.prototype.delete = function (id, slot) 
  {
    var slot = naturalize(slot);
    var localSlots = [];
    angular.forEach(angular.fromJson(Storage.get('slots')), 
    function(slot, index)
    {
      if (slot.id != id)
      {
        localSlots.push(slot);
      };  
    });
    Storage.add('slots', angular.toJson(localSlots));
    $rootScope.$broadcast('renderPlanboard', 'slot deleted from localStorage');
    $rootScope.notify( { message: 'Slot deleted from localStorage.' } );
    /**
     * TODO
     */
    Slots.delete(slot, function()
    {
      $rootScope.$broadcast('renderPlanboard', 'slot deleted from back-end');
      $rootScope.notify( { message: 'Slot deleted in back-end.' } );
    });
  };


  /**
   * TODO
   * Finish it
   * 
   * Check whether slot extends from saturday to sunday and if recursive?
   */
  function checkForSatSun(slot)
  {
    // Produce timestamps for sunday 00:00 am through the year and
    // check whether intended to change recursive slot has one of those
    // timestamps, if so slice slot based on midnight and present as two
    // slots in timeline.
  };


  /**
   * TODO
   * Finish it
   * 
   * Check for overlaping slots exists?
   */
  function preventOverlaps(slot)
  {
    // Prevent any overlaping slots by adding new slots or changing
    // the current ones in front-end so back-end is almost always aligned with
    // front-end.
  };


  /**
   * TODO
   * Finish it
   * 
   * Slice a slot
   */
  function slice(slot, point)
  {
    // Slice a slot from a give point
  };


  /**
   * TODO
   * Finish it
   * 
   * Combine two slots
   */
  function combine(slots)
  {
    // Combine two slots
  };
  

  /**
   * Naturalize Slot for back-end injection
   * @slot  {object} slot [slot that should be naturalized]
   */
  function naturalize(slot)
  {
    var content = angular.fromJson(slot.content);
    return {
      start: new Date(slot.start).getTime() / 1000,
      end: new Date(slot.end).getTime() / 1000,
      recursive: content.recursive,
      text: content.state,
      id: content.id
    }
  };


  /**
   * Return resource
   */
  return new Slots;
});