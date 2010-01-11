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

/**
 * d�truit tous les liens entre les emails s�lectionn�s et les taches s�lectionn�es.
 * @return void
 */
function unlinkTask() {
	// parcours tous les messages s�lectionn�s pour trouver les taches li�es dans celles s�lectionn�s
	// TODO optimisation possible en n'invocant uniquement pour les liens li�es;
	var selectedMessages = gFolderDisplay.selectedMessages; // OK un objet msg
	var listBox = document.getElementById("taskList");
	var selectedTasks = listBox.selectedItems;
	for (var i = 0; i < selectedMessages.length; i++) {
		for (var j = 0; j < selectedTasks.length; j++) {
			tbirdsqlite.unlinkTaskSQLite(selectedMessages[i],selectedTasks[j].getAttribute("pk"));
		}
	}
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

/**
 * D�termine les cl� de mail correspondant � la tache sp�cifi�e.
 */
function getMailKeysFromTaskID(taskID) {
	var result = null;
	var nbResult = 0;
	for (var i = 0; i < taskIdLinks.length; i++) {
		if (taskIdLinks[i] == taskID) {
			if (result == null) {
				result = new Array();
			}
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

function refreshTaskList () {
  //consoleService.logStringMessage("refreshTaskList");
  // le refresh du folder est lanc� avant l'handler de la colonne des emails.
  emptyList();
  getTaskList();
}

function stateFilterChange () {
  refreshTaskList();  
}

function viewFilterChange () {
  var viewFilter = document.getElementById("viewFilter").selectedItem.value;
  if (viewFilter == 2) {
    // recherche par mail
    // il faut supprimer le refreshTaskLink et le remettre pour qui soit en 2�
    document.getElementById("threadTree").removeEventListener("select", refreshTaskLink, false);
    document.getElementById("threadTree").addEventListener("select", refreshTaskList, false);
    document.getElementById("threadTree").addEventListener("select", refreshTaskLink, false);
  } else {
    document.getElementById("threadTree").removeEventListener("select", refreshTaskList, false);
  }
  refreshTaskList();
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
  refreshTaskList();
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
  refreshTaskList();
  refreshMailLink();
}

/**
 * d�place un tache dans un nouveau folder si la tache n'est li�e � aucun email
 */
function moveTask (aDestFolder) {
	var taskId = document.popupNode.getAttribute("pk");
	// si pas de task s�lectionn�e, on ne fait rien.
	if (taskId == "") return;
	// si la tache a un lien, on ne fait rien.
	if (getMailKeysFromTaskID(taskId) != null) {
		alert('d�placement de tache avec lien non g�rer.');
		return;
	}
	tbirdsqlite.taskMoveSQLite(taskId, aDestFolder);
	refreshTaskList();
}

/**
 * si l'email est li�e � au moins une tache li�e � un autre mail, one ne fait rien.
 * @param selectedMsgs
 */
function msgsMovable (selectedMsgs) {
	
	// 1 transforme enum en Array de selected msg key
	var selectedMsgKey = new Array();
	var srcEnum = selectedMsgs.enumerate();
	while (srcEnum.hasMoreElements()) {
		var srcMsg = srcEnum.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
		selectedMsgKey.push(srcMsg.messageKey);
	}
	// 2 pour chaque selected msg, recup�re les taches li�es
	// d�s qu'un msg li� hors s�lection, on stoppe
	var stop = false;
	for (var i = 0; i < selectedMsgKey.length && !stop; i++) {
		var taskIDs = getTaskIDFromMailID(selectedMsgKey[i]);
		for (var j = 0; j < taskIDs.length && !stop; j++) {
			var msgKeys = getMailKeysFromTaskID(taskIDs[j]);
			for (var k = 0; k < msgKeys.length && !stop; k++) {
				if (selectedMsgKey.indexOf(msgKeys[k]) == -1) {
					stop = true;
				}
			}
		}
	}
	return !stop;
}

function init() {
  document.getElementById("folderTree").addEventListener("select", refreshTaskList, false);
  document.getElementById("threadTree").addEventListener("select", refreshTaskLink, false);
  document.getElementById("taskList").addEventListener("select", refreshMailLink, false);
  
	var newMailListener = {
		folderRenamed: function (aOrigFolder, aNewFolder) {
			tbirdsqlite.renameFolderSQLite(aOrigFolder, aNewFolder);
		},
		folderDeleted: function (aFolder) {
			// Rien lors de la suppression r�elle puisque �a passe par la corbeille
			// Une fois dans la corbeille, 1 supprimer => un event folderDeleted,  
			// un vidage de corbeille => un event de plus pour 'corbeille'
			// Un event par subFolder en partant du dessous.
			// le baseMessageURI est conforme
			// avant delete mailbox-message://nobody@Local%20Folders/toto/titi
			// l'uri est modifi� 
			//consoleService.logStringMessage(aFolder.baseMessageURI);
			tbirdsqlite.deleteFolderSQLite(aFolder);
		},
		folderMoveCopyCompleted: function (aMove,aSrcFolder,aDestFolder) {
			// TODO Voir ce qu'on devrait faire pour une copie de folder
			if (aMove) {
				tbirdsqlite.moveFolderSQLite(aSrcFolder,aDestFolder);
			}
		},
		msgsMoveCopyCompleted: function(aMove,
		                                aSrcMsgs,
										aDestFolder,
										aDestMsgs){
			if (aMove) {
				var moveable = msgsMoveable(aSrcMsgs);
				// si probl�me on alerte mais le d�placement de message est d�j� fait donc on laisse faire.
				// @todo voir comment empecher le d�placement
				if (!moveable) {
					alert('d�placement de message probl�matique. Il existe un email qui a perdu une tache. Il est possible d\'annuler la derni�re op�ration.');
				}
				tbirdsqlite.msgsMoveCopyCompletedSQLite(aSrcMsgs,
									                    aDestFolder,
									                    aDestMsgs);
			}
		},
		msgsDeleted: function(aMsgs) {
			tbirdsqlite.msgsDeletedSQLite(aMsgs);
		}
	}

	var notificationService =  
	Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]  
		.getService(Components.interfaces.nsIMsgFolderNotificationService);  
	notificationService.addListener(newMailListener, notificationService.folderRenamed | 
	                                                 notificationService.folderDeleted | 
													 notificationService.folderMoveCopyCompleted |
													 notificationService.msgsMoveCopyCompleted |
													 notificationService.msgsDeleted);
}

// besoin de passer par le load de la fen�tre sinon �a plante thunderbird (peut-�tre UI pas pr�te)
window.addEventListener("load", init, false);

// Pour logguer
var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);


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

function fillTaskList(id, title, state) {
  var row = _makeRowList(id, title, state);
  document.getElementById("taskList").appendChild( row );
}

function _makeRowList(pk, titleInput, stateInput) {
  var row = document.createElement('listitem');
  row.setAttribute('pk', pk );
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

function _unique(array) {
	var r = new Array();
	o:for(var i = 0, n = array.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==array[i])
			{
				continue o;
			}
		}
		r[r.length] = array[i];
	}
	return r;
}

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
		} catch (e) {
			consoleService.logStringMessage(e);
		}
	}
	consoleService.logStringMessage(folder.baseMessageURI);
}

/*
baseMessageURI = mailbox-message://nobody@Local%20Folders/_maintenance/Autom%20Tests
var mailKey = GetSelectedMessages(); // provoque un plantage
*/
