"use strict";

const abas = document.querySelectorAll(".tab");
const formularios = document.querySelectorAll(".form");

function alternarFormulario(idAlvo) {
	abas.forEach((aba) => {
		const estaAtiva = aba.dataset.target === idAlvo;
		aba.classList.toggle("active", estaAtiva);
		aba.setAttribute("aria-selected", String(estaAtiva));
	});

	formularios.forEach((formulario) => {
		formulario.classList.toggle("active", formulario.id === idAlvo);
	});
}

abas.forEach((aba) => {
	aba.addEventListener("click", () => alternarFormulario(aba.dataset.target));
});

document.querySelectorAll(".show-password").forEach((botao) => {
	botao.addEventListener("click", () => {
		const campoSenha = document.getElementById(botao.dataset.password);
		const senhaVisivel = campoSenha.type === "text";
		campoSenha.type = senhaVisivel ? "password" : "text";
		botao.textContent = senhaVisivel ? "Mostrar" : "Ocultar";
	});
});

function exibirMensagem(formulario, texto, tipo) {
	const mensagem = formulario.querySelector(".message");
	mensagem.textContent = texto;
	mensagem.className = `message ${tipo}`;
}

function validarFormulario(formulario) {
	const senha = formulario.elements.password;
	const confirmacaoSenha = formulario.elements.passwordConfirmation;

	if (!formulario.checkValidity()) {
		exibirMensagem(formulario, "Revise os campos destacados e tente novamente.", "error");
		formulario.reportValidity();
		return false;
	}

	if (confirmacaoSenha && senha.value !== confirmacaoSenha.value) {
		exibirMensagem(formulario, "As senhas não são iguais.", "error");
		confirmacaoSenha.focus();
		return false;
	}

	return true;
}

async function enviarFormulario(formulario) {
	const dadosFormulario = new FormData(formulario);
	const dadosUsuario = Object.fromEntries(dadosFormulario.entries());
	const botao = formulario.querySelector(".submit-button");

	botao.disabled = true;
	botao.textContent = "Processando...";

	try {
		const resultado = formulario.id === "register-form"
			? await cadastrarUsuario(dadosUsuario)
			: await autenticarUsuario(dadosUsuario);
		exibirMensagem(formulario, resultado.message, "success");
	} catch (erro) {
		exibirMensagem(formulario, erro.message, "error");
	} finally {
		botao.disabled = false;
		botao.textContent = formulario.id === "register-form" ? "Criar minha conta" : "Entrar na conta";
	}
}

document.querySelectorAll(".form").forEach((formulario) => {
	formulario.addEventListener("submit", (evento) => {
		evento.preventDefault();
		if (validarFormulario(formulario)) enviarFormulario(formulario);
	});
});

document.querySelector('[data-action="forgot-password"]').addEventListener("click", async (evento) => {
	evento.preventDefault();
	const formulario = document.getElementById("login-form");
	const enderecoEmail = formulario.elements.email.value.trim();

	if (!enderecoEmail) {
		exibirMensagem(formulario, "Informe seu e-mail para recuperar a senha.", "error");
		formulario.elements.email.focus();
		return;
	}

	try {
		const resultado = await solicitarRedefinicaoSenha(enderecoEmail);
		exibirMensagem(formulario, resultado.message, "success");
	} catch (erro) {
		exibirMensagem(formulario, erro.message, "error");
	}
});
