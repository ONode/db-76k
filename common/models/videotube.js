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
  Videotuba.job_update_channel = function (_channel_id, cb) {
    __ttub.update_db_by_channel(Videotuba, _channel_id, function () {
      console.log(logTag, "========== ***************** =========");
      console.log(logTag, "========== All jobs are done =========");
      console.log(logTag, "========== ***************** =========");
    });
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
  Videotuba.get_lucky_list = function (_count, cb) {
    var count_final = _count > 20 ? 20 : _count;
    console.log("> get sample list");
    var where_cond = {
      "listing.enabled": true,
      "listing.searchable": true
    };
    /* Videotuba.find({
     where: {
     "listing.enabled": true,
     "listing.searchable": true
     },
     /!* aggregate: [
     {
     $sample: {size: count_final}
     }
     ]
     ,*!/
     sort: "createtime DESC",
     limit: count_final
     }, function (err, results) {
     if (_.isError(err)) {
     return cb(err);
     }
     cb(null, results);
     });*/

    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }

    Videotuba.count(where_cond, function (err, number) {
      if (_.isError(err)) {
        return cb(err);
      }
      var __skip = parseInt(Math.random() * (number - _count));

      Videotuba.find({
        where: {
          "listing.enabled": true,
          "listing.searchable": true
        },
        sort: "createtime DESC",
        limit: count_final,
        skip: __skip
      }, function (err, results) {
        if (_.isError(err)) {
          return cb(err);
        }
        cb(null, results);
      });
    });

  };

  Videotuba.job_update_and_loop_channel = function (cb) {
    __ttub.update_db_and_loop_channel(Videotuba, function (done) {

    });
    cb(null, result_bool);
  };

  Videotuba.remoteMethod("job_update_and_loop_channel", {
    description: ["Cron job update item from loop channel."],
    accepts: [],
    returns: {
      arg: "token", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/job_lp_channel/"}
  });

  Videotuba.remoteMethod("job_update_channel", {
    description: ["Cron job call to update the db id items by input channel id"],
    accepts: [{
      arg: "channel_id",
      type: "string",
      http: {source: "path"},
      required: true,
      description: "id of the video id"
    }],
    returns: {
      arg: "token", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/job_update_channel/:channel_id"}
  });


  Videotuba.remoteMethod("mach_scanlist", {
    description: ["Cron job to the list locally.."],
    accepts: [],
    returns: {
      arg: "token", type: "object", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/scanlist"}
  });


  Videotuba.remoteMethod("get_lucky_list", {
    description: ["Cron job to the list locally.."],
    accepts: [{
      arg: "count",
      type: "number",
      http: {source: "path"},
      required: true,
      description: "the count number of the ramdom list"
    }],
    returns: {
      arg: "luckylist", type: "array", root: true, description: "Return value"
    },
    http: {verb: "get", path: "/imlucky/:count"}
  });


  Videotuba.remoteMethod("update_scan_item", {
    description: ["Prompted by remote api to update scanned item"],
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