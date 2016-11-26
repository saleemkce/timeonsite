module.exports = function(grunt) {

    grunt.initConfig({
        uglify: {
            my_target: {
                files: {
                    'TimeOnSiteTracker.min.js': ['TimeOnSiteTracker.js']
                }
            }
        }


    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    grunt.registerTask('minify', ['uglify']);
    
};
