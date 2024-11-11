// Функция для загрузки заказов клиента
        // Функция для загрузки заказов клиента
        function loadClientOrders() {
            fetch('http://127.0.0.1:3000/client-orders')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const ordersTableBody = document.querySelector('#ordersTable tbody');
                        ordersTableBody.innerHTML = ''; // Очищаем таблицу перед добавлением новых данных

                        data.orders.forEach(order => {
                            const row = document.createElement('tr');
                            // Преобразуем sum в число, если оно строка или undefined
                            const totalSum = parseFloat(order.sum);

                            row.innerHTML = `
                                <td>${formatDate(order.datetime)}</td>
                                <td>
                                    <ul>
                                        ${order.products.map(product => `
                                            <li>${product.name} - ${product.count} шт. по ${product.price} руб. (Итого: ${product.total_price.toFixed(2)} руб.)</li>
                                        `).join('')}
                                    </ul>
                                </td>
                                <td>${!isNaN(totalSum) ? totalSum.toFixed(2) : 'Ошибка'}</td>
                                <td><button onclick="deleteOrder(${order.order_id})">Удалить</button></td>
                            `;
                            ordersTableBody.appendChild(row);
                        });
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

        // Функция для форматирования даты
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
        }

        // Загружаем заказы клиента при загрузке страницы
        loadClientOrders();