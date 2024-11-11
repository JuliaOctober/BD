// Функция для отображения товаров на странице
function loadProducts() {
    fetch('http://127.0.0.1:3000/get-products')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tableBody = document.getElementById('productsTable').querySelector('tbody');
                tableBody.innerHTML = ''; // Очистить таблицу перед добавлением новых данных

                data.products.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.name_product}</td>
                        <td>${product.price} ₽</td>
                        <td>${product.catagory_name}</td>
                        <td>
                            <button class="delete-btn" onclick="deleteProduct(${product.id})">
                                <img src="img8.png" alt="Удалить" class="delete-icon">
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                alert('Ошибка при загрузке товаров');
            }
        })
        .catch(error => console.error('Ошибка при загрузке товаров:', error));
}

// Загружаем товары при загрузке страницы
window.onload = loadProducts;

/// Функция для удаления товара
function deleteProduct(productId) {
    fetch('http://127.0.0.1:3000/delete-product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: productId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Товар удален');
            loadProducts(); // Перезагружаем товары
        } else {
            alert('Ошибка при удалении товара');
        }
    })
    .catch(error => console.error('Ошибка при удалении товара:', error));
}
////////////////////////////////
// Функция для добавления нового товара
function addProduct() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const categoryId = parseInt(document.getElementById('productCategory').value);

    // Проверка на валидность введенных данных
    if (!name || isNaN(price) || isNaN(categoryId)) {
        alert('Пожалуйста, заполните все поля корректно');
        return;
    }

    fetch('http://127.0.0.1:3000/add-product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            price: price,
            categoryId: categoryId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Товар успешно добавлен');
            loadProducts(); // Обновляем список товаров
            document.getElementById('productName').value = ''; // Очистка полей формы
            document.getElementById('productPrice').value = '';
            document.getElementById('productCategory').value = '';
        } else {
            alert('Ошибка при добавлении товара');
        }
    })
    .catch(error => console.error('Ошибка при добавлении товара:', error));
}

// Функция для загрузки категорий в выпадающий список при загрузке страницы
function loadCategories() {
    fetch('http://127.0.0.1:3000/categories2')
    .then(response => response.json())
    .then(data => {
        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = ''; // Очистка перед добавлением

        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    })
    .catch(error => console.error('Ошибка при загрузке категорий:', error));
}

// Загружаем категории при загрузке страницы
document.addEventListener('DOMContentLoaded', loadCategories);
