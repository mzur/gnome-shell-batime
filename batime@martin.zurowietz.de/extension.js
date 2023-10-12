import {
   Extension as BaseExtension,
   InjectionManager
} from 'resource:///org/gnome/shell/extensions/extension.js';// import {overrideProto} from './util.js'
import {panel} from 'resource:///org/gnome/shell/ui/main.js';
import {Indicator} from 'resource:///org/gnome/shell/ui/status/system.js';
import UPower from 'gi://UPowerGlib';

const _powerToggleSyncOverride = function () {
   // Do we have batteries or a UPS?
   this.visible = this._proxy.IsPresent;
   if (!this.visible) {
      return false;
   }

   let seconds = 0;
   let state = this._proxy.State;

   if (this._proxy.State === UPower.DeviceState.CHARGING) {
      seconds = this._proxy.TimeToFull;
   } else if (this._proxy.State === UPower.DeviceState.DISCHARGING) {
      seconds = this._proxy.TimeToEmpty;
   }

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
         };
      });

      // This is called in case the extension is enabled after startup.
      // During startup, the _system indicator is not created at this point, yet.
      this._syncToggle();
   }

   disable() {
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
