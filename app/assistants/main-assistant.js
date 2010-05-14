function MainAssistant() {
	Mojo.Log.info("enter constructor()");		

	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;
	
	Mojo.Log.info("exit constructor()");
}    

MainAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	try {
		this.installCookie = new Mojo.Model.Cookie('INSTALL');
		this.installObj = this.installCookie.get();
		if(!this.installObj) {
			this.onInstall();
		}
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
		this.onInstall();
	}
	
	this.controller.get('title').innerHTML = Mojo.appInfo.title;
	this.controller.get('version').innerHTML = 'Beta v' + Mojo.appInfo.version;
	setTimeout(this.showNextScreen.bind(this), 10);
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appAssistant.appMenuModel);
	
	Mojo.Log.info("exit setup()");
}

MainAssistant.prototype.showNextScreen = function() {
	Mojo.Log.info("enter showNextScreen()");
	
	Mojo.Controller.appController.getStageController(MAIN_STAGE).pushScene('lists');
	
	Mojo.Log.info("exit showNextScreen()");
}

MainAssistant.prototype.onInstall = function(){
	Mojo.Log.info('enter onInstall()');
	
	// Do Something
		
	this.installCookie = new Mojo.Model.Cookie('INSTALL');
	this.installCookie.put({installTime: new Date()});
	
	Mojo.Log.info('exit onInstall()');
}

