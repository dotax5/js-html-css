const FLAKE_COUNT = 200;

for (let i = 0; i < FLAKE_COUNT; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';

    const size = 3 + Math.random() * 5;
    const duration = 5 + Math.random() * 10;

    flake.style.width = size + 'px';
    flake.style.height = size + 'px';
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.top = '-10px';
    flake.style.animationDuration = duration + 's';
    flake.style.animationDelay = Math.random() * duration + 's';

    document.body.appendChild(flake);
}
