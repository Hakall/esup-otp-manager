/** jQuery Initialisation **/
(function ($) {
    $(function () {
        $(document).on('click', ".collapsible-header", function(){
            $(this).next('.collapsible-body').toggle(200);
        });
    }); // end of document ready
})(jQuery); // end of jQuery name space

/** WebSockets init**/
var arr = window.location.href.split('/');
var urlSockets = arr[0] + "//" + arr[2];
var socket;

/** Vue.JS **/

/** User **/
var PushMethod = Vue.extend({
    props: {
        'user': Object,
        'get_user': Function,
        'messages': Object,
        'activate': Function,
        'deactivate': Function,
        'switch_push_event': {}
    },
    created: function () {
        var self = this;
        socket = io.connect(urlSockets, {reconnect: true, path: "/sockets"});

        socket.on('userPushActivate', function () {
            self.activatePush();
        });

        socket.on('userPushActivateManager', function (data) {
            self.activatePush();
        });
    },
    methods: {
        activatePush: function () {
            this.get_user(this.user.uid);
            if (this.switch_push_event) {
                if (this.switch_push_event.target) {
                    this.switch_push_event.target.checked = true;
                }
            }
        }
    },
    template: '#push-method'
});

var BypassMethod = Vue.extend({
    props: {
        'user': Object,
        'generate_bypass': Function,
        'activate': Function,
        'deactivate': Function,
        'messages': Object
    },
    template: '#bypass-method'
});

var TotpMethod = Vue.extend({
    props: {
        'user': Object,
        'generate_totp': Function,
        'activate': Function,
        'deactivate': Function,
        'messages': Object,
    },
    template: '#totp-method'
});

var RandomCodeMethod = Vue.extend({
    props: {
        'user': Object,
        'messages': Object,
        'activate': Function,
        'deactivate': Function,
    },
    template: '#random_code-method'
});

var UserDashboard = Vue.extend({
    props: {
        'messages': Object,
        'methods': Object,
        'user': Object,
        'currentmethod': String,
        'get_user': Function
    },
    data: function () {
        return {
            "switchPushEvent": MouseEvent
        }
    },
    components: {
        "push": PushMethod,
        "totp": TotpMethod,
        "bypass": BypassMethod,
        "random_code": RandomCodeMethod
    },
    template: "#user-dashboard",
    created: function () {
    },
    methods: {
        activate: function (event) {
            switch (event.target.name) {
                case 'push':
                    this.askPushActivation(event);
                    break;
                case 'bypass':
                    this.activateBypass(event);
                    break;
                case 'random_code':
                    this.activateRandomCode(event);
                    break;
                case 'totp':
                    this.activateTotp(event);
                    break;
                default:
                    /** **/
                    event.target.checked = true;
                    this.user.methods[event.target.name].active = true;
                    break;
            }
        },
        askPushActivation: function (event) {
            event.target.checked = false;
            this.switchPushEvent = event;
            //ajax
            $.ajax({
                method: "PUT",
                url: "/api/push/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") {
                        this.user.methods.push.activationCode = data.activationCode;
                        this.user.methods.push.qrCode = data.qrCode;
                        this.user.methods.push.api_url = data.api_url;
                    }else Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("/api/push/activate", status, err.toString());
                }.bind(this)
            });
        },
        activateBypass: function (event) {
            event.target.checked = true;
            $.ajax({
                method: "PUT",
                url: "/api/bypass/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        event.target.checked = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                    } else {
                        this.user.methods.bypass.active = true;
                        this.generateBypass(function () {
                            this.user.methods.bypass.active = false;
                            event.target.checked = false;
                        })
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = false;
                    console.error("/api/bypass/activate", status, err.toString());
                }.bind(this)
            });
        },
        activateTotp: function (event) {
            event.target.checked = true;
            $.ajax({
                method: "PUT",
                url: "/api/totp/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                        event.target.checked = false;
                    } else {
                        this.user.methods.totp.active = true;
                        this.generateTotp(function () {
                            this.user.methods.totp.active = false;
                            event.target.checked = false;
                        })
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = false;
                    console.error("/api/totp/activate", status, err.toString());
                }.bind(this)
            });
        },
        activateRandomCode: function (event) {
            event.target.checked = true;
            $.ajax({
                method: "PUT",
                url: "/api/random_code/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        event.target.checked = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                    } else this.user.methods.random_code.active = true;
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = false;
                    console.error("/api/random_code/activate", status, err.toString());
                }.bind(this)
            });
        },
        deactivate: function (event) {
            event.target.checked = false;
            $.ajax({
                method: "PUT",
                url: "/api/" + event.target.name + "/deactivate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        event.target.checked = true;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                    }
                    else this.user.methods[event.target.name].active = false;
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = true;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/" + event.target.name + "/deactivate", status, err.toString());
                }.bind(this)
            });
        },
        generateBypass: function (onError) {
            $.ajax({
                method: "POST",
                url: "/api/generate/bypass",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") this.user.methods.bypass.codes = data.codes;
                    else if (typeof(onError) === "function") onError();
                }.bind(this),
                error: function (xhr, status, err) {
                    if (typeof(onError) === "function") onError();
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/generate/bypass", status, err.toString());
                }.bind(this)
            });
        },
        generateTotp: function (onError) {
            $.ajax({
                method: "POST",
                url: "/api/generate/totp",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") {
                        this.user.methods.totp.message = data.message;
                        this.user.methods.totp.qrCode = data.qrCode;
                        this.user.methods.totp.uid = data.uid;
                    } else if (typeof(onError) === "function") onError();
                }.bind(this),
                error: function (xhr, status, err) {
                    if (typeof(onError) === "function") onError();
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/generate/totp", status, err.toString());
                }.bind(this)
            });
        },
        saveTransport: function(transport) {
            var new_transport = document.getElementById(transport + '-input').value;
            var reg;
            if (transport == 'sms') reg = new RegExp("^0[6-7]([-. ]?[0-9]{2}){4}$");
            else reg = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
            if (reg.test(new_transport)) {
                var oldTransport = this.user.transports[transport];
                this.user.transports[transport]= new_transport;
                document.getElementById(transport + '-input').value = '';
                $.ajax({
                    method: 'PUT',
                    url: '/api/transport/' + transport + '/' + new_transport,
                    dataType: 'json',
                    cache: false,
                    success: function(data) {
                        if (data.code != "Ok") {
                            this.user.transports[transport]= oldTransport;
                            document.getElementById(transport + '-input').value = oldTransport;
                            Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                        }else Materialize.toast('Transport vérifié', 3000, 'green darken-1');
                    }.bind(this),
                    error: function(xhr, status, err) {
                        this.user.transports[transport]= oldTransport;
                        document.getElementById(transport + '-input').value = oldTransport;
                        Materialize.toast(err, 3000, 'red darken-1');
                        console.error('/api/transport/' + transport + '/' + new_transport, status, err.toString());
                    }.bind(this)
                });
            }else Materialize.toast('Format invalide.', 3000, 'red darken-1');
        },
        deleteTransport: function(transport) {
            var oldTransport = this.user.transports[transport];
            this.user.transports[transport]= null;
            $.ajax({
                method: 'DELETE',
                url: '/api/transport/' + transport,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    if (data.code != "Ok") this.user.transports[transport]= oldTransport;
                }.bind(this),
                error: function(xhr, status, err) {
                    this.user.transports[transport]= oldTransport;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/data/deactivate.json", status, err.toString());
                }.bind(this)
            });
        },
        testTransport: function(transport) {
            $.ajax({
                url: '/api/transport/' + transport + '/test',
                dataType: 'json',
                cache: false,
                success: function(data) {
                    if (data.code != "Ok") Materialize.toast(data.message, 3000, 'red darken-1');
                    else Materialize.toast('Transport vérifié', 3000, 'green darken-1');
                }.bind(this),
                error: function(xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error('/api/transport/' + transport + '/test', status, err.toString());
                }.bind(this)
            });
        },
    }
});

/** Manager **/
var UserView = Vue.extend({
    props: {
        'user': Object,
        'methods': Object,
        'messages': Object,
        "get_user": Function
    },
    components: {
        "push": PushMethod,
        "totp": TotpMethod,
        "bypass": BypassMethod,
        "random_code": RandomCodeMethod
    },
    data: function () {
        return {
            "switchPushEvent": MouseEvent
        }
    },
    template: '#user-view',
    methods: {
        activate: function (method) {
            switch (method) {
                case 'push':
                    this.askPushActivation(method);
                    break;
                case 'bypass':
                    this.activateBypass(method);
                    break;
                case 'random_code':
                    this.activateRandomCode(method);
                    break;
                case 'totp':
                    this.activateTotp(method);
                    break;
                default:
                    /** **/
                    this.user.methods[method].active = true;
                    break;
            }
        },
        askPushActivation: function () {
            //ajax
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + this.user.uid + "/push/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") {
                        this.user.methods.push.activationCode = data.activationCode;
                        this.user.methods.push.qrCode = data.qrCode;
                        this.user.methods.push.api_url = data.api_url;
                    }else Materialize.toast('Erreur interne, veuillez réessayer plus tard', 3000, 'red darken-1');
                }.bind(this),
                error: function (xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + this.user.uid + "/push/activate", status, err.toString());
                }.bind(this)
            });
        },
        activateBypass: function () {
            this.user.methods.bypass.active = true;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + this.user.uid + "/bypass/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") {
                        this.generateBypass(function () {
                            this.user.methods.bypass.active = false;
                        })
                    } else {
                        this.user.methods.bypass.active = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard', 3000, 'red darken-1');
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    this.user.methods.bypass.active = false;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + this.user.uid + "/bypass/activate", status, err.toString());
                }.bind(this)
            });
        },
        activateTotp: function () {
            this.user.methods.totp.active = true;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + this.user.uid + "/totp/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") {
                        this.generateTotp(function () {
                            this.user.methods.totp.active = false;
                        })
                    } else {
                        this.user.methods.totp.active = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard', 3000, 'red darken-1');
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    this.user.methods.totp.active = false;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + this.user.uid + "/totp/activate", status, err.toString());
                }.bind(this)
            });
        },
        activateRandomCode: function () {
            this.user.methods.random_code.active = true;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + this.user.uid + "/random_code/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        this.user.methods.random_code.active = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard', 3000, 'red darken-1');
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    this.user.methods.random_code.active = false;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + this.user.uid + "/random_code/activate", status, err.toString());
                }.bind(this)
            });
        },
        deactivate: function (method) {
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + this.user.uid + "/" + method + "/deactivate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") this.user.methods[method].active = false;
                    else {
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard', 3000, 'red darken-1');
                        this.user.methods[method].active = true;
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    this.user.methods[method].active = true;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + this.user.uid + "/" + method + "/activate", status, err.toString());
                }.bind(this)
            });
        },
        generateBypass: function (onError) {
            $.ajax({
                method: "POST",
                url: "/api/admin/generate/bypass/" + this.user.uid,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") this.user.methods.bypass.codes = data.codes;
                    else if (typeof(onError) === "function") onError();
                }.bind(this),
                error: function (xhr, status, err) {
                    if (typeof(onError) === "function") onError();
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/generate/bypass/" + this.user.uid, status, err.toString());
                }.bind(this)
            });
        },
        generateTotp: function (onError) {
            $.ajax({
                method: "POST",
                url: "/api/admin/generate/totp/" + this.user.uid,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code == "Ok") {
                        this.user.methods.totp.message = data.message;
                        this.user.methods.totp.qrCode = data.qrCode;
                        this.user.methods.totp.uid = data.uid;
                    } else if (typeof(onError) === "function") onError();
                }.bind(this),
                error: function (xhr, status, err) {
                    if (typeof(onError) === "function") onError();
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/generate/bypass/" + this.user.uid, status, err.toString());
                }.bind(this)
            });
        },
    }
});

var ManagerDashboard = Vue.extend({
    props: {
        'methods': Object,
        'messages': Object
    },
    components: {
        "user-view": UserView
    },
    data: function () {
        return {
            suggestions: [],
            user: {
                uid: String,
                methods: Object,
                transports: Object
            },
            uids: Array,
        }
    },
    created: function () {
        this.getUsers();
    },
    methods: {
        suggest: function (event) {
            this.suggestions = [];
            if (event.target.value !== "") {
                for (uid in this.uids) {
                    if (this.uids[uid].includes(event.target.value)) this.suggestions.push(this.uids[uid]);
                }
            }
        },

        search: function (event) {
            if ($('#autocomplete-input').val() !== "" && this.suggestions.includes($('#autocomplete-input').val())) {
                this.getUser($('#autocomplete-input').val());
                $('#autocomplete-input').val('');
            }
        },

        getUsers: function () {
            $.ajax({
                url: "/api/admin/users",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    this.setUsers(data);
                }.bind(this),
                error: function (xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/users", status, err.toString());
                }.bind(this)
            });
        },

        setUsers: function (data) {
            this.uids = data.uids;
        },

        getUser: function (uid) {
            $.ajax({
                url: "/api/admin/user/" + uid,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    data.uid = uid;
                    this.setUser(data);
                }.bind(this),
                error: function (xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/user/" + uid, status, err.toString());
                }.bind(this)
            });
        },
        setUser: function (data) {
            this.user = {
                uid: data.uid,
                methods: {
                    push: data.user.push,
                    bypass: data.user.bypass,
                    totp: data.user.totp,
                    random_code: data.user.random_code
                },
                transports: data.user.transports
            }
        }
    },
    template: '#manager-dashboard'
});

/** Admin **/
var AdminDashboard = Vue.extend({
    props: {
        'messages': Object,
        'methods': Object
    },
    template: '#admin-dashboard',
    methods: {
        activate: function (event) {
            event.target.checked = true;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + event.target.name + "/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        event.target.checked = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                    } else {
                        this.methods[event.target.name].activate = true;
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = false;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + event.target.name + "/activate", status, err.toString());
                }.bind(this)
            });
        },
        deactivate: function (event) {
            event.target.checked = false;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + event.target.name + "/deactivate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        this.methods[event.target.name].activate = true;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                    } else this.methods[event.target.name].activate = false;
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = true;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + event.target.name + "/deactivate", status, err.toString());
                }.bind(this)
            });
        },
        activateTransport: function (method, transport) {
            event.target.checked = true;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + method + "/transport/" + transport + "/activate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        event.target.checked = false;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard.', 3000, 'red darken-1');
                    } else {
                        this.methods[method].transports.push(transport);
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = false;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + method + "/transport/" + transport + "/activate", status, err.toString());
                }.bind(this)
            });
        },
        deactivateTransport: function (method, transport) {
            event.target.checked = false;
            $.ajax({
                method: "PUT",
                url: "/api/admin/" + method + "/transport/" + transport + "/deactivate",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.code != "Ok") {
                        event.target.checked = true;
                        Materialize.toast('Erreur interne, veuillez réessayer plus tard', 3000, 'red darken-1');
                    } else {
                        var index = this.methods[method].transports.indexOf(transport);
                        if (index > (-1)) this.methods[method].transports.splice(index, 1);
                    }
                }.bind(this),
                error: function (xhr, status, err) {
                    event.target.checked = true;
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/admin/" + method + "/transport/" + transport + "/deactivate", status, err.toString());
                }.bind(this)
            });
        },
    }
});

/** Admin **/
var Home = Vue.extend({
    props: {
        messages: Object
    },
    template: '#home-dashboard'
});

/** Main **/
var app = new Vue({
    el: '#app',
    components: {
        "home": Home,
        "preferences": UserDashboard,
        "manager": ManagerDashboard,
        "admin": AdminDashboard
    },
    data: {
        pageTitle: 'Accueil',
        currentView: 'home',
        currentMethod: '',
        methods: {},
        user: {
            uid: '',
            methods: {},
            transports: {}
        },
        uids: [],
        messages: {}
    },
    created: function () {
        this.getMessages();
        this.getUser();
        this.getMethods();
    },
    methods: {
        cleanMethods: function () {
            for (method in this.methods) {
                if (method[0] == '_') delete this.methods[method];
                else {
                    this.methods[method].name = method;
                    if (this.messages.api) {
                        if (this.messages.api.methods[method]) this.methods[method].label = this.messages.api.methods[method].name;
                    }
                }
            }

        },

        navigate: function (event) {
            if (event.target.name == "manager") {
                this.pageTitle = event.target.text;
                this.currentView = 'manager';
            } else if (event.target.name == "admin") {
                this.currentView = 'admin';
                this.pageTitle = event.target.text;
            } else if (event.target.name == "home") {
                this.currentView = 'home';
                this.pageTitle = event.target.text;
            } else {
                this.pageTitle = "Préférences";
                this.currentMethod = event.target.name;
                this.currentView = 'preferences';
            }
            $('a').parent().removeClass('active');
            $('#' + event.target.name).parent().addClass('active');
            if (document.getElementById("sidenav-overlay"))$('#navButton').click();
            this.getUser();
        },

        getUser: function () {
            $.ajax({
                url: "/api/user",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    this.setUser(data);
                }.bind(this),
                error: function (xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/user", status, err.toString());
                }.bind(this)
            });
        },

        setUser: function (data) {
            this.user.uid = data.uid;
            this.user.methods = data.user.methods;
            this.user.transports = data.user.transports;
        },

        getMethods: function () {
            $.ajax({
                url: "/api/methods",
                dataType: 'json',
                cache: false,
                success: function (data) {
                    this.setMethods(data);
                }.bind(this),
                error: function (xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/methods", status, err.toString());
                }.bind(this)
            });
        },
        setMethods: function (data) {
            this.methods = data.methods;
            this.cleanMethods();
        },
        getMessages: function (language) {
            var query = '';
            if(language)query="/"+language;
            $.ajax({
                url: "/api/messages"+query,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    this.setMessages(data);
                }.bind(this),
                error: function (xhr, status, err) {
                    Materialize.toast(err, 3000, 'red darken-1');
                    console.error("/api/messages", status, err.toString());
                }.bind(this)
            });
        },
        setMessages: function (data) {
            this.messages = data;
            this.cleanMethods();
        },
    }
})
