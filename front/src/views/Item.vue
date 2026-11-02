<template>
    <v-container>
        <h1>{{ article.title }}</h1>
        <div class="info-container">
            <div class="left">
                <div>작성시간 : {{ article.writeDate }}</div>
                <div>조회수 : {{ article.hits }}회</div>
            </div>
            <div class="center"></div>
            <div class="right">
                <div class="writer">{{ article.writerName }}</div>
            </div>
        </div>
        
        <p>{{ article.body }}</p>
        <div class="text-center mt-2">
            <v-btn color="primary" to="/">글 목록</v-btn>
            <v-btn color="primary" class="ml-2" @click="moveModify()" >글수정</v-btn>
            <v-btn color="error" class="ml-2" @click="remove()">글삭제</v-btn>
        </div>
    </v-container>
</template>
<script>
export default {
    data(){
        return {
            article:{
                title:"",
                body:"",
                writerName:""
            }
        }
    },
    
    //이 VUE 파일이 화면에 불려지면
    async mounted(){
        //게시물 번호
        var no=Number(this.$route.params.no)
        console.log(no)
        
        //게시글 백엔드에서 가져오기
        var response=await this.$axios.get(`/board/article/${no}`)
        if(response.data.success){  //정상적으로 가져왔는지 확인
            this.article=response.data.article
        }
    },
    methods:{
        //글 수정 버튼 클릭시
        moveModify(){
            //글 수정 화면으로 이동
            this.$router.replace(`/article/modify/${this.$route.params.no}`)
        },
        //글삭제 버튼 클릭시
        remove(){
            var result=confirm("정말 삭제하시겠습니까?")
            if(!result){    //사용자가 취소버튼을 눌렀으면
                return  //삭제되지않게 함수 끝내기
            }
            this.$axios.delete(`/board/article/${this.$route.params.no}`)
            .then(result=>{
                //응답이 왔을때 처리
                this.$router.replace("/")
            })
        }
    }
}
</script>
<style scoped lang="less">
h1{
    border-bottom:1px #999 solid;
    padding-bottom:16px;
    margin-bottom:16px;
}
.writer{
    text-align:right;
    color:#555;
}
.info-container{
    display:flex;
    flex-direction: row;
    .center{
        flex:1;
    }
}
p{
    background:#eee;
    min-height:500px;
    padding:16px;
    margin-top:8px;
}

</style>
