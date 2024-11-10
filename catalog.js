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
                    var productDiv = document.createElement('div');
                    productDiv.className = 'product-item';

                    // Определяем путь к изображению
                    var imagePath = `http://127.0.0.1:3000/images/catalog_image_${product.id}.png`;

                    productDiv.innerHTML = `
                        <img src="${imagePath}" alt="${product.name_product}" class="product-image" onerror="this.onerror=null;this.src='default_image.png';">
                        <h3>${product.name_product}</h3>
                        <p>Цена: ${product.price} руб.</p>
                        <p>Категория: ${product.category_name}</p>
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
