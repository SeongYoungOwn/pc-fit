<template>
    <div class="header">
        <div class="logo">MJC 게시판</div>
        <div class="blank"></div>
        <div class="menu-container">
            <div class="user-name" v-if="$store.state.isLogin">
                {{ $store.state.loginUser.name }}
            </div>
            <v-btn v-if="!$store.state.isLogin" to="/login" color="primary">로그인</v-btn>
            <v-btn v-if="$store.state.isLogin" @click="logout()" color="error">로그아웃</v-btn>
        </div>
    </div>
</template>
<script>
export default{
  
    async mounted(){
        //로그인된 사용자 정보 가져오기
        var response=await this.$axios.get("/user/info")
        if(response.data.login){  //로그인 되어있을경우
            //TODO : 로그인된 사용자 정보를 저장
            //this.user=response.data.user
            console.log(response.data.user)
            this.$store.commit("setLoginUser",response.data.user) //로그인된 사용자 정보를 Vuex에 저장
        }
        else{

        }
    },
    methods:{
        async logout(){   //로그아웃 버튼이 클릭됐을때
            var response=await this.$axios.get("/user/logout")   //백엔드 로그아웃 api 호출
            if(response.data.success){  //로그아웃 성공시
                this.$store.commit("logout")    //Vuex에 저장된 로그인 정보 초기화
            }
        }
    }
}
</script>
<style scoped lang="less">
.header{
    display: flex;
    padding:24px 24px;
    box-shadow: 0px 1px 3px rgba(0,0,0,0.2);
    margin-bottom:8px;
    align-items: center;
    .logo{
        font-size: 24px;
        font-weight: bold;
    }
    .blank{
        flex:1;
    }
    .user-name{
        display: inline-block;
        margin-right:16px;
        font-size:16px;
        font-weight:700;
    }
}

</style>