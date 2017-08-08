const inspect = require("util").inspect;
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");   //用来解析出请求中的文件流

/*----- 创建存储文件目录 -----*/
function mkdirSync(dirname){
    if(fs.existsSync(dirname)){
        return true;
    }else{
        if(mkdirSync(path.dirname(dirname))){
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

/*----- 获取存储文件的后缀名 -----*/
function getFileSuffixName(fileName){
    let nameList = fileName.split(".");
    return nameList[nameList.length - 1];
}

/*----- 处理文件上传 -----*/
function uploadFile(ctx , options){
    let req = ctx.req;
    let res = ctx.res;
    let busboy = new Busboy({headers: req.headers});

    //获取文件类型并创建文件存储目录
    let fileType = options.fileType || "common";
    let filePath = path.join(options.path , fileType);
    let mkdirResult = mkdirSync(filePath);

    return new Promise((resolve,reject) => {
        console.log("文件上传中...");
        let result = {
            success : false,
            formData:{}
        };

        //解析文件请求
        busboy.on("file",function(filedname , file , filename , encoding , mimetype){
            let fileName = Math.random().toString(16).substr(2)+ "." + getFileSuffixName(filename);
            let _uploadFilePath = path.join(filePath , fileName);
            let saveTo = path.join(_uploadFilePath);
            
            //文件保存到指定路径
            file.pipe(fs.createWriteStream(saveTo));

            file.on("end",function(){
                result.success = true;
                result.message = "文件上传成功";
                console.log("文件上传成功");
                resolve(result);
            });
        });

        //解析表单中其他字段信息
        busboy.on("field",function(filedname , val , filednameTruncated , valTruncated , encoding , mimetype){
            console.log("表单字段数据[" + filedname + "]: value " + inspect(val));
            result.formData[filedname] = inspect(val);
        });

        //解析事件结束
        busboy.on("finish",function(){
            console.log("文件上传结束");
            resolve(result);
        });

        //解析错误事件
        busboy.on("error",function(err){
            console.log("文件解析出错");
            reject(err);
        });

        req.pipe(busboy);
    })
}

module.exports = {
    uploadFile
};