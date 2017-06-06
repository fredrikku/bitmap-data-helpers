
/* 
Helps to convert image files before and after sending over http
*/
/* 
API: 
buffer: bin2str, str2bin, str2buf, buf2str; 
dataUrl: makeOne, unmakeOne, mimeTypeOf, addPrefixTo, removePrefixFrom ; 
zip: 2url, 2buf, 2list, extractOne;
b64: encode, decode
*/
var helpers = module.exports = { 
    b64: {
        encode: encodeToBase64, 
        decode: decodeFromBase64
    }, 
    buffer: { 
        str2bin: str2bin, 
        bin2str: bin2str, 
        str2buf: str2buf,
        buf2str: buf2str
    },
    dataUrl: {
        makeOne: makeDataUrl,
        makeOneAsync: makeDataUrlPromise,
        unmakeOne: unmakeDataUrl, 
        mimeTypeOf: mimeTypeOfDataUrl, 
        addPrefixTo: addPrefixToDataUrl, 
        removePrefixFrom: removePrefixFromDataUrl 
    },
    zip: {  zip2url: zipBufferToDataUrl, //TODO: test and improve promise-list
            zip2buf: zipBufferToImageBuffer,
            zip2list: zipBufferToFileList, //working
            extractOne: extractOne
    },
    /*TODO: optional blobs instead of dataURLs
    blob: { 
        buf2blob: {}, 
        blob2url: {}
    },*/
    default: {default: null}
};
module.exports.tonicEndpoint = myEndpoint;

var btoa = require("btoa");
var atob = require("atob");
var JSZip = require("jszip"); 
var Promise = require("bluebird");

//Following functions async/promisified wherever supported by
//utilized libraries. 

function encodeToBase64 (binarystring) {
    return btoa(binarystring);
}
function decodeFromBase64 (b64str) {
    return atob(b64str);
}
function str2bin (textstring) {
    var binarystring = "";
    for(var i=0, strLen=textstring.length; i < strLen; i++) {
        binarystring += textstring.charCodeAt(i);
    }
    return binarystring;
}
function bin2str (binarystring, bytelength) {
    var textstring = "";
    var bits = bytelength || 16;
    for (var i=0; i+bits < binarystring.length; i+=bits) {
        textstring += String.fromCharCode(binarystring.substring(i, i+bits));
    }
    return textstring;
}
function str2buf (str, decoding) {
    if(decoding) {
        str = decodeFromBase64(str);
    }
    return Buffer.from(str);
}
function buf2str (buf, encoding) {
    return buf.toString(encoding);
}
function makeDataUrl (buffer) {
    var b64string = buf2str(buffer, "base64");
    return addPrefixToDataUrl("image/png", b64string);
}
async function makeDataUrlPromise (bufferPromise) {
    var b64string = buf2str(await bufferPromise, "base64");
    return addPrefixToDataUrl("image/png", b64string);
}
function unmakeDataUrl (dataUrl, encoding) {
    var b64string = removePrefixFromDataUrl(dataUrl);
    return Buffer.from(b64string, encoding);
}
function mimeTypeOfDataUrl (dataUrl) {
    return dataUrl.slice(5, 13);
}
function addPrefixToDataUrl (mimeType, b64body) {
    return "data:"+mimeType+";base64,"+ (b64body || "");
}
function removePrefixFromDataUrl (dataUrl) {
    return dataUrl.slice(22, dataUrl.length-1);
}
async function zipBufferToDataUrl (b64zipbuf) {
    return _zipBufferTo(b64zipbuf, "dataurl");   
}
async function zipBufferToImageBuffer (b64zipbuf) {
    return _zipBufferTo(b64zipbuf, "buffer");   
}
async function extractOne ( zipEntry, onProgress ) {
    if(typeof onProgress === 'function') {
       return zipEntry.async("nodebuffer", onProgress);
    }
    else {
        return zipEntry.async("nodebuffer");
    }  
}
async function _zipBufferTo (b64zipbuf, BUF_OR_URL) {
    
    var imageBatch = await zipBufferToFileList(b64zipbuf); 
    
    var imageNames = Object.getOwnPropertyNames(imageBatch);
    var unzipPromises = [];
    for(var i=0; i<imageNames.length; i++) {
        var compressedData = imageBatch[imageNames[i]];
        //promisify output after selecting format
        switch(BUF_OR_URL){
            case "buffer":
                imageBatch[imageNames[i]] = extractOne(compressedData);
                break;
            case "dataurl": 
                imageBatch[imageNames[i]] = makeDataUrlPromise(extractOne(compressedData));
                break;
        }
        //add to aggregate in order to await all
        unzipPromises.push(imageBatch[imageNames[i]]);
    }
    var unzippedList = await Promise.all(unzipPromises);
    Object.keys(imageBatch).map(function(key, index) {
        imageBatch[key] = unzippedList[index];
    });
    return imageBatch;
    
}
async function zipBufferToFileList (b64zipbuf) {
    
    let binarystring = buf2str(b64zipbuf); 
    let zip = await JSZip.loadAsync(binarystring, {base64: true});
    if(typeof zip.files !== "object") {
        throw "fail: zip load";
    }
    
    //get full file-names, and layer names
    let fileNames = Object.getOwnPropertyNames(zip.files);
    var imageNames = [];
    zip.forEach(_fetchImageName);
    var batch = {};    
    
    for(let i=0; i < imageNames.length; i++) {
        Object.defineProperty(batch, imageNames[i], {
            configurable: false,
            enumerable: true, 
            value: zip.files[fileNames[i]],
            writable: true
        });
    }
    return batch;
   
    function _fetchImageName (filePath, zipEntry) {
        let fileName = zipEntry.name;
        
        if (fileName.includes(".png")) {
            let newName = zipEntry.name.slice(0, zipEntry.name.length-4);
            imageNames.push(newName);
        }
        else if(fileName.includes(".json")){
           _handleJSON();
           
        }
    }
    function _handleJSON () {
        //TODO: provide definitions in advance
    }    
    function _appendImageXMP () {
        //TODO: accompany dataurl with metadata
    }
}

/* 
How to use:
*/

var http = await require("promise-http").client;
var url = "https://pastebin.com/raw/u7e7WyFq";
//where file is b64-encoded zip-file containing png-files (no folders
var b64Buffer = await http.get(url);
//await zipBufferToFileList(b64Buffer);
//await zipBufferToImageBuffer(b64Buffer);
await zipBufferToDataUrl(b64Buffer);

/* 
TODO: test endpoint for accessing specific helper functions
*/

async function myEndpoint(req, res) {
    req.url = req.url || "";
    var obj = require('url').parse(req.url, true).query.url;
    var helperName = obj["run"] || "default.default"; 
    var topHelper = helperName.split(".", 0);
    var subHelper = helperName.split(".", 1);
    var arg1 = obj["arg1"] || null;
    var arg2 = obj["arg2"] || undefined;
    res.end(helpers[topHelper][subHelper](arg1, arg2));
}

