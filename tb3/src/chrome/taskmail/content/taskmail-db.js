if (!TASKMAIL)
	var TASKMAIL = {};
if (!TASKMAIL.DB)
	TASKMAIL.DB = {};

TASKMAIL = {
	
	done_state : 4,
	
	Task : function(aId, aFolderURI, aFolderName, aTitle, aDesc, aState, aPriority,
	                aCreateDate, aDueDate, aCompleteDate) {
		this.id             = aId;
		this.folderURI      = aFolderURI;
		this.folderName     = aFolderName;
		this.title          = aTitle;
		this.desc           = aDesc;
		this.state          = aState;						// State (code de l'état) ; 4 = TASKMAIL.done_state = done.
		this.priority       = aPriority;
		this.createDate     = aCreateDate;			// Les dates sont des Date Javascript, null possible.
		this.dueDate        = aDueDate;
		this.completeDate   = aCompleteDate;
	}
}

TASKMAIL.DB = {

	consoleService : Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService),

	getTaskListSQLite : function(mailId, folder, stateFilter) {
//		this.consoleService.logStringMessage("getTaskListSQLite");
		var sql = "";
		var stat;
		var folderURI = folder.URI;
		var result = new Array();
		try {
			// recherche par mail (donc non recurssive)
			if (mailId != null) {
				sql = "select tasks.rowid, title, state, desc, priority, createDate, dueDate, completeDate from tasks, links where tasks.folderURI = links.folderURI and tasks.rowid = links.taskId and links.folderURI = :folderURI and links.messageId = :mailId ";
				// quelque soit le type de recherche (email ou folder) on
				// applique le filtre d'état
				if (stateFilter != "") {
					var stateExp = "";
					for (var i = 0; i < stateFilter.length; i++) {
						if (i > 0) {
							stateExp += ",";
						}
						stateExp += stateFilter.charAt(i);
					}
					sql += " and state in (" + stateExp + ")";
				}
				stat = this.dbConnection.createStatement(sql);
				stat.bindStringParameter(0, folderURI);
				stat.bindStringParameter(1, mailId);
				// sinon recherche par folder
			} else {
				sql = "select tasks.rowid, title, state, desc, priority, createDate, dueDate, completeDate from tasks where folderURI = :folderURI ";
				// quelque soit le type de recherche (email ou folder) on
				// applique le filtre d'état
				if (stateFilter != "") {
					var stateExp = "";
					for (var i = 0; i < stateFilter.length; i++) {
						if (i > 0) {
							stateExp += ",";
						}
						stateExp += stateFilter.charAt(i);
					}
					sql += " and state in (" + stateExp + ")";
				}
				stat = this.dbConnection.createStatement(sql);
				stat.bindStringParameter(0, folderURI);
			}
			while (stat.executeStep()) {
				var id = stat.getInt32(0);
				var title = stat.getString(1);
				var state = stat.getString(2);
				var desc  = stat.getString(3);
				var prio  = stat.getInt32(4);
				var createDate     = this.convertSQLiteToDate(stat.getString(5));
				var dueDate        = this.convertSQLiteToDate(stat.getString(6));
				var completeDate   = this.convertSQLiteToDate(stat.getString(7));
				
				var task = new TASKMAIL.Task(id, folderURI, folder.prettyName, title, desc, state, prio,
				                             createDate, dueDate, completeDate);
				result.push(task);
			}
		} catch (err) {
			Components.utils.reportError("getTaskListSQLite " + err);
		}
		return result;
	},
	
	getInvisibleTaskCountSQLite : function(mailId, folder, stateFilterVisible) {
//		this.consoleService.logStringMessage("getInvisibleTaskCountSQLite");
		var sql = "";
		var stat;
		var folderURI = folder.URI;
		var result = 0;
		if (stateFilterVisible == "") {
			return result;
		}
		var stateFilter = this.inverseStateFilter(stateFilterVisible);
		try {
			// recherche par mail (donc non recurssive)
			if (mailId != null) {
				sql = "select count(*) from tasks, links where tasks.folderURI = links.folderURI and tasks.rowid = links.taskId and links.folderURI = :folderURI and links.messageId = :mailId";
				// quelque soit le type de recherche (email ou folder) on
				// applique le
				// filtre d'état
				if (stateFilter != "") {
					var stateExp = "";
					for (var i = 0; i < stateFilter.length; i++) {
						if (i > 0) {
							stateExp += ",";
						}
						stateExp += stateFilter.charAt(i);
					}
					sql += " and state in (" + stateExp + ")";
				}
				stat = this.dbConnection.createStatement(sql);
				stat.bindStringParameter(0, folderURI);
				stat.bindStringParameter(1, mailId);
				// sinon recherche par folder
			} else {
				sql = "select count(*) from tasks where folderURI = :folderURI";
				// quelque soit le type de recherche (email ou folder) on
				// applique le
				// filtre d'état
				if (stateFilter != "") {
					var stateExp = "";
					for (var i = 0; i < stateFilter.length; i++) {
						if (i > 0) {
							stateExp += ",";
						}
						stateExp += stateFilter.charAt(i);
					}
					sql += " and state in (" + stateExp + ")";
				}
				stat = this.dbConnection.createStatement(sql);
				stat.bindStringParameter(0, folderURI);
			}
			stat.executeStep();
			result = stat.getInt32(0);
		} catch (err) {
			Components.utils.reportError("getTaskListSQLite " + err);
		}
		return result;
	},
	
	inverseStateFilter : function (stateFilter) {
		if (stateFilter == "") stateFilter = "01234";
		var result = "";
		for(var i=0; i<5; i++) {
			if (stateFilter.indexOf(i) < 0) {
				result += i;
			}
		}
		return result;
	},

	getTaskDetailSQLite : function(pk) {
		this.consoleService.logStringMessage("getTaskDetailSQLite");
		var result = null;
		try {
			var stat = this.dbConnection
					.createStatement("select rowid, title, state, desc, priority, createDate, dueDate, completeDate from tasks where rowid = :pk");
			stat.bindInt32Parameter(0, pk);
			while (stat.executeStep()) {
				var id = stat.getInt32(0);
				var title = stat.getString(1);
				var state = stat.getString(2);
				var desc = stat.getString(3);
				var prio = stat.getInt32(4);
				var createDate     = this.convertSQLiteToDate(stat.getString(5));
				var dueDate        = this.convertSQLiteToDate(stat.getString(6));
				var completeDate   = this.convertSQLiteToDate(stat.getString(7));
				result = new TASKMAIL.Task(id, null, null, title, desc, state, prio, 
				                           createDate, dueDate, completeDate);
			}
		} catch (err) {
			Components.utils.reportError("getTaskDetailSQLite " + err);
		}
		return result;
	},

	/**
	 * La date de création est celle de la base.
	 */
	addTaskSQLite : function(aTask) {
		this.consoleService.logStringMessage("addTaskSQLite");
		var folderURI = aTask.folderURI;
		var stat = this.dbConnection
				.createStatement("insert into tasks (title, state, desc, folderURI, priority, createDate, dueDate, completeDate) values (:titleInput, :stateInput, :desc, :folderURI, :priority, current_date, :dueDate, :completeDate)");
		stat.bindStringParameter(0, aTask.title);
		stat.bindStringParameter(1, aTask.state);
		stat.bindStringParameter(2, aTask.desc);
		stat.bindStringParameter(3, aTask.folderURI);
		stat.bindInt32Parameter (4, aTask.priority);
		if (aTask.dueDate != null) stat.bindStringParameter(5, this.convertDateToSQLite(aTask.dueDate));
		if (aTask.completeDate != null) stat.bindStringParameter(6, this.convertDateToSQLite(aTask.completeDate));
		stat.execute();
	},

	/**
	 * La date de création n'est pas modifiée.
	 */
	updateTaskSQLite : function(aTask) {
		this.consoleService.logStringMessage("updateTaskSQLite");
		var stat = this.dbConnection
				.createStatement("update tasks set title = :title, state = :state, desc = :desc, priority = :priority, dueDate = :due_d, completeDate = :complete_d where rowid = :pk");
		var dueDate = this.convertDateToSQLite(aTask.dueDate);
		var completeDate = this.convertDateToSQLite(aTask.completeDate);				
		stat.bindStringParameter(0, aTask.title);
		stat.bindStringParameter(1, aTask.state);
		stat.bindStringParameter(2, aTask.desc);
		stat.bindInt32Parameter (3, aTask.priority);
		if (dueDate != null) stat.bindStringParameter(4, dueDate);
		if (completeDate != null) stat.bindStringParameter(5, completeDate);
		stat.bindInt32Parameter (6, aTask.id);
		stat.execute();
	},

	updateTaskProritySQLite : function(taskIdArray, priority) {
		this.consoleService.logStringMessage("updateTaskProritySQLite");
		try {
			var stat = this.dbConnection
				.createStatement("update tasks set priority = :p where rowid = :pk");
			this.dbConnection.beginTransaction();
			for(var i=0; i<taskIdArray.length; i++) {
				stat.bindInt32Parameter(0, priority);
				stat.bindInt32Parameter(1, taskIdArray[i].id);
				stat.execute();
			}
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("updateTaskProritySQLite" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},
	
	incrementTaskProritySQLite : function(taskIdArray) {
		this.consoleService.logStringMessage("incrementTaskProritySQLite");
		try {
			var stat = this.dbConnection
				.createStatement("update tasks set priority = priority  + 1 where rowid = :pk and priority < 9");
			this.dbConnection.beginTransaction();
			for(var i=0; i<taskIdArray.length; i++) {
				stat.bindInt32Parameter(0, taskIdArray[i].id);
				stat.execute();
			}
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("incrementTaskProritySQLite" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},
	
	decrementTaskProritySQLite : function(taskArray) {
		this.consoleService.logStringMessage("decrementTaskProritySQLite");
		try {
			var stat = this.dbConnection
				.createStatement("update tasks set priority = priority  - 1 where rowid = :pk and priority > 0");
			this.dbConnection.beginTransaction();
			for(var i=0; i<taskArray.length; i++) {
				stat.bindInt32Parameter(0, taskArray[i].id);
				stat.execute();
			}
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("decrementTaskProritySQLite" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	/**
	 * Change state and complete date if change to 'done'.
	 * @param taskIdArray Array[int] tasks id to update
	 * @param state int state code
	 */
	updateStateTaskSQLite : function (taskIdArray, state) {
		this.consoleService.logStringMessage("updateStateTaskSQLite");
		try {
			this.dbConnection.beginTransaction();
			var statState = this.dbConnection
				.createStatement("update tasks set state = :state where rowid = :pk");
			var statDate = this.dbConnection
				.createStatement("update tasks set completeDate = current_date where rowid = :pk");
			for(var i=0; i<taskIdArray.length; i++) {
				statState.bindStringParameter(0, state);
				statState.bindInt32Parameter(1, taskIdArray[i]);
				statState.execute();
				if (state == TASKMAIL.done_state) {
					statDate.bindInt32Parameter(0, taskIdArray[i]);
					statDate.execute();
				}
			}
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("updateStateTaskSQLite" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	removeTaskAndLinkSQLite : function(taskId) {
		this.consoleService.logStringMessage("removeTaskAndLinkSQLite");
		var stat = this.dbConnection
				.createStatement("delete from tasks where rowid = :taskId");
		stat.bindInt32Parameter(0, taskId);
		stat.execute();
		var stat2 = this.dbConnection
				.createStatement("delete from links where taskId = :taskId");
		stat2.bindInt32Parameter(0, taskId);
		stat2.execute();
	},

	/**
	 * @param msg
	 *            a message.
	 */
	linkTaskSQLite : function(taskId, msg) {
		this.consoleService.logStringMessage("linkTaskSQLite");
   	var messageId = msg.folder.GetMessageHeader(msg.messageKey).messageId;
   	var stat = TASKMAIL.DB.dbConnection
				.createStatement("insert into links (folderURI, messageId, taskId) values (:folderURI, :mailId, :taskId)");
		stat.bindStringParameter(0, msg.folder.URI);
		stat.bindStringParameter(1, messageId);
		stat.bindInt32Parameter(2, taskId);
		stat.execute();
	},

	/**
	 * detruit les lients
	 * 
	 * @param msg
	 *            a message.
	 * @param taskId
	 *            a TaskId.
	 * @return
	 */
	unlinkTaskSQLite : function(msg, taskId) {
//   	this.consoleService.logStringMessage("unlinkTaskSQLite");
   	var messageId = msg.folder.GetMessageHeader(msg.messageKey).messageId; 
   	var stat = this.dbConnection
				.createStatement("delete from links where folderURI = :folderURI and messageId = :MAIL_ID and taskId = :TASK_ID");
		stat.bindStringParameter(0, msg.folder.URI);
		stat.bindStringParameter(1, messageId);
		stat.bindInt32Parameter(2, taskId);
		stat.execute();
	},

	/**
	 * remonte touts les liens de toutes les taches du folder fourni.
	 */
	getLinkSQLite : function(folder) {
//		this.consoleService.logStringMessage("getLinkSQLite,folderName="+folder.URI);
		try {
			var sql = "select links.folderURI, messageId, taskId from links, tasks where links.taskId = tasks.rowid and tasks.folderURI = :folderURI";
			var stat = this.dbConnection.createStatement(sql);
			var folderURI = folder.URI;
			stat.bindStringParameter(0, folderURI);
			while (stat.executeStep()) {
  			var messageId =  stat.getString(1);
  			var message = folder.msgDatabase.getMsgHdrForMessageID(messageId);
  			var messageKey = message.messageKey;
  			var threadKey = message.threadId;
				//consoleService.logStringMessage("messageId=" + messageId + "messageKey=" + messageKey);
				TASKMAIL.Link.addLink(folderURI,
				                      messageKey,
				                      threadKey,
				                      stat.getInt32(2));
			}
		} catch (err) {
			Components.utils.reportError("getLinkSQLite " + err);
		}
	},

	renameFolderSQLite : function(aOrigFolder, aNewFolder) {
//		this.consoleService.logStringMessage("renameFolderSQLite");
		// rename folder then rename subFolders
		try {
			this.dbConnection.beginTransaction();
			var origFolderName = aOrigFolder.name;
			// le origFolder n'a pas d'attribut parent
			var newFolderName = aNewFolder.name;
			var newFolderURI = aNewFolder.URI;

			var origSubFolderURI = aOrigFolder.URI;
			var newSubFolderURI = aNewFolder.URI;

			var sql = "update tasks set folderURI = replace(folderURI, :old, :new) where folderURI like :like";
			var stat4 = this.dbConnection.createStatement(sql);
			stat4.bindStringParameter(0, origSubFolderURI);
			stat4.bindStringParameter(1, newSubFolderURI);
			stat4.bindStringParameter(2, origSubFolderURI + "%");
			stat4.execute();

			sql = "update links set folderURI = replace(folderURI, :old, :new) where folderURI like :like";
			var stat5 = this.dbConnection.createStatement(sql);
			stat5.bindStringParameter(0, origSubFolderURI);
			stat5.bindStringParameter(1, newSubFolderURI);
			stat5.bindStringParameter(2, origSubFolderURI + "%");
			stat5.execute();
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("renameFolder" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	/**
	 * Efface un folder cad les taches et liens associés. n'efface pas les sous
	 * folder car l'event folderDeleted est appelé plusieurs fois
	 */
	deleteFolderSQLite : function(aFolder) {
		this.consoleService.logStringMessage("deleteFolderSQLite");
		try {
			this.dbConnection.beginTransaction();

			var folderURI = aFolder.URI;
			this.consoleService.logStringMessage("deleteFolderSQLite"
					+ folderURI);

			var sql = "delete from tasks where folderURI = :URI";
			var stat2 = this.dbConnection.createStatement(sql);
			stat2.bindStringParameter(0, folderURI);
			stat2.execute();

			sql = "delete from links where folderURI = :URI";
			var stat3 = this.dbConnection.createStatement(sql);
			stat3.bindStringParameter(0, folderURI);
			stat3.execute();

		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("renameFolder" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	/**
	 * pas d'event pour les sous-folders
	 */
	moveFolderSQLite : function(aSrcFolder, aDestFolder) {
		this.consoleService.logStringMessage("moveFolderSQLite");
		try {
			var oldParentURI = aSrcFolder.parent != null
					? aSrcFolder.parent.URI
					: aSrcFolder.URI;
			var newParentURI = aDestFolder.URI;

			this.dbConnection.beginTransaction();

			var sql = "update tasks set folderURI = replace(folderURI, :OLD_URI,:NEW_URI) where folderURI like :OLD_LIKE_URI";
			var stat = this.dbConnection.createStatement(sql);
			stat.bindStringParameter(0, oldParentURI);
			stat.bindStringParameter(1, newParentURI);
			stat.bindStringParameter(2, aSrcFolder.URI + "%");
			stat.execute();

			sql = "update links set folderURI = replace(folderURI, :OLD_URI, :NEW_URI) where folderURI like :OLD_LIKE_URI";
			var stat2 = this.dbConnection.createStatement(sql);
			stat2.bindStringParameter(0, oldParentURI);
			stat2.bindStringParameter(1, newParentURI);
			stat2.bindStringParameter(2, aSrcFolder.URI + "%");
			stat2.execute();
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("moveFolderSQLite" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	/**
	 * @param aMsgs
	 *            An array of the message headers about to be deleted
	 */
	msgsDeletedSQLite : function(aMsgs) {
		this.consoleService.logStringMessage("msgsDeletedSQLite");
		try {
			this.dbConnection.beginTransaction();
			var TASK_SQL = "delete from tasks where rowid in (select taskId from links where folderURI = :URI and messageId = :ID)";
			var LINK_SQL = "delete from links where folderURI = :URI and messageId = :ID";
			var msgEnum = aMsgs.enumerate();
			while (msgEnum.hasMoreElements()) {
				var msg = msgEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
				var msgKey = msg.messageKey;
				var folderURI = msg.folder.URI;
				var messageId = msg.folder.GetMessageHeader(msg.messageKey).messageId;
				this.consoleService.logStringMessage("msgsDeletedSQLite" + folderURI + "," + msgKey + "," + messageId);
				var stat = this.dbConnection.createStatement(TASK_SQL);
				stat.bindStringParameter(0, folderURI);
				stat.bindStringParameter(1, messageId);
				stat.execute();

				var stat2 = this.dbConnection.createStatement(LINK_SQL);
				stat2.bindStringParameter(0, folderURI);
				stat2.bindStringParameter(1, messageId);
				stat2.execute();
			}
		} catch (err) {
			this.dbConnection.rollbackTransaction();
			Components.utils.reportError("msgsDeletedSQLite" + err);
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	/**
	 * DÃ©placement des mails et des taches liÃ©es.
	 * @param aSrcMsgs
	 *            An array of the message headers in the source folder
	 * @param aDestFolder
	 *            The folder these messages were moved to.
	 * @param aDestMsgs
	 *            Present only for local folder moves, it provides the list of
	 *            target message headers.
	 */
	msgsMoveCopyCompletedSQLite : function(aSrcMsgs, aDestFolder, aDestMsgs) {
		this.consoleService.logStringMessage("msgsMoveCopyCompletedSQLite");
		try {
			var TASK_SQL = "update tasks set folderURI = :NEW_URI where rowid in (select taskId from links where folderURI = :OLD_URI and messageId = :OLD_MSG_KEY)";
			var LINK_SQL = "update links set folderURI = :NEW_URI where folderURI = :OLD_URI and messageId = :OLD_MSG_KEY";

			var srcEnum = aSrcMsgs.enumerate();
			var destEnum = aDestMsgs.enumerate();

			while (srcEnum.hasMoreElements()) {
				var srcMsg = srcEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
				var destMsg = destEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
				var messageId = destMsg.folder.GetMessageHeader(destMsg.messageKey).messageId;
				
				this.consoleService.logStringMessage("msgsMoveCopyCompletedSQLite"
								+ destMsg.folder.URI + "," + srcMsg.folder.URI + "," + srcMsg.messageKey
								+ "," + messageId);

				
				var stat = this.dbConnection.createStatement(TASK_SQL);
				stat.bindStringParameter(0, destMsg.folder.URI);
				stat.bindStringParameter(1, srcMsg.folder.URI);
				stat.bindStringParameter(2, messageId);
				stat.execute();

				var stat2 = this.dbConnection.createStatement(LINK_SQL);
				stat2.bindStringParameter(0, destMsg.folder.URI);
				stat2.bindStringParameter(1, srcMsg.folder.URI);
				stat2.bindStringParameter(2, messageId);
				stat2.execute();
			}
		} catch (err) {
			// this.dbConnection.rollbackTransaction();
			Components.utils.reportError("msgsDeletedSQLite" + err);
		} finally {
			// this.dbConnection.commitTransaction();
		}
	},

	/**
	 * @param aSrcFolder
	 *            A source folder from to move the task
	 * @param aTask
	 *            A task to move
	 * @param aDestFolder
	 *            A destination folder
	 * 
	 * @todo Pas encore de gestion du déplacement de tache avec des liens. Gérer
	 *       plusieurs taches
	 */
	taskMoveSQLite : function(aTaskID, aDestFolder) {
		this.consoleService.logStringMessage("taskMoveSQLite");
		var SQL = "update tasks set folderURI = :NEW_URI where rowid = :TASK_ID";
		var stat = this.dbConnection.createStatement(SQL);
		stat.bindStringParameter(0, aDestFolder.URI);
		stat.bindStringParameter(1, aTaskID);
		stat.execute();
		// this.consoleService.logStringMessage("taskMoveSQLite " + aTaskID
		// + " dans "
		// + aDestFolder.URI);
	},

	onLoad : function() {
		// initialization code
		this.initialized = true;
		this.dbInit();
		this.dbUpgrade();
	},

	dbConnection : null,

	/**
	 * La pk de la table est le rowid interne de sqlite
	 * createDate, dueDate, completeDate sont au format YYYY-MM-DD
	 */
	dbSchema : {
		tables : {
			tasks : "folderURI TEXT, title TEXT NOT NULL, state TEXT, desc TEXT, priority INTEGER, createDate TEXT, dueDate TEXT, completeDate TEXT",
			links : "folderURI TEXT, messageId TEXT, taskId NUMBER",
			model_version : "version NUMERIC"
		}
	},

	dbInit : function() {

		var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties);

		// ne pas mettre la base dans le répertoire de l'extension sinon elle serait perdue
		// durant un upgrade.
		var dbFile = dirService.get("ProfD", Components.interfaces.nsIFile);
		dbFile.append("tasks.sqlite");

		var dbService = Components.classes["@mozilla.org/storage/service;1"]
				.getService(Components.interfaces.mozIStorageService);

		var dbConnection;

		if (!dbFile.exists()) {
			dbConnection = this._dbCreate(dbService, dbFile);
			this._dbInitTables(dbConnection);
		} else {
			dbConnection = dbService.openDatabase(dbFile);
		}
		this.dbConnection = dbConnection;
	},

	targetVersion : 7,
	
	dbUpgrade : function() {
		try {
			this.dbConnection.beginTransaction();
			var currentVersion = 0;
			
			var stat = this.dbConnection
					.createStatement("select version from model_version");
			try {
				stat.executeStep();
				currentVersion = stat.getInt32(0);
			} catch (err) {
				stat = this.dbConnection
						.createStatement("CREATE TABLE model_version (version NUMERIC)");
				stat.execute();
				stat = this.dbConnection
						.createStatement("insert into model_version values (:version)");
				stat.bindInt32Parameter(0, 3);
				stat.execute();
				currentVersion = 3;
			}
			if (currentVersion < this.targetVersion) {
				var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties);
				var dbFile = dirService.get("ProfD", Components.interfaces.nsIFile);
				dbFile.append("tasks.sqlite");
				alert("Upgrade of db model needed. A backup will be made of " + dbFile.path);
				// Sauvegarde de la base.
				dbFile.copyTo(null, "tasks.sqlite" + ".backup." + currentVersion);
			}
			if (currentVersion < 4) {
				this.dbUpgrade4();
			}
			if (currentVersion < 5) {
				this.dbUpgrade5();
			} 
			if (currentVersion < 6) {
				this.dbUpgrade6();
			} 
			if (currentVersion < 7) {
				this.dbUpgrade7();
			} 
			if (currentVersion < this.targetVersion) {
				stat = this.dbConnection
						.createStatement("update model_version set version = :version");
				stat.bindInt32Parameter(0, this.targetVersion);
				stat.execute();
				alert("Upgrade successful.");
			}
		} catch (err) {
			Components.utils.reportError("dbUpgrade " + err);
			alert("Upgrade problem. Consult Error console for details.");
			this.dbConnection.rollbackTransaction();
		} finally {
			this.dbConnection.commitTransaction();
		}
	},

	dbUpgrade4 : function() {
		var stat = this.dbConnection
				.createStatement("update tasks set folderURI = replace(folderURI,'mailbox-message:','mailbox:')");
		stat.execute();
		stat = this.dbConnection
				.createStatement("update links set folderURI = replace(folderURI,'mailbox-message:','mailbox:')");
		stat.execute();
	},
	
	dbUpgrade5 : function() {
		var stat = this.dbConnection
				.createStatement("alter table tasks add column priority INTEGER DEFAULT (5)");
		stat.execute();
	},
	
	dbUpgrade6 : function() {
		this.consoleService.logStringMessage("update messageKey into messageId");
		var statAlter = this.dbConnection
				.createStatement("alter table links add column messageId TEXT");
		statAlter.execute();
		var acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]
                        .getService(Components.interfaces.nsIMsgAccountManager);
		var accounts = acctMgr.accounts;
		for (var i = 0; i < accounts.Count(); i++) {
		  var account = accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount);
		  var rootFolder = account.incomingServer.rootFolder; // nsIMsgFolder
		  this.dbUpgrade6Folder(rootFolder);
		}
	},
	
	dbUpgrade6Folder : function(folder) {
		this.consoleService.logStringMessage(folder.prettiestName);
	  var stat = this.dbConnection
			.createStatement("select mailId from links where folderURI = :FOLDER_URI");
		stat.params.FOLDER_URI = folder.URI;
	  while (stat.executeStep()) {
	  	var messageKey =  stat.getInt64(0);
	  	try {
	  		var messageHdr = folder.GetMessageHeader(messageKey);
	  		var messageId = messageHdr.messageId;
//		  	this.consoleService.logStringMessage("key="+messageKey+"Id trouv�=" + messageId);
		  	var statUpdate = this.dbConnection
				.createStatement("update links set messageId = :id where folderURI = :folderURI and mailId = :key");
				statUpdate.params.id = messageId;
				statUpdate.params.folderURI = folder.URI;
				statUpdate.params.key = messageKey;
				statUpdate.execute();
	  	} catch (err) {
	  		this.consoleService.logStringMessage("messageKey introuvable, key=" + messageKey);
	  		var statDelete = this.dbConnection
				.createStatement("delete from links where folderURI = :FOLDER_URI and mailId = :MAIL_ID");
				statDelete.params.FOLDER_URI = folder.URI;
				statDelete.params.MAIL_ID = messageKey;
				statDelete.execute();
	  	}
	  }
		if (folder.hasSubFolders) {
			var subFolders = folder.subFolders; // nsIMsgFolder
		    while(subFolders.hasMoreElements()) {
		      var subfolder = subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
		      this.dbUpgrade6Folder(subfolder);
		    }
			}
	},

	/**
	 * rajout dates avec initilisation
	 */
	dbUpgrade7 : function() {
		this.dbConnection.executeSimpleSQL("alter table tasks add column createDate TEXT");
		this.dbConnection.executeSimpleSQL("alter table tasks add column dueDate TEXT");
		this.dbConnection.executeSimpleSQL("alter table tasks add column completeDate TEXT");
		this.dbConnection.executeSimpleSQL("update tasks set createDate = current_date");
		this.dbConnection.executeSimpleSQL("update tasks set completeDate = current_date where state = '" + TASKMAIL.done_state + "'");
	},
	
	_dbCreate : function(aDBService, aDBFile) {
		var dbConnection = aDBService.openDatabase(aDBFile);
		this._dbCreateTables(dbConnection);
		return dbConnection;
	},

	_dbCreateTables : function(aDBConnection) {
		for (var name in this.dbSchema.tables)
			aDBConnection.createTable(name, this.dbSchema.tables[name]);
	},

	_dbInitTables : function(connexion) {
		var stat = connexion
				.createStatement("insert into model_version values (:version)");
		stat.bindInt32Parameter(0, this.targetVersion);
		stat.execute();
		this.consoleService
				.logStringMessage("Database initialisation successful.");
	},

	/**
	 * convert SQLite string date (YYYY-MM-DD) to javascript Date.
	 * if null returns null.  
	 */
	convertSQLiteToDate : function(aStringDate) {
		if (aStringDate != null) {
			var year  = parseInt(aStringDate.substring(0,4));
			var month = parseInt(aStringDate.substring(5,7), 10) - 1;
			var day   = parseInt(aStringDate.substring(8), 10);
			var result = new Date(year, month, day);
			return result;
		} else {
			return null;
		}
	},
	
	/**
	 * convert javascript Date to SQLite string date (YYYY-MM-DD)
	 */
	convertDateToSQLite : function(aDate) {
	  if (aDate != null) {
	  	var year = aDate.getFullYear();
	  	var month = aDate.getMonth() + 1;  // since js month is 0-11
	  	if ( month < 10 )
		    month = "0" + month;
		  var date = aDate.getDate();
		  if ( date < 10 )
	    	date = "0" + date;
	  	var result = year + "-" + month + "-" + date; 
			return result;
	  } else { 
	  	return null;
		}
	}
};

window.addEventListener("load", function(e) {
			TASKMAIL.DB.onLoad(e);
		}, false);
