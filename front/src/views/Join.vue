<template>
    <v-container>
        <v-text-field v-model="user.email" label="이메일"></v-text-field>
        <v-text-field v-model="user.name" label="이름"></v-text-field>
        <v-text-field v-model="user.password" type="password" label="비밀번호"></v-text-field>
        <v-text-field v-model="user.passwordConfirm" type="password" label="비밀번호 확인"></v-text-field>
        <div class="text-center">
            <v-btn @click="join()" color="primary" class="mr-2">회원가입</v-btn>
            <v-btn to="/login">취소</v-btn>
        </div>
    </v-container>
</template>
<script>
export default{
    data(){
        return{
            user:{
                email:"",
                name:"",
                password:"",
                passwordConfirm:""
            }
        }
    },
    methods:{
        async join(){     //회원가입 버튼 클릭시
            if(this.user.email==""){
                return alert("이메일을 입력해주세요")
            }
            if(this.user.name==""){
                return alert("이름을 입력해주세요")
            }
            if(this.user.password==""){
                return alert("비밀번호를 입력해주세요")
            }
            if(this.user.password!=this.user.passwordConfirm){  //비밀번호와 비밀번호 확인이 다를경우
                this.user.passwordConfirm=""    //비밀번호 확인 초기화
                return alert("비밀번호를 확인해주세요")
            }

            //여기까지 왔으면 폼검증 완료
            var response=await this.$axios.post("/user/join",this.user)
            if(response.data.success){  //회원가입이 완료됐을경우
                alert(response.data.message)
                this.$router.replace("/login")  //로그인창으로 이동
            }
            else{       //회원가입 실패시
                alert(response.data.message)    //backend에서 보내준 메세지띄우기
            }
        }
    }

}
</script>
<style>
</style>