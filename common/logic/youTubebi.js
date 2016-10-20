/**
 * Created by hesk on 16年10月20日.
 */
var YouTube = require('youtube-node');
var dl = require('youtube-dl');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var api = "AIzaSyCG_xyQEnd6NsBRvunrjpqiBrWPBQfx0PU";
var playlistid = "PLr2mLhT8gDUK-pMnT4tJKRwUn2FxNNhAU";
var playlist = "https://www.googleapis.com/youtube/v3/playlists";
const __parentDir = path.dirname(module.main);
const show_debug_list = false;
var dlworker = function () {
  this._staticYT = new YouTube();
  this._staticYT.setKey(api);
  this.NextToken = "";
  this.totalResult = 0;
  this.itemPerPage = 0;
  this.video_clip_db = null;
};
dlworker.prototype.setdb = function (object_db) {
  this.video_clip_db = object_db;
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
      outp.default.width = ensure_input(from_thumbnails.default.width);
      outp.default.height = ensure_input(from_thumbnails.default.height);
    }

    if (!_.isUndefined(from_thumbnails.medium)) {
      outp.medium = {};
      outp.medium.url = ensure_input(from_thumbnails.medium.url);
      outp.medium.width = ensure_input(from_thumbnails.medium.width);
      outp.medium.height = ensure_input(from_thumbnails.medium.height);
    }

    if (!_.isUndefined(from_thumbnails.high)) {
      outp.high = {};
      outp.high.url = ensure_input(from_thumbnails.high.url);
      outp.high.width = ensure_input(from_thumbnails.high.width);
      outp.high.height = ensure_input(from_thumbnails.high.height);
    }

    if (!_.isUndefined(from_thumbnails.standard)) {
      outp.standard = {};
      outp.standard.url = ensure_input(from_thumbnails.standard.url);
      outp.standard.width = ensure_input(from_thumbnails.standard.width);
      outp.standard.height = ensure_input(from_thumbnails.standard.height);
    }

    if (!_.isUndefined(from_thumbnails.maxres)) {
      outp.maxres = {};
      outp.maxres.url = ensure_input(from_thumbnails.maxres.url);
      outp.maxres.width = ensure_input(from_thumbnails.maxres.width);
      outp.maxres.height = ensure_input(from_thumbnails.maxres.height);
    }
  } catch (e) {
    console.log("> item", "=error=", e);
    console.log("> item", "=review properties=", from_thumbnails);
    return outp;
  }
  return outp;
};
dlworker.prototype.updateInfo = function (item, callback_next) {
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
              "enabled": true,
              "searchable": true
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
dlworker.prototype.nextPage = function () {
  this._staticYT.addParam("pageToken", this.NextToken);
  console.log("> item", ">>>>>>>>> next page Info >>>>>>>>>>>");
  this.initList();
};
dlworker.prototype.initList = function () {
  this._staticYT.getPlayListsItemsById(playlistid, function (error, result) {
    if (_.isError(error)) {
      console.log("> item", "Error..", error);
    } else {
      var nextPage = result.nextPageToken;
      this.NextToken = nextPage;
      this.totalResult = result.pageInfo.totalResults;
      this.itemPerPage = result.pageInfo.resultsPerPage;
      var t = 0;
      async.eachSeries(
        result.items,

        function (val, callback_nxt_iter) {

          this.updateInfo(val,

            function (err) {
              if (_.isError(err)) {
                return callback_nxt_iter(err);
              } else {
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
              }
            }.bind(this));
        }.bind(this),


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
    var dm = new dlworker();
    dm.initList();
  },
  listp: function (video_clip_db) {
    var dm = new dlworker();
    dm.setdb(video_clip_db);
    dm.initList();
  }
};