function LoginAssistant() {
	Mojo.Log.info('enter constructor()');
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;
	
	Mojo.Log.info('exit constructor()');	
}    

LoginAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.controller.setupWidget(
        'auth-button', { 'label': 'Authenticate' }, { }
    );
    this.controller.setupWidget(
        'continue-button', { 'label': 'Continue' }, { }
    );
	
	this.controller.listen('auth-button', Mojo.Event.tap, this.handleAuthTap.bind(this));
	this.controller.listen('continue-button', Mojo.Event.tap, this.handleContinueTap.bind(this));
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appAssistant.appMenuModel);
	
	Mojo.Log.info("exit setup()");	
}

LoginAssistant.prototype.handleAuthTap = function (event) {
    this.appAssistant.auth_getFrob(
        {}, 
        function (frob, grant_url) {
            this.rtmObj.frob = frob;
			this.appAssistant.rtmObj = this.rtmObj;
            Mojo.log("AUTH URL %s %j", frob, grant_url);

            this.controller.serviceRequest(
                "palm://com.palm.applicationManager", 
                {
                    method: "open",
                    parameters:  {
                        id: 'com.palm.app.browser',
                        params: { target: grant_url }
                    }
                }
            );

        }.bind(this),
        function (event) {
            Mojo.log("AUTH GETFROB FAILED %j", (event.responseText));
            this.controller.showAlertDialog({
                onChoose: function(value) {},
                title: $L("Authentication Failed"),
                message:
                    $L("A call to the RTM API failed.  " + 
                    "Please try authenticating again."),
                choices: [
                    {label:$L("OK"), value:""}
                ]
            });
        }.bind(this)
    );
},

/**
 * Handle a tap on the continue button to complete Flickr auth process.
 */
LoginAssistant.prototype.handleContinueTap = function (event) {
    this.appAssistant.auth_getToken(
        { frob: this.rtmObj.frob },
        
        function (token, user) {
            Mojo.Log.info('continueTap inner succ');
			
			this.rtmObj.token = token;
			this.appAssistant.rtmObj.token = token;
			
			this.rtmObj.user = user;
			this.appAssistant.rtmObj.user = user;
			
			var token_cookie = new Mojo.Model.Cookie('RTM_TOKEN');
			token_cookie.put(token);
            var user_cookie = new Mojo.Model.Cookie('RTM_USER');
            user_cookie.put(user);
            Mojo.log('getToken: %s', token);
            Mojo.log('auth user: %j', user);
            this.controller.stageController.popScene();
        }.bind(this),
        
        function (event) {
            Mojo.log("AUTH GETTOKEN FAILED %j", (event.responseText));
            this.controller.showAlertDialog({
                onChoose: function(value) {},
                title: $L("Authentication Failed"),
                message:
                    $L("Access was not approved. " + 
                    "Please try authenticating again. " + 
                    "It may help to refresh the RTM page " +
                    "in the browser once before authorizing, " +
                    "due to caching issues."),
                choices: [
                    {label:$L("OK"), value:""}
                ]
            });
        }.bind(this)
    );
}

LoginAssistant.prototype.activate = function(event) {
	
}
	
LoginAssistant.prototype.deactivate = function(event) {

}

LoginAssistant.prototype.cleanup = function(event) {

}
