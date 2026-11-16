
 // JavaScript handles interactions only. All restaurant details, images and menu prices live in HTML.
document.querySelectorAll('.mobile-toggle').forEach(button => button.addEventListener('click', () => {
    const nav = document.querySelector('.nav');
    const expanded = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(expanded));
}));

const menu = document.querySelector('#menu-grid');

if (menu) {
    const cards = [...menu.querySelectorAll('.food-card')],
        cartItems = document.querySelector('#cart-items'),
        cartCount = document.querySelector('#cart-count'),
        cartTotal = document.querySelector('#cart-total'),
        modal = document.querySelector('#checkout-modal');

    const cart = {};
    const peso = n => '₱' + n.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const details = Object.fromEntries(cards.map(card => [
        card.dataset.id,
        {
            name: card.querySelector('h3').textContent,
            price: Number(card.dataset.price)
        }
    ]));

    function draw() {
        const ids = Object.keys(cart).filter(id => cart[id] > 0);

        cartCount.textContent = `(${ids.reduce((n, id) => n + cart[id], 0)})`;
        cartTotal.textContent = peso(ids.reduce((n, id) => n + cart[id] * details[id].price, 0));
        cartItems.innerHTML = ids.length ? '' : '<p class="cart-empty">Your cart is waiting for something delicious.</p>';

        ids.forEach(id => {
            const row = document.createElement('div');
            row.className = 'cart-item';

            const left = document.createElement('div'),
                name = document.createElement('strong'),
                unit = document.createElement('small'),
                qty = document.createElement('div'),
                minus = document.createElement('button'),
                plus = document.createElement('button'),
                number = document.createElement('span'),
                total = document.createElement('strong');

            name.textContent = details[id].name;
            unit.textContent = peso(details[id].price) + ' each';

            qty.className = 'quantity';
            minus.textContent = '−';
            plus.textContent = '+';

            minus.setAttribute('aria-label', 'Decrease ' + details[id].name);
            plus.setAttribute('aria-label', 'Increase ' + details[id].name);

            number.textContent = cart[id];

            minus.onclick = () => {
                cart[id]--;
                if (!cart[id]) delete cart[id];
                draw();
            };

            plus.onclick = () => {
                cart[id]++;
                draw();
            };

            qty.append(minus, number, plus);
            left.append(name, unit, qty);

            total.textContent = peso(cart[id] * details[id].price);

            row.append(left, total);
            cartItems.append(row);
        });
    }

    menu.querySelectorAll('.add-button').forEach(b => b.addEventListener('click', () => {
        const id = b.closest('.food-card').dataset.id;
        cart[id] = (cart[id] || 0) + 1;
        draw();
    }));

    document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
        b.classList.add('active');

        cards.forEach(c => c.hidden = b.dataset.filter !== 'All' && c.dataset.category !== b.dataset.filter);
    }));

    document.querySelector('#clear-cart').onclick = () => {
        Object.keys(cart).forEach(k => delete cart[k]);
        draw();
    };

    document.querySelector('#open-checkout').onclick = () => {
        if (!Object.keys(cart).length) {
            alert('Add an item to your cart first.');
            return;
        }

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        modal.querySelector('input').focus();
    };

    function close() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }

    document.querySelector('#close-checkout').onclick = close;

    modal.addEventListener('click', e => {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
    });

    
/* =========================================
   MESSENGER ORDER SUMMARY
========================================= */

const summaryModal = document.querySelector('#summary-modal');
const summaryText = document.querySelector('#order-summary-text');
const copyOrderButton = document.querySelector('#copy-order');
const messengerButton = document.querySelector('#open-messenger');
const closeSummaryButton = document.querySelector('#close-summary');

let preparedOrderMessage = "";

// When the customer clicks Prepare Messenger Order
document.querySelector('#checkout-form').addEventListener('submit', e => {

    e.preventDefault();

    const form = new FormData(e.currentTarget);

    // Check if a delivery address was entered
    if (
        form.get('fulfillment') === 'Delivery' &&
        !String(form.get('address') || '').trim()
    ) {
        alert('Please enter your delivery address.');
        return;
    }

    // Get products from the cart
    const lines = Object.keys(cart)
        .filter(id => cart[id] > 0)
        .map(id =>
            `${cart[id]} x ${details[id].name} — ${peso(cart[id] * details[id].price)}`
        );

    // Calculate subtotal
    const subtotal = Object.keys(cart).reduce(
        (total, id) => total + cart[id] * details[id].price,
        0
    );

    // Prepare the order summary
    preparedOrderMessage = [
        'Hello! I would like to order:',
        '',
        ...lines,
        '',
        `Subtotal: ${peso(subtotal)}`,
        `Name: ${form.get('name')}`,
        `Phone: ${form.get('phone')}`,
        `Order type: ${form.get('fulfillment')}`,
        `Address: ${form.get('address') || 'N/A'}`,
        `Payment preference: ${form.get('payment')}`,
        `Notes: ${form.get('notes') || 'None'}`,
        '',
        'Please confirm availability, payment instructions and any delivery fee.'
    ].join('\n');

    // Display the message in the popup
    summaryText.textContent = preparedOrderMessage;

    // Close the checkout form
    close();

    // Open the order summary popup
    summaryModal.classList.add('open');
    summaryModal.setAttribute('aria-hidden', 'false');

    copyOrderButton.textContent = 'Copy Order Summary';
    closeSummaryButton.focus();

});

// Copy the order summary
copyOrderButton.addEventListener('click', async () => {

    try {
        await navigator.clipboard.writeText(preparedOrderMessage);
        copyOrderButton.textContent = '✓ Order Summary Copied!';
    } catch (error) {
        // Allow manual copying if clipboard access is blocked
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(summaryText);
        selection.removeAllRanges();
        selection.addRange(range);

        alert('Please press Ctrl + C to copy the selected order summary.');
    }

});

// Close the summary popup
function closeSummary() {
    summaryModal.classList.remove('open');
    summaryModal.setAttribute('aria-hidden', 'true');
}

closeSummaryButton.addEventListener('click', closeSummary);

summaryModal.addEventListener('click', e => {
    if (e.target === summaryModal) {
        closeSummary();
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeSummary();
    }
});

// Replace this with your restaurant's Facebook Page username
messengerButton.href = 'https://www.messenger.com/t/1254031467803684';


    draw();
}
