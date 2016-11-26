module.exports = function(grunt) {

    grunt.initConfig({
    
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
