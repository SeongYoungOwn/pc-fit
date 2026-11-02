<template>
  <div>

    <div class="text-right">
      <v-btn :disabled="!$store.state.isLogin" color="primary" @click="moveWrite()">글쓰기2222</v-btn>
    </div>
    
    <table class="table">
      <thead>
        <tr>
          <th width="100px">글번호</th>
          <th width="200px">카테고리</th>
          <th>글제목</th>
          <th width="100px">작성자</th>
          <th width="200px">작성시간</th>
          <th width="100px">조회수</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="article in articleList" @click="clickArticle(article)">
          <td class="text-center">{{ article.no }}</td>
          <td>
            <span class="category" v-for="category in article.categorys">{{ category.name }}</span>
          </td>
          <td>{{ article.title }}</td>
          <td>
              <div class="text-center" v-if="article.writer">{{ article.writer.name }}</div>
          </td>
          <td class="text-center">{{ formatDate(article.writeDate,"YYYY-MM-DD HH:mm") }}</td>
          <td class="text-center">{{ article.hits }}</td>
        </tr>
      </tbody>
    </table>
    <div class="text-center">
      <v-pagination v-model="page" @update:modelValue="changePage" :length="pageCount"></v-pagination>
      
    </div>
  </div>
</template>
<script>
import moment from "moment"
export default{
  data(){
    return {
      loginUser:null,
      page:1,
      pageCount:null,
      articleList:[]
    }
  },
  methods:{
    async logout(){ //로그아웃 버튼이 클릭됐을때
      var response=await this.$axios.get("/user/logout")
      if(response.data.success){
        this.loginUser=null
      }
    },

    //날짜를 포멧팅해주는 함수
    formatDate(value,format){
      var date=moment(value).format(format)
      return date
    },
    moveWrite(){
      this.$router.push("/write") 
    },
    //글을 클릭했을때
    clickArticle(article){
      this.$router.push(`/article/${article.no}`)
    },
    //사용자가 페이지를 클릭했을때
    async changePage(page){
      console.log(page)
      //사용자가 선택한 페이지의 글을 가져온다
      var result=await this.$axios.get(`/board/articles?page=${page}`)
      this.articleList=result.data.articles
      this.pageCount=result.data.pageCount
    }
  },
  async mounted(){  //화면에 보여지게 될때

    var result=await this.$axios.get("/board/articles") //백엔드로부터 데이터 가져오기
    this.articleList=result.data.articles     //가져온 데이터를 Vue 변수에 넣기
    this.pageCount=result.data.pageCount      //가져온 페이지갯수 vue 변수에 넣기

    //로그인된 사용자 정보 가져오기
    var response=await this.$axios.get("/user/info")
    if(response.data.login){  //로그인 되어있을경우
      this.loginUser=response.data.user //로그인된 사용자 정보를 저장
    }

  }
}
</script>
<style lang="less">
.table{
  width:100%;
  border-collapse: collapse;
  thead{
    th{   //.table>thead>th
      background:#eee;
      padding:12px 4px;
    }
  }
  tbody{
    tr{
      border-bottom:1px solid #eee;
      &:hover{
        background:#eee;
        cursor:pointer;
      }
      td{
        padding:8px;
      }
    }
    
  }
}

.category{
  color:red;
  background:pink;
  padding:4px 8px;
  border-radius: 4px;
  margin-right:8px;
}
</style>