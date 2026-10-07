"use strict";

const abas = document.querySelectorAll(".tab");
const formularios = document.querySelectorAll(".form");
const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

function animar(elemento, quadros, opcoes) {
	if (!movimentoReduzido.matches && elemento.animate) elemento.animate(quadros, opcoes);
}

function alternarFormulario(idAlvo) {
	abas.forEach((aba) => {
		const estaAtiva = aba.dataset.target === idAlvo;
		aba.classList.toggle("active", estaAtiva);
		aba.setAttribute("aria-selected", String(estaAtiva));
	});

	formularios.forEach((formulario) => {
		const estaAtivo = formulario.id === idAlvo;
		formulario.classList.toggle("active", estaAtivo);
		if (estaAtivo) animar(formulario, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 280, easing: "ease-out" });
	});
}

abas.forEach((aba) => aba.addEventListener("click", () => alternarFormulario(aba.dataset.target)));

document.querySelectorAll(".show-password").forEach((botao) => {
	botao.addEventListener("click", () => {
		const campoSenha = document.getElementById(botao.dataset.password);
		const senhaVisivel = campoSenha.type === "text";
		campoSenha.type = senhaVisivel ? "password" : "text";
		botao.textContent = senhaVisivel ? "Mostrar" : "Ocultar";
		botao.setAttribute("aria-label", senhaVisivel ? "Mostrar senha" : "Ocultar senha");
	});
});

function exibirMensagem(formulario, texto, tipo) {
	const mensagem = formulario.querySelector(".message");
	mensagem.textContent = texto;
	mensagem.className = `message ${tipo}`;
	animar(mensagem, [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 220 });
}

function validarFormulario(formulario) {
	const senha = formulario.elements.senha;
	const confirmacaoSenha = formulario.elements.confirmacaoSenha;

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
	const dadosUsuario = Object.fromEntries(new FormData(formulario).entries());
	const botao = formulario.querySelector(".submit-button");
	const textoOriginal = botao.textContent;
	botao.disabled = true;
	botao.textContent = "Processando...";
	botao.classList.add("carregando");

	try {
		const resultado = formulario.id === "register-form"
			? await cadastrarUsuario(dadosUsuario)
			: await autenticarUsuario(dadosUsuario);
		exibirMensagem(formulario, resultado.mensagem, "success");
	} catch (erro) {
		exibirMensagem(formulario, erro.message, "error");
	} finally {
		botao.disabled = false;
		botao.textContent = textoOriginal;
		botao.classList.remove("carregando");
	}
}

formularios.forEach((formulario) => formulario.addEventListener("submit", (evento) => {
	evento.preventDefault();
	if (validarFormulario(formulario)) enviarFormulario(formulario);
}));

document.querySelector('[data-action="forgot-password"]').addEventListener("click", async (evento) => {
	evento.preventDefault();
	const formulario = document.getElementById("login-form");
	const email = formulario.elements.email.value.trim();
	if (!email) {
		exibirMensagem(formulario, "Informe seu e-mail para recuperar a senha.", "error");
		formulario.elements.email.focus();
		return;
	}
	try {
		const resultado = await solicitarRedefinicaoSenha(email);
		exibirMensagem(formulario, resultado.mensagem, "success");
	} catch (erro) {
		exibirMensagem(formulario, erro.message, "error");
	}
});

document.querySelectorAll("button").forEach((botao) => botao.addEventListener("click", (evento) => {
	animar(botao, [{ transform: "scale(1)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }], { duration: 180 });
	if (botao.classList.contains("submit-button") && !botao.disabled) {
		const limite = botao.getBoundingClientRect();
		botao.style.setProperty("--posicao-clique", `${evento.clientX - limite.left}px ${evento.clientY - limite.top}px`);
	}
}));
