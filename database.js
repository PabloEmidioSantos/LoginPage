"use strict";

const USERS_STORAGE_KEY = "login-page-users";

function getUsers() {
	const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
	return savedUsers ? JSON.parse(savedUsers) : [];
}

function saveUsers(users) {
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

async function loginUser(userData) {
	const users = getUsers();
	const user = users.find((savedUser) => savedUser.email === userData.email);

	if (!user || user.password !== userData.password) {
		throw new Error("E-mail ou senha inválidos.");
	}

	localStorage.setItem("login-page-current-user", JSON.stringify({
		name: user.name,
		email: user.email
	}));

	return { success: true, message: `Bem-vindo, ${user.name}!` };
}

async function registerUser(userData) {
	const users = getUsers();
	const emailAlreadyExists = users.some((user) => user.email === userData.email);

	if (emailAlreadyExists) {
		throw new Error("Este e-mail já está cadastrado.");
	}

	users.push({
		name: userData.name,
		email: userData.email,
		password: userData.password
	});

	saveUsers(users);
	return { success: true, message: "Cadastro realizado com sucesso!" };
}

async function requestPasswordReset(email) {
	const userExists = getUsers().some((user) => user.email === email);

	if (!userExists) {
		throw new Error("Nenhuma conta foi encontrada com este e-mail.");
	}

	return { success: true, message: "Conta encontrada. Faça login para continuar." };
}
