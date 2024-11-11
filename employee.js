// Функция для загрузки сотрудников из базы данных
function loadStaff() {
    fetch('http://127.0.0.1:3000/staff')
    .then(response => response.json())
    .then(data => {
        const staffList = document.getElementById('staff-list');
        staffList.innerHTML = ''; // Очищаем список перед обновлением

        data.staff.forEach(staff => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${staff.name}</td>
                <td>${staff.lastname}</td>
                <td>${formatDate(staff.dateofhiring)}</td>
                <td>${staff.passport}</td>
                <td>${staff.post}</td>
                <td><button onclick="deleteStaff(${staff.id})">-</button></td>
            `;

            staffList.appendChild(row);
        });
    })
    .catch(error => console.error('Ошибка при загрузке списка сотрудников:', error));
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];  // Оставляем только дату в формате YYYY-MM-DD
}


// Функция для добавления нового сотрудника
function addStaff() {
    const name = document.getElementById('staffName').value;
    const lastname = document.getElementById('staffLastname').value;
    const dateOfHiring = document.getElementById('staffDateOfHiring').value;
    const passport = document.getElementById('staffPassport').value;
    const post = document.getElementById('staffPost').value;

    // Проверка на валидность введенных данных
    if (!name || !lastname || !dateOfHiring || !passport || !post) {
        alert('Пожалуйста, заполните все поля корректно');
        return;
    }

    fetch('http://127.0.0.1:3000/add-staff', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            lastname: lastname,
            dateOfHiring: dateOfHiring,
            passport: passport,
            post: post
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Сотрудник успешно добавлен');
            loadStaff(); // Обновляем список сотрудников
        } else {
            alert('Ошибка при добавлении сотрудника');
        }
    })
    .catch(error => console.error('Ошибка при добавлении сотрудника:', error));
}

// Функция для удаления сотрудника
function deleteStaff(staffId) {
    fetch(`http://127.0.0.1:3000/delete-staff/${staffId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Сотрудник успешно удален');
            loadStaff(); // Обновляем список сотрудников
        } else {
            alert('Ошибка при удалении сотрудника');
        }
    })
    .catch(error => console.error('Ошибка при удалении сотрудника:', error));
}

// Загрузка списка сотрудников при загрузке страницы
document.addEventListener('DOMContentLoaded', loadStaff);
