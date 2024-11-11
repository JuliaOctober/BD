// Функция для загрузки заказов клиента
// Функция для загрузки заказов клиента
function loadClientOrders() {
    fetch('http://127.0.0.1:3000/client-orders')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const ordersTableBody = document.querySelector('#ordersTable tbody');
                ordersTableBody.innerHTML = ''; // Очищаем таблицу перед добавлением новых данных

                let totalAmount = 0;
                
                data.orders.forEach(order => {
                    const row = document.createElement('tr');
                    
                    const totalSum = parseFloat(order.sum);
                    totalAmount += totalSum

                    row.innerHTML = `
                        <td data-label="Список товаров">
                            <ul class="products-list">
                                ${order.products.map(product => `
                                    <span clas="product-name">${product.name}</span> 
                                    <span class="product-qty-price">x${product.count} ${product.price}₽</span>
                                `).join('')}
                            </ul>
                        </td>
                        <td class="basket-total">${!isNaN(totalSum) ? totalSum.toFixed(2) : 'Ошибка'}</td>
                        <td>
                            <img src="img7.png" alt="Удалить заказ" class="delete-icon" onclick="deleteOrder(${order.order_id})">
                        </td>
                    `;

                    ordersTableBody.appendChild(row);
                });
                
                // Обновляем общую сумму в фиксированной строке "Итого"
                const totalAmountElement = document.getElementById('totalAmount');
                totalAmountElement.textContent = totalAmount.toFixed(2) + '₽';
                
            } else {
                alert('Не удалось загрузить заказы');
            }
        })
        .catch(error => console.error('Ошибка при загрузке заказов:', error));
}


// Функция для удаления заказа
function deleteOrder(orderId) {
    if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
        fetch('http://127.0.0.1:3000/delete-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId: orderId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Заказ успешно удален');
                loadClientOrders(); // Перезагружаем таблицу заказов
            } else {
                alert('Ошибка при удалении заказа');
            }
        })
        .catch(error => console.error('Ошибка при удалении заказа:', error));
    }
}

// Функция для оформления заказа
function placeOrder() {
    fetch('http://127.0.0.1:3000/place-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Очищаем корзину
            const ordersTableBody = document.querySelector('#ordersTable tbody');
            ordersTableBody.innerHTML = '';
            document.getElementById('totalAmount').textContent = '0₽';

            // Показываем сообщение подтверждения
            const confirmationMessage = document.getElementById('confirmationMessage');
            confirmationMessage.textContent = 'Спасибо за заказ! В скором времени наш менеджер свяжется с вами для уточнения деталей.';
            confirmationMessage.style.display = 'block';
        } else {
            alert('Ошибка при оформлении заказа');
        }
    })
    .catch(error => console.error('Ошибка при оформлении заказа:', error));
}

// Загружаем заказы клиента при загрузке страницы
loadClientOrders();