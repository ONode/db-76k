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
module.exports = function (Videotuba) {
  Videotuba.mach_scanlist = function (cb) {
    __ttub.listp(Videotuba);
    cb(null, result_bool);
  };

  Videotuba.update_scan_item = function (_id, withdata, cb) {
    __ttub.updateSingleClip(
      Videotuba,
      _.isUndefined(withdata) ? false : withdata,
      _id,
      function (err, done) {
        var bool = _.isUndefined(withdata) ? false : withdata;
        if (bool) {
          cb(null, done);
        } else {
          cb(null, result_bool);
        }
      });
  };

  Videotuba.remoteMethod("mach_scanlist", {
    description: ["Mech Job.."],
    accepts: [],
    returns: {
      arg: "token", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/scanlist"}
  });

  Videotuba.remoteMethod("update_scan_item", {
    description: ["Update scanned item"],
    accepts: [
      {
        arg: "video_id",
        type: "string",
        http: {source: "path"},
        required: true,
        description: "id of the video id"
      },
      {
        arg: "withdata",
        type: "Boolean",
        http: {source: "query"},
        required: false,
        description: "with additional data attached at the callback"
      }
    ],
    returns: {
      arg: "token", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/requestclip/:video_id/"}
  });

};