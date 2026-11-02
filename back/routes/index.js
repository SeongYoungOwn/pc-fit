var express = require('express');
var router = express.Router();
var fs=require("fs")
var path=require("path")



router.get("/file",function(req,res){
  var imagePath=path.join(__dirname,"../image/test.jpg")
  var image=fs.readFileSync(imagePath)
  console.log(image)
  fs.readFile(imagePath,function(err,image){
    console.log(image)
  })
  res.setHeader("Content-Disposition","attachement; filename=helloworld.jpg")
  res.end(image)
})

router.get("/file2",function(req,res){
  var imagePath=path.join(__dirname,"../image/test.jpg")
  fs.createReadStream(imagePath).pipe(res)
})



module.exports = router;
