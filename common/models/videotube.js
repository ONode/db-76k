/**
 * Created by hesk on 16年10月20日.
 */
var _ = require('lodash');
var __ttub = require("./../logic/youTubebi.js");
const logTag = "> basemap.js model",
  result_bool = {
    acknowledged: true
  }
;
module.exports = function (Videotube) {
  Videotube.mach_scanlist = function (cb) {
    __ttub.listp(Videotube);
    cb(null, result_bool);
  };
  Videotube.remoteMethod("mach_scanlist", {
    description: ["Mech Job.."],
    accepts: [],
    returns: {
      arg: "token", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/scanlist"}
  });
};