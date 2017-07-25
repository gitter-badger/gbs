'use strict'

module.exports = function (grunt) {
  grunt.initConfig({
    mocha_istanbul: {
      coverage: {
        src: 'tests/unit',
        options: {
          mask: '*.spec.js'
        }
      }
    },
    jsdoc: {
      dist: {
        options: {
          configure: 'jsdoc.conf.json'
        }
      }
    },
    apidoc: {
      gbs: {
        src: './',
        dest: 'docs/api',
        options: {
          includeFilters: ['.*\\.js$'],
          excludeFilters: ['node_modules/', 'tests/', 'bin/']
        }
      }
    },
    watch: {
      tests: {
        files: ['./*.js', 'tests/*.js'],
        tasks: ['mocha_istanbul:coverage']
      },
      docs: {
        files: ['./*.js', './config/*.js'],
        tasks: ['jsdoc', 'apidoc']
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-mocha-istanbul')
  grunt.loadNpmTasks('grunt-jsdoc')
  grunt.loadNpmTasks('grunt-apidoc')
  // grunt.registerTask('autotest', ['watch:tests'])
  grunt.registerTask('docswatch', ['watch:docs'])
  grunt.registerTask('docs', ['jsdoc', 'apidoc'])
}
