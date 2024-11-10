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