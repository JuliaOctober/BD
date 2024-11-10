// Получить элементы на странице
var categorySelect = document.getElementById('category-select');
var productList = document.getElementById('product-list');

// Функция для загрузки категорий
function loadCategories() {
    fetch('http://127.0.0.1:3000/categories')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                data.data.forEach(category => {
                    var option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Ошибка при загрузке категорий:', error));
}

// Функция для загрузки товаров
// Функция для загрузки товаров с изображениями
function loadProducts(categoryId = '') {
    const url = categoryId ? `http://127.0.0.1:3000/catalog?categoryId=${categoryId}` : 'http://127.0.0.1:3000/catalog';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                productList.innerHTML = ''; // Очистить список товаров

                data.data.forEach(product => {
                    const productDiv = document.createElement('div');
                    productDiv.className = 'product-item';

                    // Определяем путь к изображению
                    const imagePath = `http://127.0.0.1:3000/images/catalog_image_${product.id}.png`;

                    // Структура товара с кнопками +, - и полем количества
                    productDiv.innerHTML = `
                        <img src="${imagePath}" alt="${product.name_product}" class="product-image">
                        <h3>${product.name_product}</h3>
                        <p>Цена: ${product.price} руб.</p>
                        <p>Категория: ${product.category_name}</p>
                        <button class="decrement" data-id="${product.id}">-</button>
                        <span class="product-quantity" id="quantity-${product.id}" data-id="${product.id}">0</span>
                        <button class="increment" data-id="${product.id}">+</button>
                    `;
                    productList.appendChild(productDiv);
                });
            }
        })
        .catch(error => console.error('Ошибка при загрузке товаров:', error));
}


// Обработчик изменения категории
categorySelect.addEventListener('change', () => {
    var selectedCategory = categorySelect.value;
    loadProducts(selectedCategory);
});

// Загрузка категорий и всех товаров при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
});

let cart = []; // Массив для хранения товаров в корзине

// Обработчик нажатия на кнопку "+"
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('increment')) {
        const productId = event.target.getAttribute('data-id');
        updateQuantity(productId, 1); // Увеличиваем количество
    }
});

// Обработчик нажатия на кнопку "-"
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('decrement')) {
        const productId = event.target.getAttribute('data-id');
        updateQuantity(productId, -1); // Уменьшаем количество
    }
});

// Обновление количества товара
function updateQuantity(productId, delta) {
    const quantityElement = document.getElementById(`quantity-${productId}`);
    let quantity = parseInt(quantityElement.textContent);

    quantity += delta;
    if (quantity < 0) quantity = 0; // Не позволяем отрицательные количества

    quantityElement.textContent = quantity;

    // Обновляем корзину
    const existingProductIndex = cart.findIndex(item => item.productId == productId);
    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity = quantity;
    } else {
        cart.push({ productId: productId, quantity: quantity });
    }
}

// Обработчик кнопки "Сохранить заказ"
document.getElementById('save-order-btn').addEventListener('click', function() {
    saveOrder();
});

// Функция для сохранения заказа
function saveOrder() {
    // Получаем id клиента
    const clientId = 1;
    
    if (cart.length > 0) {
        fetch('http://127.0.0.1:3000/save-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: clientId,
                cart: cart
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Заказ успешно сохранен');
                cart = []; // Очищаем корзину после успешного сохранения
            } else {
                alert('Ошибка при сохранении заказа');
            }
        })
        .catch(error => console.error('Ошибка при сохранении заказа:', error));
    } else {
        alert('Корзина пуста');
    }
}
