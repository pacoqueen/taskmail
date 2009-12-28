const Cc = Components.classes;  
const Ci = Components.interfaces;  
   
var tbirdsqlite = {
   
   getTaskListSQLite: function (mailId, folder, stateFilter, fillFunction) {
    var sql = ""; 
	var stat;
	var folderURI = folder.parent.baseMessageURI;
	var folderName = folder.name;
    try {
      // recherche par mail (donc non recurssive)
      if (mailId != null) {
        sql = "select tasks.rowid, title, state from tasks, links where tasks.folderURI = links.folderURI and tasks.folderName = links.folderName and tasks.rowid = links.taskId and ans links.folderURI = :folderURI and links.folderName = :folderName and links.mailId = :mailId";
        // quelque soit le type de recherche (email ou folder) on applique le filtre d'état
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
        stat.bindStringParameter(1, folderName);
        stat.bindStringParameter(2, mailId);
      // sinon recherche par folder
      } else {
        sql = "select tasks.rowid, title, state from tasks where folderURI = :folderURI and folderName = :folderName";
        // quelque soit le type de recherche (email ou folder) on applique le filtre d'état
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
        stat.bindStringParameter(1, folderName);
      }
      while (stat.executeStep()) {
         var id    = stat.getInt32(0);
         var title = stat.getString(1);
         var state = stat.getString(2);

          fillFunction (id, title, state, folderName);
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
    var folderURI = folder.parent.baseMessageURI;
	var folderName = folder.name;
    var stat = this.dbConnection.createStatement("insert into tasks (title, state, desc, folderURI, folderName) values (:titleInput, :stateInput, :desc, :folderURI, :folderName)");
    stat.bindStringParameter(0,titleInput);
    stat.bindStringParameter(1,stateInput);
    stat.bindStringParameter(2,desc);
    stat.bindStringParameter(3,folderURI);
    stat.bindStringParameter(4,folderName);
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
    var stat = this.dbConnection.createStatement("insert into links (folderURI, folderName, mailId, taskId) values (:folderURI, :folderName, :mailId, :taskId)");
	var folderURI = folder.parent.baseMessageURI;
	var folderName = folder.name;
    stat.bindStringParameter(0,folderURI);
    stat.bindStringParameter(1,folderName);
    stat.bindStringParameter(2,mailId);
    stat.bindInt32Parameter(3,taskId);
    stat.execute();
   },
   
   getLinkSQLite: function (folder) {
    //consoleService.logStringMessage("getLinkSQLite, folderName="+folderName);
    try {
      var sql = "select mailId, taskId from links, tasks where links.folderURI = tasks.folderURI and links.folderName = tasks.folderName and links.taskId = tasks.rowid and tasks.folderURI = :folderURI and tasks.folderName = :folderName";
      var stat = this.dbConnection.createStatement(sql);
	  var folderURI = folder.parent.baseMessageURI;
	  var folderName = folder.name;
      stat.bindStringParameter(0, folderURI);
      stat.bindStringParameter(1, folderName);
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
	// folder rename then subFolders rename
    var stat = null;
	try {
		this.dbConnection.beginTransaction();
		var origFolderName = aOrigFolder.name;
		// le origFolder n'a pas d'attribut parent
		var newFolderName  = aNewFolder.name;
		var newFolderURI   = aNewFolder.parent.baseMessageURI;
		var origSubFolderURI = newFolderURI + "/" + origFolderName;
		var newSubFolderURI  = newFolderURI + "/" + newFolderName;
		
		var sql = "update tasks set folderName = :newFolderName where folderURI = :newFolderURI and folderName = :origFolderName";
		stat2 = this.dbConnection.createStatement(sql);
		stat2.bindStringParameter(0, newFolderName);
		stat2.bindStringParameter(1, newFolderURI);
		stat2.bindStringParameter(2, origFolderName);
		stat2.execute();
		
		sql = "update links set folderName = :newFolderName where folderURI = :newFolderURI and folderName = :origFolderName";
		stat3 = this.dbConnection.createStatement(sql);
		stat3.bindStringParameter(0, newFolderName);
		stat3.bindStringParameter(1, newFolderURI);
		stat3.bindStringParameter(2, origFolderName);
		stat3.execute();

		sql = "update tasks set folderURI = replace(folderURI, :origSubFolderURI, :newSubFolderURI) where folderURI like :origSubFolderURI";
		stat4 = this.dbConnection.createStatement(sql);
		stat4.bindStringParameter(1, origSubFolderURI + "%");
		stat4.execute();
		
		sql = "update links set folderURI = replace(folderURI, :origSubFolderURI, :newSubFolderURI) where folderURI = :origSubFolderURI";
		stat5 = this.dbConnection.createStatement(sql);
		stat5.bindStringParameter(0, newSubFolderURI);
		stat5.bindStringParameter(1, origSubFolderURI + "%");
		stat5.execute();
	} catch (err) {
		this.dbConnection.rollbackTransaction();
		Components.utils.reportError("renameFolder" + err);
	} finally {
		this.dbConnection.commitTransaction();
	}
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
        tasks:"folderURI TEXT, folderName TEST, title TEXT NOT NULL, state TEXT, desc TEXT",
        links:"folderURI TEXT, folderName TEXT, mailId TEXT, taskId NUMBER"
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
    var folderURI = folder.parent.baseMessageURI;
	var folderName = folder.name;
    var stat = this.dbConnection.createStatement("update tasks set folderURI = :folderURI where folderName = :folderName");
    stat.bindStringParameter(0,folderURI);
    stat.bindStringParameter(1,folderName);
    stat.execute();
    var stat2 = this.dbConnection.createStatement("update links set folderURI = :folderURI where folderName = :folderName");
    stat2.bindStringParameter(0,folderURI);
    stat2.bindStringParameter(1,folderName);
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

