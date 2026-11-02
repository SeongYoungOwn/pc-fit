<template>
    <button :style="{color:color}">
        <slot></slot>
    </button>
</template>
<script>
export default{
    props:{
        label:{
            type:String
        },
        color:{
            type:String
        }
    }
}
</script>
<style scoped lang="less">
button{
    border:1px solid #eee;
    padding: 8px 16px;
    font-size:18px;
    border-radius: 8px;
    &:hover{
        background:red;
        color:white!important;
    }
}
</style>