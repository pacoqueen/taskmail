if (!TASKMAIL)
	var TASKMAIL = {};
if (!TASKMAIL.QFB)
	TASKMAIL.QFB = {};

TASKMAIL.QFB = {

	messageLinkedCustomTerm : {
	  id: "TaskMail#TermName",
	  name: "message task linked term",
	  getEnabled: function(scope, op)
	    {
	      return scope == Components.interfaces.nsMsgSearchScope.offlineMail &&
	             op == Components.interfaces.nsMsgSearchOp::Is
	    },
	  getAvailable: function(scope, op)
	    {
	      return scope == Components.interfaces.nsMsgSearchScope.offlineMail &&
	             op == Components.interfaces.nsMsgSearchOp::Is
	    },
	  getAvailableOperators: function(scope, length)
	    {
	       length.value = 1;
	       return [Components.interfaces.nsMsgSearchOp.Is];
	    },
	  /**
	   * @param searchValue taskId
	   */
	  match: function(msgHdr, searchValue, searchOp) {
	    var result = false;
	    switch (searchOp) {
	      case Components.interfaces.nsMsgSearchOp.Is:
	        result =  TASKMAIL.Link.isMessageLinkedWith(msgHdr.folder.URI, msgHdr.messageKey, searchValue);  
	        break;
	      case Components.interfaces.nsMsgSearchOp.IsEmpty:
	      	result = !TASKMAIL.Link.isMessageLinked(msgHdr.folder.URI, msgHdr.messageKey);  
	        break;
	      case Components.interfaces.nsMsgSearchOp.IsntEmpty:
	      	result = TASKMAIL.Link.isMessageLinked(msgHdr.folder.URI, msgHdr.messageKey);
	        break;
	    }
	    consoleService.logStringMessage("TaskMail#TermName.match("+msgHdr.messageId+","+searchValue+","+searchOp+")="+result);
	    return result;
	  }
	},

	threadLinkedCustomTerm : {
	  id: "TaskMail#threadLinkedTerm",
	  name: "thread task linked term",
	  getEnabled: function(scope, op)
	    {
	      return scope == Components.interfaces.nsMsgSearchScope.offlineMail &&
	             op == Components.interfaces.nsMsgSearchOp::Is
	    },
	  getAvailable: function(scope, op)
	    {
	      return scope == Components.interfaces.nsMsgSearchScope.offlineMail &&
	             op == Components.interfaces.nsMsgSearchOp::Is
	    },
	  getAvailableOperators: function(scope, length)
	    {
	       length.value = 1;
	       return [Components.interfaces.nsMsgSearchOp.Is];
	    },
	  /**
	   * @param searchValue taskId
	   */
	  match: function(msgHdr, searchValue, searchOp) {
	  	var result = false;
	  	switch (searchOp) {
	  		case Components.interfaces.nsMsgSearchOp.Is:
					result = TASKMAIL.Link.isThreadLinkedWith(msgHdr.threadId, searchValue);
		      break;
	      case Components.interfaces.nsMsgSearchOp.IsEmpty:
	        result = !TASKMAIL.Link.isThreadLinked(msgHdr.threadId);
	        break;
	      case Components.interfaces.nsMsgSearchOp.IsntEmpty:
	        result = TASKMAIL.Link.isThreadLinked(msgHdr.threadId);
	        break;
	    }
	    consoleService.logStringMessage("TaskMail#threadLinkedTerm.match("+msgHdr.messageId+","+searchValue+","+searchOp+")="+result);
	    return result;
	  }
	},

	/**
	 * called when a task is selected and linked mode is active.
	 * refresh search.
	 */
	onTaskSelect : function() {
		consoleService.logStringMessage("onTaskSelect");
		QuickFilterBarMuxer.updateSearch();
	},
	
	/**
	 * called when active/desactive subfiler.
	 * if linked mode active, then need manage of task select even.
	 */
	onCommandSubFilter : function() {
		consoleService.logStringMessage("onCommandSubFilter");
		var linkButton = document.getElementById("qfb-task-linked");
		if (linkButton.checked) {
    	consoleService.logStringMessage("onCommandSubFilter => ajoute select event");
    	document.getElementById("taskList").addEventListener("select",TASKMAIL.QFB.onTaskSelect, false);
    } else {
    	consoleService.logStringMessage("onCommandSubFilter => supprime select event");
    	document.getElementById("taskList").removeEventListener("select",TASKMAIL.QFB.onTaskSelect, false);
    }
		QuickFilterBarMuxer.updateSearch();
	},
	
	init : function () {
		var filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
		                        .getService(Components.interfaces.nsIMsgFilterService);
		filterService.addCustomTerm(TASKMAIL.QFB.messageLinkedCustomTerm);
		filterService.addCustomTerm(TASKMAIL.QFB.threadLinkedCustomTerm);
	}
};

TASKMAIL.QFB.init();

QuickFilterManager.defineFilter({
  name: "tache",
  domId: "qfb-task",
  appendTerms: function(aTermCreator, aTerms, aFilterValue) {
  	consoleService.logStringMessage("appendTerms");
  	var linked = document.getElementById("qfb-task-linked").checked;
  	var threaded = document.getElementById("qfb-task-thread").checked;
  	if (threaded) {
  		var termName = "TaskMail#threadLinkedTerm";
  	} else {
  		var termName = "TaskMail#TermName";
  	}
  	var selectedTasks = TASKMAIL.UI.getSelectedTasks();
  	// if no task selected, we acte as if link mode is not selected
  	if (linked && selectedTasks.length > 0) {
	   	var firstBook = true;
	    var term = null;
	    for(var i=0; i<selectedTasks.length; i++) {
		    var value;
		    term = aTermCreator.createTerm();
		    term.attrib = nsMsgSearchAttrib.Custom;
		    value = term.value;
		    value.attrib = term.attrib;
	    	value.str = selectedTasks[i].id;
	    	term.customId = termName;
		    term.value = value;
		    term.op = aFilterValue ? nsMsgSearchOp.Is : nsMsgSearchOp.Isnt;
		    term.booleanAnd = firstBook || !aFilterValue;
		    term.beginsGrouping = firstBook;
		    aTerms.push(term);
		    firstBook = false;
	    }
	    if (term)
	      term.endsGrouping = true;
  	} else { 
	    var value;
	    term = aTermCreator.createTerm();
	    term.attrib = nsMsgSearchAttrib.Custom;
	    value = term.value;
	    value.attrib = term.attrib;
    	term.customId = termName;
	    term.value = value;
	    term.op = aFilterValue ? nsMsgSearchOp.IsntEmpty : nsMsgSearchOp.IsEmpty;
	    term.booleanAnd = true;
	    aTerms.push(term);
    }
  }
  
  /**
   * called on a active / desactive of task's filter (qfb-task button only) 
   * not on subFilters.     
   */
//  onCommand: function(aState, aNode, aEvent, aDocument) {
//  	consoleService.logStringMessage("onCommand(" + aNode.id + ")");
//  	if (!aNode.checked) {
//    	consoleService.logStringMessage("onCommand => supprime select event");
//    	document.getElementById("taskList").removeEventListener("select",TASKMAIL.QFB.onTaskSelect, false);
//    } else {
//	    var linkButton = document.getElementById("qfb-task-linked");
//			if (linkButton.checked) {
//				// subFilters could be checked when main filter is activating.
//				consoleService.logStringMessage("onCommand => ajout select event");
//	    	document.getElementById("taskList").addEventListener("select",TASKMAIL.QFB.onTaskSelect, false);
//			}
//    }
//    // make subFilters visible or not.
//    if (aNode.checked) {
//    	document.getElementById("qfb-task-linked").style.visibility = "visible";
//    	document.getElementById("qfb-task-thread").style.visibility = "visible";
//    } else {
//    	document.getElementById("qfb-task-linked").style.visibility = "hidden";
//    	document.getElementById("qfb-task-thread").style.visibility = "hidden";
//    }
//    var checked = aNode.checked ? true : null;
//    return [checked, true];
//  },
  
  /*
   * called on quick-filter-bar is hidding.
   */
//  clearState: function(aState) {
//    consoleService.logStringMessage("clearState => supprime select event");
//    // remove possible task's select callback and hide subFilters.
//    document.getElementById("taskList").removeEventListener("select",TASKMAIL.QFB.onTaskSelect, false);
//    return [null, false];
//  },
  
  /**
   * called on a folder changed and on UI binding.
   * make subFilter visible or not.
   */
//  reflectInDOM: function TFF_reflectInDOM(aNode, aFilterValue,
//                                          aDocument, aMuxer) {
//	  consoleService.logStringMessage("reflectInDom");
//	  aNode.checked = aFilterValue ? true : false;
//  	
//	  if (aFilterValue == null) {
//		  consoleService.logStringMessage("reflectInDOM => supprime select event");
//		  document.getElementById("taskList").removeEventListener("select",TASKMAIL.QFB.onTaskSelect, false);
//		  document.getElementById("qfb-task-linked").style.visibility = "hidden";
//		  document.getElementById("qfb-task-thread").style.visibility = "hidden";
//	  } else {
//	  	// utile quand thunderbird est relancé.
//	  	// seul l'état du main filter est conservé.
//	  	document.getElementById("qfb-task-linked").style.visibility = "visible";
//	  	document.getElementById("qfb-task-thread").style.visibility = "visible";
//	  }
//  }
});
