"use strict";

// Cliente HTTP da API Python: os dados não são armazenados no navegador.
async function enviarParaApi(caminho, dados) {
	const resposta = await fetch(caminho, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(dados)
	});
	const resultado = await resposta.json();
	if (!resposta.ok) throw new Error(resultado.mensagem || "Não foi possível concluir a solicitação.");
	return resultado;
}

function autenticarUsuario(dadosUsuario) {
	return enviarParaApi("/api/login", {
		email: dadosUsuario.email,
		senha: dadosUsuario.senha
	});
}

function cadastrarUsuario(dadosUsuario) {
	return enviarParaApi("/api/cadastro", {
		nome: dadosUsuario.nome,
		email: dadosUsuario.email,
		senha: dadosUsuario.senha
	});
}

function solicitarRedefinicaoSenha(email) {
	return enviarParaApi("/api/recuperacao-senha", { email });
}
