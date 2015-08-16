(function() {

    window.app = {
        Views: {},
        Extensions: {},
        Router: null,
        routes: [],
        linkClicked : false,
        backDetected : false,
        previousFragment : null,

        init: function() {

            this.instance = new app.Views.App();
            Backbone.history.start();

        }
    };

    window.noop = function() {}

    $(function() {
        window.app.init();
    });

    app.Router = Backbone.Router.extend({

        routes: {
            'activity': 'activity',
            'contact': 'contact',
            '': 'home'
        },

        execute: function(callback, args) {
            var self = this,
                answer = $.Deferred(),
                route = Backbone.history.getFragment();

            if (route === '') {
                route = 'home';
            }

            app.backDetected = false;

            if (app.routes[app.routes.length - 2] === route && !app.linkClicked) {

                app.backDetected = true;
                app.routes.pop();

                if (app.routes[app.routes.length - 1] === route) {
                    app.routes.pop();
                }

            }

            app.routes.push(route);

            _.delay(function() {
                // this is super hacky but need a delay as global event on links
                // takes ages to execute
                app.linkClicked = false;
            }, 500);

            answer.promise().then(function() {

                app.dirty = false;

                window.onbeforeunload = null;

                if (callback) {
                    callback.apply(self, args);
                } else {
                    console.log('no callback');
                }
            });

            if (app.dirty) {
                console.log('app is dirty');

                window.onbeforeunload = (function(_this) {

                })(this);

            } else {
                answer.resolve();
            }

        },

        initialize: function(options) {

            var self = this;
            this.options = options || {};

            $(document).on('click', 'a', function(e) {
                self.linkClicked = true;
            });

        },

        goto: function(view, options) {
            var params = options || {};

            params = _.extend(params, {
                reverseAnimation: app.backDetected
            });

            app.instance.goto(view, params);

        },

        home: function() {
            var view = new app.Views.Home();
            this.goto(view);
        },

        contact: function() {
            var view = new app.Views.Contact();
            this.goto(view);
        },

        activity: function() {
            var view = new app.Views.Activity();
            this.goto(view);
        }

    });

    app.Extensions.View = Backbone.View.extend({

        initialize: function() {
            this.router = new app.Router();
        },

        //  animation defaults
        inDuration: 0.25,
        outDuration : 0.25,
        ease : Power4.easeIn,

        /**
         * js animate in
         * @param  {Object} options - animation config options
         * @param  {Boolean} options.reverseAnimation - right to left?
         */
        animateIn: function(callback, options) {

            var self = this,
                xPercent = '100%',
                tween;

            if (options && options.reverseAnimation) {
                xPercent = '-100%';
            }

            tween = TweenMax.fromTo(self.$el, self.inDuration, {
                xPercent: xPercent
            }, {
                xPercent: '0%',
                ease: self.ease,
                onUpdateParams: ['{self}', 'param2'],
                onComplete: function() {
                    callback.apply(this);
                }
            });

        },

        /**
         * js animate out
         * @param  {String}  reverse - should our standard animation be reversed? e.g. back btn
         */
        animateOut: function(callback, options) {

            var self = this,
                fromX = '0%',
                toX = '-100%',
                tween;

            if (options && options.reverseAnimation) {
                toX = '100%';
            }

            tween = TweenMax.to(self.$el, self.outDuration, {
                xPercent: toX,
                z: 0.01,
                startAt: {
                    xPercent: fromX
                },
                ease: self.ease,
                onComplete: function() {
                    callback.apply(this);
                }
            });
        }

    });

    app.Views.App = app.Extensions.View.extend({

        el: 'body',

        goto: function(view, params) {

            var previous = this.currentPage || null,
                next = view;

            if (previous) {
                previous.animateOut(function() {
                    previous.remove();
                }, params);
            }

            next.render({
                page: true
            });

            this.$el.append(next.$el);
            next.animateIn(noop, params);
            this.currentPage = next;

        }

    });

    app.Views.Home = app.Extensions.View.extend({

        className: 'home page',

        render: function() {
            var template = _.template($('script[name=home]').html());
            this.$el.html(template());
            return app.Extensions.View.prototype.render.apply(this, arguments);
        }

    });

    app.Views.Contact = app.Extensions.View.extend({

        className: 'contact page',

        render: function() {
            var template = _.template($('script[name=contact]').html());
            this.$el.html(template());
            return app.Extensions.View.prototype.render.apply(this, arguments);
        }

    });

    app.Views.Activity = app.Extensions.View.extend({

        className: 'activity page',

        render: function() {
            var template = _.template($('script[name=activity]').html());
            this.$el.html(template());
            return app.Extensions.View.prototype.render.apply(this, arguments);
        }

    });

}());