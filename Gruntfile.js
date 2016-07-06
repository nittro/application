module.exports = function (grunt) {

    var NittroApplication = [
        'src/js/Utils/DateInterval.js',
        'src/js/Utils/DateTime.js',
        'src/js/Nittro/Utils/Tokenizer.js',
        'src/js/Nittro/Neon/Neon.js',
        'src/js/Nittro/Forms/Vendor.js',
        'src/js/Nittro/Forms/Form.js',
        'src/js/Nittro/Forms/Locator.js',
        'src/js/Nittro/DI/Container.js',
        'src/js/Nittro/DI/Context.js',
        'src/js/Nittro/Application/Storage.js',
        'src/js/Nittro/Application/Routing/URLRoute.js',
        'src/js/Nittro/Application/Routing/DOMRoute.js',
        'src/js/Nittro/Application/Routing/Router.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            nittro: {
                files: {
                    'dist/js/nittro-application.min.js': NittroApplication
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            nettejs: {
                files: {
                    'dist/js/nittro-application.js': NittroApplication
                }
            }
        },

        jasmine: {
            src: NittroApplication,
            options: {
                vendor: [
                    'bower_components/promiz/promiz.min.js',
                    'src/js/netteForms-helper.js',
                    'bower_components/nette-forms/src/assets/netteForms.js',
                    'bower_components/nittro-core/dist/js/nittro-core.min.js',
                    'bower_components/nittro-page/dist/js/nittro-page.min.js'
                ],
                specs: 'tests/specs/**.spec.js',
                display: 'short',
                summary: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.registerTask('default', ['uglify', 'concat']);
    grunt.registerTask('test', ['jasmine']);

};
