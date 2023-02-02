const { GObject} = imports.gi;
const UPower = imports.gi.UPowerGlib;
const BaseIndicator = imports.ui.status.system.Indicator;

var Indicator = GObject.registerClass(
   class Indicator extends BaseIndicator {
   // Adapted from _getStatus of the parent.
   _getTime() {
      let seconds = 0;
      let proxy = this._systemItem.powerToggle._proxy;
      let state = proxy.State;

      if (state === UPower.DeviceState.FULLY_CHARGED) {
         return '';
      } else if (state === UPower.DeviceState.CHARGING) {
         seconds = proxy.TimeToFull;
      } else if (state === UPower.DeviceState.DISCHARGING) {
         seconds = proxy.TimeToEmpty;
      } else if (state === UPower.DeviceState.PENDING_CHARGE) {
         return '';
      } else {
         // state is PENDING_DISCHARGE or UNKNOWN
         return _('Estimating…');
      }

      let time = Math.round(seconds / 60);
      if (time === 0) {
         // 0 is reported when UPower does not have enough data
         // to estimate battery life
         return _('Estimating…');
      }

      let minutes = time % 60;
      let hours = Math.floor(time / 60);

      // Translators: this is <hours>:<minutes>
      return _('%d\u2236%02d').format(hours, minutes);
   }

   _sync() {
      super._sync();
      this._percentageLabel.text = this._getTime();
   }
});
