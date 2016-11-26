module.exports = function(grunt) {

    grunt.initConfig({
    // jshint: {
    //   files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
    //   options: {
    //     globals: {
    //       jQuery: true
    //     }
    //   }
    // },
    // watch: {
    //   files: ['<%= jshint.files %>'],
    //   tasks: ['jshint']
    // }
    
    mocha_phantomjs: {
        options: {
            reporter: 'xunit',
            output: 'test/result.xml',
            config: {
                useColors: true,
                viewportSize: {
                    width: 1024,
                    height: 768
                },
                //grep: 'pattern'
            }
        },
        all: ['test/**/*.html']
    }


    });

    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.registerTask('default', ['mocha_phantomjs']);
};
