module.exports = function(grunt) {

    grunt.initConfig({
        uglify: {

            options: {
                // to preserve comments or license information
                preserveComments: 'some',

                // keep these variables/global names from getting modified
                mangle: {
                    except: ['TimeOnSiteTracker']
                }
            },

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
