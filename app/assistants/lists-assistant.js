function ListsAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;		
	if(!this.rtmObj.lists) {
		this.rtmObj.lists = [ ];
	}
	
	Mojo.Log.info("exit constructor()");
}    

ListsAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	//Mojo.Log.info("rtmObj: " + Object.toJSON(this.rtmObj));
	
	this.controller.setupWidget('lstLists', {
									itemTemplate:'lists/listitem',
									emptyTemplate:'lists/emptylist', 
									//addItemLabel: 'Add new list...',
									swipeToDelete: false,								
									reorderable: false
								}, { items: this.rtmObj.lists });	
	
	this.controller.setupWidget("spinnerId",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.spinnerModel = {
             spinning: false 
         });
	
	/*
	this.viewMenuModel = {
		visible: true,
        items: [{
			items: [
				{icon: 'nav_update', expand:false, command: 'do-update'},
				{label: 'Lists', expand: true, command: ''},
				{icon: 'nav_edit', expand:false, command: 'do-edit'}
        	]
		}]
	}
	this.viewMenuModel = {
		visible: true,
        items: [
			{icon: 'nav_update', expand:false, command: 'do-update'},
			{icon: 'nav_edit', expand:false, command: 'do-edit'}
		]
	}
	this.controller.setupWidget(Mojo.Menu.viewMenu, {menuClass: 'no-fade'}, this.viewMenuModel);
	*/
	
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);

	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appAssistant.appMenuModel);

	Mojo.Event.listen(this.controller.get('lstLists'), Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('lstLists'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('lstLists'), Mojo.Event.listReorder, this.listReorderHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('lstLists'), Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));

	Mojo.Log.info("exit setup()");
}

ListsAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
	if (event.type == Mojo.Event.commandEnable && 
			(event.command == 'do-update' || event.command == 'do-more' || event.command == Mojo.Menu.helpCmd || event.command == Mojo.Menu.prefsCmd)) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}
	
	if (event.type == Mojo.Event.command) {
		Mojo.Log.info("in command event");
		switch (event.command) {
			case 'do-more':
				Mojo.Log.info('selected update screen');
				this.update();
				break;			
		}
	} 
	
	Mojo.Log.info("exit handleCommand()");
}

ListsAssistant.prototype.listTapHandler = function(event) {
	Mojo.Log.info("enter listTapHandler()");
	
	Mojo.Controller.appController.getStageController(MAIN_STAGE).pushScene('tasks', event.item.id+'');
		
	Mojo.Log.info("exit listTapHandler()");
}

ListsAssistant.prototype.listReorderHandler = function(event){
	Mojo.Log.info("enter listReorderHandler()");
	
	Mojo.Log.info('from: ' + event.fromIndex + ' | to: ' + event.toIndex);
	
	var index = this.rtmObj.items.indexOf(event.item);
	var item = this.rtmObj.items[index];
	this.stockList.items.splice(index, 1);
	
	var front = this.rtmObj.items.slice(), back = front.splice(event.toIndex);
  	front[event.toIndex] = item;
	this.rtmObj.items = front.concat(back);
	
	this.saveItems();
	
	Mojo.Log.info("exit listReorderHandler()");
}

ListsAssistant.prototype.listDeleteHandler = function(event){
	Mojo.Log.info("enter listDeleteHandler()");
	
	var index = this.rtmObj.items.indexOf(event.item);
	this.rtmObj.items.splice(index, 1);
	this.saveItems();
	
	Mojo.Log.info("exit listDeleteHandler()");
}

ListsAssistant.prototype.listAddHandler = function(event){
	Mojo.Log.info("enter listAddHandler()");
	
	this.controller.showDialog({
		template: 'portfolios/addportfolio-scene',
		assistant: new AddportfolioAssistant(this, this.addPortfolio.bind(this)),
		preventCancel: true
	});

	Mojo.Log.info("exit listAddHandler()");
}

ListsAssistant.prototype.saveItems = function() {
	Mojo.Log.info("enter saveItems()");
	
	this.appAssistant.rtmObj = this.rtmObj;
	
	this.cookie = new Mojo.Model.Cookie(RTM_COOKIE);
	this.cookie.put(this.appAssistant.rtmObj);
	
	Mojo.Log.info("exit saveItems()");
}

ListsAssistant.prototype.update = function(event){
	Mojo.Log.info("enter update()");

	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;
	
    if (!this.rtmObj.token) {
        Mojo.log('Token not found.  Pushing login scene.');
        return this.controller.stageController.pushScene('login');
    } else {
		this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-lists';
		this.controller.modelChanged(this.appAssistant.cmdMenuModel);
		
		this.appAssistant.auth_checkToken(
            {},
            function (token, user, perms) {
				// start the spinner
				this.spinnerModel.spinning = true;
				this.controller.modelChanged(this.spinnerModel);
				
				this.appAssistant.lists_getList(
					{},
					function (listsArray) {
						//Mojo.Log.info('list of lists: ' + Object.toJSON(listsArray));
						
						var listsMap = new Array();
						for (var i = 0; i < listsArray.length; i++) 
							listsMap[listsArray[i].id + ''] = {
								'name': listsArray[i].name,
								'smart': listsArray[i].smart
							};
						
						this.appAssistant.tasks_getList(
							{ filter: 'status:incomplete' },
							function (tasksArray) {

								var listCountsMap = new Array();
								for(var i = 0; i < tasksArray.length; i++)
									listCountsMap[tasksArray[i].id+''] = tasksArray[i].taskseries.length;
																	
								//Mojo.Log.info('setting listCounts as per - ' + Object.toJSON(listCountsMap));
								
								var count;
								for(var j = 0; j < listsArray.length; j++) {
									count = listCountsMap[listsArray[j].id+''];
									if(count == null)
										count = 'smart';
									listsArray[j] = Object.extend({ "count": count}, listsArray[j]);
								}
								//Mojo.Log.info(Object.toJSON(listsArray[j]));
								
								listsArray = this.sortListsArray(listsArray);
								
								this.appAssistant = Mojo.Controller.appController.assistant;
								this.rtmObj = this.appAssistant.rtmObj;
								this.rtmObj.lists = listsArray;
								this.rtmObj.listsMap = listsMap;
								Mojo.Controller.appController.assistant.rtmObj.lists = listsArray;
								Mojo.Controller.appController.assistant.rtmObj.listsMap = listsMap;												
								
								this.controller.setWidgetModel('lstLists', {items: this.rtmObj.lists});
								Mojo.Log.info('done setting list model');								
								
								// stop the spinner
								this.spinnerModel.spinning = false;
								this.controller.modelChanged(this.spinnerModel);
							}.bind(this),
							function(ev){								
								this.appAssistant = Mojo.Controller.appController.assistant;
								this.rtmObj = this.appAssistant.rtmObj;
								this.rtmObj.lists = listsArray;
								this.rtmObj.listsMap = listsMap;
								Mojo.Controller.appController.assistant.rtmObj.lists = listsArray;
								Mojo.Controller.appController.assistant.rtmObj.listsMap = listsMap;												
								
								this.controller.setWidgetModel('lstLists', {items: this.rtmObj.lists});
								Mojo.Log.info('done setting list model');
								
								// stop the spinner
								this.spinnerModel.spinning = false;
								this.controller.modelChanged(this.spinnerModel);
							}.bind(this)
						);
					}.bind(this),
					function(ev){
						// stop the spinner
						this.spinnerModel.spinning = false;
						this.controller.modelChanged(this.spinnerModel);
						
						Mojo.log("LISTS GETLIST FAILED %j", (ev.responseText));
						this.controller.showAlertDialog({
							onChoose: function(value){
							},
							title: $L("Error"),
							message: $L("A call to the RTM API failed.  " +
							"Please try authenticating again."),
							choices: [{
								label: $L("OK"),
								value: ""
							}]
						});
					}.bind(this)
				);
            }.bind(this),
            function () {
                this.controller.stageController.pushScene('login');
            }.bind(this)
        );
    }
	
	Mojo.Log.info("exit update()");
}

ListsAssistant.prototype.sortListsArray = function(listsArray){
	Mojo.Log.info("enter sortListsArray()");

	var tempValue;
	
	if(listsArray && listsArray.length > 0)
	{	
		for(var i = 0; i < listsArray.length; i++)
		{
			for(var j = i+1; j < listsArray.length; j++)
			{
				// J gets moved higher if I > J				
				if(listsArray[i].name.toUpperCase() > listsArray[j].name.toUpperCase())
				{
					tempValue = listsArray[j];
					listsArray[j] = listsArray[i];
					listsArray[i] = tempValue;
				}
			}
		}	
	}
	
	Mojo.Log.info("exit sortListsArray()");
	
	return listsArray;
}

ListsAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");

	this.update();	
	
	Mojo.Log.info("exit activate()");
}

ListsAssistant.prototype.deactivate = function(){
	Mojo.Log.info("enter deactivate()");
	
	Mojo.Log.info("exit deactivate()");
}

ListsAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info("enter cleanup()");	
	
	Mojo.Event.stopListening(this.controller.get('lstLists'), Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('lstLists'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('lstLists'), Mojo.Event.listReorder, this.listReorderHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('lstLists'), Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
	
	Mojo.Log.info("exit cleanup()");
}
