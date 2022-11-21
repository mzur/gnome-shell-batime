const ExtensionUtils = imports.misc.extensionUtils;
const BaTime = ExtensionUtils.getCurrentExtension();
const Panel = imports.ui.main.panel;

class BaTimeExtension {
   constructor() {
      this.aggregateMenu = Panel.statusArea.quickSettings;
      this.originalIndicator = this.aggregateMenu._system;
      this.aggregateMenu._system = this.customIndicator = new BaTime.imports.power.Indicator();
      this.aggregateMenu._indicators.replace_child(
         this.originalIndicator,
         this.customIndicator
      );
   }
   destroy() {
      this.aggregateMenu._system = this.originalIndicator;
      this.aggregateMenu._indicators.replace_child(
         this.customIndicator,
         this.originalIndicator
      );
   }
}

let baTime;

function enable() {
   baTime = new BaTimeExtension();
}

function disable() {
   baTime.destroy();
   baTime = null;
}
