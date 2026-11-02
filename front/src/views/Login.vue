<template>
    <v-container>
        <v-text-field v-model="user.email" label="이메일"></v-text-field>
        <v-text-field v-model="user.password" type="password" label="비밀번호"></v-text-field>
        <div class="text-center">
            <v-btn @click="login()" color="primary" class="mr-2">로그인</v-btn>
            <v-btn to="/join">회원가입</v-btn>
        </div>
    </v-container>
</template>
<script>
export default{
    data(){
        return{
            user:{
                email:"",
                password:""
            }
        }
    },
    methods:{
        async login(){    //로그인 버튼 클릭시
            var response=await this.$axios.post("/user/login",this.user)
            if(response.data.success){  //로그인에 성공했을경우
                this.$store.commit("setLoginUser",response.data.user) 
                alert(response.data.message)    //로그인성공메세지띄우기
                this.$router.replace("/")       //게시판글목록으로 이동
            }
            else{   //로그인 실패시
                alert(response.data.message)    //로그인실패메세지 띄우기
            }
        }
    }

}
</script>
<style>
</style>