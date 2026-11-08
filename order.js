// Order page: cart + WhatsApp order
(function () {
    const MENU = [{"title": "☕ ARTISAN COFFEE SELECTIONS", "items": [{"name": "Signature Espresso", "price": 120}, {"name": "Classic Americano", "price": 140}, {"name": "Velvety Cappuccino", "price": 160}, {"name": "Caramel Latte", "price": 175}, {"name": "Dark Mocha Roast", "price": 180}, {"name": "Hazelnut Delight", "price": 190}]}, {"title": "❄️ ICED & COLD BREWS", "items": [{"name": "Iced Vanilla Latte", "price": 185}, {"name": "Cold Brew Classic", "price": 179}]}, {"title": "🍔 FOOD MENU", "items": [{"name": "Club Sandwich", "price": 220}, {"name": "Chicken Sandwich", "price": 220}, {"name": "Cheese Sandwich", "price": 180}, {"name": "Pasta (White/Red)", "price": 240}, {"name": "Cheesy Nachos", "price": 200}, {"name": "French Fries", "price": 120}, {"name": "Garlic Bread", "price": 120}]}, {"title": "🍰 DESSERTS", "items": [{"name": "Chocolate Cake", "price": 180}, {"name": "Cheesecake", "price": 180}, {"name": "Brownie w/ Ice Cream", "price": 180}, {"name": "Tiramisu", "price": 200}, {"name": "Chocolate Muffin", "price": 140}, {"name": "Ice Cream (Scoop)", "price": 100}]}];
    const WHATSAPP = '919579626809'; // +91 9579626809
    const $ = id => document.getElementById(id);
    const money = n => '\u20b9' + n;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

    const items = [], qty = [], ctrls = [];
    const list = $('menuList');
    MENU.forEach(cat => {
        list.appendChild(el('div', 'menu-category-title', cat.title));
        cat.items.forEach(it => {
            const k = items.length; items.push(it); qty.push(0);
            const row = el('div', 'order-row');
            row.appendChild(el('span', 'o-name', it.name));
            row.appendChild(el('span', 'o-price', money(it.price)));
            const c = el('div', 'o-ctrl'); ctrls.push(c); row.appendChild(c);
            list.appendChild(row);
        });
    });

    function btn(label, cls, fn, aria) {
        const b = el('button', cls, label); b.type = 'button';
        if (aria) b.setAttribute('aria-label', aria);
        b.addEventListener('click', fn); return b;
    }
    const setQty = (k, q) => { qty[k] = Math.max(0, Math.min(q, 20)); render(); };

    function render() {
        let total = 0, count = 0;
        const cart = $('cartList'); cart.textContent = '';
        items.forEach((it, k) => {
            const c = ctrls[k]; c.textContent = '';
            if (!qty[k]) { c.appendChild(btn('Add', 'add-btn', () => setQty(k, 1), 'Add ' + it.name)); return; }
            c.appendChild(btn('\u2212', 'step-btn', () => setQty(k, qty[k] - 1), 'Decrease ' + it.name));
            c.appendChild(el('span', 'qty', String(qty[k])));
            c.appendChild(btn('+', 'step-btn', () => setQty(k, qty[k] + 1), 'Increase ' + it.name));
            const line = it.price * qty[k]; total += line; count++;
            const r = el('div', 'cart-line');
            r.appendChild(el('span', 'cl-name', it.name + ' \u00d7 ' + qty[k]));
            r.appendChild(el('span', 'cl-price', money(line)));
            r.appendChild(btn('\u2715', 'rm-btn', () => setQty(k, 0), 'Remove ' + it.name));
            cart.appendChild(r);
        });
        if (!count) cart.appendChild(el('div', 'cart-empty', 'Your cart is empty. Tap Add on any item.'));
        $('cartTotal').textContent = money(total);
        validate(count);
    }

    function validate(count) {
        if (count === undefined) count = qty.filter(Boolean).length;
        const name = $('custName').value.trim();
        let hint = '';
        if (!count) hint = 'Add at least one item to your cart.';
        else if (name.length < 2) hint = 'Please write your name.';
        else if (!$('confirmChk').checked) hint = 'Tick the confirmation box to place your order.';
        $('orderHint').textContent = hint;
        $('orderBtn').disabled = !!hint;
    }

    $('custName').addEventListener('input', () => validate());
    $('confirmChk').addEventListener('change', () => validate());
    $('orderBtn').addEventListener('click', () => {
        if ($('orderBtn').disabled) return;
        let total = 0, n = 0;
        const lines = [];
        items.forEach((it, k) => { if (qty[k]) { n++; total += it.price * qty[k]; lines.push(n + '. ' + it.name + ' x ' + qty[k] + ' = ' + money(it.price * qty[k])); } });
        const msg = '*New Order - Dream Life Cafe*\n\nName: ' + $('custName').value.trim() + '\n\n' + lines.join('\n') + '\n\n*Total: ' + money(total) + '*\n\nOrder confirmed by customer.';
        location.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    });
    render();
})();
