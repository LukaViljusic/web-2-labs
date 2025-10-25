const loginClick = () => {
    window.location.href = "/login"
}

const logoutClick = () => {
    window.location.href = "/logout"
}

const validateForm = () => {
    const submitButton = document.getElementById("submitButton");
    const idInput = document.getElementById("idNumber");
    const lotoNumsInput = document.getElementById("lotoNumbers");
    const errorIdElem = document.getElementById("errorNumberId");

    let isValid = true;

    const idValue = idInput.value.trim();
    if (idValue.length === 0 || idValue.length > 20) {
        isValid = false;
    } else {
        errorIdElem.textContent = "";
    }

    const lotoValue = lotoNumsInput.value.trim();
    let lotoNums = lotoValue.split(",").map(n => parseInt(n.trim(), 10));
    
    if (lotoValue === "" || lotoNums.some(isNaN)) {
        isValid = false;
    } else if (lotoNums.some(n => n < 1 || n > 45)) {
        isValid = false;
    } else if (new Set(lotoNums).size !== lotoNums.length) {
        isValid = false;
    } else if (lotoNums.length < 6 || lotoNums.length > 10) {
        isValid = false;
    } 

    if (submitButton) {
        submitButton.classList.toggle("disabled", !isValid);
    }
};

const checkData = () => {
    const idInput = document.getElementById("idNumber");
    const lotoNumsInput = document.getElementById("lotoNumbers");
    const errorIdElem = document.getElementById("errorNumberId");
    const errorLotoElem = document.getElementById("errorLotoNumbers");

    let isValid = true;

    const idValue = idInput.value.trim();
    if (idValue.length === 0 || idValue.length > 20) {
        errorIdElem.textContent = "Neispravan broj osobne iskaznice/putovnice!";
        isValid = false;
    } else {
        errorIdElem.textContent = "";
    }

    const lotoValue = lotoNumsInput.value.trim();
    let lotoNums = lotoValue.split(",").map(n => parseInt(n.trim(), 10));
    
    if (lotoValue === "" || lotoNums.some(isNaN)) {
        errorLotoElem.textContent = "Svi unosi moraju biti brojevi!";
        isValid = false;
    } else if (lotoNums.some(n => n < 1 || n > 45)) {
        errorLotoElem.textContent = "Brojevi moraju biti u rasponu od 1 do 45!";
        isValid = false;
    } else if (new Set(lotoNums).size !== lotoNums.length) {
        errorLotoElem.textContent = "Brojevi se ne smiju ponavljati!";
        isValid = false;
    } else if (lotoNums.length < 6 || lotoNums.length > 10) {
        errorLotoElem.textContent = "Morate unijeti između 6 i 10 brojeva!";
        isValid = false;
    } else {
        errorLotoElem.textContent = "";
    }

    return isValid;
}

const submitTicket = async () => {
    if(!checkData()) return;

    const idInput = document.getElementById("idNumber");
    const lotoNumsInput = document.getElementById("lotoNumbers");

    if (!idInput || !lotoNumsInput) return;

    const idNumber = idInput.value.trim();
    const lotoNumbers = lotoNumsInput.value.split(",").map(num => parseInt(num.trim(), 10));

    const response = await fetch("/new-ticket", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idNumber, lotoNumbers })
    });

    if (response.ok) {
        const { qrCode, url } = await response.json();
        document.getElementById("QRCode-img").src = qrCode;
        document.getElementById("QRCode-link").href = url;
        toggleModal();
    } else {
        console.error("Greška prilikom kreiranja ticketa");
        alert("Neuspješno stvaranje novog tiketa, runda je zatvorena!");
    }
};

const toggleModal = () => {
    const modal = document.getElementById("modalId");
    if(modal.classList.contains("active"))
        modal.classList.remove("active");
    else
        modal.classList.add("active");
}


window.onload = () => {
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const idInput = document.getElementById("idNumber");
    const lotoNumsInput = document.getElementById("lotoNumbers");
    const submitButton = document.getElementById("submitButton");
    const closeModalButton = document.getElementById("close-button");

    if(loginButton) loginButton.addEventListener("click", loginClick);
    if(logoutButton) logoutButton.addEventListener("click", logoutClick);
    if(idInput) idInput.addEventListener("input", validateForm);
    if(lotoNumsInput) lotoNumsInput.addEventListener("input", validateForm);
    if(submitButton) submitButton.addEventListener("click", submitTicket);
    if(closeModalButton) closeModalButton.addEventListener("click", toggleModal);
}

