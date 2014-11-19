// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

main();

function readConfig(configFilePath) {
    var configFile = new File(configFilePath);
    configFile.open('r');
    var configStr = "";
    while (!configFile.eof) {
        configStr += configFile.readln();
    }
    configFile.close();
    configStr = configStr.replace(/(^\s*)|(\s*$)/g,"");
    var result = eval('('+configStr+')');

    if (!result.no) {
        result.no = File($.fileName).parent.name;
    } else if (result.no == ""){
        alert("请设置产品编号");
    }

    var keyword = result.keyword;
    var no = result.no;
    for (var i in result.config) {
        var setting = result.config[i].setting;
        for (var j in setting) {
            var saveinfo = setting[j].saveinfo;
            for (var k in saveinfo) {
                var saveName = eval(saveinfo[k].name);
                var saveNameRegExp = new RegExp("[^A-Za-z0-9-_.]", "g");
                if (saveNameRegExp.test(saveName)) {
                    saveName = saveName.replace(saveNameRegExp, "-");
                }
                saveinfo[k].name = saveName;

                saveinfo[k].visibleMask =
                    !saveinfo[k].visibleMask ? result.config[i].mask : saveinfo[k].visibleMask;
            }
        }
    }
    return result;
}

function endsWith(string, subffix) {
    return string.indexOf(subffix, string.length - subffix.length) !== -1;
}

//~ 打开脚本当前目录下的所有psd文件
function openPSDs() {
    var folder = new Folder((new File($.fileName)).parent);
    var fileList  = folder.getFiles();
    for (var i = 0; i < fileList.length; i++)  {
        var file  = fileList[i];
        if (endsWith(file.name, "psd")) {
            app.open(file);
        }
    }
}

function main() {
    // 读取所有打开的document
    var docs = app.documents;
    if (docs.length == 0) {
        openPSDs();
    }
    var config = readConfig(app.activeDocument.path + "/config.json");
    // 循环存储
    while (0 < docs.length) {
        handleDocs(app.activeDocument, config);
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
    alert("处理结束！");
}

function handleDocs(doc, setting) {
    doc.changeMode(ChangeMode.RGB);
//~     try {
//~         doc.rasterizeAllLayers();
//~     } catch (err) {
//~         alert(err);
//~     }
    doc.save();

//~ 决定要处理的方式并处理
    var config = setting.config;
    for (var i in config) {
        if (doc.name == config[i].name) {
            var configSetting = config[i].setting;
            for (var j in configSetting) {
                var mask = config[i].mask;
                var width = configSetting[j].size[0];
                var height = configSetting[j].size[1];
                var saveInfo = configSetting[j].saveinfo;
                saveCurrentSize(doc, mask, width, height, saveInfo);
            }
        }
    }
}

//~ 图片保存
function saveCurrentSize(doc, mask, width, height, saveInfo) {
    var state = doc.activeHistoryState;
    doc.resizeImage(UnitValue(width, "px"), UnitValue(height, "px"), null, ResampleMethod.BICUBIC);
    for (var i in saveInfo) {
        if (!saveInfo[i].directSave) {
            saveLayers(doc, mask, saveInfo[i].visibleMask, saveInfo[i].path, saveInfo[i].name);
        } else {
            setAllLayerVisible(doc, true);
            directSave(doc, saveInfo[i].path, saveInfo[i].name);
        }
    }

    doc.activeHistoryState = state;
}

function saveLayers(doc, mask, visibleMask, path, name) {
    setVisibleMask(doc, visibleMask);
    var j = 1;
    for (var i = doc.layers.length-1; i > 0; i--) {
        var state = doc.activeHistoryState;

        var currentLayer = doc.layers[i];
        currentLayer.visible = true;
        if (!isMaskLayer(currentLayer.name, mask)) {
            directSave(doc, path, j++ + "-" + name);
        }

        doc.activeHistoryState = state;
    }
}

function directSave(doc, path, name) {
    var savePath = doc.path + path;

    if (!Folder(savePath).exists) {
        new Folder(savePath).create();
    }

    saveForWeb(doc, new File(savePath + name + ".jpg"), SaveDocumentType.JPEG);
}

function setAllLayerVisible(doc, visible) {
    for (var i = 0; i < doc.layers.length; i++) {
        doc.layers[i].visible = visible;
    }
}

//~ 设置图层可见性
function setVisibleMask(doc, visibleMask) {
    setAllLayerVisible(doc, false);
    for (var i in visibleMask) {
        doc.layers.getByName(visibleMask[i]).visible = true;
    }
}

function isMaskLayer(layerName, mask) {
    for (var i = 0; i < mask.length; i++) {
        if (layerName == mask[i]) {
            return true;
        }
    }
    return false;
}

function saveForWeb(doc, file, format) {
    var saveOptions = new ExportOptionsSaveForWeb();
    saveOptions.format = format;
    saveOptions.includeProfile = false;
    saveOptions.interlaced = 0;
    saveOptions.optimized = true;
    saveOptions.quality = 60;
    doc.exportDocument(file, ExportType.SAVEFORWEB, saveOptions);
}
