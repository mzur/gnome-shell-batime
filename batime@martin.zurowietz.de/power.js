const Lang = imports.lang;
const UPower = imports.gi.UPowerGlib;
const BaseIndicator = imports.ui.status.power.Indicator;

var Indicator = class extends BaseIndicator {
   // Adapted from _getStatus of the parent.
   _getTime() {
      let seconds = 0;

      if (this._proxy.State == UPower.DeviceState.FULLY_CHARGED) {
         return '';
      } else if (this._proxy.State == UPower.DeviceState.CHARGING) {
         seconds = this._proxy.TimeToFull;
      } else if (this._proxy.State == UPower.DeviceState.DISCHARGING) {
         seconds = this._proxy.TimeToEmpty;
      } else {
         // state is one of PENDING_CHARGING, PENDING_DISCHARGING
         return _("Estimating…");
      }

      let time = Math.round(seconds / 60);
      if (time == 0) {
         // 0 is reported when UPower does not have enough data
         // to estimate battery life
         return _("Estimating…");
      }

      let minutes = time % 60;
      let hours = Math.floor(time / 60);

      // Translators: this is <hours>:<minutes>
      return _("%d\u2236%02d").format(hours, minutes);
   }

   _sync() {
      super._sync();
      this._percentageLabel.clutter_text.set_markup('<span size="smaller">' + this._getTime() + '</span>');
   }
}
