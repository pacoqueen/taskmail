if (!TASKMAIL.Report)
	TASKMAIL.Report = {};
TASKMAIL.Report = {

  /**
   * Génére un rapport HTML de toutes les tâches visibles.
   * Utilise les préférences.
   */
	composeReport : function () {
		var msgComposeType = Components.interfaces.nsIMsgCompType;
		var msgComposFormat = Components.interfaces.nsIMsgCompFormat;
		var msgComposeService = Components.classes['@mozilla.org/messengercompose;1'].getService();
		msgComposeService = msgComposeService.QueryInterface(Components.interfaces.nsIMsgComposeService);
	
		gAccountManager = Components.classes['@mozilla.org/messenger/account-manager;1'].
		getService(Components.interfaces.nsIMsgAccountManager);
	
		var params = Components.classes['@mozilla.org/messengercompose/composeparams;1'].
									createInstance(Components.interfaces.nsIMsgComposeParams);
		if (params) {
			params.type = msgComposeType.Template;
			params.format = Components.interfaces.nsIMsgCompFormat.HTML;
			var composeFields = Components.classes['@mozilla.org/messengercompose/composefields;1'].
			                    createInstance(Components.interfaces.nsIMsgCompFields);
			if (composeFields) {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("taskmail.report.");
				prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
				var to = prefs.getCharPref("to");
				var cc = prefs.getCharPref("cc");
				var subject = prefs.getCharPref("subject");
				var templateBody = prefs.getCharPref("body");
				
				var currentOrder = document.getElementById("taskmail-taskPriorityCol").getAttribute("sortDirection");
				var temp = TASKMAIL.UI.retrieveTasks(currentOrder == "natural");
				temp = TASKMAIL.UI.sortTaskList(temp);
		  	
				var body = this._getReportBody(temp, templateBody);
				
				composeFields.to = to;
				composeFields.cc = cc;
				composeFields.subject = subject;
				composeFields.body = body;
				params.composeFields = composeFields;
				msgComposeService.OpenComposeWindowWithParams(null, params);
			}
		}
	},

	/**
	 * génére la partie du rapport correspondant à une tache.
	 * génere la partie du template qui est entre #TASK# en y substituant les informations.
	 */
	_getReportTask : function (task, templateTask) {
	  var result = templateTask.replace("#TASK_TITLE#",task.title);
	  var stateLabel = TASKMAIL.UI.getStateLabel(task.state);
	  result = result.replace("#TASK_STATE#",stateLabel);
	  result = result.replace("#TASK_DESC#",task.desc);
	  result = result.replace("#TASK_PRIO#",task.priority);
		result = result.replace("#TASK_CREATION_DATE#",   task.createDate   == null ? "" : TASKMAIL.UI.formatDate(task.createDate));
		result = result.replace("#TASK_DUE_DATE#",        task.dueDate      == null ? "" : TASKMAIL.UI.formatDate(task.dueDate));
		result = result.replace("#TASK_COMPLETION_DATE#", task.completeDate == null ? "" : TASKMAIL.UI.formatDate(task.completeDate));
		return result;
	},
	
	/**
	 * génère la partie du rapport correspondant à un folder.
	 * remplace ce qui est entre #TASK# par la liste des taches.
	 * remplace ce qui est entre #SUBTASK# par le contenu recursif des sous folders.
	 */
	_getReportFolder : function (content, templateFolder) {
		
		if (content.tasks.length == 0 && content.subContents.length == 0) {
			return "";
		}
		
	  var templateTask = templateFolder.substring(templateFolder.indexOf("#TASK#") + 6,
	                                            templateFolder.lastIndexOf("#TASK#"));
	  // génère le texte de la liste des taches
	  var reportTasks = "";
	  for(var i = 0; i < content.tasks.length; i++) {
	    reportTasks += this._getReportTask(content.tasks[i], templateTask);
	  }
	  
	  // génère la liste des sous folders
	  var reportSubFolders = "";
	  for (var j = 0; j < content.subContents.length; j++ ) {
	    reportSubFolders += this._getReportFolder(content.subContents[j], templateFolder);
	  }
	  
	  // remplace dans le template la liste des taches
	  var result = templateFolder.substring(0, templateFolder.indexOf("#TASK#"));
	  result += reportTasks;
	  result += templateFolder.substring(templateFolder.lastIndexOf("#TASK#") + 6);
	    
	  result = result.replace("#SUB_FOLDERS#",reportSubFolders);
	  
	  result = result.replace("#FOLDER_NAME#",content.folderName);
	  
	  return result;
	},

	/*
	 * Génère le corps du rapport.
	 * Prend tout ce qui est autour des #.
	 */
	_getReportBody : function (temp, templateBody) {
	  var result = templateBody.substring(0, templateBody.indexOf("#FOLDER#"));
	  result += this._getReportFolder(temp, templateBody.substring(templateBody.indexOf("#FOLDER#") + 8,
	                                                               templateBody.lastIndexOf("#FOLDER#")));
	  result += templateBody.substring(templateBody.lastIndexOf("#FOLDER#") + 8);
		return result;
	}	
}

