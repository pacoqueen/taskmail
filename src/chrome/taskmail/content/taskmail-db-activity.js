if (!TASKMAIL)
	var TASKMAIL = {};
if (!TASKMAIL.DB)
	TASKMAIL.DB = {};
if (!TASKMAIL.DB.ACTIVITY)
	TASKMAIL.DB.ACTIVITY = {};

TASKMAIL.DB.ACTIVITY = {
	
	/**
	 * @param aTaskId 
	 * @return array[Activity]
	 */
	getActivityListSQLite : function(aTaskId) {
//		TASKMAIL.consoleService.logStringMessage("getActivityListSQLite");
		var result = new Array();
		try {
			var sql = "select rowid, taskId, date, desc from activities where taskId = :TASKID";
			var stat = TASKMAIL.DB.dbConnection.createStatement(sql);
			stat.bindStringParameter(0, aTaskId);
			while (stat.executeStep()) {
				var id     = stat.getInt32(0);
				var taskId = stat.getInt32(1);
				var date   = TASKMAIL.DB.convertSQLiteToDate(stat.getString(2));
				var desc   = stat.getString(3);
				var activity = new TASKMAIL.Activity(id, taskId, date, desc);
				result.push(activity);
			}
		} catch (err) {
			Components.utils.reportError("getActivityListSQLite " + err);
		}
		return result;
	},
	
	/**
	 * La date de création est celle de la base.
	 * @param Activity
	 */
	addActivititySQLite : function(anActivity) {
		TASKMAIL.consoleService.logStringMessage("addActivititySQLite");
		try {
			if (anActivity.id != -1) {
				var stat = TASKMAIL.DB.dbConnection
				.createStatement("update activities set desc = :DESC where rowid = :ID");
				stat.bindStringParameter(0, anActivity.desc);
				stat.bindInt32Parameter(1, anActivity.id);
				stat.execute();
			} else {
				var stat = TASKMAIL.DB.dbConnection
				.createStatement("insert into activities (taskId, date, desc) values (:TASKID, :DATE, :DESC)");
				stat.bindInt32Parameter(0, anActivity.taskId);
				stat.bindStringParameter(1, TASKMAIL.DB.convertDateToSQLite(anActivity.date));
				stat.bindStringParameter(2, anActivity.desc);
				stat.execute();
			}
		} catch (err) {
			Components.utils.reportError("addActivititySQLite " + err);
		}
	}
}
