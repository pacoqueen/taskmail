if (!TASKMAIL)
	var TASKMAIL = {};
if (!TASKMAIL.UI)
	TASKMAIL.UI = {};
if (!TASKMAIL.UI.ACTIVITY)
	TASKMAIL.UI.ACTIVITY = {};

TASKMAIL.UI.ACTIVITY = {
	
	saveActivity : function() {
		TASKMAIL.consoleService.logStringMessage("saveActivity");
		var id     = document.getElementById("taskmail-activity-id").value;
		var taskId = document.getElementById("taskmail-activity-taskId").value;
		var date   = null;
		var desc   = document.getElementById("taskmail-activity-desc").value;

		TASKMAIL.DB.ACTIVITY.addActivititySQLite(new TASKMAIL.Activity(id, taskId, date, desc));
	},

	/**
	 * @return Content (only one, flat, no arbo).
	 */
	fillActivity : function() {
		alert(TASKMAIL.UI.getSelectedTasks);
		var selectedTask = TASKMAIL.UI.getSelectedTasks();
		var taskId = selectedTask[0].taskId;
		document.getElementById("taskmail-activity-taskId").value = taskId;
		var result = TASKMAIL.DB.ACTIVITY.getActivityListSQLite(taskId);
		if (result.length > 0) {
			document.getElementById("taskmail-activity-id").value   = result[result.length-1].id;
			document.getElementById("taskmail-activity-desc").value = result[result.length-1].desc;
		} else {
			document.getElementById("taskmail-activity-id").value   = "-1";
		}
	},
	
	onAcitivityOpen : function () {
		var activityWin = window.open('chrome://taskmail/content/taskmail-activity.xul','activity','chrome,toolbar,resizable');
	}
}