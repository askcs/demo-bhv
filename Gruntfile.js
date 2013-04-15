/**
 * Main compiler for app
 */
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'war/js/localization.js',
          'war/js/webpaige.js',
          'war/js/config.js',
          'war/js/routes.js',
          'war/js/bootstrap.js',
          'war/js/modals.js',
          'war/js/controllers.js',
          'war/js/directives.js',
          'war/js/libs/angular-strap/0.7.2/angular-strap.js',
          'war/js/services.js',
          'war/js/filters.js'
        ],
        dest: 'war/js/app.js'
      }
    },

    uglify: {
      options: {
        banner: '/*!\n * WebPaige v2.0.2 (snapshot)\n * Ask Community Systems\n * Authors: Cengiz Ulusoy\n * <%= grunt.template.today("dd-mm-yyyy hh:mm") %>\n */\n'
      },
      dist: {
        files: {
          'war/js/app.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    qunit: {
      files: ['test/**/*.html']
    },

    jshint: {
      files: [
              'Gruntfile.js'
              ],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery:   true,
          console:  true,
          module:   true,
          document: true
        }
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);

  grunt.registerTask('webpaige', ['concat', 'uglify']);

};









/**
 * Timeline configuration
 */
// module.exports = function(grunt) {

//   grunt.initConfig({

//     pkg: grunt.file.readJSON('package.json'),

//     concat: {
//       options: {
//         separator: ';'
//       },
//       dist: {
//         src: [
//           'war/js/libs/chaps/timeline/2.4.0/timeline.js'
//         ],
//         dest: 'war/js/libs/chaps/timeline/2.4.0/timeline_modified.js'
//       }
//     },

//     uglify: {
//       options: {
//         banner: '/*! timeline 2.4.0 modified */\n'
//       },
//       dist: {
//         files: {
//           'war/js/libs/chaps/timeline/2.4.0/timeline_modified.min.js': ['<%= concat.dist.dest %>']
//         }
//       }
//     },

//     qunit: {
//       files: ['test/**/*.html']
//     },

//     jshint: {
//       files: [
//               'Gruntfile.js'
//               ],
//       options: {
//         // options here to override JSHint defaults
//         globals: {
//           jQuery:   true,
//           console:  true,
//           module:   true,
//           document: true
//         }
//       }
//     },

//     watch: {
//       files: ['<%= jshint.files %>'],
//       tasks: ['jshint', 'qunit']
//     }
//   });

//   grunt.loadNpmTasks('grunt-contrib-uglify');
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks('grunt-contrib-qunit');
//   grunt.loadNpmTasks('grunt-contrib-watch');
//   grunt.loadNpmTasks('grunt-contrib-concat');

//   grunt.registerTask('timeline', ['concat', 'uglify']);

// };









/**
 * Bootstrap datepicker configuration
 */
// module.exports = function(grunt) {

//   grunt.initConfig({

//     pkg: grunt.file.readJSON('package.json'),

//     concat: {
//       options: {
//         separator: ';'
//       },
//       dist: {
//         src: [
//           'war/js/libs/bootstrap-datepicker/bootstrap-datepicker.js'
//         ],
//         dest: 'war/js/libs/bootstrap-datepicker/bootstrap-datepicker.js'
//       }
//     },

//     uglify: {
//       options: {
//         banner: '/*! bootstrap datepicker */\n'
//       },
//       dist: {
//         files: {
//           'war/js/libs/bootstrap-datepicker/bootstrap-datepicker.min.js': ['<%= concat.dist.dest %>']
//         }
//       }
//     },

//     qunit: {
//       files: ['test/**/*.html']
//     },

//     jshint: {
//       files: [
//               'Gruntfile.js'
//               ],
//       options: {
//         // options here to override JSHint defaults
//         globals: {
//           jQuery:   true,
//           console:  true,
//           module:   true,
//           document: true
//         }
//       }
//     },

//     watch: {
//       files: ['<%= jshint.files %>'],
//       tasks: ['jshint', 'qunit']
//     }
//   });

//   grunt.loadNpmTasks('grunt-contrib-uglify');
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks('grunt-contrib-qunit');
//   grunt.loadNpmTasks('grunt-contrib-watch');
//   grunt.loadNpmTasks('grunt-contrib-concat');

//   grunt.registerTask('datepicker', ['concat', 'uglify']);

// };









/**
 * Bootstrap timepicker configuration
 */
// module.exports = function(grunt) {

//   grunt.initConfig({

//     pkg: grunt.file.readJSON('package.json'),

//     concat: {
//       options: {
//         separator: ';'
//       },
//       dist: {
//         src: [
//           'war/js/libs/bootstrap-timepicker/bootstrap-timepicker.js'
//         ],
//         dest: 'war/js/libs/bootstrap-timepicker/bootstrap-timepicker.js'
//       }
//     },

//     uglify: {
//       options: {
//         banner: '/*! bootstrap timepicker */\n'
//       },
//       dist: {
//         files: {
//           'war/js/libs/bootstrap-timepicker/bootstrap-timepicker.min.js': ['<%= concat.dist.dest %>']
//         }
//       }
//     },

//     qunit: {
//       files: ['test/**/*.html']
//     },

//     jshint: {
//       files: [
//               'Gruntfile.js'
//               ],
//       options: {
//         // options here to override JSHint defaults
//         globals: {
//           jQuery:   true,
//           console:  true,
//           module:   true,
//           document: true
//         }
//       }
//     },

//     watch: {
//       files: ['<%= jshint.files %>'],
//       tasks: ['jshint', 'qunit']
//     }
//   });

//   grunt.loadNpmTasks('grunt-contrib-uglify');
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks('grunt-contrib-qunit');
//   grunt.loadNpmTasks('grunt-contrib-watch');
//   grunt.loadNpmTasks('grunt-contrib-concat');

//   grunt.registerTask('timepicker', ['concat', 'uglify']);

// };









/**
 * Bootstrap daterangepicker configuration
 */
// module.exports = function(grunt) {

//   grunt.initConfig({

//     pkg: grunt.file.readJSON('package.json'),

//     concat: {
//       options: {
//         separator: ';'
//       },
//       dist: {
//         src: [
//           'war/js/libs/daterangepicker/1.1.0/daterangepicker.js'
//         ],
//         dest: 'war/js/libs/daterangepicker/1.1.0/daterangepicker.js'
//       }
//     },

//     uglify: {
//       options: {
//         banner: '/*! bootstrap daterangepicker */\n'
//       },
//       dist: {
//         files: {
//           'war/js/libs/daterangepicker/1.1.0/daterangepicker.min.js': ['<%= concat.dist.dest %>']
//         }
//       }
//     },

//     qunit: {
//       files: ['test/**/*.html']
//     },

//     jshint: {
//       files: [
//               'Gruntfile.js'
//               ],
//       options: {
//         // options here to override JSHint defaults
//         globals: {
//           jQuery:   true,
//           console:  true,
//           module:   true,
//           document: true
//         }
//       }
//     },

//     watch: {
//       files: ['<%= jshint.files %>'],
//       tasks: ['jshint', 'qunit']
//     }
//   });

//   grunt.loadNpmTasks('grunt-contrib-uglify');
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks('grunt-contrib-qunit');
//   grunt.loadNpmTasks('grunt-contrib-watch');
//   grunt.loadNpmTasks('grunt-contrib-concat');

//   grunt.registerTask('daterangepicker', ['concat', 'uglify']);

// };









/**
 * Date configuration
 */
// module.exports = function(grunt) {

//   grunt.initConfig({

//     pkg: grunt.file.readJSON('package.json'),

//     concat: {
//       options: {
//         separator: ';'
//       },
//       dist: {
//         src: [
//           'war/js/libs/date/1.0/date.js'
//         ],
//         dest: 'war/js/libs/date/1.0/date.js'
//       }
//     },

//     uglify: {
//       options: {
//         banner: '/*! date 1.0 */\n'
//       },
//       dist: {
//         files: {
//           'war/js/libs/date/1.0/date.min.js': ['<%= concat.dist.dest %>']
//         }
//       }
//     },

//     qunit: {
//       files: ['test/**/*.html']
//     },

//     jshint: {
//       files: [
//               'Gruntfile.js'
//               ],
//       options: {
//         // options here to override JSHint defaults
//         globals: {
//           jQuery:   true,
//           console:  true,
//           module:   true,
//           document: true
//         }
//       }
//     },

//     watch: {
//       files: ['<%= jshint.files %>'],
//       tasks: ['jshint', 'qunit']
//     }
//   });

//   grunt.loadNpmTasks('grunt-contrib-uglify');
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks('grunt-contrib-qunit');
//   grunt.loadNpmTasks('grunt-contrib-watch');
//   grunt.loadNpmTasks('grunt-contrib-concat');

//   grunt.registerTask('date', ['concat', 'uglify']);

// };









/**
 * jQuery plugins configuration
 */
// module.exports = function(grunt) {

//   grunt.initConfig({

//     pkg: grunt.file.readJSON('package.json'),

//     concat: {
//       options: {
//         separator: ';'
//       },
//       dist: {
//         src: [
//           'war/js/plugins.js'
//         ],
//         dest: 'war/js/plugins.js'
//       }
//     },

//     uglify: {
//       options: {
//         banner: '/*! jquery plugins */\n'
//       },
//       dist: {
//         files: {
//           'war/js/plugins.min.js': ['<%= concat.dist.dest %>']
//         }
//       }
//     },

//     qunit: {
//       files: ['test/**/*.html']
//     },

//     jshint: {
//       files: [
//               'Gruntfile.js'
//               ],
//       options: {
//         // options here to override JSHint defaults
//         globals: {
//           jQuery:   true,
//           console:  true,
//           module:   true,
//           document: true
//         }
//       }
//     },

//     watch: {
//       files: ['<%= jshint.files %>'],
//       tasks: ['jshint', 'qunit']
//     }
//   });

//   grunt.loadNpmTasks('grunt-contrib-uglify');
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks('grunt-contrib-qunit');
//   grunt.loadNpmTasks('grunt-contrib-watch');
//   grunt.loadNpmTasks('grunt-contrib-concat');

//   grunt.registerTask('plugins', ['concat', 'uglify']);

// };