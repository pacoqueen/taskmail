const Cc = Components.classes;  
const Ci = Components.interfaces;  
   
var tbirdsqlite = {
   
   getTaskListSQLite: function (mailId, folder, stateFilter, fillFunction) {
    var sql = ""; 
	var stat;
	var folderURI = folder.baseMessageURI;
    try {
      // recherche par mail (donc non recurssive)
      if (mailId != null) {
        sql = "select tasks.rowid, title, state from tasks, links where tasks.folderURI = links.folderURI and tasks.rowid = links.taskId and links.folderURI = :folderURI and links.mailId = :mailId";
        // quelque soit le type de recherche (email ou folder) on applique le
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
        sql = "select tasks.rowid, title, state from tasks where folderURI = :folderURI";
        // quelque soit le type de recherche (email ou folder) on applique le
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
      while (stat.executeStep()) {
         var id    = stat.getInt32(0);
         var title = stat.getString(1);
         var state = stat.getString(2);

          fillFunction (id, title, state);
      }
    } catch (err) {
      alert(err);
    }
   },

   getTaskDetailSQLite: function (pk, fillFunction) {
    try {
      var stat = this.dbConnection.createStatement("select rowid, title, state, desc from tasks where rowid = :pk");
      stat.bindInt32Parameter(0, pk);
      while (stat.executeStep()) {
        var id    = stat.getInt32(0);
        var title = stat.getString(1);
        var state = stat.getString(2);
        var desc  = stat.getString(3);
        fillFunction (id, title, state, desc);
      }
    } catch (err) {
      alert(err);
    }
   },
  
   addTaskSQLite: function (idInput, titleInput, stateInput, desc, folder) {
    var folderURI = folder.baseMessageURI;
    var stat = this.dbConnection.createStatement("insert into tasks (title, state, desc, folderURI) values (:titleInput, :stateInput, :desc, :folderURI)");
    stat.bindStringParameter(0,titleInput);
    stat.bindStringParameter(1,stateInput);
    stat.bindStringParameter(2,desc);
    stat.bindStringParameter(3,folderURI);
    stat.execute();
   },
  
   updateTaskSQLite: function (pk, title, state, desc) {
    var stat = this.dbConnection.createStatement("update tasks set title = :title, state = :state, desc = :desc where rowid = :pk");
    stat.bindStringParameter(0,title);
    stat.bindStringParameter(1,state);
    stat.bindStringParameter(2,desc);
    stat.bindInt32Parameter(3,pk);
    stat.execute();
   },
  
   removeTaskSQLite: function (pk) {        
    var stat = this.dbConnection.createStatement("delete from tasks where rowid = :pk");
    stat.bindInt32Parameter(0,pk);
    stat.execute();
    var stat2 = this.dbConnection.createStatement("delete from links where taskId = :pk");
    stat2.bindInt32Parameter(0,pk);
    stat2.execute();
   },
   
   linkTaskSQLite: function (taskId, folder, mailId) {        
    var stat = this.dbConnection.createStatement("insert into links (folderURI, mailId, taskId) values (:folderURI, :mailId, :taskId)");
	var folderURI = folder.baseMessageURI;
    stat.bindStringParameter(0,folderURI);
    stat.bindStringParameter(1,mailId);
    stat.bindInt32Parameter(2,taskId);
    stat.execute();
   },
   
   /**
    * détruit les lients
    * @param msgs un array de msg. doit être de même longeur que tasks
    * @param tasks un array de task. doit être de même longeur que tasks 
    * @return
    */
   unlinkSQLite: function (msgs, tasks) {
	   var stat = this.dbConnection.createStatement("delete links where folderURI = :URI and mailId = MAIL_ID and and taskId = :TASK_ID");
	   for ( var i = 0; i < msgs.length; i++) {
		   stat.bindStringParameter(0, msgs[i].folder.baseMessageURI);
		   stat.bindStringParameter(1, msgs[i].messageURI);
		   stat.bindInt32Parameter (2, tasks[i]);
		   stat.execute();
	   }
   },
   
   getLinkSQLite: function (folder) {
    // consoleService.logStringMessage("getLinkSQLite, folderName="+folderName);
    try {
      var sql = "select mailId, taskId from links, tasks where links.folderURI = tasks.folderURI and links.taskId = tasks.rowid and tasks.folderURI = :folderURI";
      var stat = this.dbConnection.createStatement(sql);
	  var folderURI = folder.baseMessageURI;
      stat.bindStringParameter(0, folderURI);
      var i = 0;
       while (stat.executeStep()) {
         mailKeysLinks[i] = stat.getInt32(0);
         taskIdLinks[i] = stat.getInt32(1);
         i++;
       }
       nbLinks = i;
    } catch (err) {
      Components.utils.reportError("getLinkSQLite " + err);
    }
   },

   renameFolderSQLite: function (aOrigFolder, aNewFolder) {
	// rename folder then rename subFolders
	try {
		this.dbConnection.beginTransaction();
		var origFolderName = aOrigFolder.name;
		// le origFolder n'a pas d'attribut parent
		var newFolderName  = aNewFolder.name;
		var newFolderURI   = aNewFolder.baseMessageURI;
		
		var origSubFolderURI = aOrigFolder.baseMessageURI;
		var newSubFolderURI  = aNewFolder.baseMessageURI;

		sql = "update tasks set folderURI = replace(folderURI, :old, :new) where folderURI like :like";
		stat4 = this.dbConnection.createStatement(sql);
		stat4.bindStringParameter(0, origSubFolderURI);
		stat4.bindStringParameter(1, newSubFolderURI);
		stat4.bindStringParameter(2, origSubFolderURI + "%");
		stat4.execute();
		
		sql = "update links set folderURI = replace(folderURI, :old, :new) where folderURI like :like";
		stat5 = this.dbConnection.createStatement(sql);
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
   deleteFolderSQLite: function (aFolder) {
	try {
		this.dbConnection.beginTransaction();
		
		var folderURI = aFolder.baseMessageURI;
		consoleService.logStringMessage("deleteFolderSQLite"+folderURI);

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
	moveFolderSQLite: function (aSrcFolder, aDestFolder) {
		try {
			var oldParentURI = aSrcFolder.parent != null ? aSrcFolder.parent.baseMessageURI : aSrcFolder.baseMessageURI;
			var newParentURI = aDestFolder.baseMessageURI;
			
			this.dbConnection.beginTransaction();
			
			var sql = "update tasks set folderURI = replace(folderURI, :OLD_URI,:NEW_URI) where folderURI like :OLD_LIKE_URI";
			var stat = this.dbConnection.createStatement(sql);
			stat.bindStringParameter(0, oldParentURI);
			stat.bindStringParameter(1, newParentURI);
			stat.bindStringParameter(2, aSrcFolder.baseMessageURI + "%");
			stat.execute();
			
			sql = "update links set folderURI = replace(folderURI, :OLD_URI, :NEW_URI) where folderURI like :OLD_LIKE_URI";
			var stat2 = this.dbConnection.createStatement(sql);
			stat2.bindStringParameter(0, oldParentURI);
			stat2.bindStringParameter(1, newParentURI);
			stat2.bindStringParameter(2, aSrcFolder.baseMessageURI + "%");
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
	msgsDeletedSQLite: function(aMsgs) {
		try {
			var TASK_SQL = "delete from tasks where rowid in (select taskId from links where folderURI = :URI and mailId = :ID)";
			var LINK_SQL = "delete from links where folderURI = :URI and mailId = :ID";
			var msgEnum = aMsgs.enumerate();
			while (msgEnum.hasMoreElements()) {
				var msg = msgEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
				var msgKey = msg.messageKey;
				var folderURI = msg.folder.baseMessageURI;
				consoleService.logStringMessage("msgsDeletedSQLite"+folderURI+","+msgKey);
				var stat = this.dbConnection.createStatement(TASK_SQL);
				stat.bindStringParameter(0, folderURI);
				stat.bindStringParameter(1, msgKey);
				stat.execute();
				
				var stat2 = this.dbConnection.createStatement(LINK_SQL);
				stat2.bindStringParameter(0, folderURI);
				stat2.bindStringParameter(1, msgKey);
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
	 * @param aSrcMsgs
	 *            An array of the message headers in the source folder
	 * @param aDestFolder
	 *            The folder these messages were moved to.
	 * @param aDestMsgs
	 *            Present only for local folder moves, it provides the list of
	 *            target message headers.
	 */
	msgsMoveCopyCompletedSQLite: function(aSrcMsgs, aDestFolder, aDestMsgs){
		try {
			var TASK_SQL = "update tasks set folderURI = :NEW_URI where rowid in (select taskId from links where folderURI = :OLD_URI and mailId = :OLD_ID)";
			var LINK_SQL = "update links set folderURI = :NEW_URI, mailId = :NEW_MSG_KEY where folderURI = :OLD_URI and mailId = :OLD_MSG_KEY";
			
			var srcEnum = aSrcMsgs.enumerate();
			var destEnum = aDestMsgs.enumerate();
			
			while (srcEnum.hasMoreElements()) {
				var srcMsg = srcEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
				var destMsg = destEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);

				consoleService.logStringMessage("msgsMoveCopyCompletedSQLite"+destMsg.folder.baseMessageURI+","+
				                                srcMsg.folder.baseMessageURI+","+srcMsg.messageKey);
				
				var stat = this.dbConnection.createStatement(TASK_SQL);
				stat.bindStringParameter(0, destMsg.folder.baseMessageURI);
				stat.bindStringParameter(1, srcMsg.folder.baseMessageURI);
				stat.bindStringParameter(2, srcMsg.messageKey);
				stat.execute();
				
				var stat2 = this.dbConnection.createStatement(LINK_SQL);
				stat2.bindStringParameter(0, destMsg.folder.baseMessageURI);
				stat2.bindStringParameter(1, destMsg.messageKey);
				stat2.bindStringParameter(2, srcMsg.folder.baseMessageURI);
				stat2.bindStringParameter(3, srcMsg.messageKey);
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
	taskMoveSQLite: function(aTaskID, aDestFolder) {
		var SQL = "update tasks set folderURI = :NEW_URI where rowid = :TASK_ID";
		var stat = this.dbConnection.createStatement(SQL);
		stat.bindStringParameter(0, aDestFolder.baseMessageURI);
		stat.bindStringParameter(1, aTaskID);
		stat.execute();
		consoleService.logStringMessage("taskMoveSQLite " + aTaskID + " dans " + aDestFolder.baseMessageURI);
	},
   
   onLoad: function() {  
     // initialization code
     this.initialized = true;  
     this.dbInit();  
   },  
   
   dbConnection: null,  
   
   /* la pk de la table est le rowid interne de sqlite */
   dbSchema: {  
      tables: {  
        tasks:"folderURI TEXT, title TEXT NOT NULL, state TEXT, desc TEXT",
        links:"folderURI TEXT, mailId TEXT, taskId NUMBER"
     }  
   },  
   
   dbInit: function() {  
     var dirService = Cc["@mozilla.org/file/directory_service;1"].  
       getService(Ci.nsIProperties);  
   
     var dbFile = dirService.get("ProfD", Ci.nsIFile);  
     dbFile.append("tasks.sqlite");  
   
     var dbService = Cc["@mozilla.org/storage/service;1"].  
       getService(Ci.mozIStorageService);  
   
     var dbConnection;  
   
     if (!dbFile.exists())  
       dbConnection = this._dbCreate(dbService, dbFile);  
     else {  
       dbConnection = dbService.openDatabase(dbFile);  
     }  
     this.dbConnection = dbConnection;  
   },
   
   reprise: function (folder) {
    var stat = this.dbConnection.createStatement("update tasks set folderURI = :folderURI where folderURI = :URI and folderName = :folderName");
    stat.bindStringParameter(0,folder.baseMessageURI);
    stat.bindStringParameter(1,folder.parent.baseMessageURI);
	stat.bindStringParameter(2,folder.name);
    stat.execute();
    var stat2 = this.dbConnection.createStatement("update links set folderURI = :folderURI where folderURI = :URI and folderName = :folderName");
    stat.bindStringParameter(0,folder.baseMessageURI);
    stat.bindStringParameter(1,folder.parent.baseMessageURI);
	stat.bindStringParameter(2,folder.name);
    stat2.execute();
   },

   _dbCreate: function(aDBService, aDBFile) {  
     var dbConnection = aDBService.openDatabase(aDBFile);  
     this._dbCreateTables(dbConnection);  
     return dbConnection;  
  },  
   
  _dbCreateTables: function(aDBConnection) {  
    for(var name in this.dbSchema.tables)  
       aDBConnection.createTable(name, this.dbSchema.tables[name]);  
  }
};
window.addEventListener("load", function(e) { tbirdsqlite.onLoad(e); }, false); 

