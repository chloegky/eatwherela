<script>
    export default { 
        data() {
            return {
                name: 'John',
                phone: '123456'
            }
        },
        methods: { 
   			getPhone() { 
                // method doesn't necessarily 'return'
				return "This is my number " + this.phone; 
            }
		}
    }
</script>

<template>
    <h1>hello</h1>
</template>

<style scoped>
.greeting {
    color: blue;
}
</style>
