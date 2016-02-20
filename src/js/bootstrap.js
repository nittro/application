_context.invoke(function(Nittro, DOM, Arrays) {

    var params = DOM.getById('nittro-params'),
        defaults = {
            basePath: '',
            page: {
                whitelistLinks: false,
                whitelistForms: false,
                defaultTransition: '.transition-auto'
            },
            flashes: {
                layer: document.body
            }
        };

    if (params && params.nodeName.toLowerCase() === 'script' && params.type === 'application/json') {
        params = Arrays.mergeTree(defaults, JSON.parse(params.textContent.trim()));

    } else {
        params = defaults;

    }

    var di = new Nittro.DI.Context({
        params: params,
        services: {
            'ajax': {
                factory: 'Nittro.Ajax.Service()',
                run: true,
                setup: [
                    '::addTransport(Nittro.Ajax.Transport.Native())'
                ]
            },
            'router': 'Nittro.Application.Routing.Router(basePath: %basePath%)!',
            'page': {
                factory: 'Nittro.Page.Service(options: %page%)',
                run: true,
                setup: [
                    '::setFormLocator()'
                ]
            },
            'transitions': 'Nittro.Page.Transitions(300)',
            'formLocator': 'Nittro.Forms.Locator()',
            'flashMessages': 'Nittro.Widgets.FlashMessages(%flashes%)'
        }
    });

    this.di = di;
    di.runServices();

}, {
    DOM: 'Utils.DOM',
    Arrays: 'Utils.Arrays'
});
