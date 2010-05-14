function OptionsAssistant() {

}

OptionsAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.controller.setupWidget("bgUpdateStatusRadio",
    	this.attributes = {
	        choices: [
		        {label: "ENABLED", value: 'on'},
		        {label: "DISABLED", value: 'off'}
        ]},
		this.bgUpdateStatusModel = {
			value: Mojo.Controller.appController.assistant.rtmObj.bgUpdateStatus || 'on'
		});	
		
	this.controller.setupWidget("bgUpdateRateRadio",
    	this.attributes = {
	        choices: [
				{label: " 15 MI ", value: '00:15:00'},
				{label: " 30 MI ", value: '00:30:00'},
		        {label: " 1 HR ", value: '01:00:00'},
				{label: " 2 HR ", value: '02:00:00'},
				{label: " 4 HR ", value: '04:00:00'}
        ]},
		this.bgUpdateRateModel = {
			value: Mojo.Controller.appController.assistant.rtmObj.bgUpdateRate || '05'
		});
		
	this.controller.setupWidget("bgNotificationsRadio",
    	this.attributes = {
	        choices: [
		        {label: "SHOW ALERTS", value: 'on'},
		        {label: "NO ALERTS", value: 'off'}
        ]},
		this.bgNotificationsModel = {
			value: Mojo.Controller.appController.assistant.rtmObj.bgNotifications || 'on'
		});	

	Mojo.Log.info("exit setup()");	
}

OptionsAssistant.prototype.saveOptions = function(event) {
	Mojo.Log.info("enter saveOptions()");
	
	Mojo.Controller.appController.assistant.rtmObj.bgUpdateStatus = this.bgUpdateStatusModel.value;
	Mojo.Controller.appController.assistant.rtmObj.bgUpdateRate = this.bgUpdateRateModel.value;
	Mojo.Controller.appController.assistant.rtmObj.bgNotifications = this.bgNotificationsModel.value;
	
	this.cookie = new Mojo.Model.Cookie(RTM_COOKIE);
	this.cookie.put(Mojo.Controller.appController.assistant.rtmObj);
	
	Mojo.Log.info("exit saveOptions()");
}

OptionsAssistant.prototype.activate = function(event) {
	Mojo.Log.info("enter activate()");
	
	Mojo.Controller.appController.assistant.clearUpdate();
	
	Mojo.Log.info("exit activate()");
}

OptionsAssistant.prototype.deactivate = function(event) {
	Mojo.Log.info("enter deactivate()");
	
	this.saveOptions();
	
	if(Mojo.Controller.appController.assistant.params.bgUpdateStatus == 'on')
		Mojo.Controller.appController.assistant.scheduleUpdate();
		
	Mojo.Log.info("exit deactivate()");
}