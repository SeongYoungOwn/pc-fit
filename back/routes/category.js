var express=require("express")
var router=express.Router()

//카테고리 목록 조회 api
router.get("/list",async(req,res)=>{
    var list=await Category.findAll()
    res.json({
        success:true,
        list:list
    })
})


module.exports=router