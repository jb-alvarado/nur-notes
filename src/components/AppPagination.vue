<script setup lang="ts">
defineProps<{ page: number; pages: number; pageList: number[] }>()
defineEmits<{ change: [page: number] }>()
</script>

<template>
    <nav v-if="pages > 1" class="mt-10 flex justify-center" aria-label="Seitennavigation">
        <div class="join"><button class="join-item btn" :disabled="page === 1" @click="$emit('change', page - 1)">«</button><button v-for="item in pageList" :key="item" class="join-item btn" :class="{ 'btn-active': item === page }" @click="$emit('change', item)">{{ item }}</button><button class="join-item btn" :disabled="page === pages" @click="$emit('change', page + 1)">»</button></div>
    </nav>
</template>
