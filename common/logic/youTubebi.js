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
const show_debug_list = true;
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
        console.log("> ========================");
        this.video_clip_db.create({
          "yt": {
            "clipid": item.snippet.resourceId.videoId,
            "publishedT": item.snippet.publishedAt,
            "title": item.snippet.title,
            "description": item.snippet.description,
            "thumbsnails": {
              "default": {
                "url": item.snippet.thumbnails.default.url,
                "width": item.snippet.thumbnails.default.width,
                "height": item.snippet.thumbnails.default.height
              },
              "medium": {
                "url": item.snippet.thumbnails.medium.url,
                "width": item.snippet.thumbnails.medium.width,
                "height": item.snippet.thumbnails.medium.height
              },
              "high": {
                "url": item.snippet.thumbnails.high.url,
                "width": item.snippet.thumbnails.high.width,
                "height": item.snippet.thumbnails.high.height
              },
              "standard": {
                "url": item.snippet.thumbnails.standard.url,
                "width": item.snippet.thumbnails.standard.width,
                "height": item.snippet.thumbnails.standard.height
              },
              "maxres": {
                "url": item.snippet.thumbnails.maxres.url,
                "width": item.snippet.thumbnails.maxres.width,
                "height": item.snippet.thumbnails.maxres.height
              }
            }
          },
          "listing.enabled": true,
          "listing.searchable": true
        }, function (err, rcallback) {
          console.log("> clip data created ===================== :: ", item.snippet.resourceId.videoId);
          if (_.isFunction(callback_next)) {
            callback_next();
          }
        });
      } else {
        console.log("> clip data skipped ===================== :: ", item.snippet.resourceId.videoId);
        if (_.isFunction(callback_next)) {
          callback_next();
        }
      }
    });
  } else {
    if (_.isFunction(callback_next)) {
      console.log("> no db is found =====================");
      callback_next();
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
      async.forEachOf(result.items, function (val, key, callback) {
        this.updateInfo(val, function () {
          if (key == this.itemPerPage - 1) {
            if (!_.isUndefined(this.NextToken)) {
              this.nextPage();
            } else {
              console.log("> item", "Scan for this playlist complete..");
            }
          }
          callback();
        });

      }.bind(this), function (err) {
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