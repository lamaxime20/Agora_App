const ADMIN_FORM_LOCALSTORAGE = "ADMIN_FORM_LOCALSTORAGE";

export function getADMIN_FORM_LOCALSTORAGE() {
    return localStorage.getItem(ADMIN_FORM_LOCALSTORAGE) || false;
}

export function setADMIN_FORM_LOCALSTORAGE(value) {
    localStorage.setItem(ADMIN_FORM_LOCALSTORAGE, value);
}

export function removeADMIN_FORM_LOCALSTORAGE() {
    localStorage.removeItem(ADMIN_FORM_LOCALSTORAGE);
}