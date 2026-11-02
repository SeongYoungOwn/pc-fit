<template>
    <v-container>
        <v-text-field ref="articleTitle" v-model="article.title" label="글제목"></v-text-field>
        <v-select v-model="article.categorys"
        :return-object="true"
        :items="categorys"
        item-title="name"
        :multiple="true"></v-select>

        {{ article.categorys }}


        <!-- <v-text-field v-model="article.writerName" label="작성자명"></v-text-field> -->
        <v-textarea v-model="article.body" label="글내용"></v-textarea>
        
        <div class="text-center">
            <v-btn color="primary" @click="submit()">글쓰기</v-btn>
        </div>
    </v-container>
</template>
<script>
import MjcBtn from "@/components/MjcBtn.vue"

export default{
    components:{
        MjcBtn:MjcBtn
    },
    data(){
        return{
            categorys:[],
            article:{
                categorys:[],
                title:"",
                body:""
            }
        }
        
    },
    async mounted(){
        var result=await this.$axios.get("/category/list")
        if(result.data.success){
            this.categorys=result.data.list
        }
    },
    methods:{
        async submit(){   //글쓰기 버튼 클릭됐을때
            //폼검증
            if(this.article.title==""){ //제목이 빈값일경우
                alert("제목을 입력해주세요")
                this.$refs.articleTitle.focus()     //글 제목에 포커스주기
                return
            }

            var result=await this.$axios.post("/board/create",this.article)      //글쓰기 api 호출
            this.article={
                title:"",
                body:"",
                writerName:""
            }
            //TODO: 글보기 페이지로 이동하게 하기
            this.$router.replace(`/article/${result.data.article.no}`)
        }
    }
}
</script>
<style></style>