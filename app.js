// Notebook page-flip navigation + realistic butterflies (home page only)
(function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // ---------- Notebook page turn ----------
    let busy = false;
    const store = {
        set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
        pop(k) { try { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; } catch (e) { return null; } }
    };
    // forward: current page turns over to the left, next page is uncovered
    // back: previous page turns back over the current page
    function go(url, dir) {
        if (busy) return;
        busy = true;
        try {
            const page = document.querySelector('.page');
            if (reduce || !page) { location.href = url; return; }
            store.set('flipDir', dir);
            page.classList.add('flip-out-' + dir);
            setTimeout(() => { location.href = url; }, dir === 'back' ? 380 : 780);
            setTimeout(() => { busy = false; }, 3000);
        } catch (e) { location.href = url; }
    }
    document.addEventListener('DOMContentLoaded', () => {
        const dir = store.pop('flipDir');
        const page = document.querySelector('.page');
        if (dir && page && !reduce) page.classList.add('flip-in-' + dir);

        document.querySelectorAll('[data-go]').forEach(el =>
            el.addEventListener('click', e => { e.preventDefault(); go(el.dataset.go, el.dataset.dir || 'fwd'); }));

        // swipe left = next page, swipe right = previous page
        let sx = 0, sy = 0;
        document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        document.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
            if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            const prev = document.body.dataset.prev, next = document.body.dataset.next;
            if (dx < 0 && next) go(next, 'fwd');
            if (dx > 0 && prev) go(prev, 'back');
        }, { passive: true });

        if (document.body.dataset.page === 'home' && !reduce) initButterflies();
    });
    window.addEventListener('pageshow', e => {
        busy = false;
        if (e.persisted) document.querySelectorAll('.page').forEach(p => { p.className = p.className.replace(/flip-\S+/g, '').trim(); });
    });

    // ---------- Realistic butterflies (canvas) ----------
    function initButterflies() {
        const cv = document.createElement('canvas');
        cv.className = 'butterfly-canvas';
        document.body.appendChild(cv);
        const ctx = cv.getContext('2d');
        let W, H, dpr;
        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = innerWidth; H = innerHeight;
            cv.width = W * dpr; cv.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize(); addEventListener('resize', resize);

        // [wing base, wing tip, dark edge]
        const pal = [['#e8731c', '#ffc65a', '#1c0e06'], ['#6b3a1e', '#e0a458', '#24120a'],
                     ['#2f6fc0', '#a8d8ff', '#0b1a30'], ['#9a52b0', '#efc4f7', '#2a1236'],
                     ['#f2d03b', '#fff3a8', '#3a2a05']];
        const small = W < 600;
        const rnd = (a, b) => a + Math.random() * (b - a);
        const bs = Array.from({ length: small ? 4 : 6 }, (_, i) => ({
            x: rnd(0, W), y: rnd(0, H), ang: rnd(0, 6.28), speed: rnd(.9, 1.6),
            size: small ? rnd(.55, .85) : rnd(.8, 1.3), phase: rnd(0, 9), flap: rnd(.22, .32),
            tx: rnd(0, W), ty: rnd(0, H), pal: pal[i % pal.length], t: rnd(0, 100)
        }));

        function wing(c, size) {
            ctx.save(); ctx.scale(c.side * c.flap, 1);
            const g = ctx.createRadialGradient(0, 0, 2, 22, -6, 52);
            g.addColorStop(0, c.p[0]); g.addColorStop(.7, c.p[1]); g.addColorStop(1, c.p[0]);
            ctx.fillStyle = g; ctx.strokeStyle = c.p[2]; ctx.lineWidth = 2.6;
            ctx.beginPath(); // forewing
            ctx.moveTo(1, -2); ctx.bezierCurveTo(8, -34, 44, -42, 50, -16); ctx.bezierCurveTo(52, -2, 26, 6, 1, 5);
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); // hindwing
            ctx.moveTo(1, 4); ctx.bezierCurveTo(28, 2, 44, 20, 32, 38); ctx.bezierCurveTo(22, 48, 6, 34, 1, 16);
            ctx.fill(); ctx.stroke();
            ctx.strokeStyle = 'rgba(20,10,5,.55)'; ctx.lineWidth = 1; // veins
            for (const [x, y] of [[40, -22], [46, -10], [36, 2], [30, 28], [20, 36]]) {
                ctx.beginPath(); ctx.moveTo(2, 2); ctx.quadraticCurveTo(x * .5, y * .6, x, y); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,.85)'; // edge spots
            for (const [x, y, r] of [[44, -26, 2.2], [48, -16, 1.8], [30, 38, 1.8], [38, 30, 2]]) {
                ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
            }
            ctx.restore();
        }

        function draw(b) {
            const flap = .2 + .8 * Math.abs(Math.cos(b.phase));
            ctx.save();
            ctx.translate(b.x, b.y); ctx.rotate(b.ang + Math.PI / 2); ctx.scale(b.size, b.size);
            ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6;
            const c = { p: b.pal, flap };
            wing({ ...c, side: 1 }, 1); wing({ ...c, side: -1 }, 1);
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#1a0d06'; // body
            ctx.beginPath(); ctx.ellipse(0, 6, 2.6, 17, 0, 0, 6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(0, -12, 3.2, 0, 6.28); ctx.fill();
            ctx.strokeStyle = '#1a0d06'; ctx.lineWidth = 1.1; // antennae
            ctx.beginPath(); ctx.moveTo(-1, -14); ctx.quadraticCurveTo(-8, -26, -12, -27);
            ctx.moveTo(1, -14); ctx.quadraticCurveTo(8, -26, 12, -27); ctx.stroke();
            ctx.restore();
        }

        let last = performance.now();
        (function loop(now) {
            const dt = Math.min((now - last) / 16.7, 3); last = now;
            if (!document.hidden) {
                ctx.clearRect(0, 0, W, H);
                for (const b of bs) {
                    b.t += dt * .02;
                    const dx = b.tx - b.x, dy = b.ty - b.y;
                    if (Math.hypot(dx, dy) < 60) { b.tx = rnd(-40, W + 40); b.ty = rnd(-40, H + 40); }
                    let diff = Math.atan2(dy, dx) - b.ang;
                    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
                    b.ang += diff * .03 * dt + Math.sin(b.t * 3 + b.phase) * .035 * dt; // erratic wander
                    const burst = .65 + .5 * Math.abs(Math.cos(b.phase * .5)); // speed pulses with wingbeats
                    b.x += Math.cos(b.ang) * b.speed * burst * dt;
                    b.y += Math.sin(b.ang) * b.speed * burst * dt + Math.sin(b.phase) * .5 * dt; // bobbing
                    b.phase += b.flap * dt;
                    draw(b);
                }
            }
            requestAnimationFrame(loop);
        })(last);
    }
})();
