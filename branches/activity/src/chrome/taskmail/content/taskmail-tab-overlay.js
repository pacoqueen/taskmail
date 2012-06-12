var taskmailTabType = {
  name: "taskmail",
  panelId: "taskmailTabPanel",
  modes: {
    taskmail: {
      type: "taskmail",
      maxTabs: 1,
      openTab: function(aTab, aArgs) {
        aTab.title = aArgs["title"];
        if (!("background" in aArgs) || !aArgs["background"]) {
            // Only do calendar mode switching if the tab is opened in
            // foreground.
            ltnSwitch2Calendar();
        }
      },

      showTab: function(aTab) {
        ltnSwitch2Calendar();
      },
      closeTab: function(aTab) {
        if (gCurrentMode == "calendar") {
          // Only revert menu hacks if closing the active tab, otherwise we
          // would switch to mail mode even if in task mode and closing the
          // calendar tab.
          ltnSwitch2Mail();
        }
      },

      persistTab: function(aTab) {
        let tabmail = document.getElementById("tabmail");
        return {
            // Since we do strange tab switching logic in ltnSwitch2Calendar,
            // we should store the current tab state ourselves.
            background: (aTab != tabmail.currentTabInfo)
        };
      },

      restoreTab: function(aTabmail, aState) {
        aState.title = ltnGetString("lightning", "tabTitleCalendar");
        aTabmail.openTab('calendar', aState);
      },

      onTitleChanged: function(aTab) {
        aTab.title = ltnGetString("lightning", "tabTitleCalendar");
      },

      supportsCommand: function (aCommand, aTab) calendarController2.supportsCommand(aCommand),
      isCommandEnabled: function (aCommand, aTab) calendarController2.isCommandEnabled(aCommand),
      doCommand: function(aCommand, aTab) calendarController2.doCommand(aCommand),
      onEvent: function(aEvent, aTab) calendarController2.onEvent(aEvent)
    },

  },
};

window.addEventListener("load", function(e) {
    let tabmail = document.getElementById('tabmail');
    tabmail.registerTabType(calendarTabType);
    tabmail.registerTabMonitor(calendarTabMonitor);
}, false);
