var setupModule = function(module) {
  controller = mozmill.getMail3PaneController();  
	jumlib = {};
	Components.utils.import("resource://mozmill/modules/jum.js", jumlib);

  /**
   * Préparer des controlleurs d'interface qui vérifieront que les 
   * raccourcis clavier sont bien invoqués.
   */        
  UITest = {
    shortCalled : false,
    beginAddTaskWithLink : function() {
//      controller.window.alert('shift-N');
      this.shortCalled = true;
    },
    updateTaskStateDone : function() {
//      controller.window.alert('shift-D');
      this.shortCalled = true;
    },
    incrementPriority : function() {
//      controller.window.alert('ctrl-alt-pageup');
      this.shortCalled = true;
    },
    toggleTaskPane : function() {
//      controller.window.alert('F9');
      this.shortCalled = true;
    }
  };  
	UILinkTest = {
    shortCalled : false,
    showLinked : function (event) {
      this.shortCalled = true;
//      controller.window.alert('shift-L');
    },
    showLinkedTask : function (event) {
      this.shortCalled = true;
//      controller.window.alert('shift-L(2)');
    },
    showLinkedMail : function (event) {
      this.shortCalled = true;
//      controller.window.alert('shift-L(3)');
    }
  };  

  /**
   * Sauvegarde les anciens controlleurs et subsituent les spécifiques
   */     
	oldUI = controller.window.TASKMAIL.UI;
	oldUILink = controller.window.TASKMAIL.UILink;

  controller.window.TASKMAIL.UI = UITest;  
  controller.window.TASKMAIL.UILink = UILinkTest;  
}

var testShortcutShiftN = function () {
  UITest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document,"threadTree"),
    "N",{ctrlKey:false, altKey:false,shiftKey:true, metaKey:false});  
  jumlib.assert(UITest.shortCalled == true,"shortcut non appelé");  
}

var testShortcutShiftNTaskPane = function () {
  UITest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document,"taskmail-taskList"),
    "N",{ctrlKey:false, altKey:false,shiftKey:true, metaKey:false});  
  jumlib.assert(UITest.shortCalled == true,"shortcut non appelé");  
}

var testShortcutShiftL = function () {
  UILinkTest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document, "threadTree"),
    "L", {ctrlKey:false, altKey:false,shiftKey:true, metaKey:false});  
  jumlib.assert(UILinkTest.shortCalled == true,"shortcut non appelé");  
}

var testShortcutShiftLTaskPane = function () {
  UILinkTest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document, "taskmail-taskList"),
    "L", {ctrlKey:false, altKey:false,shiftKey:true, metaKey:false});  
  jumlib.assert(UILinkTest.shortCalled == true,"shortcut non appelé");  
}

var testShortcutShiftDTaskPane = function () { 
  UITest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document, "taskmail-taskList"),
    "D", {ctrlKey:false, altKey:false,shiftKey:true, metaKey:false});  
  jumlib.assert(UITest.shortCalled == true,"shortcut non appelé");  
}

var testShortcutCtrlAltPageUpTaskPane = function () {
  UITest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document, "taskmail-taskList"),
    "VK_PAGE_UP", {ctrlKey:true, altKey:true, shiftKey:false, metaKey:false});  
  jumlib.assert(UITest.shortCalled == true,"shortcut non appelé");  
}

var testF9 = function () {
  UITest.shortCalled = false;
  controller.keypress(
    new elementslib.ID(controller.window.document, "threadTree"),
    "VK_F9", {ctrlKey:false, altKey:false, shiftKey:false, metaKey:false});  
  jumlib.assert(UITest.shortCalled == true,"test F9");  
}

/**
 * Restaure les controleur de l'interface.
 */
var teardownModule = function (module) {
  controller.window.TASKMAIL.UI = oldUI;  
  controller.window.TASKMAIL.UILink = oldUILink;  
}
