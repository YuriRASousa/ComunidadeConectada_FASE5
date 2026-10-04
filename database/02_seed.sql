-- =====================================================================
-- Smart HAS - Fase 6
-- 02_seed.sql - carga de dados simulados
--
-- Os ids sao fixos para facilitar a leitura e as chaves estrangeiras.
-- No final, as sequences sao avancadas ate passar do maior id usado,
-- para a aplicacao continuar inserindo sem colidir.
--
-- Datas sao relativas a SYSDATE, entao o cenario continua coerente
-- independentemente do dia em que o script for executado: sempre existem
-- emprestimos devolvidos, ativos no prazo e ativos em atraso.
--
-- Senhas dos usuarios de teste (hash BCrypt, compativel com o
-- BCryptPasswordEncoder do Spring Security):
--   moradores .......... 123456
--   admin@smarthas.com . admin123
-- =====================================================================

-- ---------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------
INSERT INTO sh_categoria (id_categoria, nm_categoria, ds_categoria) VALUES (1, 'FERRAMENTAS', 'Ferramentas manuais e eletricas, escadas e equipamentos de obra');
INSERT INTO sh_categoria (id_categoria, nm_categoria, ds_categoria) VALUES (2, 'SAUDE', 'Itens de mobilidade e cuidado, como cadeira de rodas e muletas');
INSERT INTO sh_categoria (id_categoria, nm_categoria, ds_categoria) VALUES (3, 'EDUCACAO', 'Livros, material escolar e instrumentos de estudo');
INSERT INTO sh_categoria (id_categoria, nm_categoria, ds_categoria) VALUES (4, 'ALIMENTOS', 'Doacao de alimentos e utensilios de cozinha');
INSERT INTO sh_categoria (id_categoria, nm_categoria, ds_categoria) VALUES (5, 'ELETRONICOS', 'Eletronicos e eletrodomesticos de uso pontual');
INSERT INTO sh_categoria (id_categoria, nm_categoria, ds_categoria) VALUES (6, 'OUTROS', 'Itens que nao se encaixam nas demais categorias');

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (1, 'Administrador Smart HAS', 'admin@smarthas.com', '$2b$10$vP30ePht24XPrmkdePvKUeCMqOGd7B4qtL.VBTpMBeqT3jlnadXjO', 'Rua da Consolacao, 100 - Sao Paulo', -23.554500, -46.652000, 5.00, 0, 'S', 'ADMIN', SYSDATE - 400);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (2, 'Marina Guimaraes', 'marina@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Rua Augusta, 1200 - Sao Paulo', -23.556100, -46.660300, 4.80, 12, 'S', 'USER', SYSDATE - 320);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (3, 'Rogerio Tavares', 'rogerio@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Rua Haddock Lobo, 340 - Sao Paulo', -23.557900, -46.663400, 4.50, 9, 'S', 'USER', SYSDATE - 300);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (4, 'Priscila Nakamura', 'priscila@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Alameda Santos, 900 - Sao Paulo', -23.565200, -46.650800, 4.90, 15, 'S', 'USER', SYSDATE - 280);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (5, 'Edson Bittencourt', 'edson@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Rua Bela Cintra, 55 - Sao Paulo', -23.551700, -46.658900, 4.10, 6, 'N', 'USER', SYSDATE - 210);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (6, 'Camila Ferraz', 'camila@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Rua Frei Caneca, 700 - Sao Paulo', -23.553000, -46.647500, 5.00, 4, 'S', 'USER', SYSDATE - 150);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (7, 'Wanderson Lopes', 'wanderson@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Rua Maria Antonia, 20 - Sao Paulo', -23.547300, -46.651400, 3.80, 3, 'N', 'USER', SYSDATE - 90);

INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco, vl_latitude, vl_longitude, vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro)
VALUES (8, 'Leticia Amorim', 'leticia@exemplo.com', '$2b$10$0OwSXpdtrOAUFfYBOf1sp.vPGpFwabK0pGAxp03t8UOuEXo8ZbCpa', 'Rua Avanhandava, 45 - Sao Paulo', -23.548900, -46.643100, 4.70, 8, 'S', 'USER', SYSDATE - 60);

-- ---------------------------------------------------------------------
-- Recursos
-- ---------------------------------------------------------------------
INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (1, 2, 1, 'Furadeira de impacto 650W', 'Furadeira com maleta, brocas para concreto e madeira. Usada duas vezes desde que comprei.', 'EXCELENTE', 'EMPRESTIMO', 'RESERVADO', -23.556100, -46.660300, SYSDATE - 200);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (2, 2, 1, 'Escada de aluminio 5 degraus', 'Escada dobravel, guardada na garagem. Peco devolver limpa.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.556100, -46.660300, SYSDATE - 180);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (3, 3, 1, 'Serra tico-tico', 'Serra tico-tico com duas laminas reserva.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.557900, -46.663400, SYSDATE - 175);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (4, 3, 1, 'Sobra de piso ceramico 8 m2', 'Sobrou da reforma da cozinha, cor cinza claro. Doacao para quem retirar.', 'NOVO', 'DOACAO', 'DISPONIVEL', -23.557900, -46.663400, SYSDATE - 120);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (5, 4, 2, 'Cadeira de rodas dobravel', 'Cadeira semi-nova, usada durante a recuperacao da minha mae.', 'EXCELENTE', 'EMPRESTIMO', 'RESERVADO', -23.565200, -46.650800, SYSDATE - 160);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (6, 4, 2, 'Par de muletas regulaveis', 'Muletas de aluminio, altura ajustavel.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.565200, -46.650800, SYSDATE - 155);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (7, 5, 3, 'Colecao de livros do ensino medio', 'Doze livros didaticos em bom estado, para troca por material infantil.', 'BOM', 'TROCA', 'DISPONIVEL', -23.551700, -46.658900, SYSDATE - 140);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (8, 5, 3, 'Violao de estudo', 'Violao acustico com capa, otimo para quem esta comecando.', 'REGULAR', 'EMPRESTIMO', 'DISPONIVEL', -23.551700, -46.658900, SYSDATE - 135);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (9, 6, 5, 'Furadeira de bancada', 'Equipamento mais pesado, ideal para quem precisa de precisao.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.553000, -46.647500, SYSDATE - 110);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (10, 6, 5, 'Projetor multimidia', 'Projetor usado em reunioes de condominio, com cabo HDMI.', 'EXCELENTE', 'EMPRESTIMO', 'RESERVADO', -23.553000, -46.647500, SYSDATE - 100);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (11, 7, 4, 'Cesta de alimentos nao pereciveis', 'Arroz, feijao, macarrao e oleo. Doacao para familia em necessidade.', 'NOVO', 'DOACAO', 'DISPONIVEL', -23.547300, -46.651400, SYSDATE - 80);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (12, 7, 1, 'Carrinho de mao', 'Carrinho de mao reforcado, otimo para mudanca ou obra pequena.', 'REGULAR', 'EMPRESTIMO', 'DISPONIVEL', -23.547300, -46.651400, SYSDATE - 75);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (13, 8, 1, 'Kit de chaves e alicates', 'Maleta com 40 pecas, chaves de fenda, philips e alicates.', 'EXCELENTE', 'EMPRESTIMO', 'DISPONIVEL', -23.548900, -46.643100, SYSDATE - 55);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (14, 8, 5, 'Maquina de lavar roupa portatil', 'Maquina pequena, util enquanto a sua esta no conserto.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.548900, -46.643100, SYSDATE - 50);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (15, 2, 6, 'Barraca de camping para 4 pessoas', 'Barraca completa com sobreteto e estacas.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.556100, -46.660300, SYSDATE - 45);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (16, 4, 6, 'Caixa de ferramentas de jardinagem', 'Tesoura de poda, pa e regador.', 'REGULAR', 'EMPRESTIMO', 'DISPONIVEL', -23.565200, -46.650800, SYSDATE - 40);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (17, 3, 3, 'Notebook antigo para estudos', 'Notebook simples, serve para trabalho escolar e navegacao.', 'REGULAR', 'DOACAO', 'DISPONIVEL', -23.557900, -46.663400, SYSDATE - 30);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (18, 6, 1, 'Lixadeira orbital', 'Lixadeira com folhas de lixa de varias gramaturas.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.553000, -46.647500, SYSDATE - 20);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (19, 5, 2, 'Nebulizador infantil', 'Aparelho de inalacao, higienizado apos o ultimo uso.', 'EXCELENTE', 'EMPRESTIMO', 'DISPONIVEL', -23.551700, -46.658900, SYSDATE - 12);

INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso, ds_condicao, ds_tipo, ds_disponibilidade, vl_latitude, vl_longitude, dt_cadastro)
VALUES (20, 8, 4, 'Panelas de pressao 4,5 litros', 'Duas panelas, uso ocasional em festa de familia.', 'BOM', 'EMPRESTIMO', 'DISPONIVEL', -23.548900, -46.643100, SYSDATE - 6);

-- ---------------------------------------------------------------------
-- Emprestimos
-- Cenario montado de proposito: devolvidos no prazo, devolvidos com
-- atraso, ativos dentro do prazo, ativos vencidos (viram alerta) e um
-- pedido ainda em analise.
-- ---------------------------------------------------------------------
INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (1, 2, 5, SYSDATE - 170, SYSDATE - 169, SYSDATE - 162, SYSDATE - 163, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (2, 3, 6, SYSDATE - 150, SYSDATE - 150, SYSDATE - 143, SYSDATE - 140, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (3, 6, 7, SYSDATE - 130, SYSDATE - 129, SYSDATE - 115, SYSDATE - 116, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (4, 8, 4, SYSDATE - 120, SYSDATE - 120, SYSDATE - 106, SYSDATE - 104, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (5, 9, 2, SYSDATE - 95, SYSDATE - 94, SYSDATE - 88, SYSDATE - 88, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (6, 12, 3, SYSDATE - 70, SYSDATE - 70, SYSDATE - 63, SYSDATE - 59, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (7, 13, 7, SYSDATE - 45, SYSDATE - 45, SYSDATE - 38, SYSDATE - 36, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (8, 15, 6, SYSDATE - 40, SYSDATE - 39, SYSDATE - 32, SYSDATE - 32, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (9, 16, 8, SYSDATE - 28, SYSDATE - 28, SYSDATE - 21, SYSDATE - 20, 'DEVOLVIDO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (10, 18, 3, SYSDATE - 18, SYSDATE - 18, SYSDATE - 11, SYSDATE - 11, 'DEVOLVIDO');

-- ativos vencidos: alimentam PRC_SH_DETECTA_ATRASOS
INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (11, 1, 7, SYSDATE - 25, SYSDATE - 24, SYSDATE - 10, NULL, 'ATIVO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (12, 5, 5, SYSDATE - 19, SYSDATE - 19, SYSDATE - 4, NULL, 'ATIVO');

-- ativos dentro do prazo
INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (13, 10, 4, SYSDATE - 5, SYSDATE - 5, SYSDATE + 9, NULL, 'ATIVO');

INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (14, 14, 2, SYSDATE - 2, SYSDATE - 2, SYSDATE + 12, NULL, 'ATIVO');

-- pedido ainda nao retirado
INSERT INTO sh_emprestimo (id_emprestimo, id_recurso, id_solicitante, dt_solicitacao, dt_retirada, dt_prev_devolucao, dt_devolucao, st_emprestimo)
VALUES (15, 20, 3, SYSDATE - 1, NULL, SYSDATE + 13, NULL, 'SOLICITADO');

-- ---------------------------------------------------------------------
-- Avaliacoes dos emprestimos ja devolvidos
-- ---------------------------------------------------------------------
INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (1, 1, 2, 5, 5, 'Devolveu antes do combinado e limpa.', SYSDATE - 162);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (2, 2, 3, 6, 5, 'Tudo certo, pessoa muito atenciosa.', SYSDATE - 139);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (3, 3, 4, 7, 4, 'Devolveu no prazo, faltou avisar do horario.', SYSDATE - 115);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (4, 4, 5, 4, 5, 'Cuidou bem do instrumento.', SYSDATE - 103);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (5, 5, 6, 2, 5, 'Combinamos a retirada rapido, recomendo.', SYSDATE - 87);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (6, 6, 7, 3, 3, 'Devolveu com quatro dias de atraso.', SYSDATE - 58);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (7, 7, 8, 7, 4, 'Sem problemas, conversa facil.', SYSDATE - 35);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (8, 8, 2, 6, 5, 'Barraca voltou seca e dobrada, otimo.', SYSDATE - 31);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (9, 9, 4, 8, 5, 'Pontual na retirada e na devolucao.', SYSDATE - 19);

INSERT INTO sh_avaliacao (id_avaliacao, id_emprestimo, id_avaliador, id_avaliado, nr_nota, ds_comentario, dt_avaliacao)
VALUES (10, 10, 6, 3, 4, 'Tudo certo, so demorou a responder no chat.', SYSDATE - 10);

-- ---------------------------------------------------------------------
-- Mensagens
-- ---------------------------------------------------------------------
INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (1, 7, 2, 1, 'Oi Marina, a furadeira ainda esta disponivel para o fim de semana?', SYSDATE - 26, 'S');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (2, 2, 7, 1, 'Esta sim. Pode retirar amanha depois das 18h.', SYSDATE - 26, 'S');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (3, 5, 4, 5, 'Boa tarde, preciso da cadeira por duas semanas. Tudo bem?', SYSDATE - 20, 'S');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (4, 4, 5, 5, 'Sem problema, deixo separada aqui na portaria.', SYSDATE - 20, 'S');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (5, 4, 6, 10, 'O projetor tem cabo HDMI junto?', SYSDATE - 6, 'S');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (6, 6, 4, 10, 'Tem sim, vai na bolsa junto com o controle.', SYSDATE - 6, 'S');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (7, 3, 8, 20, 'As panelas ainda estao livres para o proximo sabado?', SYSDATE - 1, 'N');

INSERT INTO sh_mensagem (id_mensagem, id_remetente, id_destinatario, id_recurso, ds_conteudo, dt_envio, fl_lida)
VALUES (8, 8, 2, 15, 'Marina, obrigada pela barraca, foi perfeita para o feriado.', SYSDATE - 30, 'S');

-- ---------------------------------------------------------------------
-- Ajusta as sequences para o proximo id livre de cada tabela
-- ---------------------------------------------------------------------
DECLARE
    -- Avanca uma sequence ate ultrapassar o maior id ja carregado.
    -- Feito em laco para funcionar em qualquer versao do Oracle, sem
    -- depender do ALTER SEQUENCE ... RESTART (18c em diante).
    PROCEDURE ajusta(p_sequence IN VARCHAR2, p_tabela IN VARCHAR2, p_coluna IN VARCHAR2) IS
        v_max      NUMBER;
        v_atual    NUMBER;
    BEGIN
        EXECUTE IMMEDIATE 'SELECT NVL(MAX(' || p_coluna || '), 0) FROM ' || p_tabela INTO v_max;
        LOOP
            EXECUTE IMMEDIATE 'SELECT ' || p_sequence || '.NEXTVAL FROM dual' INTO v_atual;
            EXIT WHEN v_atual >= v_max;
        END LOOP;
    END ajusta;
BEGIN
    ajusta('sq_sh_categoria',  'sh_categoria',  'id_categoria');
    ajusta('sq_sh_usuario',    'sh_usuario',    'id_usuario');
    ajusta('sq_sh_recurso',    'sh_recurso',    'id_recurso');
    ajusta('sq_sh_mensagem',   'sh_mensagem',   'id_mensagem');
    ajusta('sq_sh_emprestimo', 'sh_emprestimo', 'id_emprestimo');
    ajusta('sq_sh_avaliacao',  'sh_avaliacao',  'id_avaliacao');
END;
/

COMMIT;

-- Conferencia rapida da carga
SELECT 'sh_categoria'  AS tabela, COUNT(*) AS registros FROM sh_categoria
UNION ALL SELECT 'sh_usuario',    COUNT(*) FROM sh_usuario
UNION ALL SELECT 'sh_recurso',    COUNT(*) FROM sh_recurso
UNION ALL SELECT 'sh_emprestimo', COUNT(*) FROM sh_emprestimo
UNION ALL SELECT 'sh_avaliacao',  COUNT(*) FROM sh_avaliacao
UNION ALL SELECT 'sh_mensagem',   COUNT(*) FROM sh_mensagem;
