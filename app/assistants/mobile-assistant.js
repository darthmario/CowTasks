function MobileAssistant() {
	this.appAssistant = Mojo.Controller.appController.assistant;
}    

MobileAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");

	this.controller.setupWidget('mobileView', {
		minFontSize: 14,
		cacheAdapter: true,
		url: 'http://i.rememberthemilk.com/'
	});
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit setup()");	
}

MobileAssistant.prototype.activate = function(event) {
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-mobile';
}
	
MobileAssistant.prototype.deactivate = function(event) {

}

MobileAssistant.prototype.cleanup = function(event) {

}
