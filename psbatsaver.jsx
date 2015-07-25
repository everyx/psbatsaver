// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

main();

function main() {
  var preDocPath='';
  var setting;

  var docLength = app.documents.length;
  while (docLength--) {
    var currentDoc = app.documents[docLength];
    if (preDocPath === '' || preDocPath != currentDoc.path) {
      setting = readJson(currentDoc.path + "./psbatsaver.json");
    }
    preDocPath = currentDoc.path;

    app.activeDocument = currentDoc;
    if (!currentDoc.saved && !confirm("源文件未保存，是否保存并开始处理")) {
      return;
    } else {
      currentDoc.save();
    }

    var currentRule = findRuleByDocName(setting.rules, currentDoc.name);
    handleDoc(currentDoc, currentRule);

    if (!isUndefinedOrNull(setting.autoClose) && setting.autoClose) {
      currentDoc.close(SaveOptions.DONOTSAVECHANGES);
    }
  }
}

function findRuleByDocName(rules, docName) {
  var result = '';
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (!isUndefinedOrNull(rule.target) && rule.target == docName) {
      result = rule;
      break;
    }
  }
  return result;
}

function isUndefinedOrNull(value) {
  return typeof value == "undefined" || value === "";
}

function readJson(path) {
  var jsonFile = new File(path);
  jsonFile.open('r');
  var jsonStr = "";
  while (!jsonFile.eof) {
      jsonStr += jsonFile.readln();
  }
  jsonFile.close();
  jsonStr = jsonStr.replace(/(^\s*)|(\s*$)/g,"");
  var result = eval('('+jsonStr+')');
  return result;
}

function handleDoc(doc, rule) {
  for (var i = 0; i < rule.exportSetting.length; i++) {
    var currentExportSetting = rule.exportSetting[i];
    currentExportSetting.mask = rule.mask;
    if (isUndefinedOrNull(currentExportSetting.visibleMask)) {
      currentExportSetting.visibleMask = rule.mask;
    }
    exportBySetting(doc, currentExportSetting);
  }
}

function exportBySetting(doc, exportSetting) {
  var state = doc.activeHistoryState;

  var width = UnitValue(exportSetting.size[0], "px");
  var height = UnitValue(exportSetting.size[1], "px");
  doc.resizeImage(width, height, null, ResampleMethod.BICUBIC);

  if (exportSetting.directSave) {
    setLayerVisible(doc, exportSetting.mask, exportSetting.visibleMask, true);
    var directSaveFileName = exportSetting.name + '.jpg';
    saveCurrentLayer(doc, exportSetting.savePath, directSaveFileName);
  } else {
    setLayerVisible(doc, exportSetting.mask, exportSetting.visibleMask, false);
    saveEachLayers(doc, exportSetting);
  }

  doc.activeHistoryState = state;
}

function saveEachLayers(doc, exportSetting) {
  var i = doc.layers.length-1;
  var j = 1;
  for (var i=doc.layers.length-1; i>0; i--) {
    var currentLayer = doc.layers[i];
    if (isItemInArray(currentLayer.name, exportSetting.mask))
      continue;

    currentLayer.visible = true;

    var fileName = exportSetting.name + j++ + '.jpg';
    saveCurrentLayer(doc, exportSetting.savePath, fileName);

    currentLayer.visible = false;
  }
}

function saveCurrentLayer(doc, savePath, name) {
  var completePath = doc.path + savePath;
  if (!Folder(completePath).exists) {
    new Folder(completePath).create();
  }
  var file = new File(completePath + name);
  exportDocument(doc, file, SaveDocumentType.JPEG);
}

function setLayerVisible(doc, mask, visibleMask, isNonMaskLayerVisible) {
  if (isUndefinedOrNull(mask)) {
      return
  }

  var i = doc.layers.length;
  while(i--) {
    var layer = doc.layers[i];
    if (isItemInArray(layer.name, mask)) {
      layer.visible = isItemInArray(layer.name, visibleMask)? true : false;
    } else {
      layer.visible = isNonMaskLayerVisible;
    }
  }
}

function isItemInArray(item, array) {
  var i = array.length;
  while(i--) {
    if (array[i] === item) {
      return true;
    }
  }
  return false;
}

function exportDocument(doc, savefile, saveformat) {
  var saveOptions = new ExportOptionsSaveForWeb();
  saveOptions.format = saveformat;
  saveOptions.includeProfile = false;
  saveOptions.interlaced = 0;
  saveOptions.optimized = true;
  saveOptions.quality = 60;
  doc.exportDocument(savefile, ExportType.SAVEFORWEB, saveOptions);
}
