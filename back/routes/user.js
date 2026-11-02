var express=require("express")
var router=express.Router()

//회원가입 api
router.post("/join",async(req,res)=>{
    var user=req.body

    //이메일 중복 체크
    var alreadyUser=await User.findOne({
        where:{
            email:user.email    //가입하려는 이메일로 등록된 회원이 있는지 확인
        }
    })
    if(alreadyUser){    //이미 가입된 이메일
        return res.json({
            success:false,
            message:"이미 가입된 이메일 입니다"
        })
    }
    //TODO :폼검증 생략

    var joinedUser=await User.create(user)      //데이터베이스에 insert

    res.json({  //front 로 성공 응답 보내기
        success:true,
        message:"회원가입이 완료되었습니다"
    })

})

//로그인 api
router.post("/login",async(req,res)=>{
    var user=req.body
    var loginedUser=await User.findOne({
        where:{
            email:user.email,       //where 안에 조건은 기본 and 조건
            password:user.password
        }
    })
    if(!loginedUser){   //이메일 또는 패스워드가 틀렸을경우
        return res.json({
            success:false,
            message:"이메일 또는 패스워드가 틀렸습니다"
        })
    }

    //사용자로그인 유지되도록 세션 처리하기
    req.session.user=loginedUser

    res.json({
        success:true,
        user:loginedUser,
        message:"로그인에 성공했습니다"
    })

})

//로그인된 사용자 정보 조회
router.get("/info",async(req,res)=>{
    if(!req.session.user){  //로그인 되어있지 않은 상태
        return res.json({
            login:false,
            user:null
        })
    }
    var user=await User.findOne({        //세션에 있는정보로 사용자 테이블에서 한번더 조회
        attributes:["email","name","joinDate"], //필요한 회원정보만 나오게하기
        where:{
            email:req.session.user.email
        }
    })

    if(!user){  //탈퇴 혹은 사용자가 없음
        return res.json({
            login:false,
            user:null
        })
    }
    res.json({
        login:true,
        user:user
    })
})

router.get("/logout",async(req,res)=>{
    req.session.destroy()
    res.json({
        success:true,
        message:"로그아웃이 완료되었습니다"
    })
})

module.exports=router