_context.invoke(function(Nittro) {

    var di = new Nittro.DI.Context({
        params: {
            page: {
                whitelistLinks: false,
                whitelistForms: false,
                defaultTransition: '.transition-auto'
            },
            flashes: {
                layer: document.body
            }
        },
        services: {
            'ajax': {
                factory: 'Nittro.Ajax.Service()',
                run: true,
                setup: [
                    '::addTransport(Nittro.Ajax.Transport.Native())'
                ]
            },
            'router': 'Nittro.Application.Routing.Router()!',
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
        },
        factories: {
            formDialog: 'Nittro.Widgets.FormDialog(@formLocator)'
        }
    });

    this.di = di;
    di.runServices();

});

