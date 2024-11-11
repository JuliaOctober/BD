var express = require('express');
var mysql = require('mysql2'); 
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var port = 3000;
app.listen(port, function() {
    console.log('Server is running on http://localhost:' + port);
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456Ii!',
    database: 'mydb'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Обработка входа клиента
app.post('/client-login', function(req, res) {
    var name = req.body.name;
    var email = req.body.email;

    var query = 'SELECT * FROM clients WHERE name = ? AND email = ?';
    connection.query(query, [name, email], function(error, results) {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            res.json({ success: true, message: 'Login successful', redirectUrl: 'Lk_client.html' });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Обработка регистрации клиента
app.post('/register-client', function(req, res) {
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var email = req.body.email;
    var points = 0; 
    var level = "-";

    connection.query('SELECT MAX(id) AS last_id FROM program_loyalty', function(error, results) {
        if (error) {
            console.error('Ошибка при получении последнего ID:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении последнего ID' });
        }
        
        var newProgramLoyaltyId = (results[0].last_id || 0) + 1;

        connection.query('INSERT INTO program_loyalty (id, idclient, points, level) VALUES (?, ?, ?, ?)', 
        [newProgramLoyaltyId, newProgramLoyaltyId, points, level], 
        function(error, results) {
            if (error) {
                console.error('Ошибка при добавлении в program_loyalty:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при добавлении в program_loyalty' });
            }

            var newProgramLoyaltyRecordId = newProgramLoyaltyId; 

            connection.query('INSERT INTO clients (id, name, lastname, phone, email, program_loyalty_id) VALUES (?, ?, ?, ?, ?, ?)', 
            [newProgramLoyaltyRecordId, firstname, lastname, phone, email, newProgramLoyaltyRecordId], 
            function(error, results) {
                if (error) {
                    console.error('Ошибка при добавлении клиента:', error);
                    return res.status(500).json({ success: false, message: 'Ошибка при добавлении клиента' });
                }

                var newClientId = results.insertId; 

                connection.query('UPDATE program_loyalty SET idclient = ? WHERE id = ?', 
                [newProgramLoyaltyId, newProgramLoyaltyRecordId], 
                function(error) {
                    if (error) {
                        console.error('Ошибка при обновлении program_loyalty с idclient:', error);
                        return res.status(500).json({ success: false, message: 'Ошибка при обновлении program_loyalty с idclient' });
                    }

                    res.json({ success: true, message: 'Клиент успешно зарегистрирован!' });
                });
            });
        });
    });
});

let clientID;
// Обработка запроса для получения данных клиента
app.post('/client-profile', function(req, res) {
    var name = req.body.name;
    var email = req.body.email;

    // Запрос к базе данных для получения данных клиента
    connection.query(`
        SELECT clients.id, clients.name, clients.lastname, clients.phone, clients.email, clients.loyalty, 
               program_loyalty.points, program_loyalty.level
        FROM clients
        JOIN program_loyalty ON clients.program_loyalty_id = program_loyalty.id
        WHERE clients.name = ? AND clients.email = ?
    `, [name, email], function(error, results) {
        if (error) {
            console.error('Ошибка при получении профиля клиента:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении профиля клиента' });
        }

        if (results.length > 0) {
            const client = results[0];
            clientID = client.id;
            const loyaltyStatus = client.loyalty === 0 ? "Нет" : "Есть";
            const lastLogin = new Date().toLocaleDateString(); // Последний вход (текущая дата)

            res.json({
                success: true,
                data: {
                    id: clientID,
                    name: client.name,
                    lastname: client.lastname,
                    phone: client.phone,
                    email: client.email,
                    loyalty: loyaltyStatus,
                    points: client.points,
                    level: client.level,
                    lastLogin: lastLogin
                }
            });
        } else {
            res.json({ success: false, message: 'Клиент не найден' });
        }
    });
});




///////////////////
// Получить список всех категорий
app.get('/categories', function(req, res) {
    connection.query('SELECT * FROM catagory', function(error, results) {
        if (error) {
            console.error('Ошибка при получении категорий:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении категорий' });
        }
        res.json({ success: true, data: results });
    });
});

// Получить список товаров (по категории или все)
app.get('/catalog', function(req, res) {
    const categoryId = req.query.categoryId;

    // Если указан categoryId, фильтруем по категории, иначе возвращаем все товары
    let query = 'SELECT catalog.id, catalog.name_product, catalog.price, catagory.name AS category_name ' +
                'FROM catalog ' +
                'JOIN catagory ON catalog.idcategory = catagory.id';

    if (categoryId) {
        query += ' WHERE catalog.idcategory = ?';
    }

    connection.query(query, [categoryId], function(error, results) {
        if (error) {
            console.error('Ошибка при получении каталога:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении каталога' });
        }
        res.json({ success: true, data: results });
    });
});


app.use('/images', express.static('public/images'));

//////////////////
// Для сохранения заказа
app.post('/save-order', function(req, res) {
    const { clientId, cart } = req.body;
    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    connection.query('SELECT MAX(id) AS last_id FROM orders', function(error, results) {
        if (error) {
            console.error('Ошибка при получении последнего ID заказа:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении последнего ID заказа' });
        }

        const newOrderId = (results[0].last_id || 0) + 1;

        let totalSum = 0;
        let productIds = cart.map(item => item.productId); 

        connection.query('SELECT id, price FROM catalog WHERE id IN (?)', [productIds], function(error, catalogResults) {
            if (error) {
                console.error('Ошибка при получении цен товаров:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при получении цен товаров' });
            }

            let priceMap = {};
            catalogResults.forEach(item => {
                priceMap[item.id] = item.price;
            });

            cart.forEach(item => {
                const quantity = parseInt(item.quantity, 10);
                const price = priceMap[item.productId];

                if (!isNaN(quantity) && !isNaN(price)) {
                    totalSum += quantity * price;
                } else {
                    console.error(`Ошибка при расчете стоимости для товара ${item.productId}: количество=${quantity}, цена=${price}`);
                }
            });

            connection.query('INSERT INTO orders (id, idclient, sum, datetime, clients_id) VALUES (?, ?, ?, ?, ?)', 
            [newOrderId, clientID, totalSum.toFixed(2), dateTime, clientID], 
            function(error) {
                if (error) {
                    console.error('Ошибка при добавлении заказа:', error);
                    return res.status(500).json({ success: false, message: 'Ошибка при добавлении заказа' });
                }

                connection.query('SELECT MAX(id) AS last_id FROM ordered_products', function(error, results) {
                    if (error) {
                        console.error('Ошибка при получении последнего ID из ordered_products:', error);
                        return res.status(500).json({ success: false, message: 'Ошибка при получении последнего ID из ordered_products' });
                    }

                    let newOrderedProductId = (results[0].last_id || 0) + 1;

                    cart.forEach(item => {
                        const price = priceMap[item.productId];
                        const productId = item.productId;
                        const quantity = item.quantity;

                        connection.query('INSERT INTO ordered_products (id, idorder, idproduct, count, price, orders_id, catalog_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                        [newOrderedProductId, newOrderId, productId, quantity, price, newOrderId, productId], 
                        function(error) {
                            if (error) {
                                console.error('Ошибка при добавлении товара в заказ:', error);
                            }
                        });

                        newOrderedProductId += 1;
                    });

                    res.json({ success: true, message: 'Заказ успешно сохранен' });
                });
            });
        });
    });
});

////////////////
app.get('/orders', function(req, res) {
    const query = `
        SELECT 
            clients.name AS client_name,
            clients.lastname AS client_lastname,
            orders.id AS order_id,
            orders.sum AS total_sum,
            orders.datetime AS order_date,
            catalog.name_product AS product_name,
            ordered_products.count AS product_quantity,
            ordered_products.price AS product_price
        FROM 
            orders
        JOIN 
            clients ON orders.idclient = clients.id
        JOIN 
            ordered_products ON orders.id = ordered_products.idorder
        JOIN 
            catalog ON ordered_products.idproduct = catalog.id
        ORDER BY 
            orders.datetime DESC;
    `;

    connection.query(query, function(error, results) {
        if (error) {
            console.error('Ошибка при получении заказов:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении заказов' });
        }
        res.json({ success: true, data: results });
    });
});

/////////////////////////////
// Получение всех товаров из базы данных и их вывод на страницу
app.get('/get-products', function(req, res) {
    connection.query(`
        SELECT catalog.id, catalog.name_product, catalog.price, catalog.idcategory, catagory.name AS catagory_name
        FROM catalog
        JOIN catagory ON catalog.idcategory = catagory.id
    `, function(error, results) {
        if (error) {
            console.error('Ошибка при получении товаров:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении товаров' });
        }
        res.json({ success: true, products: results });
    });
});

// Удаление товара из базы данных
app.post('/delete-product', function(req, res) {
    const productId = req.body.productId;

    // Шаг 1: Удалить все связанные записи в таблице ordered_products
    connection.query('DELETE FROM ordered_products WHERE catalog_id = ?', [productId], function(error) {
        if (error) {
            console.error('Ошибка при удалении записей из ordered_products:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при удалении записей из ordered_products' });
        }

        // Шаг 2: Удалить товар из таблицы catalog
        connection.query('DELETE FROM catalog WHERE id = ?', [productId], function(error) {
            if (error) {
                console.error('Ошибка при удалении товара из catalog:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при удалении товара из catalog' });
            }
            res.json({ success: true, message: 'Товар удален' });
        });
    });
});

// Маршрут для добавления нового товара
app.post('/add-product', function(req, res) {
    const { name, price, categoryId } = req.body;

    // Шаг 1: Получить последний ID из таблицы catalog и определить новый ID
    connection.query('SELECT MAX(id) AS last_id FROM catalog', function(error, results) {
        if (error) {
            console.error('Ошибка при получении последнего ID товара:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении последнего ID товара' });
        }

        const newProductId = (results[0].last_id || 0) + 1;

        // Шаг 2: Вставить новый товар в таблицу catalog
        connection.query('INSERT INTO catalog (id, name_product, price, idcategory, catagory_id) VALUES (?, ?, ?, ?, ?)', 
        [newProductId, name, price, categoryId, categoryId], 
        function(error) {
            if (error) {
                console.error('Ошибка при добавлении товара в catalog:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при добавлении товара' });
            }
            res.json({ success: true, message: 'Товар успешно добавлен' });
        });
    });
});

// Маршрут для получения списка категорий (для загрузки в выпадающий список)
app.get('/categories2', function(req, res) {
    connection.query('SELECT id, name FROM catagory', function(error, results) {
        if (error) {
            console.error('Ошибка при получении категорий:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении категорий' });
        }
        res.json({ success: true, categories: results });
    });
});
//////////////////////////////
// Маршрут для получения списка сотрудников
app.get('/staff', function(req, res) {
    connection.query('SELECT * FROM staff', function(error, results) {
        if (error) {
            console.error('Ошибка при получении списка сотрудников:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении списка сотрудников' });
        }
        res.json({ success: true, staff: results });
    });
});

// Маршрут для добавления нового сотрудника
app.post('/add-staff', function(req, res) {
    const { name, lastname, dateOfHiring, passport, post } = req.body;

    connection.query('SELECT MAX(id) AS last_id FROM staff', function(error, results) {
        if (error) {
            console.error('Ошибка при получении последнего ID сотрудника:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при получении последнего ID сотрудника' });
        }

        const newStaffId = (results[0].last_id || 0) + 1;

        connection.query('INSERT INTO staff (id, name, lastname, dateofhiring, passport, post) VALUES (?, ?, ?, ?, ?, ?)', 
        [newStaffId, name, lastname, dateOfHiring, passport, post], 
        function(error) {
            if (error) {
                console.error('Ошибка при добавлении сотрудника в базу данных:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при добавлении сотрудника' });
            }
            res.json({ success: true, message: 'Сотрудник успешно добавлен' });
        });
    });
});


// Маршрут для удаления сотрудника
// Обработка запроса для удаления сотрудника
app.delete('/delete-staff/:id', function(req, res) {
    const staffId = req.params.id;

    // Начинаем транзакцию для выполнения обоих запросов
    connection.beginTransaction(function(err) {
        if (err) {
            console.error('Ошибка при начале транзакции:', err);
            return res.status(500).json({ success: false, message: 'Ошибка при удалении сотрудника' });
        }

        // Шаг 1: Удаляем записи из таблицы worktime, связанные с этим сотрудником
        connection.query('DELETE FROM worktime WHERE idstaff = ?', [staffId], function(error) {
            if (error) {
                return connection.rollback(function() {
                    console.error('Ошибка при удалении записей из worktime:', error);
                    res.status(500).json({ success: false, message: 'Ошибка при удалении данных из worktime' });
                });
            }

            // Шаг 2: Удаляем сотрудника из таблицы staff
            connection.query('DELETE FROM staff WHERE id = ?', [staffId], function(error) {
                if (error) {
                    return connection.rollback(function() {
                        console.error('Ошибка при удалении сотрудника:', error);
                        res.status(500).json({ success: false, message: 'Ошибка при удалении сотрудника' });
                    });
                }

                // Если оба запроса прошли успешно, коммитим транзакцию
                connection.commit(function(err) {
                    if (err) {
                        return connection.rollback(function() {
                            console.error('Ошибка при коммите транзакции:', err);
                            res.status(500).json({ success: false, message: 'Ошибка при сохранении изменений' });
                        });
                    }

                    // Успешное удаление
                    res.json({ success: true, message: 'Сотрудник успешно удален' });
                });
            });
        });
    });
});

///////////////
app.get('/client-orders', function(req, res) {
    connection.query(
        `SELECT orders.id AS order_id, orders.datetime, orders.sum, ordered_products.count, ordered_products.price, catalog.name_product 
        FROM orders
        JOIN ordered_products ON orders.id = ordered_products.idorder
        JOIN catalog ON ordered_products.catalog_id = catalog.id
        WHERE orders.idclient = ?`,
        [clientID],
        function(error, results) {
            if (error) {
                console.error('Ошибка при получении заказов клиента:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при получении заказов' });
            }

            // Группируем данные по заказам, чтобы отображать каждый заказ отдельно
            let orders = [];
            results.forEach(item => {
                let order = orders.find(o => o.order_id === item.order_id);
                if (!order) {
                    order = {
                        order_id: item.order_id,
                        datetime: item.datetime,
                        sum: item.sum,
                        products: []
                    };
                    orders.push(order);
                }
                order.products.push({
                    name: item.name_product,
                    count: item.count,
                    price: item.price,
                    total_price: item.count * item.price
                });
            });

            res.json({ success: true, orders: orders });
        }
    );
});

app.post('/delete-order', function(req, res) {
    const orderId = req.body.orderId;

    // Шаг 1: Удалить все записи из таблицы ordered_products, связанные с данным заказом
    connection.query('DELETE FROM ordered_products WHERE orders_id = ?', [orderId], function(error) {
        if (error) {
            console.error('Ошибка при удалении записей из ordered_products:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при удалении записей из ordered_products' });
        }

        // Шаг 2: Удалить все записи в таблице orders_staff, связанные с данным заказом
        connection.query('DELETE FROM orders_staff WHERE orders_id = ?', [orderId], function(error) {
            if (error) {
                console.error('Ошибка при удалении записей из orders_staff:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при удалении записей из orders_staff' });
            }

            // Шаг 3: Удалить заказ из таблицы orders
            connection.query('DELETE FROM orders WHERE id = ?', [orderId], function(error) {
                if (error) {
                    console.error('Ошибка при удалении заказа:', error);
                    return res.status(500).json({ success: false, message: 'Ошибка при удалении заказа' });
                }

                // Возвращаем успешный ответ
                res.json({ success: true, message: 'Заказ успешно удален' });
            });
        });
    });
});

app.post('/place-order', function(req, res) {
    const userId = req.body.userId; 

    connection.query('DELETE FROM orders WHERE clients_id = ?', [userId], function(error) {
        if (error) {
            console.error('Ошибка при очистке корзины:', error);
            return res.status(500).json({ success: false, message: 'Ошибка при очистке корзины' });
        }

        // Возвращаем успешный ответ
        res.json({ success: true, message: 'Заказ успешно оформлен. Спасибо! Наш менеджер свяжется с вами.' });
    });
});
