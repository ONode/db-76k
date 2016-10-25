/**
 * Created by hesk on 16年10月20日.
 */
var _workYoutuba = require('youtube-node');
var dl = require('youtube-dl');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var pyJson = require('./pympdmanifest.js');
var _api_key_ = process.env.YOUTUBEAPI || "";
var playlistid = "PLr2mLhT8gDUK-pMnT4tJKRwUn2FxNNhAU";
var playlist = "https://www.googleapis.com/youtube/v3/playlists";
const __parentDir = path.dirname(module.main);
const show_debug_list = false;

var dlworker = function () {
  this._staticYT = new _workYoutuba();
  console.log("> item", "=api.key=", _api_key_);
  this._staticYT.setKey(_api_key_);
  this.NextToken = "";
  this.paginationStartOffset = 0;
  this.paginationPerPage = 10;
  this.totalResult = 0;
  this.itemPerPage = 0;
  this.video_clip_db = null;
  this.channel_list = [];
};
dlworker.prototype.set_channel_list = function (object_list) {
  this.channel_list = object_list;
};
dlworker.prototype.setdb = function (object_db) {
  this.video_clip_db = object_db;
};
dlworker.prototype.start_channel_traveling = function (callback) {
  if (this.channel_list.length > 0) {
    async.eachSeries(
      /**
       * channel listing
       */
      this.channel_list,

      /**
       * support channel id
       * @param channel_id id is now
       * @param next_cb the callback
       */
      function (channel_id, next_cb) {
        this.listYtdData(channel_id, function (err) {
          next_cb();
        });
      }.bind(this),

      /**
       * error or complete
       * @param err
       */
      function (err) {
        console.log("> item out", "complete looping ids");
      });
  } else {
    console.log("> item out", "end of looping");
  }
};
var ensure_input = function (v) {
  if (_.isEmpty(v)) {
    return "";
  } else {
    return v;
  }
};

var ensure_int = function (v) {
  return parseInt(v);
};

var processThumbnails = function (from_snippet) {
  var outp = {};
  if (_.isEmpty(from_snippet.thumbnails)) {
    return outp;
  }
  var from_thumbnails = from_snippet.thumbnails;
  try {
    if (!_.isUndefined(from_thumbnails.default)) {
      outp.default = {};
      outp.default.url = ensure_input(from_thumbnails.default.url);
      outp.default.width = ensure_int(from_thumbnails.default.width);
      outp.default.height = ensure_int(from_thumbnails.default.height);
    }

    if (!_.isUndefined(from_thumbnails.medium)) {
      outp.medium = {};
      outp.medium.url = ensure_input(from_thumbnails.medium.url);
      outp.medium.width = ensure_int(from_thumbnails.medium.width);
      outp.medium.height = ensure_int(from_thumbnails.medium.height);
    }

    if (!_.isUndefined(from_thumbnails.high)) {
      outp.high = {};
      outp.high.url = ensure_input(from_thumbnails.high.url);
      outp.high.width = ensure_int(from_thumbnails.high.width);
      outp.high.height = ensure_int(from_thumbnails.high.height);
    }

    if (!_.isUndefined(from_thumbnails.standard)) {
      outp.standard = {};
      outp.standard.url = ensure_input(from_thumbnails.standard.url);
      outp.standard.width = ensure_int(from_thumbnails.standard.width);
      outp.standard.height = ensure_int(from_thumbnails.standard.height);
    }

    if (!_.isUndefined(from_thumbnails.maxres)) {
      outp.maxres = {};
      outp.maxres.url = ensure_input(from_thumbnails.maxres.url);
      outp.maxres.width = ensure_int(from_thumbnails.maxres.width);
      outp.maxres.height = ensure_int(from_thumbnails.maxres.height);
    }
  } catch (e) {
    console.log("> item", "=error=", e);
    console.log("> item", "=review properties=", from_thumbnails);
    return outp;
  }
  return outp;
};
//private
dlworker.prototype.constructFormat = function (formats_youtube_dl) {
  var just_all_meta = [];
  _.forEach(formats_youtube_dl, function (item) {
    var extmeta = {
      "format": ensure_input(item.format),
      "url": ensure_input(item.url),
      "hd_manifest_url": ensure_input(item.manifest_url),
      "vcodec": ensure_input(item.vcodec),
      "acodec": ensure_input(item.acodec),
      "format_note": ensure_input(item.format_note),
      "ext": ensure_input(item.ext),
      "format_id": ensure_input(item.format_id),
      "filesize": ensure_int(item.filesize),
      "width": ensure_int(item.width),
      "height": ensure_int(item.height)
    };
    if (_.isEmpty(extmeta.hd_manifest_url)) {
      delete extmeta.hd_manifest_url;
    }
    just_all_meta.push(extmeta);
  });
  return just_all_meta;
};

dlworker.prototype.updateExtInfo = function (videoId, formats_array, callback_next) {
  if (_.isObject(this.video_clip_db) && _.isArray(formats_array)) {
    console.log("> extracted formats from id:: ", videoId);

    this.video_clip_db.findOne({
      where: {
        "yt.clipid": videoId
      }
    }, function (err, r) {

      if (_.isEmpty(r)) {
        return callback_next(new Error("empty item found from video id" + videoId));
      }

      if (_.isError(err)) {
        console.log("> err is findOne... ", err);
        return callback_next(err);
      }

      //console.log("> scan and updateAttributes", videoId, r);
      r.updateAttributes({
        "yt.format": this.constructFormat(formats_array),
        "listing.enabled": true,
        "listing.searchable": true
      }, function (err, afterupdate) {
        if (_.isError(err)) {
          console.log("> err is here... ", err);
          return callback_next(err);
        }
        console.log("> update completed for ::", videoId);
        callback_next();
      });

    }.bind(this));

  } else {
    console.log("> validation on presistent Model failed:: ", videoId, this.video_clip_db);
  }
};
dlworker.prototype.loopScanInternalList = function () {
  var search_query = {
    where: {},
    limit: this.paginationPerPage,
    skip: this.paginationStartOffset
  };

  console.log("> seee", "where to start it now locally:: ", search_query);
  this.video_clip_db.find(search_query, function (err, docs_array) {

    if (_.isError(err)) {
      console.log("> seeeerr", err);
      return;
    }

    var items = docs_array.length;

    async.eachSeries(
      /**
       * end of eachSeries
       * @param err
       */
      docs_array,

      /**
       * end of eachSeries
       * @param err
       */
      function (val, nextaction) {

        if (_.isEmpty(val.yt.clipid)) {
          console.log("> check val", val, "========Youtube id is not valid=====>>>");
          return;
        }

        var pJsonNow = new pyJson();
        var v_id_m = val.yt.clipid;

        pJsonNow.extFormatsV2(v_id_m, function (list_array) {

          this.updateExtInfo(v_id_m, list_array, function (err) {
            if (_.isError(err)) {
              console.log("> err", err);
              return;
            }

            nextaction();
          });

        }.bind(this));

      }.bind(this),

      /**
       * end of eachSeries
       * @param err
       */
      function (err) {

        if (items < this.paginationPerPage) {
          console.log("> item", "================================");
          console.log("> item", "============ END PAGINATION =========");
          console.log("> item", "================================");
        } else {
          this.loopScanInternalListNextPage();
        }

      }.bind(this)
    );
  }.bind(this));
};

dlworker.prototype.loopScanInternalListNextPage = function () {
  this.paginationStartOffset += this.paginationPerPage;
  this.loopScanInternalList();
};
dlworker.prototype.checkVideoOrientationPortrait = function (formats) {
  var is_portrait = false;
  _.forEach(formats, function (format) {
    if (_.isNaN(format.width) || _.isNaN(format.height)) {
    } else {
      if (_.parseInt(format.width) < _.parseInt(format.height)) {
        return is_portrait = true;
      }
    }
  });
  return is_portrait;
};
/**
 * use custom api to update channel info
 * @param channel_id
 * @param callback_next
 */
dlworker.prototype.listYtdData = function (channel_id, callback_next) {
//getListVsIdsFromChannel
  var pJsonNow = new pyJson();
  var process_ids = [];
  async.series([
    function (callback) {
      pJsonNow.harvestChannelContentIds(channel_id, function (list_ids) {
        process_ids = list_ids;
        callback(null, "next");
      });
    },
    function (callback) {
      async.eachSeries(
        process_ids,

        /**
         * loop item
         * @param err error is here
         * @param result result
         */
        function (video_id, cb_next_item) {

          if (_.isObject(this.video_clip_db)) {
            this.video_clip_db.findOne({
              where: {
                "yt.clipid": video_id
              }
            }, function (err, result_document) {
              if (_.isError(err)) {
                console.log("technical error from db", err);
                return;
              }

              var pyExt = new pyJson();
              pyExt.extFullArchive(video_id, function (archive) {
                if (!this.checkVideoOrientationPortrait(archive.formats)) {
                  console.log("> ===========================================");
                  console.log("> Video orientation not portrait we now skip");
                  console.log("> ===========================================");
                  return cb_next_item();
                }
                /**
                 * result is empty and it is here
                 */
                if (_.isEmpty(result_document)) {
                  console.log("> ==============================");
                  console.log("> Create Clip Data ========= :: ");
                  console.log("> ==============================");
                  if (_.isFunction(this.video_clip_db.create)) {
                    this.video_clip_db.create({
                        "yt": {
                          "clipid": video_id,
                          "default_format_id": ensure_int(archive.format_id),
                          "title": ensure_input(archive.title),
                          "description": ensure_input(archive.description),
                          "format": this.constructFormat(archive.formats)
                        },
                        "listing": {
                          "enabled": false,
                          "searchable": false
                        }
                      },
                      function (err, clip) {
                        console.log("> clip data created ======= :: ", video_id);
                        if (_.isError(err)) {
                          console.log("> error from after ======= :: ", err);
                          return cb_next_item(err);
                        }

                        return cb_next_item();
                      });
                  }
                } else {
                  /**
                   * do the update
                   */
                  this.updateExtInfo(video_id, archive.formats, function (err) {
                    if (_.isError(err)) {
                      console.log("> err", err);
                      return;
                    }
                    console.log("> update clip format at ====== :: ", video_id);

                    return cb_next_item();
                  });
                }
                /**
                 * done with it
                 */
              }.bind(this));
              /**
               * end find one
               */
            }.bind(this));
            /**
             * end extFullArchieve
             */
          }
        }.bind(this),
        /**
         * end of eachSeries
         * @param err error is here
         */
        function done(err) {
          if (_.isError(err)) {
            console.error(err.message);
          }
          callback(null, "tow");
        }
      );
    }.bind(this)

  ], function (err, results) {
    if (_.isError(err)) {
      console.error(err);
    }
    callback_next(null, "done");
  });
};
dlworker.prototype.gDataUpdateInfoApi = function (item, callback_next) {
  if (show_debug_list) {
    console.log("> item", "================================");
    console.log("> item", "============ page Info =========");
    console.log("> item", "================================");
    console.log(JSON.stringify(item, null, 2));
    console.log("> item", "================================");
  }
  if (_.isObject(this.video_clip_db)) {
    this.video_clip_db.findOne({
      where: {
        "yt.clipid": item.snippet.resourceId.videoId
      }
    }, function (err, r) {
      if (_.isError(err)) {
        console.log("technical error from db", err);
        return;
      }
      if (_.isEmpty(r)) {
        console.log("> ==========================");
        console.log("> Create Clip Data ===============");
        if (_.isFunction(this.video_clip_db.create)) {
          this.video_clip_db.create({
            "yt": {
              "clipid": item.snippet.resourceId.videoId,
              "publishedT": ensure_input(item.snippet.publishedAt),
              "title": ensure_input(item.snippet.title),
              "description": ensure_input(item.snippet.description),
              "thumbsnails": processThumbnails(item.snippet)
            },

            "listing": {
              "enabled": false,
              "searchable": false
            }

          }, function (err, clip) {
            console.log("> clip data created ===================== :: ", item.snippet.resourceId.videoId);
            if (_.isFunction(callback_next)) {
              if (_.isError(err)) {
                return callback_next(err);
              }
              return callback_next();
            }
          });
        }
      } else {
        console.log("> clip data skipped ===================== :: ", item.snippet.resourceId.videoId);
        if (_.isFunction(callback_next)) {
          return callback_next();
        }
      }
    }.bind(this));
  } else {
    if (_.isFunction(callback_next)) {
      console.log("> no db is found =====================");
      return callback_next();
    }
  }
};

dlworker.prototype.scanItemAt = function (clip_video_id, bool_return, callbacknext) {
  var pJsonNow = new pyJson();
  console.log("> item", ">>>>>>>>> scan 1 >>>>>>>>>>>");
  pJsonNow.extFormatsV2(clip_video_id, function (dat) {
    console.log("> item", ">>>>>>>>> scan 2 >>>>>>>>>>>");
    this.updateExtInfo(clip_video_id, dat, function (err) {
      console.log("> item", ">>>>>>>>> scan 3 >>>>>>>>>>>");
      if (_.isError(err)) {
        return callbacknext(err);
      }
      if (bool_return) {
        this.video_clip_db.findOne({
          where: {
            "yt.clipid": clip_video_id
          }
        }, function (err, doc) {
          if (_.isError(err)) {
            return callbacknext(err);
          }
          console.log("> item", ">>>>>>>>> scan 4 >>>>>>>>>>>");
          callbacknext(null, doc);
        });
      } else {
        callbacknext(null, 'done');
      }
    }.bind(this));
  }.bind(this));
};


dlworker.prototype.nextPage = function () {
  this._staticYT.addParam("pageToken", this.NextToken);
  console.log("> item", ">>>>>>>>> next page Info >>>>>>>>>>>");
  this.initList();
};
/**
 * use the google api provided to get update the user channel list.
 */
dlworker.prototype.initList = function () {
  console.log(playlistid);
  this._staticYT.getPlayListsItemsById(playlistid, function (error, result) {
    if (_.isError(error) || _.isEmpty(result)) {

      if (_.isError(error)) {
        console.log("> item", "Error..", error);
        return;
      }

      if (_.isEmpty(result)) {
        console.log("> item", "no result", result);
        return;
      }

    } else {

      var nextPage = result.nextPageToken;
      this.NextToken = nextPage;
      this.totalResult = result.pageInfo.totalResults;
      this.itemPerPage = result.pageInfo.resultsPerPage;


      var t = 0;
      async.eachSeries(
        result.items,
        function (val, callback_nxt_iter) {

          async.series([

              /**
               * update local dat
               */
              function (callbacknext) {
                this.gDataUpdateInfoApi(val, function (err) {
                  if (_.isError(err)) {
                    return callback_nxt_iter(err);
                  }

                  callbacknext(null, 'one');
                }.bind(this));
              }.bind(this),


              /**
               * get format and meta data
               */
              function (callbacknext) {
                var pJsonNow = new pyJson();
                var v_id_m = val.snippet.resourceId.videoId;
                pJsonNow.extFormatsV2(v_id_m, function (dat) {
                  this.updateExtInfo(v_id_m, dat, function (err) {
                    if (_.isError(err)) {
                      return callback_nxt_iter(err);
                    }
                    callbacknext(null, 'two');
                  });

                });
              }.bind(this)


            ],
            function (err, results) {
              // results is now equal to ['one', 'two']
              if (t == this.itemPerPage - 1) {
                if (!_.isUndefined(this.NextToken)) {
                  this.nextPage();
                } else {
                  console.log("> item", "Scan for this playlist complete..");
                }
              } else {
                t++;
                callback_nxt_iter();
              }
            }.bind(this));


        }.bind(this),


        /**
         * end of eachSeries
         * @param err
         */
        function done(err) {
          if (_.isError(err)) {
            console.error(err.message);
          }
        });
    }
  }.bind(this));
};
module.exports = {
  listitems: function () {
    var dm66k_ds = new dlworker();
    dm66k_ds.initList();
  },
  listp: function (video_clip_db) {
    var dm87 = new dlworker();
    dm87.setdb(video_clip_db);
    dm87.initList();
  },
  listLoopLocal: function (video_clip_db) {
    var dd_ml = new dlworker();
    dd_ml.setdb(video_clip_db);
    dd_ml.loopScanInternalList();
  },
  updateSingleClip: function (video_cl_db, bool_return, video_id, callback) {
    var dd_ml = new dlworker();
    dd_ml.setdb(video_cl_db);
    dd_ml.scanItemAt(video_id, bool_return, callback);
  },
  update_db_by_channel: function (video_cl_db, channel_id, callback) {
    var dd_ml = new dlworker();
    dd_ml.setdb(video_cl_db);
    dd_ml.listYtdData(channel_id, callback);
  },
  update_db_and_loop_channel: function (video_cl_db, callback) {
    var dd_ml = new dlworker();
    dd_ml.setdb(video_cl_db);
    dd_ml.set_channel_list(require(".././meta/scan_channel_list.json"));
    dd_ml.start_channel_traveling(callback);
  },
  listTesting: function () {
    var jText = new pyJson();
    jText.extFormatsV3(function (list_array) {


    });
  }
};