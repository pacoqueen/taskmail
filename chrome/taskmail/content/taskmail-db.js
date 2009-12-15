const Cc = Components.classes;  
const Ci = Components.interfaces;  
   
var tbirdsqlite = {
   
   getTaskListSQLite: function (mailId, folderName, stateFilter, fillFunction) {
    try {
      // recherche par mail (donc non recurssive)
      if (mailId != null) {
        sql = "select tasks.rowid, title, state from tasks, links where tasks.folderName = links.folder and tasks.rowid = links.taskId and links.mailId = :mailId";
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
        stat.bindStringParameter(0, mailId);
      // sinon recherche par folder
      } else {
        sql = "select tasks.rowid, title, state from tasks where folderName = :folderName";
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
        stat.bindStringParameter(0, folderName);
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
  
   addTaskSQLite: function (idInput, titleInput, stateInput, desc, folderName) {
    var stat = this.dbConnection.createStatement("insert into tasks (title, state, desc, folderName) values (:titleInput, :stateInput, :desc, :folderName)");
    stat.bindStringParameter(0,titleInput);
    stat.bindStringParameter(1,stateInput);
    stat.bindStringParameter(2,desc);
    stat.bindStringParameter(3,folderName);
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
   },
   
   linkTaskSQLite: function (taskId, folder, mailId) {        
    var stat = this.dbConnection.createStatement("insert into links (folder, mailId, taskId) values (:folder, :mailId, :taskId)");
    stat.bindStringParameter(0,folder);
    stat.bindStringParameter(1,mailId);
    stat.bindInt32Parameter(2,taskId);
    stat.execute();
   },
   
   hasTaskSQLite: function (folder, mailId) {
    var result = false;
    try {
      sql = "select 1 from links where links.folder = :folder and links.mailId = :mailId";
      stat = this.dbConnection.createStatement(sql);
      stat.bindStringParameter(0, folder);
      stat.bindStringParameter(1, mailId);
      if (stat.executeStep()) {
        result = true;
      }
    } catch (err) {
      alert(err);
    }
    return result;
   },

   getLinkSQLite: function (folderName) {
    //consoleService.logStringMessage("getLinkSQLite, folderName="+folderName);
    try {
      sql = "select mailId, taskId from links, tasks where links.folder = tasks.folderName and links.taskId = tasks.rowid and tasks.folderName = :folderName";
      stat = this.dbConnection.createStatement(sql);
      stat.bindStringParameter(0, folderName);
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

   onLoad: function() {  
     // initialization code  
     this.initialized = true;  
     this.dbInit();  
   },  
   
   dbConnection: null,  
   
   /* la pk de la table est le rowid interne de sqlite */
   dbSchema: {  
      tables: {  
        tasks:"title TEXT NOT NULL, state TEXT, desc TEXT, folderName TEST",
        links:"taskId NUMBER, mailId TEXT"
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
