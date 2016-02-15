module.exports = function (grunt) {

    var NittroApplication = [
        'src/js/Utils/DateInterval.js',
        'src/js/Utils/DateTime.js',
        'src/js/Nittro/Utils/Tokenizer.js',
        'src/js/Nittro/Neon/Neon.js',
        'src/js/Nittro/Forms/VendorCompiled.js',
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

        netteForms: {
            fix: {
                files: {
                    'dist/js/netteForms.js': [
                        'bower_components/nette-forms/src/assets/netteForms.js'
                    ]
                }
            }
        },

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            nittro: {
                files: {
                    'dist/js/nittro-application.min.js': NittroApplication,
                    'dist/js/nittro-application.full.min.js': [
                        'bower_components/promiz/promiz.min.js',
                        'dist/js/netteForms.js',
                        'bower_components/nittro-core/dist/js/nittro-core.js',
                        'bower_components/nittro-page/dist/js/nittro-page.js'
                    ].concat(
                        NittroApplication,
                        'src/js/bootstrap.js',
                        'bower_components/nittro-core/src/js/stack.js'
                    )
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            nettejs: {
                files: {
                    'dist/js/nittro-application.js': NittroApplication,
                    'dist/js/nittro-application.full.js': [
                        'bower_components/promiz/promiz.min.js',
                        'dist/js/netteForms.js',
                        'bower_components/nittro-core/dist/js/nittro-core.js',
                        'bower_components/nittro-page/dist/js/nittro-page.js'
                    ].concat(
                        NittroApplication,
                        'src/js/bootstrap.js',
                        'bower_components/nittro-core/src/js/stack.js'
                    ),
                    'dist/css/nittro-application.css': [
                        'bower_components/nittro-page/dist/css/nittro-page.css'
                    ],
                    'dist/css/nittro-application.min.css': [
                        'bower_components/nittro-page/dist/css/nittro-page.min.css'
                    ]
                }
            }
        },

        jasmine: {
            src: NittroApplication,
            options: {
                vendor: [
                    'bower_components/promiz/promiz.min.js',
                    'bower_components/nette-forms/src/assets/netteForms.js',
                    'bower_components/nittro-page/dist/js/nittro-page.full.js'
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
    grunt.registerTask('default', ['netteForms', 'uglify', 'concat']);
    grunt.registerTask('test', ['jasmine']);

    grunt.registerMultiTask('netteForms', 'Fix netteForms.js', function () {
        this.files.forEach(function (f) {
            var source = f.src.map(grunt.file.read).join("\n");
            source = source.replace(/^[ \t]*global\.Nette\.initOnLoad\(\);[ \t]*$/mg, '');
            grunt.file.write(f.dest, source);

            grunt.file.write(f.dest, source);
            grunt.log.ok('Fixed ' + f.dest.replace(/^.+?([^\/]+)$/, '$1'));

        });
    });
};
