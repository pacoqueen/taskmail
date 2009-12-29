var addOrUpdate = "";

var stateLabels = [ "info", "� faire", "� suivre", "attente", "fait" ] ;

////////////////////////////////////////////////////////////////////////////////
// gestion des liens
//

function linkTask() {
  // TODO g�rer la s�lection de plusieurs emails
  // TODO g�rer pas de tache s�lectionn�
  var tree = document.getElementById("threadTree");
  //tree.db.getIndicesForSelection(count, indices);
 //var mailIndices = GetSelectedIndices(gDBView);
  //consoleService.logStringMessage(mailIndices);
  var mailKey = gDBView.keyForFirstSelectedMessage;
  //var mailKey = gDBView.getKeyAt(mailIndices[0]);
  var listBox = document.getElementById("taskList");
  var taskId = listBox.selectedItem.getAttribute("pk");
  var folder = GetSelectedMsgFolders()[0];
  tbirdsqlite.linkTaskSQLite(taskId, folder, mailKey);
  //consoleService.logStringMessage(link done tache="+taskId+",mail="+mailId);
}

function showLinkedTask() {
	try {
		// r�cup�re la key du 1� email selectionn�
		var mailKey = gDBView.keyForFirstSelectedMessage;
		// recup�re les ID de taches li�es au mail
		var TaskIDs = getTaskIDFromMailID(mailKey);
		// recup�re les index des taches associ�es
		var taskIndex = getTaskIndexFromTaskID(TaskIDs);
		// identifie l'index de la tache suivante
		if (taskIndex.length > 0) {
			var founded = false;
			for (var i = 0; i < taskIndex.length; i++) {
				if (document.getElementById("taskList").selectedIndex == taskIndex[i]) {
					founded = true;
					break;
				}
			}
			if (founded) {
				if (i == taskIndex.length - 1) {
					i = -1;
				}
			} else {
				i = -1;
			}
			document.getElementById("taskList").selectedIndex = taskIndex[i+1];
		}
	} catch (err) {}
}

function showLinkedMail() {
	var taskID    = document.getElementById("taskList").selectedItem.getAttribute("pk");
	// recup�re les keys de mail li�s � la tache
	var keysMails = getMailKeysFromTaskID(taskID);
	if (keysMails.length > 0) {
		// si la tache selectionn�e a au moins un mail li�
		var i = -1;
		try {
			var selectedMailKey = gDBView.keyForFirstSelectedMessage;
			var founded = false;
			// identifie le mail suivant
			for (var i = 0; i < keysMails.length; i++) {
				// on prend le 1� mail s�lectionn�
				if (selectedMailKey == keysMails[i]) {
					founded = true;
					break;
				}
			}
			if (founded) {
				if (i == keysMails.length - 1) {
					i = -1;
				}
			} else {
				i = -1;
			}
		} catch (err) {}
		gDBView.selectMsgByKey(keysMails[i+1]);
	}
}

var mailKeysLinks = new Array();
var taskIdLinks   = new Array();
var nbLinks = -1;

// use to populate custom column
function hasMail(taskID)
{ 
  //consoleService.logStringMessage("hasMail, taskID=" + taskID + ", nbLinks=" + nbLinks);
  var result = false;
  for (var i = 0; i < nbLinks; i++) {
    if (taskIdLinks[i] == taskID) {
      result = true;
      break;
    }
  }
  return result;  
}

function hasTask(messageKey)
{ 
  //consoleService.logStringMessage("hasTask, mailID=" + messageID + ", nbLinks=" + nbLinks);
  var result = false;
  for (var i = 0; i < nbLinks; i++) {
    if (mailKeysLinks[i] == messageKey) {
      result = true;
      break;
    }
  }
  return result;  
}

function getTaskIDFromMailID(mailKey) {
  var result = new Array();
  var j = 0;
  for (var i = 0; i < nbLinks; i++) {
    if (mailKeysLinks[i] == mailKey) {
      result[j++] = taskIdLinks[i];
    }
  }
  //consoleService.logStringMessage(result);
  return result;
}

function getMailKeysFromTaskID(taskID) {
  var result = new Array();
  var nbResult = 0;
  for (var i = 0; i < taskIdLinks.length; i++) {
   if (taskIdLinks[i] == taskID) {
    result[nbResult] = mailKeysLinks[i];
    nbResult += 1;
   }
  }
  //consoleService.logStringMessage(result);
  return result;
}

// recup�re les index des taches dont les pk sont fournies
// taskID : tableau de taskID
// result : tableau d'index
function getTaskIndexFromTaskID (taskID) {
  var result = new Array();
  var nbResult = 0;
  var listBox = document.getElementById("taskList");
  for (var j = 0; j < taskID.length; j++) {
    var i = 0;
    while (i < listBox.getRowCount()) {
      var row = listBox.getItemAtIndex(i);
       if (row.getAttribute("pk") == taskID[j]) {
        result[nbResult] = i;
        nbResult += 1;
       }
       i++;
    }
  }
  //consoleService.logStringMessage(result);
  return result;
}

function getMailIndexFromMailKey (mailKeys) {
  var result = new Array();
  var nbResult = 0;
  for (var j = 0; j < mailKeys.length; j++) {
    var i = 0;
    while (i < gDBView.rowCount) {
      if (gDBView.getKeyAt(i) == mailKeys[j]) {
        result[nbResult] = i;
        nbResult += 1;
      }
      i++;
    }
  }
  //consoleService.logStringMessage(result);
  return result;
}

function getTaskTextLink (taskID, selectedMailKey) {
  // taskID � -1 si pas de tache s�lectionn�e
  var direct = false;
  var undirect = false;
  for (var j = 0; j < taskIdLinks.length; j++) {
    if (taskID == taskIdLinks[j]) {
      if (selectedMailKey == mailKeysLinks[j]) {
        direct = true;
      } else {
        undirect = true;
      }
    }
  }
  var text = direct ? "<*>" : undirect ? "< >" : "";
  return text;
}

function getMailTextLink (taskID, selectedMailKey) {
  // taskID � -1 si pas de tache s�lectionn�e
  var direct = false;
  var undirect = false;
  for (var j = 0; j < mailKeysLinks.length; j++) {
    if (selectedMailKey == mailKeysLinks[j]) {
      if (taskID == taskIdLinks[j]) {
        direct = true;
      } else {
        undirect = true;
      }
    }
  }
  var text = direct ? "<*>" : undirect ? "< >" : "";
  return text;
}

function refreshTaskLink() {
	var selectedMailKey = null;
	try {
		selectedMailKey = gDBView.keyForFirstSelectedMessage;
	} catch (err) {}
	// parcours tout les taches et regarde s'il existe une tache li�e
	var listBox = document.getElementById("taskList");
	for (var i = 0; i < listBox.getRowCount(); i++) {
		var row = listBox.getItemAtIndex(i);
		var text = getTaskTextLink(row.getAttribute("pk"), selectedMailKey);
		row.lastChild.setAttribute("label",text);
	}
}

function refreshMailLink() {
  // TODO iteration sur les mails
  var selectedTask = document.getElementById("taskList").selectedItem;
  if (selectedTask != null) {
    var taskID    = selectedTask.getAttribute("pk");
    var tree = document.getElementById("threadTree");
    // parcours tout les taches et regarde s'il existe une tache li�e
    var column = tree.columns.getNamedColumn("colTask");
    tree.treeBoxObject.invalidateColumn(column);
  }
}

////////////////////////////////////////////////////////////////////////////////
// gestion de la liste
//

function getTaskList () {
  var currentMsgFolder = GetSelectedMsgFolders()[0];
  var viewFilter = document.getElementById("viewFilter").selectedItem.value
  if (viewFilter == 2) {
    // recherche par mail
	try {
		var selectedMailKey = gDBView.keyForFirstSelectedMessage;
		//consoleService.logStringMessage(selectedMailKey);
		var stateFilter = document.getElementById("stateFilter").selectedItem.value;
		tbirdsqlite.getTaskListSQLite(selectedMailKey, currentMsgFolder, stateFilter, fillTaskList);
	} catch (err) {}
  } else {
    var recur = viewFilter == 1;
    // �vite erreur sur "dossier locaux"
    if (currentMsgFolder != null) {
      // il faut charger les liens avant les taches
      tbirdsqlite.getLinkSQLite(currentMsgFolder);
      getTaskListRec(currentMsgFolder, recur);
    }
  }
  // refresh link
  refreshTaskLink();
  refreshMailLink();
}

function getTaskListRec (folder, recur) {
  var folderName = folder.name;
  var stateFilter = document.getElementById("stateFilter").selectedItem.value;
  tbirdsqlite.getTaskListSQLite(null, folder, stateFilter, fillTaskList);

  // r�cup�re les sous folders si possible et si demand�
  if (folder.hasSubFolders && recur) {
	var subFolders = folder.subFolders;
	try {
		while (subFolders.hasMoreElements()) {
			var subFolder = subFolders.getNext();
				getTaskListRec(subFolder, recur);
		}
	} catch (e) {}
  }
}

function emptyList() {
  var listBox = document.getElementById("taskList");
  while (listBox.getRowCount() > 0) {
     listBox.removeItemAt(0);
  }
}

function refreshList () {
  //consoleService.logStringMessage("refreshList");
  // le refresh du folder est lanc� avant l'handler de la colonne des emails.
  emptyList();
  getTaskList();
}

function stateFilterChange () {
  refreshList();  
}

function viewFilterChange () {
  var viewFilter = document.getElementById("viewFilter").selectedItem.value;
  if (viewFilter == 2) {
    // recherche par mail
    // il faut supprimer le refreshTaskLink et le remettre pour qui soit en 2�
    document.getElementById("threadTree").removeEventListener("select", refreshTaskLink, false);
    document.getElementById("threadTree").addEventListener("select", refreshList, false);
    document.getElementById("threadTree").addEventListener("select", refreshTaskLink, false);
  } else {
    document.getElementById("threadTree").removeEventListener("select", refreshList, false);
  }
  refreshList();
}

////////////////////////////////////////////////////////////////////////////////
// gestion des mises � jour
//

function beginAddTask(event) {
  // clean UI
  fillTaskDetail("","",1,"");     
	var box = document.getElementById("addTask");
	box.collapsed = false;
	addOrUpdate = "add";
}

function beginUpdateTask(event) {
  // get task detail
  var listBox = document.getElementById("taskList");
  var pk = listBox.selectedItem.getAttribute("pk");
  tbirdsqlite.getTaskDetailSQLite(pk, fillTaskDetail);  
	// show details
  var box = document.getElementById("addTask");
	box.collapsed = false;
	addOrUpdate = "update";
}

function saveTask() {  
	var idInput    = document.getElementById("addTask").value;
  var titleInput = document.getElementById("taskTitle").value;
  var stateInput = document.getElementById("taskState").selectedItem.value;
  var desc       = document.getElementById("taskDesc").value;
  var currentMsgFolder = GetSelectedMsgFolders()[0];
  
  if (addOrUpdate == "add") {
    tbirdsqlite.addTaskSQLite(idInput, titleInput, stateInput, desc, currentMsgFolder);
  } else {
    tbirdsqlite.updateTaskSQLite(idInput, titleInput, stateInput, desc);
  }
  refreshList();
  cancelSaveTask();  
}

function cancelSaveTask() {
	var box = document.getElementById("addTask");
	box.collapsed = true;
}

function removeTask() {
  var listBox = document.getElementById("taskList");
  var pk = listBox.selectedItem.getAttribute("pk");  
  tbirdsqlite.removeTaskSQLite(pk);
  refreshList();
  refreshMailLink();
}

function fillTaskDetail(id, title, state, desc) {
  document.getElementById("addTask").value = id;         
  document.getElementById("taskTitle").value = title;
  document.getElementById("taskDesc").value = desc;
  var stateList = document.getElementById("taskState");
  var ligne = stateList.firstChild;
  for (var i = 0; i < ligne.childNodes.length; i++){
    if (ligne.childNodes[i].value == state) {
      stateList.selectedIndex = state;
      break;
    }
  }
}

function fillTaskList(id, title, state, folderName) {
  var row = _makeRowList(id, title, state, folderName);
  document.getElementById("taskList").appendChild( row );
}

function _makeRowList(pk, titleInput, stateInput, folderName) {
  var row = document.createElement('listitem');
  row.setAttribute('pk', pk );
  if (folderName != "") {
    row.setAttribute('tooltiptext', folderName);
  }
  // Create and attach 1st cell
  var cell = document.createElement('listcell');
  cell.setAttribute('label', stateLabels[stateInput] );
  //cell.setAttribute('value', value );
  row.appendChild( cell );
  // Create and attach 2nd cell
  cell = document.createElement('listcell');
  cell.setAttribute('label', titleInput );
  //cell.setAttribute('value', value2 );
  row.appendChild( cell );

  // le text du lien sera sett� plus tard
  var linkText = "";
	
  cell = document.createElement('listcell');
  cell.setAttribute('label', linkText);
  row.appendChild( cell );
  return row;
}

function init() {
  document.getElementById("folderTree").addEventListener("select", refreshList, false);
  document.getElementById("threadTree").addEventListener("select", refreshTaskLink, false);
  document.getElementById("taskList").addEventListener("select", refreshMailLink, false);
  
  var newMailListener = {  
      itemAdded: function(item) {     
      alert("Got mail.  Look at item's properties for more details.");  
      var hdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);  
      },
      folderRenamed: function (aOrigFolder, aNewFolder) {
		tbirdsqlite.renameFolderSQLite(aOrigFolder, aNewFolder);
      },
      itemEvent: function (aItem, aEvent, aData){
        alert('goi was here');
      },
      itemDeleted: function (aItem) {
        alert('delete');
      },
      itemMoveCopyCompleted: function (aMove, 
                               aSrcItems, 
                               aDestFolder) {
        alert('movecopy');
      },
	  folderDeleted: function (aFolder) {
		// sur un vidage de corbeille, on recoit 2 folderDeleted , le 
		consoleService.logStringMessage(aFolder.name);
	  }
	}
	
 var notificationService =  
     Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]  
     .getService(Components.interfaces.nsIMsgFolderNotificationService);  
     //notificationService.addListener(newMailListener, notificationService.folderRenamed | notificationService.folderDeleted);	 
}

// besoin de passer par le load de la fen�tre sinon �a plante thunderbird (peut-�tre UI pas pr�te)
window.addEventListener("load", init, false);


// Pour logguer
var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);

///////////////////////////////////////////////////////////////////////////////
// Tests

function displayMessageID () {
	/*
	var messageArray={};
	messageArray=GetSelectedMessages();
	var messageURI = messageArray[0];
	var header = messenger.msgHdrFromURI(messageURI);
	var messageID = header.messageId;
	*/
	// avant modif
	// messgeURI=mailbox-message://nobody@Local%20Folders/Inbox#3587310
	// messageID=50826FCACE4318438E8AF53FD716466701E595A36F@exdruembetl003.eq1etl.local
	//Components.utils.reportError("messgeURI="+messageURI+"\n"+"messageID ="+messageID);
	// apr�s d�placement de l'email
	// messgeURI=mailbox-message://nobody@Local%20Folders/Trash#143700885
	// messageID=50826FCACE4318438E8AF53FD716466701E595A36F@exdruembetl003.eq1etl.local
	// conclusion : m�me messgeID. l'uri elle est diff�rente.

  	var folder = GetSelectedMsgFolders()[0];
	consoleService.logStringMessage(folder.baseMessageURI);
}

function reprise (folder) {
	if (folder == null) {
		folder = GetSelectedMsgFolders()[0];
	}
	tbirdsqlite.reprise(folder);
	if (folder.hasSubFolders) {
		var subFolders = folder.subFolders;
		try {
			while (subFolders.hasMoreElements()) {
				var subFolder = subFolders.getNext();
					tbirdsqlite.reprise(subFolder);
			}
		} catch (e) {}
	}
	consoleService.logStringMessage(folder.baseMessageURI);
}

/*
baseMessageURI = mailbox-message://nobody@Local%20Folders/_maintenance/Autom%20Tests
*/
