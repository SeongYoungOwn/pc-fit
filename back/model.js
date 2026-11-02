const { Sequelize, DataTypes } = require('sequelize');


async function initModel(conn){
    global.Article=conn.define("Article",{
        //글번호
        no:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },

        //글제목
        title:{
            type:DataTypes.STRING(500)
        },
        //글 본문
        body:{
            type:DataTypes.TEXT
        },
        //작성자 이름
        writerName:{
            type:DataTypes.STRING(20)
        },
        //작성 시간
        writeDate:{
            type:DataTypes.DATE,
            defaultValue:DataTypes.NOW
        },
        //조회수
        hits:{
            type:DataTypes.BIGINT,
            defaultValue:0
        }
    })

    //사용자 모델 만들기
    global.User=conn.define("User",{
        email:{
            type:DataTypes.STRING(50),
            allowNull:false,        //Null 값이 들어올수없게하기
            primaryKey:true         //기본키(식별자)로 쓰도록하기
        },
        name:{
            type:DataTypes.STRING(20),
            allowNull:false
        },
        password:{
            type:DataTypes.STRING(1000),
            allowNull:false
        },
        //가입일자
        joinDate:{
            type:DataTypes.DATE,
            defaultValue:DataTypes.NOW
        }

    })

    // 내 PC 정보 모델 (UserPc)
    global.UserPc = conn.define("UserPc", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        cpu: { type: DataTypes.JSON },
        gpu: { type: DataTypes.JSON },
        ram: { type: DataTypes.JSON },
        motherboard: { type: DataTypes.JSON },
        storage: { type: DataTypes.JSON },
        psu: { type: DataTypes.JSON },
        pccase: { type: DataTypes.JSON },
        cooler: { type: DataTypes.JSON }
    });

    // 저장된 견적 모델 (SavedBuild)
    global.SavedBuild = conn.define("SavedBuild", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: { type: DataTypes.STRING(100) },
        buildData: { type: DataTypes.JSON }, // 1, 2, 3지망 및 REUSE 정보 포함
        totalPrice: { type: DataTypes.INTEGER },
        purpose: { type: DataTypes.STRING(200) }
    });

    // 이륙심사소 게시글 모델 (TakeoffPost)
    global.TakeoffPost = conn.define("TakeoffPost", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: { type: DataTypes.STRING(200), allowNull: false },
        content: { type: DataTypes.TEXT },
        buildData: { type: DataTypes.JSON },
        votesGood: { type: DataTypes.INTEGER, defaultValue: 0 },
        votesBad: { type: DataTypes.INTEGER, defaultValue: 0 },
        hits: { type: DataTypes.INTEGER, defaultValue: 0 }
    });

    global.Category=conn.define("Category",{
        //카테고리 id
        id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        name:{
            type:DataTypes.STRING(30),
            allowNull:false         //null 허용하지 않음
        },

    },{
        createdAt:false,
        updatedAt:false
    })

    // 관계 설정
    
    // User : UserPc = 1:1
    User.hasOne(UserPc, { foreignKey: 'userEmail', as: 'myPc' });
    UserPc.belongsTo(User, { foreignKey: 'userEmail' });

    // User : SavedBuild = 1:N
    User.hasMany(SavedBuild, { foreignKey: 'userEmail', as: 'savedBuilds' });
    SavedBuild.belongsTo(User, { foreignKey: 'userEmail' });

    // User : TakeoffPost = 1:N
    User.hasMany(TakeoffPost, { foreignKey: 'userEmail', as: 'takeoffPosts' });
    TakeoffPost.belongsTo(User, { foreignKey: 'userEmail' });

    // SavedBuild : TakeoffPost = 1:1 (선택적)
    SavedBuild.hasOne(TakeoffPost, { foreignKey: 'buildId' });
    TakeoffPost.belongsTo(SavedBuild, { foreignKey: 'buildId' });

    // Article:Category  N:M
    Article.belongsToMany(Category,{
        as:"categorys",
        constraints:false,
        through:"ArticleCategory"
    })
    //Category:Article  N:M
    Category.belongsToMany(Article,{
        as:"articles",
        constraints:false,
        through:"ArticleCategory"
    })

    //User:Article 1:N
    User.hasMany(Article,{
        as:"articles",
        foreignKey:"writerId",
        constraints:false
    })
    //Article 은 작성자를 포함하고있다
    Article.belongsTo(User,{
        as:"writer",
        foreignKey:"writerId",
        constraints:false
    })



    //연결된 데이터베이스하고 동기화
    await conn.sync({
        alter:true
    })
}

module.exports=initModel