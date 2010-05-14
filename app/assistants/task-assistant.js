function TaskAssistant(type, name, list, priority, dueMS, tags) {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;
	
	this.lists = [ ];
	for (var key in this.rtmObj.listsMap) {		
		if(this.rtmObj.listsMap[key].smart == '0') {
			this.lists.push({
				label: this.rtmObj.listsMap[key].name,
				value: this.rtmObj.listsMap[key].name
			});			
		}
	}
	
	this.type = type;
	if (type == 'add') {
		Mojo.Log.info('type: ' + 'add');
	} else if(type == 'edit') {
		Mojo.Log.info('type: ' + 'edit');
				
		this.pName = name;
		this.pList = list;
		this.pPriority = priority;
		this.pDueMS = dueMS;
		this.pTags = tags;
	}
	
	Mojo.Log.info("exit constructor()");
}    

TaskAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.controller.setupWidget("spinnerId",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.spinnerModel = {
             spinning: false 
         });
	
	this.controller.setupWidget("txtName",
         this.attributes = {
		 	 label: 'Name',
             hintText: $L('Task name')
         },
         this.nameModel = {
             value: (this.type == 'edit' ? this.pName : '')
    });
	
	this.controller.setupWidget("lstSelList",
        this.attributes = {
	        label: 'List'
		},		  
        this.listModel = {
	        choices: this.lists,
	        value: (this.type == 'edit' ? this.pList : '')	//this.lists[0].value
        }
    );
	
	this.controller.setupWidget("lstSelPriority",
        this.portfolioAttributes = { 
			label: 'Priority',
			choices: [
		        {label: "1 - High", value: '1'},
				{label: "2 - Medium", value: '2'},
				{label: "3 - Low", value: '3'},
				{label: "None", value: ''},
		]},
        this.priorityModel = {
			value: (this.type == 'edit' ? this.pPriority : '')
        }
    );

	var todayDate = new Date();
    this.controller.setupWidget("dateDue",
        this.attributes = {
            label: ' ',
            modelProperty: 'value'
        },
		this.dueModel = {
            value: (this.type == 'edit' ? (new Date(this.pDueMS)) : todayDate)
    });

	this.controller.setupWidget("txtTags",
         this.attributes = {
             label: 'Tags',
			 hintText: $L('Tags')
         },
         this.tagsModel = {
             value: ""
    });
	
	this.viewMenuModel = {
		visible: true,
        items: [{
			items: [
				{icon: 'nav_update', expand:false, command: 'do-update'},
				{label: '--', expand: true, command: ''},
				{icon: 'nav_edit', expand:false, command: 'do-edit'}
        	]
		}]
	}
	//this.controller.setupWidget(Mojo.Menu.viewMenu, {menuClass: 'no-fade'}, this.viewMenuModel);

	this.controller.get('btnDone').innerHTML = this.toProperCase(this.type);
	this.controller.get('main-hdr').innerHTML = this.toProperCase(this.type) + ' Task';

	Mojo.Event.listen(this.controller.get('lstSelList'), Mojo.Event.propertyChange, this.handleUpdateList.bindAsEventListener(this));

	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);

	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appAssistant.appMenuModel);

	Mojo.Event.listen(this.controller.get('btnDone'),Mojo.Event.tap,this.done.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('btnCancel'),Mojo.Event.tap,this.cancel.bindAsEventListener(this));
	
	this.controller.window.setTimeout(function(){
		var version = Mojo.Environment.DeviceInfo.platformVersionMajor +
						  Mojo.Environment.DeviceInfo.platformVersionMinor * 0.1 +
						  Mojo.Environment.DeviceInfo.platformVersionDot * 0.01;
						  
		if(version > 1.31)
			this.controller.get('dateDue').style.top = '-39px';
	}.bind(this), 100);
	
	Mojo.Log.info("exit setup()");
}

TaskAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
	if (event.type == Mojo.Event.commandEnable && 
			(event.command == 'do-update' || event.command == 'do-more')) {
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

TaskAssistant.prototype.handleUpdateList = function(event){
	Mojo.Log.info('enter handleUpdateList()');	
	
	Mojo.Log.info('handleUpdateList > event: ' + Object.toJSON(event));
	
	this.listModel.value = event.value;	
	this.controller.modelChanged(this.listModel);
	
	Mojo.Log.info('exit handleUpdateList()');
}

TaskAssistant.prototype.createTimeline = function() {
	Mojo.Log.info('enter createTimeline()');	
	
	if (!this.rtmObj.token) {
        Mojo.log('Token not found.  Pushing login scene.');
        return this.controller.stageController.pushScene('login');
    } else {		
		this.appAssistant.auth_checkToken(
            {},
            function (token, user, perms) {
                Mojo.log('about to call timelines_create');
				
				this.appAssistant.timelines_create(
					{},
					function (timeline) {
						this.appAssistant = Mojo.Controller.appController.assistant;
						this.rtmObj = this.appAssistant.rtmObj;
						this.rtmObj.timeline = timeline;
						this.appAssistant.rtmObj.timeline = timeline;
						
						Mojo.Log.info('done creating timeline');
					}.bind(this),
					function(ev){
						Mojo.log("TIMELINES CREATE FAILED %j", (ev.responseText));
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
						
	Mojo.Log.info('exit createTimeline()');	
}

TaskAssistant.prototype.done = function(event){
	Mojo.Log.info('enter done()');	
	
	if(this.type == 'edit') {
		this.controller.showAlertDialog({
			preventCancel: true,
			onChoose: function(value){
				this.cancel();
			},
			title: 'RTM',
			message: 'This function is currently not available.',
			choices: [{
				label: 'OK',
				value: 'OK',
				type: 'color'
			}]
		});
		return ;
	}
	
	// TODO: validate task here
	
	if (!this.rtmObj.token) {
        Mojo.log('Token not found.  Pushing login scene.');
        return this.controller.stageController.pushScene('login');
    } else if(this.type == 'add') {
		// start the spinner
		this.spinnerModel.spinning = true;
		this.controller.modelChanged(this.spinnerModel);
				
		this.appAssistant.auth_checkToken(
            {},
            function (token, user, perms) {
                Mojo.log('about to call tasks_add');
				
				var taskName = this.nameModel.value;
				Mojo.Log.info('name: ' + taskName);
				
				if(this.listModel.value != null && this.listModel.value != '') {
					taskName += ' #' + this.listModel.value;
					Mojo.Log.info('name, list: ' + taskName);
				}
				
				if(this.priorityModel.value != null && this.priorityModel.value != '') {
					taskName += ' !' + this.priorityModel.value;
					Mojo.Log.info('name, list, priority: ' + taskName);
				}
				
				if(this.dueModel.value != null) {
					Mojo.Log.info('before due');
					var dueDate = this.dueModel.value;
					Mojo.Log.info('got date from model');
					Mojo.Log.info('value: ' + dueDate);
					taskName += ' ^' + (dueDate.getMonth()+1) + '/'
							+ dueDate.getDate() + '/'
							+ dueDate.getFullYear();	
					Mojo.Log.info('name, list, priority, due: ' + taskName);				
				}
				
				if(this.tagsModel.value != null && this.tagsModel.value != '') {
					Mojo.Log.info('before tags');
					var tags = this.tagsModel.value.strip();
					tags = tags.replace(/\s*,\s*/gmi, ',')
					var tagArr = tags.split(',');
					for(var t = 0; t < tagArr.length; t++) {
						taskName += ' #' + tagArr[t];
					}
					Mojo.Log.info('name, list, priority, due, tags: ' + taskName);
				}
				
				Mojo.Log.info('before tasks_add.');
				Mojo.Log.info('task name: ' + taskName);
				Mojo.Log.info('timeline: ' + this.rtmObj.timeline);
				
				this.appAssistant.tasks_add(
					{
						name: taskName,
						parse: 1,
						timeline: this.rtmObj.timeline								
					},
					function (list) {
						Mojo.Log.info("in success callback");
						this.appAssistant = Mojo.Controller.appController.assistant;
						this.rtmObj = this.appAssistant.rtmObj;
						Mojo.Log.info('done');
						
						Mojo.Controller.appController.getStageController(MAIN_STAGE).popScene();
					}.bind(this),
					function(ev){
						Mojo.log("TASKS ADD FAILED %j", (ev.responseText));
						this.controller.showAlertDialog({
							onChoose: function(value){
								Mojo.Controller.appController.getStageController(MAIN_STAGE).popScene();
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
	
	Mojo.Log.info('exit done()');
}

TaskAssistant.prototype.cancel = function(event) {
	Mojo.Log.info('enter cancel()');
	
	Mojo.Controller.appController.getStageController(MAIN_STAGE).popScene();
	
	Mojo.Log.info('exit cancel()');
}

TaskAssistant.prototype.toProperCase = function(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

TaskAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	this.createTimeline();
	
	Mojo.Log.info("exit activate()");
}

TaskAssistant.prototype.deactivate = function(){
	Mojo.Log.info("enter deactivate()");
	
	// stop the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	Mojo.Log.info("exit deactivate()");
}

TaskAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info('enter cleanup()');
	
	Mojo.Event.stopListening(this.controller.get('btnDone'),Mojo.Event.tap,this.done);
	Mojo.Event.stopListening(this.controller.get('btnCancel'),Mojo.Event.tap,this.cancel);
	
	Mojo.Log.info('exit cleanup()');
}
