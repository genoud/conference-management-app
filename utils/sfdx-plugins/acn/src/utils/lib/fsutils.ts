const fs = require('fs');
const path = require('path');
var _ = require('lodash');

export default class FileUtils {
  public static getAllFilesSync(folder: string, extension: string = '.xml'): string[] {
    let result: string[] = [];
    let content: string[] = fs.readdirSync(folder);
    content.forEach((file) => {
      var curFile = path.join(folder, file);
      var stats = fs.statSync(curFile);
      if (stats.isFile()) {
        if (extension.indexOf(path.extname(curFile)) != -1) {
          result.push(curFile);
        }
      }
      else if (stats.isDirectory()) {
        var files: string[] = this.getAllFilesSync(curFile, extension);
        result = _.concat(result, files);
      }
    });
    return result;
  }
  public static mkDirByPathSync(targetDir: string, { isRelativeToScript = false } = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(baseDir, parentDir, childDir);
      try {
        fs.mkdirSync(curDir);
      } catch (err) {
        if (err.code !== 'EEXIST' && err.code !== 'EPERM') {
          throw err;
        }
      }
      return curDir;
    }, initDir);
  }
  public static getFileNameWithoudExtension(filePath: string, extention: string): string {
    var fileParts = filePath.split(path.sep);
    var fileName = fileParts[fileParts.length - 1];
    fileName = fileName.substr(0, fileName.lastIndexOf(extention));
    return fileName;
  }

  public static copyRecursiveSync(src, dest) {
    var exists = fs.existsSync(src);
    //var stats = exists && fs.statSync(src);
    if (exists) {
      var stats = fs.statSync(src);
      var isDirectory = stats.isDirectory();
      if (isDirectory) {
        var exists = fs.existsSync(dest);
        if (!exists) {
          fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(function (childItemName) {
          FileUtils.copyRecursiveSync(path.join(src, childItemName),
            path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

  }

  public static getFolderPath(src, foldername){
    var exists = fs.existsSync(src);
    var toReturn="";
    if (exists) {
      var stats = fs.statSync(src);
      var isDirectory = stats.isDirectory();
      if (isDirectory) {
        var childs=fs.readdirSync(src);
        for(var i=0; i<childs.length; i++){
          var childItemName=childs[i];
          if(childItemName===foldername){
            toReturn=path.join(src, childItemName);
          }
          else{
            var childStat=fs.statSync(path.join(src, childItemName));
            if(childStat.isDirectory()){
              toReturn=FileUtils.getFolderPath(path.join(src, childItemName),foldername);
            }
          }
          if(toReturn!==""){
            break;
          }
        }
      } 
    }
    return toReturn;
  }

  public static deleteFolderRecursive (folder){
    if (fs.existsSync(folder)) {
      fs.readdirSync(folder).forEach(function(file, index){
        var curPath = path.join(folder,file);
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          //console.log("Delete recursively");
          FileUtils.deleteFolderRecursive(curPath);
        } else { // delete file
          //console.log("Delete file "+ curPath);
          fs.unlinkSync(curPath);
        }
      });
      //console.log("delete folder "+ folder);
      fs.rmdirSync(folder);
    }
  }

  /* Function takes a file and its encoding as input; splits the file into an array of strings
    The split occurs at each tab, end of line and space. */
  public static readAndSplitFile(filepath, encoding){
    const sepRegex=/\t| |\n/;
    const lineBreakRegEx = /\r?\n|\r|( $)/;
    const blankRegEx = /^$/;

    var data = fs.readFileSync(filepath, encoding);

    var contents = data.split(sepRegex);

    //console.log(contents);

    /* GETS RID OF LINE BREAKAGES(FOR EXAMPLE, CARRIAGE RETURNS) AND SPACE(THE LAST ELEMENT IN THE FILE CAN CONTAIN A SPACE) */
    for (var i = 0; i < contents.length; i++) {
          contents[i] = contents[i].replace(lineBreakRegEx, "");
          if(blankRegEx.test(contents[i])){
            contents.splice(i, 1);
          }    
    }

    //console.log(contents); 
    return contents;
  }

}