
const submitSQLInjection = async () => {
    let sqlInjectionInput = document.getElementById("query");
    let switchCheckBox = document.getElementById("switch");
    let username = sqlInjectionInput.value;
    let isChecked = switchCheckBox.checked;

    const response = await fetch("/get-users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, isChecked})
    });
    if(response.ok) {
        const { result } = await response.json();
        if(result.length !== 0) {
            result.forEach(user => {
                alert(`ID: ${user.id}\nUsername: ${user.username}\nEmail: ${user.email}`);
            });
        } else {
            alert("Cannot find user!");
        }
    } else {
        if(!isChecked) {
            const { error } = await response.json();
            alert("Error while fetching data: " + error);
        } else {
            alert("Error while fetching data!");
        }
    }
}

const login = async() => {
    let switchCheckBox = document.getElementById("switch");
    let usernameInput = document.getElementById("username");
    let passwordInput = document.getElementById("password");
    let errorLabel = document.getElementById("errorLabel");

    let isChecked = switchCheckBox.checked;
    let username = usernameInput.value;
    let password = passwordInput.value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, password, isChecked})
    });

    if(response.ok) {
        errorLabel.innerText = "";
        alert("Successfull login");
        window.location.reload();
    } else {
        const { message } = await response.json();
        errorLabel.innerText = message;
    }
}

const logout = async() => {
    const response = await fetch("/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if(response.ok) {
        window.alert("Successfull logout");
        window.location.reload();
    } else {
        window.alert("Unsuccessfull logout");
    }
}

const stealCookie = () => {
    const cookies = document.cookie;
    const sessionCookie = cookies.split('; ').find(row => row.startsWith('sessionId='));
    const value = sessionCookie ? sessionCookie.split('=')[1] : '';

    if (!value) {
        alert("No session cookie found!");
        return;
    }

    const copy = prompt("Your session cookie (select and copy):", value);
}

const privateContent = async() => {
    const cookieInput = document.getElementById('cookie-value');
    const cookieValue = cookieInput.value;

    if (!cookieValue) {
        alert("Please enter a cookie value!");
        return;
    }

    window.location.href = `/profile-attack?cookie=${encodeURIComponent(cookieValue)}`;
}

window.onload = () => {
    let sqlInjectionButton = document.getElementById("sql-injection-button");
    let loginButton = document.getElementById("login-button");
    let logoutButton = document.getElementById("logout-button");
    let stealButton = document.getElementById("steal-button");
    let privateButton = document.getElementById("private-button");

    if(sqlInjectionButton)
        sqlInjectionButton.addEventListener("click", submitSQLInjection);

    if(loginButton)
        loginButton.addEventListener("click", login);

    if(logoutButton)
        logoutButton.addEventListener("click", logout);

    if(stealButton)
        stealButton.addEventListener("click", stealCookie);

    if(privateButton)
        privateButton.addEventListener("click", privateContent)
}