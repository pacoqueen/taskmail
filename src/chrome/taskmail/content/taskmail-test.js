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
	var msgFolder = gFolderDisplay ? GetFirstSelectedMsgFolder() : null;
	var msgUris = gFolderDisplay ? gFolderDisplay.selectedMessageUris : null;
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
		consoleService.logStringMessage(temp[i].messageKey + "," + temp[i].messageId + "," + temp[i].threadId
		 + "," + temp[i].threadParent);
	}	
	//messageId reste constant après la compression de folders, après le déplacement de folder.
	//Est-ce que messageId est unique. Surement.
}

function testGetMsgID() {
	var folder = GetSelectedMsgFolders()[0];
	var messageKey = prompt("key?");
	var messageHdr = folder.GetMessageHeader(messageKey);
	consoleService.logStringMessage("messageID=" + messageHdr.messageId);
}

var aListener = { 
  /* called when new items are returned by the database query or freshly indexed */  
  onItemsAdded: function myListener_onItemsAdded(aItems, aCollection) {  
  },  
  /* called when items that are already in our collection get re-indexed */  
  onItemsModified: function myListener_onItemsModified(aItems, aCollection) {  
  },  
  /* called when items that are in our collection are purged from the system */  
  onItemsRemoved: function myListener_onItemsRemoved(aItems, aCollection) {  
  },  
  /* called when our database query completes */  
  onQueryCompleted: function myListener_onQueryCompleted(aCollection) {
  	if (aCollection.items.length <= 0) {
  		consoleService.logStringMessage("onQueryCompleted:no message");
  		return;
  	}
  	consoleService.logStringMessage("onQueryCompleted:nb resultats=" + aCollection.items.length);
  	for(var i=0; i<aCollection.items.length; i++) {
  		consoleService.logStringMessage("id" + aCollection.items[i].id + 
    		",messageKey="+ aCollection.items[i].messageKey + 
    		",subject="+ aCollection.items[i].subject+",folder="+aCollection.items[i].folder.uri);
  	}
    
//    consoleService.logStringMessage("onQueryCompleted:collection length=" + aCollection.items.length);
//    try {
//    	for (var conv in aCollection.items)  
//    		//do something with the Conversation here  
//				consoleService.logStringMessage("onQueryCompleted:Gloda " + conv.contact);
//		} catch (e) {}    
  }
}

//function testGloda () {
//	Components.utils.import("resource://app/modules/gloda/public.js");
//	//var aMsrHdr = gFolderDisplay.selectedMessages[0];
//	//consoleService.logStringMessage("gloda:messageKey="+aMsrHdr.messageKey+",messageId="+aMsrHdr.messageId);
//	//var collection = Gloda.getMessageCollectionForHeader(aMsrHdr, aListener, null);
//	
//	var aFolder = GetSelectedMsgFolders()[0];
//	var aKey = gFolderDisplay.selectedMessages[0].messageKey;
//	var query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
//  query.folder(aFolder).messageKey(aKey);
//  consoleService.logStringMessage("recherche par key " + aFolder.URI+","+aKey);
//  var collection1 = query.getCollection(aListener, null);
//  
////  let query2 = Gloda.newQuery(Gloda.NOUN_MESSAGE);
////  query2.id(36);
////  consoleService.logStringMessage("recherche par id 36");
////  var collection2 = query2.getCollection(aListener, null);
//}
