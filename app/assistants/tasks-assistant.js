function TasksAssistant(listID) {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;
	this.listID = listID;
	this.tasksModel = [ ];		
	
	Mojo.Log.info("exit constructor()");
}    

TasksAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	//Mojo.Log.info("rtmObj: " + Object.toJSON(this.rtmObj));
	
	if(this.listID == 'search') {
		this.controller.setupWidget('lstTasks', {
									itemTemplate:'tasks/listitem',
									emptyTemplate:'tasks/emptylist', 
									swipeToDelete: false,								
									reorderable: false
								}, { items: [ ] });	
	} else {
		this.controller.setupWidget('lstTasks', {
									itemTemplate:'tasks/listitem',
									emptyTemplate:'tasks/emptylist', 
									addItemLabel: 'Add new task...',
									swipeToDelete: false,								
									reorderable: false
								}, { items: [ ] });	
	}
	
	this.controller.setupWidget("spinnerId",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.spinnerModel = {
             spinning: false 
         });
	
	this.controller.setupWidget('txtFilter', 
		{
			limitResize: true,
			hintText: 'Search String',
			enterSubmits: true
		}, 
		this.filterModel = { 
			value: 'priority:1'
		});
	
	this.controller.setupWidget('btnGo', 
		this.atts = {
			type: Mojo.Widget.defaultButton
		}, 
		this.model = {
			buttonLabel: 'Go',
			buttonClass: 'affirmative'
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

	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);

	// create application menu (top left)
	this.appMenuModel_search = {
		visible: true,
		items: [
			{ label: 'Advanced Search FAQ', command: 'do-search-faq' }
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: false}, (this.listID == 'search' ? this.appMenuModel_search : this.appAssistant.appMenuModel_search));

	this.controller.listen('btnGo', Mojo.Event.tap, this.handleGo.bind(this));

	Mojo.Event.listen(this.controller.get('lstTasks'), Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('lstTasks'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('lstTasks'), Mojo.Event.listReorder, this.listReorderHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('lstTasks'), Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));

	Mojo.Log.info("exit setup()");
}

TasksAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
	if (event.type == Mojo.Event.commandEnable && 
			(event.command == 'do-update' || event.command == 'do-more' || event.command == 'do-search-faq')) {
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
			case 'do-search-faq':
				Mojo.Log.info('selected search faq screen');
				this.showSearchFAQ();
				break;
		}
	} 
	
	Mojo.Log.info("exit handleCommand()");
}

TasksAssistant.prototype.listTapHandler = function(event) {
	Mojo.Log.info("enter listTapHandler()");
	
	Mojo.Log.info('tapHandler > event: ' + Object.toJSON(event.item));

	this.createTimeline();
	
	this.controller.popupSubmenu({
		onChoose: function(value) {
			// TODO: on complete, remove item from list
			Mojo.Log.info(event.item.listId)
			if(value == 'complete') {
				/*
				var index = this.tasksModel.items.indexOf(event.item);
				this.tasksModel.items.splice(index, 1);
				this.controller.modelChanged(this.tasksModel, this);
				*/
				this.complete(event.item.listId, event.item.taskSeriesId, event.item.taskId);
				window.setTimeout(this.handleGo.bind(this), 3000);				
			// TODO: on postpone, update list
			} else if(value == 'postpone') {
				this.postpone(event.item.listId, event.item.taskSeriesId, event.item.taskId);
				window.setTimeout(this.handleGo.bind(this), 3000);
			} else if(value == 'edit') {
				this.controller.stageController.pushScene('task', 'edit', event.item.name, event.item.list, event.item.priority, event.item.dueMS, '');
			}
		},
		items: [
			{label: 'Complete', command: 'complete'},
			{label: 'Postpone', command: 'postpone'},
			{label: 'Edit', command: 'edit'}],
		manualPlacement: false	
	});		
		
	Mojo.Log.info("exit listTapHandler()");
}

TasksAssistant.prototype.listReorderHandler = function(event){
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

TasksAssistant.prototype.listDeleteHandler = function(event){
	Mojo.Log.info("enter listDeleteHandler()");
	
	var index = this.rtmObj.items.indexOf(event.item);
	this.rtmObj.items.splice(index, 1);
	this.saveItems();
	
	Mojo.Log.info("exit listDeleteHandler()");
}

TasksAssistant.prototype.listAddHandler = function(event){
	Mojo.Log.info("enter listAddHandler()");
	
	this.controller.stageController.pushScene('task', 'add');

	Mojo.Log.info("exit listAddHandler()");
}

TasksAssistant.prototype.saveItems = function() {
	Mojo.Log.info("enter saveItems()");
	
	this.appAssistant.rtmObj = this.rtmObj;
	
	this.cookie = new Mojo.Model.Cookie(RTM_COOKIE);
	this.cookie.put(this.appAssistant.rtmObj);
	
	Mojo.Log.info("exit saveItems()");
}

TasksAssistant.prototype.update = function(event){
	Mojo.Log.info("enter update()");
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.rtmObj = this.appAssistant.rtmObj;
	
	if (!this.rtmObj.token) {
        Mojo.log('Token not found.  Pushing login scene.');
        return this.controller.stageController.pushScene('login');
    } else {		
		var today = new Date();
		var filter = '';
		var headerText = '';
		var useFilter = true;
		
		if(this.listID == 'today') {
			filter = 'due:today';
			headerText = 'Today, ' + MONTH_NAMES[today.getMonth()].substring(0, 3) + ' ' + today.getDate();
			
			this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-today';
			this.controller.modelChanged(this.appAssistant.cmdMenuModel);		
		} else if(this.listID == 'week') {
			filter = 'dueWithin:"1 week of today"';
			headerText = 'Due This Week';
			
			this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-week';
			this.controller.modelChanged(this.appAssistant.cmdMenuModel);
		} else if(this.listID == 'search') {
			filter = this.filterModel.value;
			headerText = 'Search';
			
			this.controller.get('filter').style.display = 'inline';
			this.controller.get('filter').style.visibility = 'visible';
			
			this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-search';
			this.controller.modelChanged(this.appAssistant.cmdMenuModel);
		} else if(this.listID.match(/\d*/gmi)) {
			filter = '';
			useFilter = false;			
			headerText = this.rtmObj.listsMap[this.listID+''].name;
		} else {
			filter = 'list:"' + this.listID + '"'
			headerText = this.listID;
		}
		
		this.controller.get('main-hdr').innerHTML = headerText;
		
        this.appAssistant.auth_checkToken(
            {},
            function (token, user, perms) {
                Mojo.log('about to call tasks_getList');
				
				// start the spinner
				this.spinnerModel.spinning = true;
				this.controller.modelChanged(this.spinnerModel);
								
				this.appAssistant.tasks_getList(
					(useFilter ? { filter: filter } : { list_id: this.listID }),
					function (tasksArray) {
						Mojo.Log.info('enter tasks_getList success');
						
						this.tasksModel = [ ];
						
						if(tasksArray) {
							if (tasksArray.length) {		
								Mojo.Log.info('list of taskseries');											
								for (var l = 0; l < tasksArray.length; l++)
									this.processTaskSeries(tasksArray[l]);
							} else {
								Mojo.Log.info('single taskseries');
								this.processTaskSeries(tasksArray);
							}			
						
							Mojo.Log.info('length before: ' + this.tasksModel.length);
							this.sortTasksModel();	// sorts the global this.tasksModel
							Mojo.Log.info('length after: ' + this.tasksModel.length);
						} else {
							Mojo.Log.info('0 tasks');
							this.controller.get('lstTasks').mojo.setLength(0);
						}		
						
						this.appAssistant = Mojo.Controller.appController.assistant;
						this.rtmObj = this.appAssistant.rtmObj;
						this.rtmObj.tasks = this.tasksModel;
						this.appAssistant.rtmObj.tasks = this.tasksModel;
						
						this.controller.setWidgetModel('lstTasks', {items: this.rtmObj.tasks});
						Mojo.Log.info('done setting task model');
						
						// stop the spinner
						this.spinnerModel.spinning = false;
						this.controller.modelChanged(this.spinnerModel);
					}.bind(this),
					function(ev){
						// stop the spinner
						this.spinnerModel.spinning = false;
						this.controller.modelChanged(this.spinnerModel);
						
						Mojo.log("TASKS GETLIST FAILED %j", (ev.responseText));
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

TasksAssistant.prototype.processTaskSeries = function(listJSON){
	Mojo.Log.info("enter processTaskSeries()");
	
	Mojo.Log.info('listJSON:' + Object.toJSON(listJSON));
	
	var ts = listJSON.taskseries;

	Mojo.Log.info('length: ' + ts.length);

	if (ts.length) {		
		Mojo.Log.info('list of tasks');											
		for (var t = 0; t < ts.length; t++) 
			this.processTask(ts[t], listJSON.id);
	} else {
		Mojo.Log.info('single task');
		this.processTask(ts, listJSON.id);
	}	
	
	Mojo.Log.info("exit processTaskSeries()");
}

TasksAssistant.prototype.processTask = function(taskJSON, listId){
	Mojo.Log.info("enter processTask()");
	
	var dueStr = '';
	var dueDate, dueDateMS = 0;
	var due = taskJSON.task.due;
	Mojo.Log.info('due: ' + due);								
	if(due.length > 0) {
		var today = new Date();
		dueDate = getDateFromFormat(due.replace(/[-TZ]/gmi, ' '), 'yyyy MM dd HH:mm:ss ')
		
		dueDateMS = Date.UTC(										
			dueDate.getFullYear(),
			dueDate.getMonth(),
			dueDate.getDate(),
			dueDate.getHours(),
			dueDate.getMinutes(),
			dueDate.getSeconds()
		);
		
		dueDate = new Date(dueDateMS);
	
		if(today.getFullYear() == dueDate.getFullYear() &&
				today.getMonth() == dueDate.getMonth() &&
				today.getDate() == dueDate.getUTCDate()) {
			if (dueDate.getHours() == 0) {
				dueStr = 'Today'
			} else {
				var hr = dueDate.getHours() % 12;
				var min = dueDate.getMinutes();
				var amPm = dueDate.getHours() < 12 ? ' AM' : ' PM';
				if(min < 10)
					min = '0' + min;
				dueStr = hr + ':' + min + amPm;
			}
		} else {
			dueStr = MONTH_NAMES[dueDate.getMonth()].substring(0, 3) + ' ' + dueDate.getDate();
		}
	}

	if (taskJSON.task.completed == '') {
		this.tasksModel.push({
			listId: listId,
			list: this.rtmObj.listsMap[listId].name,
			taskSeriesId: taskJSON.id,
			name: taskJSON.name,
			locationId: taskJSON.location_id,
			taskId: taskJSON.task.id,
			priority: (taskJSON.task.priority == '' || taskJSON.task.priority == 'N') ? '4' : taskJSON.task.priority,
			completed: (taskJSON.task.completed.length > 0 ? true : false),
			due: dueStr,
			dueMS: dueDateMS == '' ? 0 : dueDateMS
		});
	}
	
	Mojo.Log.info("exit processTask()");
}

TasksAssistant.prototype.sortTasksModel = function(){
	Mojo.Log.info("enter sortTasksModel()");
	
	var tempValue;
	
	for(var i = 0; i < this.tasksModel.length; i++)
	{
		for(var j = i+1; j < this.tasksModel.length; j++)
		{
			// J gets moved higher if I > J
			if(this.tasksModel[i].dueMS > this.tasksModel[j].dueMS)
			{
				tempValue = this.tasksModel[j];
				this.tasksModel[j] = this.tasksModel[i];
				this.tasksModel[i] = tempValue;
			}
		}
	}
	
	var tasksModelSorted = [ ];
	for(var p = 0; p <= 4; p++)
	{
		for(var t = 0; t < this.tasksModel.length; t++)
		{
			if(this.tasksModel[t].priority == p)
			{
				tasksModelSorted.push(this.tasksModel[t]);
			}
		}
	}
	
	this.tasksModel = tasksModelSorted;
	
	Mojo.Log.info("exit sortTasksModel()");
}

TasksAssistant.prototype.createTimeline = function() {
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

TasksAssistant.prototype.complete = function(listId, taskSeriesId, taskId) {
	Mojo.Log.info('enter complete()');	
	
	if (!this.rtmObj.token) {
        Mojo.log('Token not found.  Pushing login scene.');
        return this.controller.stageController.pushScene('login');
    } else {		
		this.appAssistant.auth_checkToken(
            {},
            function (token, user, perms) {
                Mojo.log('about to call tasks_complete');
				
				this.appAssistant.tasks_complete(
					{
						list_id: listId,
						task_id: taskId,
						taskseries_id: taskSeriesId,
						timeline: this.rtmObj.timeline
					},
					function (list) {						
						this.appAssistant = Mojo.Controller.appController.assistant;
						this.rtmObj = this.appAssistant.rtmObj;
						this.rtmObj.timeline = timeline;
						this.appAssistant.rtmObj.timeline = timeline;
						
						Mojo.Log.info('done completing task');
					}.bind(this),
					function(ev){
						Mojo.log("TASKS COMPLETE FAILED %j", (ev.responseText));
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
						
	Mojo.Log.info('exit complete()');	
}

TasksAssistant.prototype.postpone = function(listId, taskSeriesId, taskId) {
	Mojo.Log.info('enter postpone()');	
	
	if (!this.rtmObj.token) {
        Mojo.log('Token not found.  Pushing login scene.');
        return this.controller.stageController.pushScene('login');
    } else {		
		this.appAssistant.auth_checkToken(
            {},
            function (token, user, perms) {
                Mojo.log('about to call tasks_postpone');
				
				this.appAssistant.tasks_postpone(
					{
						list_id: listId,
						task_id: taskId,
						taskseries_id: taskSeriesId,
						timeline: this.rtmObj.timeline
					},
					function (list) {						
						this.appAssistant = Mojo.Controller.appController.assistant;
						this.rtmObj = this.appAssistant.rtmObj;
						this.rtmObj.timeline = timeline;
						this.appAssistant.rtmObj.timeline = timeline;
						
						Mojo.Log.info('done postponing task');
					}.bind(this),
					function(ev){
						Mojo.log("TASKS POSTPONE FAILED %j", (ev.responseText));
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
						
	Mojo.Log.info('exit postpone()');	
}

TasksAssistant.prototype.showSearchFAQ = function(){
	Mojo.Log.info("enter showSearchFAQ()");

	this.controller.serviceRequest(
        "palm://com.palm.applicationManager", 
        {
            method: "open",
            parameters:  {
                id: 'com.palm.app.browser',
                params: { target: 'http://www.rememberthemilk.com/help/answers/search/advanced.rtm' }
            }
        }
    );

	Mojo.Log.info("exit showSearchFAQ()");
}

TasksAssistant.prototype.handleGo = function(event){
	Mojo.Log.info("enter handleGo()");
	
	this.update();
	
	Mojo.Log.info("exit handleGo()");
}

TasksAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	this.update();
	
	Mojo.Log.info("exit activate()");
}

TasksAssistant.prototype.deactivate = function(){
	Mojo.Log.info("enter deactivate()");
	

	
	Mojo.Log.info("exit deactivate()");
}

TasksAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info("enter cleanup()");	
	
	Mojo.Event.stopListening(this.controller.get('lstTasks'), Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('lstTasks'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('lstTasks'), Mojo.Event.listReorder, this.listReorderHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('lstTasks'), Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
	
	Mojo.Log.info("exit cleanup()");
}
