var setupModule = function(module) {
  module.controller = mozmill.getMail3PaneController();
	jumlib = {};
	Components.utils.import("resource://mozmill/modules/jum.js", jumlib);
	
	oldDBConnection = controller.window.TASKMAIL.DB.dbConnection;
	
	var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
			.getService(Components.interfaces.nsIProperties);

	var dbFile = dirService.get("ProfD", Components.interfaces.nsIFile);
	dbFile.append("tasks_tests.sqlite");

	var dbService = Components.classes["@mozilla.org/storage/service;1"]
			.getService(Components.interfaces.mozIStorageService);
	QA_dbConnection = dbService.openDatabase(dbFile);
	
	controller.window.TASKMAIL.DB.dbConnection = QA_dbConnection;
}

var setupTest = function() {
	var stat = QA_dbConnection.createStatement("delete from tasks");
	stat.execute();
	var stat = QA_dbConnection.createStatement("delete from links");
	stat.execute();
	
	var stat = QA_dbConnection.createStatement("insert into tasks (title, state, desc, folderURI, priority, createDate, dueDate, completeDate) values (\"titre1\",\"0\",\"desc1\",\"mailbox://nobody@Local%20Folders/folder4\",5,null,null,null)");
	stat.execute();
	stat = QA_dbConnection.createStatement("insert into tasks (title, state, desc, folderURI, priority, createDate, dueDate, completeDate) values (\"titre2\",\"0\",\"desc2\",\"mailbox://nobody@Local%20Folders/folder4/subfolder\",5,null,null,null)");
	stat.execute();
	stat = QA_dbConnection.createStatement("insert into tasks (title, state, desc, folderURI, priority, createDate, dueDate, completeDate) values (\"titre3\",\"0\",\"desc3\",\"mailbox://nobody@Local%20Folders/folder4bis\",5,null,null,null)");
	stat.execute();
	stat = QA_dbConnection.createStatement("insert into links (folderURI, messageId, taskId) values (\"mailbox://nobody@Local%20Folders/folder4\",\"messageid1\",1)");
	stat.execute();
	stat = QA_dbConnection.createStatement("insert into links (folderURI, messageId, taskId) values (\"mailbox://nobody@Local%20Folders/folder4/subfolder\",\"messageid2\",1)");
	stat.execute();
	stat = QA_dbConnection.createStatement("insert into links (folderURI, messageId, taskId) values (\"mailbox://nobody@Local%20Folders/folder4bis\",\"messageid3\",1)");
	stat.execute();
}

var test_getTaskListSQLite1 = function() {
	/* vérifie que l'on ne remonte pas les tâche de folder4ter */ 
	var folderURI = "mailbox://nobody@Local%20Folders/folder4";
	var folder = controller.window.GetMsgFolderFromUri(folderURI, false);
  var tasks = controller.window.TASKMAIL.DB.getTaskListSQLite(null, null, 
  	folder, "012345", 0, null);
  jumlib.assert(tasks.length == 1, "pas le bon nombre de tâche trouvée");
}

var test_getTaskListSQLite2 = function() {
	/* vérifie que l'on ne remonte pas les tâche de folder4ter mais qu'on remonte bien 
	 * les tâches des sous-folder. */
	var folderURI = "mailbox://nobody@Local%20Folders/folder4";
	var folder = controller.window.GetMsgFolderFromUri(folderURI, false);
  var tasks = controller.window.TASKMAIL.DB.getTaskListSQLite(null, null, 
  	folder, "012345", 1, null);
  jumlib.assert(tasks.length == 2, "pas le bon nombre de tâche trouvée");
}

var test_renameFolderSQLite = function(){
	var folderURIOrig = "mailbox://nobody@Local%20Folders/folder4";
	var folderURIDest = "mailbox://nobody@Local%20Folders/folder4RENAMED";
	var folderOrig = controller.window.GetMsgFolderFromUri(folderURIOrig, false);
	var folderDest = controller.window.GetMsgFolderFromUri(folderURIDest, false);
  controller.window.TASKMAIL.DB.renameFolderSQLite(folderOrig, folderDest);
  /* vérifie que l'on n'a pas renommé folder4bis par erreur */
 	assertCount("select count(*) as count from tasks where folderURI = \"mailbox://nobody@Local%20Folders/folder4bis\"",1,"pas le bon nombre de tâche trouvée")
 	assertCount("select count(*) as count from tasks where folderURI like \"mailbox://nobody@Local%20Folders/folder4RENAMED%\"",
 		2, "pas le bon nombre de tâche trouvée");
 	assertCount("select count(*) as count from links where folderURI = \"mailbox://nobody@Local%20Folders/folder4bis\"",
 		1,"pas le bon nombre de tâche trouvée")
 	assertCount("select count(*) as count from links where folderURI like \"mailbox://nobody@Local%20Folders/folder4RENAMED%\"",
 		2, "pas le bon nombre de tâche trouvée");
}

var test_moveFolderSQLite = function(){
	/* vérifie que l'on n'a pas renommé folder4bis par erreur */
	var folderURIOrig = "mailbox://nobody@Local%20Folders/folder4";
	var folderURIDest = "mailbox://nobody@Local%20Folders/folder4ter";
	var folderOrig = controller.window.GetMsgFolderFromUri(folderURIOrig, false);
	var folderDest = controller.window.GetMsgFolderFromUri(folderURIDest, false);
  controller.window.TASKMAIL.DB.moveFolderSQLite(folderOrig, folderDest);
  
 	/* plus aucune tâche sous l'ancien nom */
 	assertCount("select count(*) as count from tasks where folderURI = \"mailbox://nobody@Local%20Folders/folder4\"",
	 	0,"pas le bon nombre de tâche trouvée")
 	/* plus aucune tâche dans un sousfolder sous l'ancien nom */
 	assertCount("select count(*) as count from tasks where folderURI = \"mailbox://nobody@Local%20Folders/folder4/subfolder\"",
	 	0,"pas le bon nombre de tâche trouvée")
 	/* on a bien plusieurs tâche renommées */
 	assertCount("select count(*) as count from tasks where folderURI like \"mailbox://nobody@Local%20Folders/folder4ter%\"",
 		2, "pas le bon nombre de tâche trouvée");
 	/* plus aucun lien sous l'ancien nom */
 	assertCount("select count(*) as count from links where folderURI = \"mailbox://nobody@Local%20Folders/folder4\"",
	 	0,"pas le bon nombre de tâche trouvée")
 	/* plus aucun lien sous l'ancien nom y compris dans un sousfolder */
 	assertCount("select count(*) as count from links where folderURI = \"mailbox://nobody@Local%20Folders/folder4/subfolder\"",
	 	0,"pas le bon nombre de tâche trouvée")
 	/* on a bien plusieurs liens renommées */
 	assertCount("select count(*) as count from links where folderURI like \"mailbox://nobody@Local%20Folders/folder4ter%\"",
 		2, "pas le bon nombre de tâche trouvée");
}

var teardownModule = function(module) {
  controller.window.TASKMAIL.DB.dbConnection = oldDBConnection;
}

var assertCount = function(aSelect, aCount, aMessage) {
var stat = QA_dbConnection.createStatement(aSelect);
 	while (stat.executeStep()) {
		var count = stat.row.count;
  	jumlib.assert(count == aCount, aMessage);
 	}
 	stat.reset();	
}
