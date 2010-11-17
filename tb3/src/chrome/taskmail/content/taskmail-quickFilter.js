/**
 * true: sender must be in a local address book, false: sender must not be.
 */
 
function testSelect () {
	consoleService.logStringMessage("testSelect");
	QuickFilterBarMuxer.updateSearch();
}

var customTerm =
{
  id: "TaskMail@example.com#TermName",
  name: "term name",
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
  match: function(msgHdr, searchValue, searchOp)
    {
      switch (searchOp)
      {
        case Components.interfaces.nsMsgSearchOp.Is:
          if (msgHdr.messageKey == searchValue) {
            return true;
          }
          break;
        case Components.interfaces.nsMsgSearchOp.IsEmpty:
        	var link = TASKMAIL.Link.getTaskIDFromMailID(msgHdr.messageKey);  
          if (link.length == 0)
            return true;
          break;
        case Components.interfaces.nsMsgSearchOp.IsntEmpty:
        	var link = TASKMAIL.Link.getTaskIDFromMailID(msgHdr.messageKey);
          if (link.length > 0)
            return true;
          break;
      }
      return false;
    }
};

filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
                        .getService(Components.interfaces.nsIMsgFilterService);
filterService.addCustomTerm(customTerm);
  
QuickFilterManager.defineFilter({
  name: "tache",
  domId: "qfb-task",
  appendTerms: function(aTermCreator, aTerms, aFilterValue) {
  	var linked = document.getElementById("qfb-task-linked").checked;
  	var selectedTasks = TASKMAIL.UI.getSelectedTasks();
  	if (linked) {	   
	   if (selectedTasks.length > 0) {
	   	var firstBook = true;
	    var term = null;
	    for(var i=0; i<selectedTasks.length; i++) {
		    var linkedMessageKeys = TASKMAIL.Link.getMailKeysFromTaskID(selectedTasks[i].id);
		    if (linkedMessageKeys != null) {
			    for(var j=0; j<linkedMessageKeys.length; j++) {
				    var value;
				    term = aTermCreator.createTerm();
				    term.attrib = nsMsgSearchAttrib.Custom;
				    value = term.value;
				    value.attrib = term.attrib;
			    	value.str = linkedMessageKeys[j];
				    term.customId = "TaskMail@example.com#TermName";
				    term.value = value;
				    term.op = aFilterValue ? nsMsgSearchOp.Is : nsMsgSearchOp.Isnt;
				    term.booleanAnd = firstBook || !aFilterValue;
				    term.beginsGrouping = firstBook;
				    aTerms.push(term);
				    firstBook = false;
			    }
		    } else {
			    var value;
			    term = aTermCreator.createTerm();
			    term.attrib = nsMsgSearchAttrib.Custom;
			    value = term.value;
			    value.attrib = term.attrib;
		    	value.str = "-1";
			    term.customId = "TaskMail@example.com#TermName";
			    term.value = value;
			    term.op = nsMsgSearchOp.Is;
			    term.booleanAnd = firstBook || !aFilterValue;
			    term.beginsGrouping = firstBook;
			    aTerms.push(term);
			    firstBook = false;
		    }
	    }
	    if (term)
	      term.endsGrouping = true;
	   }
  	} else { 
		    var value;
		    term = aTermCreator.createTerm();
		    term.attrib = nsMsgSearchAttrib.Custom;
		    value = term.value;
		    value.attrib = term.attrib;
		    term.customId = "TaskMail@example.com#TermName";
		    term.value = value;
		    term.op = aFilterValue ? nsMsgSearchOp.IsntEmpty : nsMsgSearchOp.IsEmpty;
		    term.booleanAnd = true;
		    aTerms.push(term);
    }
  },
  
  onCommand: function(aState, aNode, aEvent, aDocument) {
  	// called on a acive / desactive of task's filter.
    if (aNode.checked) {
    	consoleService.logStringMessage("onCommand => ajoute select event");
    	document.getElementById("taskList").addEventListener("select",testSelect, false);
    } else {
    	consoleService.logStringMessage("onCommand => supprime select event");
    	document.getElementById("taskList").removeEventListener("select",testSelect, false);
    }
    // return ourselves if we just got checked to have
    //  onSearchStart/onSearchMessage/onSearchDone get to do their thing.
    var checked = aNode.checked ? true : null;
    
    if (aNode.checked) {
    	document.getElementById("qfb-task-linked").style.visibility = "visible";
    } else {
    	document.getElementById("qfb-task-linked").style.visibility = "hidden";
    }
    return [checked, true];
  },
  
  clearState: function(aState) {
    // called on quick-filter-bar hidding
    consoleService.logStringMessage("clearState => supprime select event");
    document.getElementById("taskList").removeEventListener("select",testSelect, false);
    document.getElementById("qfb-task-linked").style.visibility = "hidden";
    return [null, false];
  },
  
  reflectInDOM: function TFF_reflectInDOM(aNode, aFilterValue,
                                          aDocument, aMuxer) {
	  // called on a folder changed
	  aNode.checked = aFilterValue ? true : false;
  	
	  if (aFilterValue == null) {
		  consoleService.logStringMessage("reflectInDOM => supprime select event");
		  document.getElementById("taskList").removeEventListener("select",testSelect, false);
		  document.getElementById("qfb-task-linked").style.visibility = "hidden";
	  } else {
	  	document.getElementById("qfb-task-linked").style.visibility = "visible";
	  }
  }
});