var uid = 'john';

function init_admin() {
    get_methods_admin();
}

function init() {
    get_methods();
}

function navClick(link) {
    reset();
    $('#transport_preference').show();
    $(link).addClass('active');
    $('#' + link.id.split('_li')[0]).show();
}

function reset() {
    resetLis();
    resetMethods();
    $('#userinfo').hide();
}

function resetLis() {
    $('li').removeClass('active');
}

function resetMethods() {
    $('.content-unit').hide();
}


function request(opts, callback, next) {
    var req = new XMLHttpRequest();
    req.open(opts.method, opts.url, true);
    req.onerror = function(e) { console.log(e) };
    req.onreadystatechange = function(aEvt) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var responseObject = JSON.parse(req.responseText);
                if (typeof(callback) === "function") callback(responseObject);
            }
            if (typeof(next) === "function") next();
        }
    };
    req.send(null);
}



function get_methods() {
    request({method: 'GET', url: 'http://localhost:4000/api/methods'}, function(response) {
        if (response.code == "Ok") {
            $('.method').each(function() {
                if (!response.methods[this.id.split('_method')[0]] || !response.methods[this.id.split('_method')[0]].activate) {
                    this.remove();
                    $('#' + this.id + '_li').remove();
                }
            });
        } else {
            $('.method').each(function() {
                this.remove();
                $('#' + this.id + '_li').remove();
            });
            console.log(response.message);
        }
    }, get_user_methods);
}


function get_methods_admin() {
    request({ method: 'GET', url: 'http://localhost:4000/api/methods' }, function(response) {
        if (response.code == "Ok") {
            $('.method').each(function() {
                var method = this.id.split('_method')[0];
                if (!response.methods[method]) {
                    this.remove();
                    $('#' + this.id.split('_method')[0] + '_admin').remove();
                } else {
                    if (response.methods[method].activate) {
                        check_method(method);
                    } else {
                        uncheck_method(method);
                    }
                    if (response.methods[method].sms) {
                        check_method_transport(method, 'sms');
                    } else {
                        uncheck_method_transport(method, 'sms');
                    }
                    if (response.methods[method].mail) {
                        check_method_transport(method, 'mail');
                    } else {
                        uncheck_method_transport(method, 'mail');
                    }
                    $('#' + this.id).show();
                }
            });
        } else {
            $('.method').each(function() {
                this.remove();
                $('#' + this.id + '_li').remove();
            });
            console.log(response.message);
        }
    });
}


function get_user_methods() {
    request({ method: 'GET', url: 'http://localhost:4000/api/activate_methods' }, function(response) {
        if (response.code == "Ok") {
            for (method in response.methods) {
                if (response.methods[method]) {
                    check_method(method);
                } else {
                    uncheck_method(method);
                }
            }
        } else {
            console.log(response.message);
        }
    }, get_qrCode);
}


function get_user() {
    request({ method: 'GET', url: 'http://localhost:4000/api/admin/user/' + uid }, function(response) {
        if (response.code == "Ok") {
            $('#userInfo').show();
        } else {
            console.log(response.message);
        }
    });
}


function get_qrCode() {
    request({ method: 'GET', url: 'http://localhost:4000/api/secret/google_authenticator' }, function(response) {
        if (response.code == "Ok") {
            $('#qrCode').append(response.qrCode);
            $('#secret').append(response.message);
        } else {
            console.log(response.message);
        }
    }, get_transports);
}


function get_transports() {
    request({ method: 'GET', url: 'http://localhost:4000/api/available_transports' }, function(response) {
        if (response.code == "Ok") {
            $('#sms_label').text(response.transports_list.sms);
            $('#mail_label').text(response.transports_list.mail);
        } else {
            console.log(response.message);
        }
    });
}

function activate_method_admin(element) {
    request({ method: 'PUT', url: 'http://localhost:4000/api/admin/' + element.id.split('_activate')[0] + '/activate' }, function(response) {
        if (response.code == "Ok") {
            check_method(element.id.split('_activate')[0]);
        } else {
            console.log(response.message);
        }
    });
}


function deactivate_method_admin(element) {
    request({ method: 'PUT', url: 'http://localhost:4000/api/admin/' + element.id.split('_deactivate')[0] + '/deactivate' }, function(response) {
        if (response.code == "Ok") {
            uncheck_method(element.id.split('_deactivate')[0]);
        } else {
            console.log(response.message);
        }
    });
}

function activate_method_transport(element) {
    request({ method: 'PUT', url: 'http://localhost:4000/api/admin/' + element.id.split('_activate')[0] + '/' + element.id.split('_activate_')[1].split('_transport')[0] + '/activate' }, function(response) {
        if (response.code == "Ok") {
            check_method_transport(element.id.split('_activate')[0], element.id.split('_activate_')[1].split('_transport')[0]);
        } else {
            console.log(response.message);
        }
    });
}


function deactivate_method_transport(element) {
    request({ method: 'PUT', url: 'http://localhost:4000/api/admin/' + element.id.split('_deactivate')[0] + '/' + element.id.split('_deactivate_')[1].split('_transport')[0] + '/deactivate' }, function(response) {
        if (response.code == "Ok") {
            uncheck_method_transport(element.id.split('_deactivate')[0], element.id.split('_deactivate_')[1].split('_transport')[0]);
        } else {
            console.log(response.message);
        }
    });
}


function activate_method(element) {
    request({ method: 'PUT', url: 'http://localhost:4000/api/' + element.id.split('_activate')[0] + '/activate' }, function(response) {
        if (response.code == "Ok") {
            check_method(element.id.split('_activate')[0]);
        } else {
            console.log(response.message);
        }
    });
}


function deactivate_method(element) {
    request({ method: 'PUT', url: 'http://localhost:4000/api/' + element.id.split('_deactivate')[0] + '/deactivate' }, function(response) {
        if (response.code == "Ok") {
            uncheck_method(element.id.split('_deactivate')[0]);
        } else {
            console.log(response.message);
        }
    });
}

function change_transport(transport) {
    var new_transport = document.getElementById(transport + '_input').value;
    var reg;
    if (transport == 'sms') reg = new RegExp("^0[6-7]([-. ]?[0-9]{2}){4}$");
    else reg = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    if (reg.test(new_transport)) {
        request({ method: 'PUT', url: 'http://localhost:4000/api/transport/' + transport + '/' + new_transport }, function(response) {
            if (response.code == "Ok") {
                $('#change_' + transport + '_form').hide();
                $('#modify_' + transport + '_btn').show();
            } else {
                console.log(response.message);
            }
        }, get_transports);
    }
}


function check_method(method) {
    $("#" + method + "_activate").addClass("glyphicon-check");
    $("#" + method + "_activate").removeClass("glyphicon-unchecked");
    $("#" + method + "_deactivate").addClass("glyphicon-unchecked");
    $("#" + method + "_deactivate").removeClass("glyphicon-check");
}

function uncheck_method(method) {
    $("#" + method + "_activate").addClass("glyphicon-unchecked");
    $("#" + method + "_activate").removeClass("glyphicon-check");
    $("#" + method + "_deactivate").addClass("glyphicon-check");
    $("#" + method + "_deactivate").removeClass("glyphicon-unchecked");
}

function check_method_transport(method, transport) {
    $("#" + method + "_activate_" + transport + '_transport').addClass("glyphicon-check");
    $("#" + method + "_activate_" + transport + '_transport').removeClass("glyphicon-unchecked");
    $("#" + method + "_deactivate_" + transport + '_transport').addClass("glyphicon-unchecked");
    $("#" + method + "_deactivate_" + transport + '_transport').removeClass("glyphicon-check");
}

function uncheck_method_transport(method, transport) {
    $("#" + method + "_activate_" + transport + '_transport').addClass("glyphicon-unchecked");
    $("#" + method + "_activate_" + transport + '_transport').removeClass("glyphicon-check");
    $("#" + method + "_deactivate_" + transport + '_transport').addClass("glyphicon-check");
    $("#" + method + "_deactivate_" + transport + '_transport').removeClass("glyphicon-unchecked");
}
