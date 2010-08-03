// /////////////////////////////////////////////////////////////////////////////
// Tests

var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService)
			
function displayFolderURI() {
    /*
     * var messageArray={}; messageArray=GetSelectedMessages(); var messageURI =
     * messageArray[0]; var header = messenger.msgHdrFromURI(messageURI); var
     * messageID = header.messageId;
     */
    // avant modif
    // messgeURI=mailbox-message://nobody@Local%20Folders/Inbox#3587310
    // messageID=50826FCACE4318438E8AF53FD716466701E595A36F@exdruembetl003.eq1etl.local
    // Components.utils.reportError("messgeURI="+messageURI+"\n"+"messageID
    // ="+messageID);
    // après déplacement de l'email
    // messgeURI=mailbox-message://nobody@Local%20Folders/Trash#143700885
    // messageID=50826FCACE4318438E8AF53FD716466701E595A36F@exdruembetl003.eq1etl.local
    // conclusion : même messgeID. l'uri elle est différente.
    var folder = GetSelectedMsgFolders()[0];
    consoleService.logStringMessage("URI"+folder.URI);
    consoleService.logStringMessage("baseMessageURI"+folder.baseMessageURI);
    var subFolders = folder.subFolders;
    while (subFolders.hasMoreElements()) {
					var subFolder = subFolders.getNext();
		    consoleService.logStringMessage("baseMessageURI"+subFolder.baseMessageURI);
				}
}

function displaySelectedTask () {
    var listbox = document.getElementById("taskList");
    var selectedItems = listbox.selectedItems;
    for (var i = 0; i < selectedItems.length; i++) {
        
    }
    var selectedIndex = listbox.selectedItems.map(function (item) {return listbox.getIndexOfItem(item)});
    consoleService.logStringMessage(selectedIndex);
}

function reprise(folder) {
    if (folder == null) {
        folder = GetSelectedMsgFolders()[0];
    }
    TASKMAIL.DB.reprise(folder);
    if (folder.hasSubFolders) {
        var subFolders = folder.subFolders;
        try {
            while (subFolders.hasMoreElements()) {
                var subFolder = subFolders.getNext();
                TASKMAIL.DB.reprise(subFolder);
            }
        } catch (e) {
            consoleService.logStringMessage(e);
        }
    }
    consoleService.logStringMessage(folder.URI);
}

/*
 * URI =
 * mailbox-message://nobody@Local%20Folders/_maintenance/Autom%20Tests var
 * mailKey = GetSelectedMessages(); // provoque un plantage
 */

function testSelectFolder() {
//	SelectFolder("mailbox-message://nobody@Local%20Folders/_maintenance/dpca");
	SelectFolder("mailbox://nobody@Local%20Folders/_maintenance/dpca");
}

function testGetFolder() {
//	consoleService.logStringMessage(gFolderTreeView.rowCount);
//	for(var i=0; i<gFolderTreeView.rowCount; i++) {
//		var folder = gFolderTreeView.getFolderForIndex(i);
//		var uri = folder.baseMessageURI;
//		var level = gFolderTreeView.getLevel(i);
//		consoleService.logStringMessage(uri + "," + level);
//	}
//	consoleService.logStringMessage(gFolderTreeView._rowMap.length);
//	for(var i=0; i<gFolderTreeView._rowMap.length; i++) {
//		var temp = gFolderTreeView._rowMap[i];
//		consoleService.logStringMessage(gFolderTreeView._rowMap[i].id + "," + gFolderTreeView._rowMap[i].text + "," + gFolderTreeView._rowMap[i].level);
//		consoleService.logStringMessage(temp._folder.baseMessageURI);
//	}
	var servers = Components
  .classes["@mozilla.org/messenger/account-manager;1"]
  .getService(Components.interfaces.nsIMsgAccountManager)
  .allServers
  var n = servers.Count()
  var list = servers.Count() + ":"
  for (var i = 0; i < n; ++i) {
  	var server = servers.QueryElementAt(i, Components.interfaces.nsIMsgIncomingServer)
  	if (!server.deferredToAccount) {
  		list += server.prettyName + ","; 
  		list += server.rootMsgFolder.baseMessageURI + ","
  		list += server.type + "\n"
  	}
  }
  alert(list);
}

var templateBodyPure = 
		"<ul>" +
		"<li><span class='who'></span></li>" +
		"</ul>";

function getHTMLTaskBodyPure() {
	return body;
}

function testOpenTemplate2 () {
	var msgcomposeWindow = document.getElementById( "msgcomposeWindow" );
  var msg_type = msgcomposeWindow.getAttribute( "msgtype" );
}

function testOpenTemplate () {
	let msgFolder = gFolderDisplay ? GetFirstSelectedMsgFolder() : null;
	let msgUris = gFolderDisplay ? gFolderDisplay.selectedMessageUris : null;
//	let msgUris = "mailbox-message://gorsini@pop.free.fr/Templates#39735";

	ComposeMessage(Components.interfaces.nsIMsgCompType.Template,
               Components.interfaces.nsIMsgCompFormat.Default,
               msgFolder, msgUris);
               
	//var msgcomposeWindow = document.getElementById( "msgcomposeWindow" );
  //var msg_type = msgcomposeWindow.getAttribute( "msgtype" );

//  try {
//		var editor = GetCurrentEditor();
//		var editor_type = GetCurrentEditorType();
//		editor.beginTransaction();
//		editor.beginningOfDocument(); // seek to beginning
//		if( editor_type == "textmail" || editor_type == "text" ) {
//			editor.insertText( "foo" );
//			editor.insertLineBreak();
//		} else {
//			editor.insertHTML( "<p>foo</p>" );
//		}
//		editor.endTransaction();
//	} catch(ex) {
//		Components.utils.reportError(ex);
//		return false;
//	}
}

function testPreferences() {
	var features = "chrome,titlebar,toolbar,centerscreen,modal";
	window.openDialog("chrome://taskmail/content/taskmail-prefs.xul", "Preferences", features);
}

function testListSelection () {
	var listBox = document.getElementById( "taskList" );
	var temp = listBox.getItemAtIndex(10);
	listBox.addItemToSelection(temp);
}

function testMessageKey() {
	var temp = gFolderDisplay.selectedMessages;
	for(var i=0; i<temp.length; i++) {
		consoleService.logStringMessage(temp[i].messageKey + "," + temp[i].messageId);
	}	
	
	//messageId reste constant après la compression de folders, après le déplacement de folder.
	//Est-ce que messageId est unique. Surement.
}

