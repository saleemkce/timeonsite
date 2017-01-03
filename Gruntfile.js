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
                    'src/public/js/timeonsitetracker.min.js': ['src/public/js/timeonsitetracker.js']
                }
            }
        },

        copy: {
            main: {
                expand: true,
                flatten: true,
                src: ['src/public/js/**'],
                dest: '',
                filter: 'isFile'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-copy');
    
    grunt.registerTask('minify', ['uglify']);

    grunt.registerTask('copoy', ['copy']);

    grunt.registerTask('build', ['minify', 'copoy']);
    
};
