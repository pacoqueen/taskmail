/**
 * true: sender must be in a local address book, false: sender must not be.
 */
 
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
    	consoleService.logStringMessage("match:key=" + msgHdr.messageKey + ",value=" + searchValue + "op="+searchOp);
      switch (searchOp)
      {
        case Components.interfaces.nsMsgSearchOp.Is:
          if (msgHdr.messageKey == searchValue)
            return true;
        case Components.interfaces.nsMsgSearchOp.IsEmpty:
        	var link = TASKMAIL.Link.getTaskIDFromMailID(msgHdr.messageKey);  
          if (link.length == 0)
            return true;
        case Components.interfaces.nsMsgSearchOp.IsntEmpty:
        	var link = TASKMAIL.Link.getTaskIDFromMailID(msgHdr.messageKey);
          if (link.length > 0)
            return true;
      }
      return false;
    }
};

let filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
                        .getService(Components.interfaces.nsIMsgFilterService);
filterService.addCustomTerm(customTerm);
  
QuickFilterManager.defineFilter({
  name: "tache",
  domId: "qfb-task",
  appendTerms: function(aTermCreator, aTerms, aFilterValue) {
//    var selectedTasks = TASKMAIL.UI.getSelectedTasks();
//    let firstBook = true;
//    let term = null;
//    for(var i=0; i<selectedTasks.length; i++) {
//	    var linkedMessageKeys = TASKMAIL.Link.getMailKeysFromTaskID(selectedTasks[i].id);
//	    for(var j=0; j<linkedMessageKeys.length; j++) {
//		    let value;
//		    term = aTermCreator.createTerm();
//		    term.attrib = nsMsgSearchAttrib.Custom;
//		    value = term.value;
//		    value.attrib = term.attrib;
//		   consoleService.logStringMessage(linkedMessageKeys[j]);
//	    	 value.str = linkedMessageKeys[j];
//		    term.customId = "TaskMail@example.com#TermName";
//		    term.value = value;
//		    term.op = aFilterValue ? nsMsgSearchOp.IsntEmpty : nsMsgSearchOp.IsEmpty;
//		    term.booleanAnd = firstBook || !aFilterValue;
//		    term.beginsGrouping = firstBook;
//		    aTerms.push(term);
//		    firstBook = false;
//	    }
//    }
//    if (term)
//      term.endsGrouping = true;
		    let value;
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
});