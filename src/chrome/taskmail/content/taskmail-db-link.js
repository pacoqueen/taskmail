/* Copyright (c) 2006 Gilles ORSINI
   See the file LICENSE.txt for licensing information. */

if (!TASKMAIL)
    var TASKMAIL = {};
if (!TASKMAIL.DB)
    TASKMAIL.DB = {};

TASKMAIL.DBLINK = {
    
    /**
     * remonte touts les liens de toutes les taches du folder fourni
     * (folder, subfolders, all folders).
     * @return no return, load links into TASKMAIL.LINK.links.
     */
    getLinkSQLite : function(msgFolder, taskFolder, viewFilter) {
        TASKMAIL.log("getLinkSQLite,msgFolderName="+msgFolder.URI+"taskFolderName="+taskFolder.URI);
        try {
            // remonte tous les liens avec les messages en cours (ceux du folder)
            // et remonte tous les liens avec les tâche visualisées.
            // les liens doivent être remonté dans l'ordre : d'abord ceux du folder
            // courant puis les autres par ordre de folder.
            var sql = "select links.folderURI, messageId, taskId, links.rowid, links.url from links where links.folderURI = :folder_URI ";
            sql += "union select links.folderURI, messageId, taskId, links.rowid, links.url from links where links.taskId in ( select rowid ";
            sql += TASKMAIL.DB.getTaskListWhereClause(null, viewFilter, null, null, taskFolder, null);
            sql += " ) order by links.rowid";
            var stat = TASKMAIL.DB.dbConnection.createStatement(sql);
            var msgFolderURI = msgFolder.URI;
            stat.bindStringParameter(0, msgFolderURI);
            TASKMAIL.DB.bindTaskListParameters(stat, 1, viewFilter, null, null, taskFolder, null);
            while (stat.executeStep()) {
                var messageFolderURI =  stat.getString(0);
                var messageId =  stat.getString(1);
                var taskId = stat.getInt32(2);
                var url    = stat.getString(4);
                try {
                    var folderDB = GetMsgFolderFromUri(messageFolderURI, false); 
                    var message = folderDB.msgDatabase.getMsgHdrForMessageID(messageId);
                    var messageKey = message.messageKey;
                    var threadKey = message.threadId;
                    TASKMAIL.log("messageId=" + messageId + "messageKey=" + messageKey);
                } catch (err) {
                    Components.utils.reportError("getLinkSQLite, problème récup messageId=" + messageId + 
                            ", links.folderURI=" + messageFolderURI + ", taskId="+stat.getInt32(2));   
//                                  var statPurge = TASKMAIL.DB.dbConnection.createStatement("delete from links where folderURI = :FOLDER_URI and messageId = :MESSAGE_ID and taskId = :TASK_ID"); 
//					statPurge.bindStringParameter(0, messageFolderURI);
//                                  statPurge.bindStringParameter(1, messageId);
//                                  statPurge.bindInt32Parameter(2, taskId);
//                                  statPurge.execute();
//                                  Components.utils.reportError("getLinkSQLite, Purge réalisée");   
                    continue;
                }
                TASKMAIL.log("getLinkSQLite:" + messageFolderURI + "," + messageId + "," + stat.getInt32(2)
                            + "," + taskId + "," + url);				
                TASKMAIL.Link.addLink(messageFolderURI, messageKey, threadKey, taskId, url);
            }
            TASKMAIL.log("getLinkSQLite,result count="+TASKMAIL.Link.nbLinks);
        } catch (err) {
            Components.utils.reportError("getLinkSQLite erreur=" + err);
        }
    },
    
    /**
    * @param msg nsIMsgDBHdr a message.
    */
    linkTaskSQLite : function(taskId, url, msg) {
        TASKMAIL.log("linkTaskSQLite");
        var messageId = msg.folder.GetMessageHeader(msg.messageKey).messageId;
        var stat = TASKMAIL.DB.dbConnection
                           .createStatement("insert into links (folderURI, messageId, taskId, url) values (:folderURI, :mailId, :taskId, :URL)");
        stat.bindStringParameter(0, msg.folder.URI);
        stat.bindStringParameter(1, messageId);
        stat.bindInt32Parameter(2, taskId);
        stat.bindStringParameter(3, url);
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
        TASKMAIL.log("unlinkTaskSQLite");
        var messageId = msg.folder.GetMessageHeader(msg.messageKey).messageId; 
        var stat = TASKMAIL.DB.dbConnection
                            .createStatement("delete from links where folderURI = :folderURI and messageId = :MAIL_ID and taskId = :TASK_ID");
        stat.bindStringParameter(0, msg.folder.URI);
        stat.bindStringParameter(1, messageId);
        stat.bindInt32Parameter(2, taskId);
        stat.execute();
    },

    /**
     * @param msg nsIMsgDBHdr a message.
     * @param url string an url
     */
    linkURLSQLite : function(msg, url) {
        TASKMAIL.log("linkURLSQLite");
        var messageId = msg.folder.GetMessageHeader(msg.messageKey).messageId;
        var stat = TASKMAIL.DB.dbConnection
                    .createStatement("insert into links (folderURI, messageId, url) values (:folderURI, :mailId, :url)");
        stat.bindStringParameter(0, msg.folder.URI);
        stat.bindStringParameter(1, messageId);
        stat.bindStringParameter(2, url);
        stat.execute();
    }
}