"use strict";

const CHAVE_ARMAZENAMENTO_USUARIOS = "login-page-users";

function obterUsuarios() {
	const usuariosSalvos = localStorage.getItem(CHAVE_ARMAZENAMENTO_USUARIOS);
	return usuariosSalvos ? JSON.parse(usuariosSalvos) : [];
}

function salvarUsuarios(usuarios) {
	localStorage.setItem(CHAVE_ARMAZENAMENTO_USUARIOS, JSON.stringify(usuarios));
}

async function autenticarUsuario(dadosUsuario) {
	const usuarios = obterUsuarios();
	const usuario = usuarios.find((usuarioSalvo) => usuarioSalvo.email === dadosUsuario.email);

	if (!usuario || usuario.password !== dadosUsuario.password) {
		throw new Error("E-mail ou senha inválidos.");
	}

	localStorage.setItem("login-page-current-user", JSON.stringify({
		name: usuario.name,
		email: usuario.email
	}));

	return { success: true, message: `Bem-vindo, ${usuario.name}!` };
}

async function cadastrarUsuario(dadosUsuario) {
	const usuarios = obterUsuarios();
	const emailJaCadastrado = usuarios.some((usuario) => usuario.email === dadosUsuario.email);

	if (emailJaCadastrado) {
		throw new Error("Este e-mail já está cadastrado.");
	}

	usuarios.push({
		name: dadosUsuario.name,
		email: dadosUsuario.email,
		password: dadosUsuario.password
	});

	salvarUsuarios(usuarios);
	return { success: true, message: "Cadastro realizado com sucesso!" };
}

async function solicitarRedefinicaoSenha(enderecoEmail) {
	const usuarioExiste = obterUsuarios().some((usuario) => usuario.email === enderecoEmail);

	if (!usuarioExiste) {
		throw new Error("Nenhuma conta foi encontrada com este e-mail.");
	}

	return { success: true, message: "Conta encontrada. Faça login para continuar." };
}
