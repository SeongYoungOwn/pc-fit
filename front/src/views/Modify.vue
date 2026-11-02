<template>
    <v-container>
        <v-text-field v-model="article.title" label="글제목"></v-text-field>
        <v-textarea v-model="article.body" label="글내용"></v-textarea>
        <div class="text-center">
            <v-btn color="primary" @click="modify()">글수정</v-btn>
        </div>

    </v-container>
</template>
<script>
export default{
    data(){
        return {
            article:{
                title:"",
                body:""
            }
        }
    },
    async mounted(){
        //글 가져오기
        var response=await this.$axios.get(`/board/article/${this.$route.params.no}`)
        if(response.data.success){
            this.article=response.data.article
        }
    },
    methods:{
        //글수정 버튼 클릭시
        async modify(){
            //TODO : 폼검증하기

            var response=await this.$axios.post(`/board/article/modify/${this.$route.params.no}`,this.article)
            if(response.data.success){  //글수정 성공시
                this.$router.replace(`/article/${this.$route.params.no}`)
            }
        }
    }
}
</script>