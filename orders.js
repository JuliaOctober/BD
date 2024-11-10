document.addEventListener("DOMContentLoaded", loadOrders);

function loadOrders() {
    fetch('http://127.0.0.1:3000/orders')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOrders(data.data);
            } else {
                alert('Ошибка при загрузке заказов');
            }
        })
        .catch(error => console.error('Ошибка при загрузке заказов:', error));
}

// Функция для форматирования даты в нужный вид: "DD.MM.YYYY HH:MM"
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы в JavaScript начинаются с 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function displayOrders(orders) {
    const ordersTable = document.getElementById('ordersTable').querySelector('tbody');
    let currentOrderId = null;
    let currentOrderRow;

    orders.forEach(order => {
        if (order.order_id !== currentOrderId) {
            currentOrderId = order.order_id;

            // Форматируем дату заказа
            const formattedDate = formatDate(order.order_date);

            currentOrderRow = document.createElement('tr');
            currentOrderRow.innerHTML = `
                <td>${order.client_name}</td>
                <td>${order.client_lastname}</td>
                <td>${formattedDate}</td>
                <td>
                    <ul class="products-list"></ul>
                </td>
                <td>${order.total_sum}</td>
            `;
            ordersTable.appendChild(currentOrderRow);
        }

        const productsList = currentOrderRow.querySelector('.products-list');
        const productItem = document.createElement('li');
        productItem.textContent = `${order.product_name} - ${order.product_quantity} шт. по цене ${order.product_price} ₽`;
        productsList.appendChild(productItem);
    });
}
