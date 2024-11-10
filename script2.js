
function populateClientProfile(profileData) {
    document.querySelector('.profile-info h2').innerText = `${profileData.name} ${profileData.lastname}`;
    document.querySelector('.profile-info p:nth-of-type(1)').innerHTML = `<strong>Почта:</strong> ${profileData.email}`;
    document.querySelector('.profile-info p:nth-of-type(2)').innerHTML = `<strong>Телефон:</strong> ${profileData.phone}`;

    document.querySelector('.additional-info p:nth-of-type(1)').innerHTML = `<strong>Лояльность:</strong> ${profileData.loyalty}`;
    document.querySelector('.additional-info p:nth-of-type(2)').innerHTML = `<strong>Баллы:</strong> ${profileData.points}`;
    document.querySelector('.additional-info p:nth-of-type(3)').innerHTML = `<strong>Уровень:</strong> ${profileData.level}`;
    document.querySelector('.additional-info p:nth-of-type(4)').innerHTML = `<strong>Последний вход:</strong> ${profileData.lastLogin}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const clientName = localStorage.getItem('client_name');
    const clientEmail = localStorage.getItem('client_email');
    if (clientName && clientEmail) {
        getClientProfile(clientName, clientEmail).then(function(profileData) {
            populateClientProfile(profileData);
        }).catch(function(error) {
            console.error(error);
            alert('Не удалось загрузить профиль');
        });
    }
});
