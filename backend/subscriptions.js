const FileSync = require('lowdb/adapters/FileSync')

var fs = require('fs-extra');
const { uuid } = require('uuidv4');
var path = require('path');

var youtubedl = require('youtube-dl');
const config_api = require('./config');

const debugMode = process.env.YTDL_MODE === 'debug';

var logger = null;
var db = null;
var users_db = null;
function setDB(input_db, input_users_db) { db = input_db; users_db = input_users_db } 
function setLogger(input_logger) { logger = input_logger; }

function initialize(input_db, input_users_db, input_logger) {
    setDB(input_db, input_users_db);
    setLogger(input_logger);
}

async function subscribe(sub, user_uid = null) {
    const result_obj = {
        success: false,
        error: ''
    };
    return new Promise(async resolve => {
        // sub should just have url and name. here we will get isPlaylist and path
        sub.isPlaylist = sub.url.includes('playlist');

        let url_exists = false;

        if (user_uid)
            url_exists = !!users_db.get('users').find({uid: user_uid}).get('subscriptions').find({url: sub.url}).value()
        else
            url_exists = !!db.get('subscriptions').find({url: sub.url}).value();

        if (url_exists) {
            logger.info('Sub already exists');
            result_obj.error = 'Subcription with URL ' + sub.url + ' already exists!';
            resolve(result_obj);
            return;
        }

        // add sub to db
        if (user_uid)
            users_db.get('users').find({uid: user_uid}).get('subscriptions').push(sub).write();
        else
            db.get('subscriptions').push(sub).write();

        let success = await getSubscriptionInfo(sub, user_uid);
        result_obj.success = success;
        result_obj.sub = sub;
        getVideosForSub(sub, user_uid);
        resolve(result_obj);
    });
    
}

async function getSubscriptionInfo(sub, user_uid = null) {
    let basePath = null;
    if (user_uid)
        basePath = path.join(config_api.getConfigItem('ytdl_users_base_path'), user_uid, 'subscriptions');
    else
        basePath = config_api.getConfigItem('ytdl_subscriptions_base_path');

    return new Promise(resolve => {
        // get videos 
        let downloadConfig = ['--dump-json', '--playlist-end', '1']
        youtubedl.exec(sub.url, downloadConfig, {}, function(err, output) {
            if (debugMode) {
                logger.info('Subscribe: got info for subscription ' + sub.id);
            }
            if (err) {
                logger.error(err.stderr);
                resolve(false);
            } else if (output) {
                if (output.length === 0 || (output.length === 1 && output[0] === '')) {
                    logger.verbose('Could not get info for ' + sub.id);
                    resolve(false);
                }
                for (let i = 0; i < output.length; i++) {
                    let output_json = null;
                    try {
                        output_json = JSON.parse(output[i]);
                    } catch(e) {
                        output_json = null;
                    }
                    if (!output_json) {
                        continue;
                    }
                    if (!sub.name) {
                        sub.name = sub.isPlaylist ? output_json.playlist_title : output_json.uploader;
                        // if it's now valid, update
                        if (sub.name) {
                            if (user_uid)
                                users_db.get('users').find({uid: user_uid}).get('subscriptions').find({id: sub.id}).assign({name: sub.name}).write();
                            else
                                db.get('subscriptions').find({id: sub.id}).assign({name: sub.name}).write();
                        }
                    }

                    const useArchive = config_api.getConfigItem('ytdl_subscriptions_use_youtubedl_archive');
                    if (useArchive && !sub.archive) {
                        // must create the archive
                        const archive_dir = path.join(__dirname, basePath, 'archives', sub.name);
                        const archive_path = path.join(archive_dir, 'archive.txt');

                        // creates archive directory and text file if it doesn't exist
                        fs.ensureDirSync(archive_dir);
                        fs.ensureFileSync(archive_path);

                        // updates subscription
                        sub.archive = archive_dir;
                        if (user_uid)
                            users_db.get('users').find({uid: user_uid}).get('subscriptions').find({id: sub.id}).assign({archive: archive_dir}).write();
                        else
                            db.get('subscriptions').find({id: sub.id}).assign({archive: archive_dir}).write();
                    }

                    // TODO: get even more info

                    resolve(true);
                }
                resolve(false);
            }
        });
    });
}

async function unsubscribe(sub, deleteMode, user_uid = null) {
    return new Promise(async resolve => {
        let basePath = null;
        if (user_uid)
            basePath = path.join(config_api.getConfigItem('ytdl_users_base_path'), user_uid, 'subscriptions');
        else
            basePath = config_api.getConfigItem('ytdl_subscriptions_base_path');
        let result_obj = { success: false, error: '' };

        let id = sub.id;
        if (user_uid)
            users_db.get('users').find({uid: user_uid}).get('subscriptions').remove({id: id}).write();
        else
            db.get('subscriptions').remove({id: id}).write();

        const appendedBasePath = getAppendedBasePath(sub, basePath);
        if (deleteMode && fs.existsSync(appendedBasePath)) {
            if (sub.archive && fs.existsSync(sub.archive)) {
                const archive_file_path = path.join(sub.archive, 'archive.txt');
                // deletes archive if it exists
                if (fs.existsSync(archive_file_path)) {
                    fs.unlinkSync(archive_file_path);
                }
                fs.rmdirSync(sub.archive);
            }
            deleteFolderRecursive(appendedBasePath);
        }
    });

}

async function deleteSubscriptionFile(sub, file, deleteForever, user_uid = null) {
    let basePath = null;
    if (user_uid)
        basePath = path.join(config_api.getConfigItem('ytdl_users_base_path'), user_uid, 'subscriptions');
    else
        basePath = config_api.getConfigItem('ytdl_subscriptions_base_path');
    const useArchive = config_api.getConfigItem('ytdl_subscriptions_use_youtubedl_archive');
    const appendedBasePath = getAppendedBasePath(sub, basePath);
    const name = file;
    let retrievedID = null;
    return new Promise(resolve => {
        let filePath = appendedBasePath;
        var jsonPath = path.join(__dirname,filePath,name+'.info.json');
        var videoFilePath = path.join(__dirname,filePath,name+'.mp4');
        var imageFilePath = path.join(__dirname,filePath,name+'.jpg');

        jsonExists = fs.existsSync(jsonPath);
        videoFileExists = fs.existsSync(videoFilePath);
        imageFileExists = fs.existsSync(imageFilePath);

        if (jsonExists) {
            retrievedID = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))['id'];
            fs.unlinkSync(jsonPath);
        }

        if (imageFileExists) {
            fs.unlinkSync(imageFilePath);
        }

        if (videoFileExists) {
            fs.unlink(videoFilePath, function(err) {
                if (fs.existsSync(jsonPath) || fs.existsSync(videoFilePath)) {
                    resolve(false);
                } else {
                    // check if the user wants the video to be redownloaded (deleteForever === false)
                    if (!deleteForever && useArchive && sub.archive && retrievedID) {
                        const archive_path = path.join(sub.archive, 'archive.txt')
                        // if archive exists, remove line with video ID
                        if (fs.existsSync(archive_path)) {
                            removeIDFromArchive(archive_path, retrievedID);
                        }
                    }
                    resolve(true);
                }
            });
        } else {
            // TODO: tell user that the file didn't exist
            resolve(true);
        }
        
    });
}

async function getVideosForSub(sub, user_uid = null) {
    return new Promise(resolve => {
        if (!subExists(sub.id, user_uid)) {
            resolve(false);
            return;
        }

        // get sub_db
        let sub_db = null;
        if (user_uid)
            sub_db = users_db.get('users').find({uid: user_uid}).get('subscriptions').find({id: sub.id});
        else
            sub_db = db.get('subscriptions').find({id: sub.id});

        // get basePath
        let basePath = null;
        if (user_uid)
            basePath = path.join(config_api.getConfigItem('ytdl_users_base_path'), user_uid, 'subscriptions');
        else
            basePath = config_api.getConfigItem('ytdl_subscriptions_base_path');

        const useArchive = config_api.getConfigItem('ytdl_subscriptions_use_youtubedl_archive');

        let appendedBasePath = null
        if (sub.name) {
            appendedBasePath = getAppendedBasePath(sub, basePath);
        } else {
            appendedBasePath = path.join(basePath, (sub.isPlaylist ? 'playlists/%(playlist_title)s' : 'channels/%(uploader)s'));
        }

        let downloadConfig = ['-o', appendedBasePath + '/%(title)s.mp4', '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '-ciw', '--write-info-json', '--print-json'];

        let archive_dir = null;
        let archive_path = null;

        if (useArchive) {
            if (sub.archive) {
                archive_dir = sub.archive;
                archive_path = path.join(archive_dir, 'archive.txt')
            }
            downloadConfig.push('--download-archive', archive_path);
        }

        // if streaming only mode, just get the list of videos
        if (sub.streamingOnly) {
            downloadConfig = ['-f', 'best', '--dump-json'];
        }

        if (sub.timerange) {
            downloadConfig.push('--dateafter', sub.timerange);
        }

        let useCookies = config_api.getConfigItem('ytdl_use_cookies');
        if (useCookies) {
            if (fs.existsSync(path.join(__dirname, 'appdata', 'cookies.txt'))) {
                downloadConfig.push('--cookies', path.join('appdata', 'cookies.txt'));
            } else {
                logger.warn('Cookies file could not be found. You can either upload one, or disable \'use cookies\' in the Advanced tab in the settings.');
            }
        }

        // get videos 
        logger.verbose('Subscription: getting videos for subscription ' + sub.name);
        youtubedl.exec(sub.url, downloadConfig, {}, function(err, output) {
            logger.verbose('Subscription: finished check for ' + sub.name);
            if (err && !output) {
                logger.error(err.stderr);
                if (err.stderr.includes('This video is unavailable')) {
                    logger.info('An error was encountered with at least one video, backup method will be used.')
                    try {
                        const outputs = err.stdout.split(/\r\n|\r|\n/);
                        for (let i = 0; i < outputs.length; i++) {
                            const output = JSON.parse(outputs[i]);
                            handleOutputJSON(sub, sub_db, output, i === 0)
                            if (err.stderr.includes(output['id']) && archive_path) {
                                // we found a video that errored! add it to the archive to prevent future errors
                                fs.appendFileSync(archive_path, output['id']);
                            }
                        }
                    } catch(e) {
                        logger.error('Backup method failed. See error below:');
                        logger.error(e);
                    }
                }
                resolve(false);
            } else if (output) {
                if (output.length === 0 || (output.length === 1 && output[0] === '')) {
                    logger.verbose('No additional videos to download for ' + sub.name);
                    resolve(true);
                }
                for (let i = 0; i < output.length; i++) {
                    let output_json = null;
                    try {
                        output_json = JSON.parse(output[i]);
                    } catch(e) {
                        output_json = null;
                    }
                    if (!output_json) {
                        continue;
                    }

                    const reset_videos = i === 0;
                    handleOutputJSON(sub, sub_db, output_json, reset_videos);

                    // TODO: Potentially store downloaded files in db?
        
                }
                resolve(true);
            }
        });
    }, err => {
        logger.error(err);
    });
}

function handleOutputJSON(sub, sub_db, output_json, reset_videos = false) {
    if (sub.streamingOnly) {
        if (reset_videos) {
            sub_db.assign({videos: []}).write();
        }

        // remove unnecessary info
        output_json.formats = null;

        // add to db
        sub_db.get('videos').push(output_json).write();
    } else {
        // TODO: make multiUserMode obj
        db_api.registerFileDB(output_json['_filename'], sub.type, multiUserMode, sub);
    }
}

function getAllSubscriptions(user_uid = null) {
    if (user_uid)
        return users_db.get('users').find({uid: user_uid}).get('subscriptions').value();
    else
        return db.get('subscriptions').value();
}

function getSubscription(subID, user_uid = null) {
    if (user_uid)
        return users_db.get('users').find({uid: user_uid}).get('subscriptions').find({id: subID}).value();
    else 
        return db.get('subscriptions').find({id: subID}).value();
}

function subExists(subID, user_uid = null) {
    if (user_uid)
        return !!users_db.get('users').find({uid: user_uid}).get('subscriptions').find({id: subID}).value();
    else
        return !!db.get('subscriptions').find({id: subID}).value();
}

// helper functions

function getAppendedBasePath(sub, base_path) {

    return path.join(base_path, (sub.isPlaylist ? 'playlists/' : 'channels/'), sub.name);
}

// https://stackoverflow.com/a/32197381/8088021
const deleteFolderRecursive = function(folder_to_delete) {
    if (fs.existsSync(folder_to_delete)) {
      fs.readdirSync(folder_to_delete).forEach((file, index) => {
        const curPath = path.join(folder_to_delete, file);
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(folder_to_delete);
    }
  };

function removeIDFromArchive(archive_path, id) {
    let data = fs.readFileSync(archive_path, {encoding: 'utf-8'});
    if (!data) {
        logger.error('Archive could not be found.');
        return;
    }

    let dataArray = data.split('\n'); // convert file data in an array
    const searchKeyword = id; // we are looking for a line, contains, key word id in the file
    let lastIndex = -1; // let say, we have not found the keyword

    for (let index=0; index<dataArray.length; index++) {
        if (dataArray[index].includes(searchKeyword)) { // check if a line contains the id keyword
            lastIndex = index; // found a line includes a id keyword
            break; 
        }
    }

    const line = dataArray.splice(lastIndex, 1); // remove the keyword id from the data Array

    // UPDATE FILE WITH NEW DATA
    const updatedData = dataArray.join('\n');
    fs.writeFileSync(archive_path, updatedData);
    if (line) return line;
    if (err) throw err;
}

module.exports = {
    getSubscription        : getSubscription,
    getAllSubscriptions    : getAllSubscriptions,
    subscribe              : subscribe,
    unsubscribe            : unsubscribe,
    deleteSubscriptionFile : deleteSubscriptionFile,
    getVideosForSub        : getVideosForSub,
    removeIDFromArchive    : removeIDFromArchive,
    setLogger              : setLogger,
    initialize             : initialize
}
