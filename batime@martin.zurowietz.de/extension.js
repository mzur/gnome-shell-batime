import {
   Extension as BaseExtension,
   InjectionManager
} from 'resource:///org/gnome/shell/extensions/extension.js';// import {overrideProto} from './util.js'
import {panel} from 'resource:///org/gnome/shell/ui/main.js';
import {Indicator} from 'resource:///org/gnome/shell/ui/status/system.js';
import UPower from 'gi://UPowerGlib';

const BATTERY_COLOR_CLASSES = ['battery-icon-green', 'battery-icon-yellow', 'battery-icon-red'];

const _getBatteryColorClass = function (percentage) {
   if (percentage > 75)
      return 'battery-icon-green';
   else if (percentage > 25)
      return 'battery-icon-yellow';
   else
      return 'battery-icon-red';
};

const _applyBatteryColor = function (icon, percentage) {
   if (!icon)
      return;
   for (const cls of BATTERY_COLOR_CLASSES)
      icon.remove_style_class_name(cls);
   icon.add_style_class_name(_getBatteryColorClass(percentage));
};

const _powerToggleSyncOverride = function () {
   // Do we have batteries or a UPS?
   this.visible = this._proxy.IsPresent;
   if (!this.visible) {
      return false;
   }

   let seconds = 0;
   let state = this._proxy.State;

   if (this._proxy.State === UPower.DeviceState.CHARGING ||
       this._proxy.State === UPower.DeviceState.PENDING_CHARGE) {
      seconds = this._proxy.TimeToFull;
   } else if (this._proxy.State === UPower.DeviceState.DISCHARGING) {
      seconds = this._proxy.TimeToEmpty;
   }

   // Apply color to the quick settings power toggle icon
   _applyBatteryColor(this._icon, this._proxy.Percentage);

   // This can happen in various cases.
   if (seconds === 0) {
      return false;
   }

   let time = Math.round(seconds / 60);
   let minutes = time % 60;
   let hours = Math.floor(time / 60);

   this.title = _('%d\u2236%02d').format(hours, minutes)

   return true;
};

export default class Extension extends BaseExtension {
   enable() {
      this._im = new InjectionManager();

      this._im.overrideMethod(Indicator.prototype, '_sync', function (_sync) {
         return function () {
            const {powerToggle} = this._systemItem;
            const hasOverride = _powerToggleSyncOverride.call(powerToggle);
            _sync.call(this);
            this._percentageLabel.visible = hasOverride;

            // Apply color to the panel indicator icon
            const percentage = powerToggle._proxy?.Percentage ?? 0;
            _applyBatteryColor(this._indicator, percentage);
         };
      });

      // This is called in case the extension is enabled after startup.
      // During startup, the _system indicator is not created at this point, yet.
      this._syncToggle();
   }

   disable() {
      // Remove color classes from icons before clearing overrides
      const powerToggle = panel.statusArea?.quickSettings?._system?._systemItem?.powerToggle;
      if (powerToggle?._icon) {
         for (const cls of BATTERY_COLOR_CLASSES)
            powerToggle._icon.remove_style_class_name(cls);
      }
      const indicator = panel.statusArea?.quickSettings?._system;
      if (indicator?._indicator) {
         for (const cls of BATTERY_COLOR_CLASSES)
            indicator._indicator.remove_style_class_name(cls);
      }
      this._im.clear();
      this._im = null;
      this._syncToggle();
   }

   _syncToggle() {
      if (panel.statusArea?.quickSettings?._system?._systemItem?.powerToggle) {
         panel.statusArea.quickSettings._system._systemItem.powerToggle._sync();
      }
   }
}
