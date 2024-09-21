<script setup lang="ts">

</script>

<template>
  <div class="header-content">
    <div class="bg-layer-1" />
    AI
    <div class="bg-layer-2" />
    <div class="bg-layer-3" />
  </div>
</template>

<style lang="css" scoped>
@keyframes translate-to-right {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@keyframes rotate-angle {
  0% {
    --angle: 45deg;
  }
  100% {
    --angle: 405deg;
  }
}
@keyframes border-radius-change {
  0% {
    border-radius: 50% 50% 50% 50% / 100% 80% 40% 50%;
  }
  20% {
    border-radius: 50% 50% 50% 50% / 50% 100% 80% 40%;
  }
  50% {
    border-radius: 50% 50% 50% 50% / 40% 50% 100% 80%;
  }
  75% {
    border-radius: 50% 50% 50% 50% / 80% 40% 50% 100%;
  }
  100% {
    border-radius: 50% 50% 50% 50% / 100% 80% 40% 50%;
  }
}

.header-content {
  font-family: 'arial black';
  font-size: 64px;
  font-weight: bold;

  width: 2em;
  height: 2em;
  color: #fff;

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
  user-select: none;
  .bg-layer-1 {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient(var(--angle), #2af8e0, #0062ff, #ff9bf0, #00a2ff,#2af8e0, #0062ff, #ff9bf0);
    background-size: 400% 400%;
    animation: translate-to-right 10s ease-in-out infinite, rotate-angle 20s ease-in-out infinite, border-radius-change 10s ease infinite;
    z-index: -1;
    left: 0;
    top: 0;
  }
  .bg-layer-2 {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient( #2af8e0, #0062ff, #ff9bf0, #00a2ff,#2af8e0, #0062ff, #ff9bf0);
    background-size: 400% 400%;
    animation: translate-to-right 8s ease-in-out infinite reverse, rotate-angle 8s linear infinite reverse;
    z-index: 1;
    left: 0;
    top: 0;
    transform: scale(1.1) rotate(var(--angle));
    mix-blend-mode: overlay;
    border-radius: 50% 50% 50% 50% / 80% 60% 50% 50%;

  }
  .bg-layer-3 {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient( #2af8e0, #0062ff, #ff9bf0, #00a2ff,#2af8e0, #0062ff, #ff9bf0);
    background-size: 400% 400%;
    animation: translate-to-right 5s ease-in-out infinite reverse, rotate-angle 2s linear infinite reverse;
    z-index: 1;
    left: 0;
    top: 0;
    transform-origin: 55% 50%;
    transform: scale(0.75) rotate(var(--angle));
    mix-blend-mode: hard-light;
    border-radius: 50% 50% 50% 50% / 100% 60% 50% 50%;
    filter: blur(8px);
    opacity: 0.2;
  }
}
</style>
