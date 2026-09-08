"use strict";

const tabs = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".form");

function switchForm(targetId) {
	tabs.forEach((tab) => {
		const isActive = tab.dataset.target === targetId;
		tab.classList.toggle("active", isActive);
		tab.setAttribute("aria-selected", String(isActive));
	});

	forms.forEach((form) => {
		form.classList.toggle("active", form.id === targetId);
	});
}

tabs.forEach((tab) => {
	tab.addEventListener("click", () => switchForm(tab.dataset.target));
});

document.querySelectorAll(".show-password").forEach((button) => {
	button.addEventListener("click", () => {
		const input = document.getElementById(button.dataset.password);
		const showing = input.type === "text";
		input.type = showing ? "password" : "text";
		button.textContent = showing ? "Mostrar" : "Ocultar";
	});
});

function showMessage(form, text, type) {
	const message = form.querySelector(".message");
	message.textContent = text;
	message.className = `message ${type}`;
}

function validateForm(form) {
	const password = form.elements.password;
	const confirmation = form.elements.passwordConfirmation;

	if (!form.checkValidity()) {
		showMessage(form, "Revise os campos destacados e tente novamente.", "error");
		form.reportValidity();
		return false;
	}

	if (confirmation && password.value !== confirmation.value) {
		showMessage(form, "As senhas não são iguais.", "error");
		confirmation.focus();
		return false;
	}

	return true;
}

async function submitForm(form) {
	const formData = new FormData(form);
	const userData = Object.fromEntries(formData.entries());
	const button = form.querySelector(".submit-button");

	button.disabled = true;
	button.textContent = "Processando...";

	try {
		const result = form.id === "register-form"
			? await registerUser(userData)
			: await loginUser(userData);
		showMessage(form, result.message, "success");
	} catch (error) {
		showMessage(form, error.message, "error");
	} finally {
		button.disabled = false;
		button.textContent = form.id === "register-form" ? "Criar minha conta" : "Entrar na conta";
	}
}

document.querySelectorAll(".form").forEach((form) => {
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		if (validateForm(form)) submitForm(form);
	});
});

document.querySelector('[data-action="forgot-password"]').addEventListener("click", async (event) => {
	event.preventDefault();
	const form = document.getElementById("login-form");
	const email = form.elements.email.value.trim();

	if (!email) {
		showMessage(form, "Informe seu e-mail para recuperar a senha.", "error");
		form.elements.email.focus();
		return;
	}

	try {
		const result = await requestPasswordReset(email);
		showMessage(form, result.message, "success");
	} catch (error) {
		showMessage(form, error.message, "error");
	}
});
