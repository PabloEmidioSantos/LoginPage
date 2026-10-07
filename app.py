"""Conexão ao mariaDB feito pello claude"""

import os
import re
from threading import Lock

import mariadb
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
PASTA_APLICACAO = os.path.dirname(os.path.abspath(__file__))
# Ajuste MARIADB_HOST, MARIADB_PORT, MARIADB_USER, MARIADB_PASSWORD e MARIADB_DATABASE.
NOME_BANCO = os.getenv("MARIADB_DATABASE", "login_page")
BANCO_INICIALIZADO = False
TRAVA_INICIALIZACAO = Lock()


def configuracao_mariadb(com_banco=True):
	"""Lê as credenciais do MariaDB do ambiente, sem gravá-las no código."""
	configuracao = {
		"host": os.getenv("MARIADB_HOST", "localhost"),
		"port": int(os.getenv("MARIADB_PORT", "3306")),
		"user": os.getenv("MARIADB_USER", "root"),
		"password": os.getenv("MARIADB_PASSWORD", ""),
	}
	if com_banco:
		configuracao["database"] = NOME_BANCO
	return configuracao


def obter_conexao():
	"""Cria o banco/tabela na primeira conexão e devolve uma conexão MariaDB."""
	global BANCO_INICIALIZADO
	if not re.fullmatch(r"[A-Za-z0-9_]+", NOME_BANCO):
		raise RuntimeError("MARIADB_DATABASE deve conter somente letras, números e _. ")

	if not BANCO_INICIALIZADO:
		with TRAVA_INICIALIZACAO:
			if not BANCO_INICIALIZADO:
				conexao_servidor = mariadb.connect(**configuracao_mariadb(com_banco=False))
				try:
					cursor = conexao_servidor.cursor()
					cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{NOME_BANCO}` CHARACTER SET utf8mb4")
					cursor.close()
				finally:
					conexao_servidor.close()

				conexao_inicial = mariadb.connect(**configuracao_mariadb())
				try:
					cursor = conexao_inicial.cursor()
					cursor.execute(
						"""CREATE TABLE IF NOT EXISTS usuarios (
							id INT AUTO_INCREMENT PRIMARY KEY,
							nome VARCHAR(120) NOT NULL,
							email VARCHAR(254) NOT NULL UNIQUE,
							senha_hash VARCHAR(255) NOT NULL,
							criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
						) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"""
					)
					cursor.close()
				finally:
					conexao_inicial.close()
				BANCO_INICIALIZADO = True

	return mariadb.connect(**configuracao_mariadb())


def responder_erro(mensagem, status):
	return jsonify(sucesso=False, mensagem=mensagem), status


@app.get("/")
def pagina_inicial():
	return send_from_directory(PASTA_APLICACAO, "index.html")


@app.get("/<caminho>")
def arquivos_frontend(caminho):
	if caminho in {"style.css", "script.js", "database.js"}:
		return send_from_directory(PASTA_APLICACAO, caminho)
	return responder_erro("Página não encontrada.", 404)


@app.post("/api/cadastro")
def cadastrar_usuario():
	dados = request.get_json(silent=True) or {}
	if not isinstance(dados, dict):
		return responder_erro("Envie os dados do cadastro em formato JSON.", 400)
	nome = str(dados.get("nome", "")).strip()
	email = str(dados.get("email", "")).strip().lower()
	senha = str(dados.get("senha", ""))

	if len(nome) < 3 or len(nome) > 120 or "@" not in email or len(email) > 254 or len(senha) < 6:
		return responder_erro("Confira o nome, o e-mail e a senha (mínimo de 6 caracteres).", 400)

	conexao = None
	try:
		conexao = obter_conexao()
		cursor = conexao.cursor()
		cursor.execute("SELECT id FROM usuarios WHERE email = ?", (email,))
		if cursor.fetchone():
			return responder_erro("Este e-mail já está cadastrado.", 409)

		cursor.execute(
			"INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
			(nome, email, generate_password_hash(senha)),
		)
		conexao.commit()
		return jsonify(sucesso=True, mensagem="Cadastro realizado com sucesso!")
	except mariadb.Error:
		app.logger.exception("Falha ao cadastrar usuário")
		return responder_erro("Não foi possível concluir o cadastro. Tente novamente.", 503)
	finally:
		if conexao:
			conexao.close()


@app.post("/api/login")
def autenticar_usuario():
	dados = request.get_json(silent=True) or {}
	if not isinstance(dados, dict):
		return responder_erro("Envie os dados de acesso em formato JSON.", 400)
	email = str(dados.get("email", "")).strip().lower()
	senha = str(dados.get("senha", ""))
	conexao = None
	try:
		conexao = obter_conexao()
		cursor = conexao.cursor(dictionary=True)
		cursor.execute("SELECT nome, senha_hash FROM usuarios WHERE email = ?", (email,))
		usuario = cursor.fetchone()
		if not usuario or not check_password_hash(usuario["senha_hash"], senha):
			return responder_erro("E-mail ou senha inválidos.", 401)
		return jsonify(sucesso=True, mensagem=f"Bem-vindo, {usuario['nome']}!")
	except mariadb.Error:
		app.logger.exception("Falha ao autenticar usuário")
		return responder_erro("Não foi possível entrar agora. Tente novamente.", 503)
	finally:
		if conexao:
			conexao.close()


@app.post("/api/recuperacao-senha")
def solicitar_redefinicao_senha():
	# O envio de e-mail não está configurado; a resposta não revela se a conta existe.
	return jsonify(sucesso=True, mensagem="Se o e-mail estiver cadastrado, você receberá instruções.")


if __name__ == "__main__":
	app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")