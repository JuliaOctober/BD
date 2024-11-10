var adminButton = document.getElementById('admin-button');
var clientButton = document.getElementById('client-button');
var adminForm = document.getElementById('admin-form');
var clientForm = document.getElementById('client-form');
var clientDetailsForm = document.getElementById('client-details-form');
var adminLoginButton = document.getElementById('admin-login-button');
var clientLoginButton = document.getElementById('client-login-button');
var clientRegisterButton = document.getElementById('client-register-button');
var clientSaveDetailsButton = document.getElementById('client-save-details-button');

adminButton.onclick = function() {
    adminButton.style.display = 'none';
    clientButton.style.display = 'none';
    adminForm.style.display = 'block';
};

clientButton.onclick = function() {
    adminButton.style.display = 'none';
    clientButton.style.display = 'none';
    clientForm.style.display = 'block';
};

// Проверка входа для администратора
adminLoginButton.onclick = function() {
    var login = document.getElementById('admin-login').value;
    var password = document.getElementById('admin-password').value;

    if (login === 'admin' && password === '1234') {
        window.location.href = 'Lk_admin.html';
    } else {
        alert('Неверный логин или пароль');
    }
};

// Проверка входа для клиента
clientLoginButton.onclick = function() {
    var name = document.getElementById('client-name').value;
    var email = document.getElementById('client-email').value;

    // AJAX-запрос к серверу для проверки имени и почты
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:3000/client-login', true); 
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.success) {
                localStorage.setItem('client_name', name);
                localStorage.setItem('client_email', email);
                window.location.href = 'Lk_client.html';
            } else {
                alert('Неверные имя или почта');
            }
        }
    };
    xhr.send(JSON.stringify({ name: name, email: email }));
};


// Регистрация клиента
clientRegisterButton.onclick = function() {
    clientForm.style.display = 'none';
    clientDetailsForm.style.display = 'block';
};

clientSaveDetailsButton.onclick = function() {
    var firstname = document.getElementById('client-firstname').value;
    var lastname = document.getElementById('client-lastname').value;
    var phone = document.getElementById('client-phone').value;
    var email = document.getElementById('client-email-reg').value;

    // AJAX-запрос на регистрацию клиента
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:3000/register-client', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.success) {
                alert('Регистрация прошла успешно!');
                localStorage.setItem('client_name', firstname);
                localStorage.setItem('client_email', email);
                window.location.href = 'Lk_client.html';
            } else {
                alert('Ошибка регистрации: ' + response.message);
            }
        }
    };
    xhr.send(JSON.stringify({
        firstname: firstname,
        lastname: lastname,
        phone: phone,
        email: email
    }));
    
};

// Функция для получения данных профиля клиента
function getClientProfile(name, email) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://127.0.0.1:3000/client-profile', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject('Клиент не найден');
                }
            } else {
                reject('Ошибка сервера');
            }
        };

        xhr.send(JSON.stringify({ name: name, email: email }));
    });
}




/////////////////////////
