var MAIN_STAGE = 'main';
var DASHBOARD_STAGE = 'dashboard';
var COOKIE_NAME = 'RTM_OBJ';

var AUTH_URL = 'http://www.rememberthemilk.com/services/auth/?';
var API_URL = 'http://api.rememberthemilk.com/services/rest/';
var API_KEY = 'd9223ab44b0239dc7071afcb8173d9d7';
var API_SECRET = '6575a4c41dd59b05';

var MONTH_NAMES = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
var EXPIRE_DATE = [2010, 2, 1];
var RTM_BLUE = '#0064C4';

var updatePID;

function AppAssistant(appController) {
	Mojo.Log.info('enter constructor');	

	this.appController = appController;
	
	// default settings					 
	try {
		//this.cookie = new Mojo.Model.Cookie(RTM_COOKIE);
		//this.rtmObj = this.cookie.get();
		
		this.rtmObj = {
			listsMap: [ ],
			lists: [ ], 
			tasks: [ ],
			timeline: -1,
			key: API_KEY,
			secret: API_SECRET,
			frob: (new Mojo.Model.Cookie('RTM_FROB')).get(),
			token: (new Mojo.Model.Cookie('RTM_TOKEN')).get(),
			user: (new Mojo.Model.Cookie('RTM_USER')).get(),
			bgUpdateStatus: 'off',
			bgUpdateRate: '01:00:00',
			bgNotifications: 'off'
		};
		
		Mojo.Log.info('loaded rtm obj: ' + Object.toJSON(this.rtmObj));
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
	}
	
	// create command menu (bottom bar)
	this.cmdMenuModel = {
		visible: true,
		items: [{
			toggleCmd: 'do-today',
			items: [
				{icon: 'nav_today', command: 'do-today'},
				{icon: 'nav_week', command: 'do-week'},
				{icon: 'nav_lists', command: 'do-lists'},
				{icon: 'nav_search', command: 'do-search'}		/*,
				{icon: 'nav_more', command: 'do-more', disabled: true},
				{icon: 'nav_mobile', command: 'do-mobile'}*/
			]
		}]
	};

	// create application menu (top left)
	this.appMenuModel = {
		visible: true,
		items: [
			Mojo.Menu.editItem,
			{ label: 'Preferences', command: Mojo.Menu.prefsCmd },
			{ label: 'Help', command: Mojo.Menu.helpCmd }
		]
	};

	Mojo.Log.info('exit constructor');
}

// This function will handle relaunching the app
AppAssistant.prototype.handleLaunch = function(params) {
	Mojo.Log.info('enter handleLaunch()');
	
	if (params) {
		Mojo.Log.info("has params");
		if (params.action == 'update') {
			Mojo.Log.info('params = update');
			
			// call update function here
			//
			
			// schedule next update
			// this.scheduleUpdate();			
		} else if(params.action == 'dashboard' || params.action == 'banner') {
			Mojo.Log.info('params in (dashboard, banner)');
			this.openChildWindow(this.appController);
		}
	} else {
		Mojo.Log.info("no params");
		/*if(this.params && this.params.bgUpdateStatus == 'on') {
			this.clearUpdate();
			this.scheduleUpdate();
		}*/
		this.openChildWindow(this.appController);		
	}
	
	Mojo.Log.info('exit handleLaunch()');
}

AppAssistant.prototype.openChildWindow = function() {
	Mojo.Log.info('enter openChildWindow()');
	
	this.stageController = this.appController.getStageController(MAIN_STAGE);
	
	if (this.stageController){
		// app window is open, give it focus
		this.stageController.activate();
	} else{
		// otherwise create the app window
		this.appController.createStageWithCallback({name: MAIN_STAGE, lightweight: true}, this.pushTheScene.bind(this));		
	}

	Mojo.Log.info('exit openChildWindow()');
}

AppAssistant.prototype.pushTheScene = function(stageController) {
	Mojo.Log.info('enter pushTheScene()');
						
	stageController.pushScene('main');
	
	Mojo.Log.info('exit pushTheScene()');
}

AppAssistant.prototype.handleCommand = function(event){
	Mojo.Log.info("enter handleCommand()");
	
	var stageController = this.controller.getStageController(MAIN_STAGE);
	
	if (event.type == Mojo.Event.commandEnable &&
			(event.command == Mojo.Menu.helpCmd || event.command == Mojo.Menu.prefsCmd)) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}

	if (event.type == Mojo.Event.command) {
		Mojo.Log.info("in command event");
		switch (event.command) {
			case Mojo.Menu.prefsCmd:
				Mojo.Log.info("before launch preferences scene");
				stageController.pushScene('options');
				Mojo.Log.info("after launch preferences scene");
				break;
			case Mojo.Menu.helpCmd:
				Mojo.Log.info("before launch support scene");
				stageController.pushScene('support');
				Mojo.Log.info("after launch support scene");
				break;
			case 'do-today':
				Mojo.Log.info("before launch today scene");
				stageController.swapScene('tasks', 'today');
				Mojo.Log.info("after launch today scene");
				break;
			case 'do-week':
				Mojo.Log.info("before launch week scene");
				stageController.swapScene('tasks', 'week');
				Mojo.Log.info("after launch week scene");
				break;
			case 'do-lists':
				Mojo.Log.info("before launch lists scene");
				stageController.swapScene('lists');
				Mojo.Log.info("after launch lists scene");
				break;
			case 'do-search':
				Mojo.Log.info("before launch search scene");
				stageController.swapScene('tasks', 'search');
				Mojo.Log.info("after launch search scene");
				break;
			case 'do-mobile':
				Mojo.Log.info("before launch mobile scene");
				stageController.swapScene('mobile');
				Mojo.Log.info("after launch mobile scene");
				break;
		}
	}

	Mojo.Log.info("exit handleCommand()");
}

AppAssistant.prototype.scheduleUpdate = function() {
	Mojo.Log.info('enter scheduleUpdate()');
	
	//var now = new Date();
	//now.setSeconds(now.getSeconds() + 120);
	//var atTime = formatDate(now, "MM/dd/yyyy HH:mm:ss");
	//Mojo.Log.info('atTime: ' + atTime);
	
	var inTime = this.params.bgUpdateRate;
	var request = new Mojo.Service.Request('palm://com.palm.power/timeout', { 
		method: 'set',
		parameters: {
			'wakeup': (this.params.bgNotifications == 'on' ? true : false),
			'key': Mojo.appInfo.id+'-update',
			'uri': 'palm://com.palm.applicationManager/launch',
			'in': inTime,
			'params': {
				'id': Mojo.appInfo.id,
				'params': { 'action': 'update' }
			}
		}
	});
	
	Mojo.Log.info('exit scheduleUpdate()');
}

AppAssistant.prototype.clearUpdate = function() {
	Mojo.Log.info('enter clearUpdate()');
	
	var request = new Mojo.Service.Request('palm://com.palm.power/timeout', { 
		method: "clear",
		parameters: {
			'key': Mojo.appInfo.id+'-update'
		}
	});
	
	Mojo.Log.info('exit clearUpdate()');
}

AppAssistant.prototype.update = function(err, msg){
	Mojo.Log.info("enter update()");
	
	
	
	Mojo.Log.info("exit update()");
}

AppAssistant.prototype.timelines_create = function (params, on_success, on_failure) {
    Mojo.Log.info("enter timelines_create()");
	
	this.apiRequest(
        'rtm.timelines.create', 
        { parameters: params },
        function (data, resp) {
            Mojo.Log.info('timelines_create inner succ');			
            on_success(data.rsp.timeline);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit timelines_create()");
}

AppAssistant.prototype.tasks_complete = function (params, on_success, on_failure) {
    Mojo.Log.info("enter tasks_complete()");
	
	this.apiRequest(
        'rtm.tasks.complete', 
        { parameters: params },
        function (data, resp) {
            Mojo.Log.info('tasks_complete inner succ');			
            on_success(data.rsp.tasks.list);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit tasks_complete()");
}

AppAssistant.prototype.tasks_postpone = function (params, on_success, on_failure) {
    Mojo.Log.info("enter tasks_postpone()");
	
	this.apiRequest(
        'rtm.tasks.postpone', 
        { parameters: params },
        function (data, resp) {
            Mojo.Log.info('tasks_postpone inner succ');			
            on_success(data.rsp.tasks.list);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit tasks_postpone()");
}

AppAssistant.prototype.tasks_add = function (params, on_success, on_failure) {
    Mojo.Log.info("enter tasks_add()");
	
	this.apiRequest(
        'rtm.tasks.add', 
        { parameters: params },
        function (data, resp) {
            Mojo.Log.info('tasks_add inner succ');			
            on_success(data);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit tasks_add()");
}

AppAssistant.prototype.tasks_getList = function (params, on_success, on_failure) {
    Mojo.Log.info("enter tasks_getList()");
	
	this.apiRequest(
        'rtm.tasks.getList', 
        { parameters: params },
        function (data, resp) {
            Mojo.Log.info('tasks_getList inner succ');
			this.rtmObj.lists = data.rsp.tasks.list;
            on_success(data.rsp.tasks.list);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit tasks_getList()");
}

AppAssistant.prototype.lists_getList = function (params, on_success, on_failure) {
    Mojo.Log.info("enter lists_getList()");
	
	this.apiRequest(
        'rtm.lists.getList', 
        { parameters: params },
        function (data, resp) {
            Mojo.Log.info('lists_getList inner succ');
			this.rtmObj.lists = data.rsp.lists.list;
            on_success(data.rsp.lists.list);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit lists_getList()");
}

AppAssistant.prototype.auth_getFrob = function (params, on_success, on_failure) {
    Mojo.Log.info("enter auth_getFrob()");
	
	this.apiRequest(
        'rtm.auth.getFrob',
        { parameters: params },
        function (data, resp) {
			Mojo.Log.info('auth_getFrob inner succ');
            var frob = data.rsp.frob;
            var login_url = AUTH_URL + 
                $H(this.escape_and_sign({
                    api_key: this.rtmObj.key,
                    frob:    frob,
					perms:   "delete"                    
                })).toQueryString();
				Mojo.Log.info('frob: ' + frob + ' | login_url: ' + login_url);
            on_success(frob, login_url, data, resp);
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit auth_getFrob()");
}

AppAssistant.prototype.auth_getToken = function (params, on_success, on_failure) {
    Mojo.Log.info("enter auth_getToken()");
	
	this.apiRequest(
        'rtm.auth.getToken', 
        { parameters: params },
        function (data, resp) {
            this.rtmObj.token = data.rsp.auth.token;
			Mojo.Log.info('token: ' + data.rsp.auth.token + ' | user: ' + data.rsp.auth.user);
            on_success(
                data.rsp.auth.token, 
                data.rsp.auth.user, 
                data.rsp.auth.perms, 
                data, resp
            );
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit auth_getToken()");
}

AppAssistant.prototype.auth_checkToken = function (params, on_success, on_failure) {
    Mojo.Log.info("enter auth_checkToken()");
	
	this.apiRequest(
        'rtm.auth.checkToken', 
        { parameters: params },
        function (data, resp) {
            this.rtmObj.token = data.rsp.auth.token;
			Mojo.Log.info('token: ' + data.rsp.auth.token + ' | user: ' + data.rsp.auth.user);
            on_success(
                data.rsp.auth.token, 
                data.rsp.auth.user, 
                data.rsp.auth.perms, 
                data, resp
            );
        }.bind(this),
        on_failure
    );
	
	Mojo.Log.info("exit auth_checkToken()");
}

AppAssistant.prototype.apiRequest = function (api_method, options, on_success, on_failure) {
    Mojo.Log.info("enter apiRequest()");

	options = Object.extend({
        "method": "get",
        "evalJSON": "force",
        "onSuccess": function (resp) {
            var data = resp.responseJSON;
			Mojo.Log.info(Object.toJSON(data));
            if ('ok' == data.rsp.stat) {
				Mojo.Log.info('apiRequest inner succ');
                on_success(data, $A(arguments));
            } else {
				Mojo.Log.info('apiRequest inner fail');
                on_failure($A(arguments));
            }
        },
        "onFailure": on_failure
    }, options || {});

    options.parameters = Object.extend({
        "api_key": this.rtmObj.key,
		"format": "json",        
        "method": api_method        
    }, options.parameters || {});

    if (this.rtmObj.token) {
        options.parameters.auth_token = this.rtmObj.token;
    }
	
	options.parameters = this.escape_and_sign(options.parameters);
	
	Mojo.Log.info("exit apiRequest()");

    return new Ajax.Request(API_URL, options);
}

AppAssistant.prototype.escape_and_sign = function(params, post) {
	Mojo.Log.info("enter escape_and_sign()");
	
	params.api_key = this.rtmObj.key;
	var sig = [];
	var esc_params = {api_key: '', api_sig: ''};
	for (var p in params) {
		if ('object' === typeof params[p]) {
			esc_params[p] = params[p];
		} else {
			sig.push(p);
			esc_params[p] = this.escape_utf8('' + params[p], !post)
				.replace(/(^\s+|\s+$)/g, '');
		}
	}
	sig.sort();
	
	var calc = [];
	var ii = sig.length;
	for (var i = 0; i < ii; ++i) {
		calc.push(sig[i] + (post ? esc_params[sig[i]] : this.escape_utf8('' +
			params[sig[i]], false)));
    }

    var clear = this.rtmObj.secret + calc.join('');
		
    esc_params.api_sig = dojox.encoding.digests.MD5(
        clear, dojox.encoding.digests.outputTypes.Hex
    );
	
	Mojo.Log.info("exit escape_and_sign()");
	
	return esc_params;
}

AppAssistant.prototype.escape_utf8 = function(data, url) {
//	Mojo.Log.info("enter escape_utf8()");
	
    if (null === url) {
        url = false;
    }
    if ('' === data || null === data || undefined === data) {
        return '';
    }
        
    var chars = '0123456789abcdef';
    data = data.toString();
    var buffer = [];
    var ii = data.length;
    for (var i = 0; i < ii; ++i) {
        var c = data.charCodeAt(i);
        var bs = [];
        if (c > 0x10000) {
            bs[0] = 0xf0 | ((c & 0x1c0000) >>> 18);
            bs[1] = 0x80 | ((c & 0x3f000) >>> 12);
            bs[2] = 0x80 | ((c & 0xfc0) >>> 6);
            bs[3] = 0x80 | (c & 0x3f);
        } else if (c > 0x800) {
            bs[0] = 0xe0 | ((c & 0xf000) >>> 12);
            bs[1] = 0x80 | ((c & 0xfc0) >>> 6);
            bs[2] = 0x80 | (c & 0x3f);
        } else if (c > 0x80) {
            bs[0] = 0xc0 | ((c & 0x7c0) >>> 6);
            bs[1] = 0x80 | (c & 0x3f);
        } else {
            bs[0] = c;
        }
        var j = 0, jj = bs.length;
        if (1 < jj) {
            if (url) {
                for (j = 0; j < jj; ++j) {
                    var b = bs[j];
                    buffer.push('%' + chars.charAt((b & 0xf0) >>> 4) +
                        chars.charAt(b & 0x0f));
                }
            } else {
                for (j = 0; j < jj; ++j) {
                    buffer.push(String.fromCharCode(bs[j]));
                }
            }
        } else {
            if (url) {
				// TODO: WEIRD ENCODING ISSUE - TEMPORARY FIX
                //buffer.push(encodeURIComponent(String.fromCharCode(bs[0])));
				buffer.push(String.fromCharCode(bs[0]));
            } else {
                buffer.push(String.fromCharCode(bs[0]));
            }
        }
    }
	
//	Mojo.Log.info("exit escape_utf8()");
	
    return buffer.join('');
}

AppAssistant.prototype.handleError = function(err, msg) {
	Mojo.Log.info("enter handleError()");

	var errorText = '';
	if(msg == null)
		errorText = msg + ' (' + err.errorCode + ": " + err.errorText + ')';
	else
		errorText = err.errorCode + ": " + err.errorText;

	Mojo.Controller.appController.getStageController(MAIN_STAGE).topScene().showAlertDialog({
		preventCancel: true,
		onChoose: function(value){
		},
		title: 'RTM Error',
		message: errorText,
		choices: [{
			label: 'OK',
			value: 'OK',
			type: 'color'
		}]
	});

	Mojo.Log.info("exit handleError()");
}

AppAssistant.prototype.showAlert = function(message) {
	Mojo.Log.info("enter showAlert()");

	Mojo.Log.info('message: ' + message);

	Mojo.Controller.appController.getStageController(MAIN_STAGE).topScene().showAlertDialog({
		preventCancel: true,
		onChoose: function(value){
		},
		title: 'CowTasks',
		message: message,
		choices: [{
			label: 'OK',
			value: 'OK',
			type: 'color'
		}]
	});

	Mojo.Log.info("exit showAlert()");
}

AppAssistant.prototype.showNotification = function(message, action) {
	Mojo.Log.info("enter showNotification()");

	Mojo.Controller.appController.showBanner(message, action);

	Mojo.Log.info("exit showNotification()");
}

//TODO
AppAssistant.prototype.showDashboard = function(){
	Mojo.Log.info('enter showDashboard()');
	
    var f = function(stageController){
        stageController.pushScene({
			name: dashboardStageName
			},{
				message: 'CowTasks Message Here',
				alertCount: '3'
			});
    };
    
	this.controller.createStageWithCallback({
		name: dashboardStageName,
	 	lightweight: true
	}, f, dashboardStageName);
	
	Mojo.Log.info('exit showDashboard()');
}
