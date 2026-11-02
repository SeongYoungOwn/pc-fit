var express = require('express');
var router = express.Router();


router.post("/create",async(req,res)=>{
    //로그인 여부 체크
    if(!req.session.user){  //로그인 되어있지 않으면
        return res.json({
            success:false,
            message:"로그인후 이용가능합니다"
        })
    }

    var board=req.body  //http body 에 있는 글 내용
    console.log(board)

    //board.writerId=req.session.user.email   //writerId는 로그인된 사용자의 이메일 저장
    var createdArticle=await Article.create(board)  //데이터베이스에 글 저장

    //사용자 PrimaryKey 로 찾기
    var user=await User.findByPk(req.session.user.email)

    //생성된 글에 작성자 지정
    await createdArticle.setWriter(user)

    //글에 선택된 카테고리 반복
    for(var category of board.categorys){
        var categoryDB=await Category.findByPk(category.id)
        await createdArticle.addCategorys(categoryDB)   //작성자가 선택한 카테고리를 작성된 글과 연결
    }

    
    //결과 응답 보내기
    res.json({
        success:true,
        article:createdArticle      //데이터베이스에 저장된 article 응답으로 보내기
    })
})

router.get("/articles",async(req,res)=>{
    var limit=Number(req.query.limit||10)   //글 한번에 가져오는 갯수(기본값 10)
    var page=Number(req.query.page||1)      //보여줄 글 페이지 번호
    var offset=(page-1)*limit               //몇개를 skip 하고 보여줄건지

    var count=await Article.count()
    console.log("글갯수",count)
    var pageCount=Math.ceil(count/limit)    //페이지갯수=올림(전체글갯수/한페이지당글갯수)
    console.log("페이지갯수",pageCount)

    var articles=await Article.findAll({
        include:[
            {
                model:Category,
                as:"categorys",
                attributes:["name"]
            },
            {
                attributes:["email","name"],
                model:User,
                as:"writer"
            }
        ],
        order:[
            ["writeDate","DESC"]        //작성 시간으로 내림차순정렬
        ],
        offset:offset,      //몇개를 SKIP 하고 가져올건지
        limit:limit         //글 한번에 가져오는 갯수 제한
    })        //글 전체목록 가져오기
    res.json({
        success:true,
        articles:articles,       //응답으로 글목록 보내기
        pageCount:pageCount     //페이지갯수 같이 넘겨주기
    })
})
router.get("/article/:no",async(req,res)=>{
    var no=Number(req.params.no)
    console.log(typeof no)
    var article=await Article.findOne({
        where:{
            no:no       //no를 조건문에 넣음 where no=1
        }
    })
    article.hits++     //조회수 하나 증가
    article.save()     //조회수 증가된걸 디비에 저장

    res.json({
        success:true,
        article:article
    })
})

router.delete("/article/:no",async(req,res)=>{
    var no=Number(req.params.no)
    
    if(no){ //글번호가 있으면
        var article=await Article.findOne({
            where:{
                no:no
            }
        })
        if(!article){   //글이 없으면
            return res.json({
                success:false,
                message:"존재하지 않는 글입니다"
            })
        }
        await article.destroy()  //게시물 데이터베이스에서 삭제
        return res.json({
            success:true,
            message:"게시물이 삭제되었습니다"
        })
    }
    
    return res.json({
        success:false,
        message:"글 삭제에 실패하였습니다"
    })

})
//글 수정
router.post("/article/modify/:no",async(req,res)=>{
    var no=Number(req.params.no)    //글 번호 URL파라미터로 부터 가져오기
    if(!no){ //글번호가 없으면
        return res.json({
            success:false,
            message:"글번호가 없습니다"
        })
    }
    //여기 코드가 실행된다는건 글번호가 있을때뿐

    var article=await Article.findOne({     //글번호로 게시물 있는지 확인
        where:{
            no:no
        }
    })
    if(!article){   //조회한 게시물이 없는경우
        return res.json({
            success:false,
            message:"존재하지 않는 게시물 입니다"
        })
    }
    //await 을 붙여서 쿼리가 실행 완료되고 난후 다음줄로 넘어가게함
    await article.update({            //제목과 내용을 수정
        title:req.body.title,
        body:req.body.body
    })

    res.json({
        success:true,
        message:"게시물이 수정되었습니다"
    })
})

module.exports=router