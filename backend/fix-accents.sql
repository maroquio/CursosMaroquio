-- Script para corrigir acentos e cedilhas no curso Python
-- Executar com: docker exec -u postgres bun-backend-postgres psql -U cursos_maroquio -d cursos_maroquio -f /fix-accents.sql

BEGIN;

-- ============================================================
-- CORREÇÃO DOS MÓDULOS
-- ============================================================

UPDATE modules SET
  title = 'Fundamentos da Linguagem',
  description = 'Neste primeiro módulo, conheceremos um pouco melhor a linguagem Python e aprenderemos a usar seus recursos de programação mais básicos, incluindo declaração de variáveis, realização de operações matemáticas, entrada de dados pelo usuário e exibição de dados para o usuário.'
WHERE id = '019bed97-89ab-728b-99b4-d64df3e822ba';

UPDATE modules SET
  title = 'Estruturas Condicionais',
  description = 'Aprenda a criar programas que tomam decisões usando estruturas condicionais em Python. Domine if, elif, else, operadores lógicos, comparações e a estrutura match-case.'
WHERE id = '019bed97-8a40-7484-abf3-5cbf5e7bb187';

UPDATE modules SET
  title = 'Estruturas de Repetição',
  description = 'Aprenda a usar estruturas de repetição em Python para automatizar tarefas repetitivas, processar dados em massa e controlar o fluxo de execução do seu código.'
WHERE id = '019bed97-8a8c-75e1-b3c5-fba68be964a4';

UPDATE modules SET
  title = 'Números, Textos, Datas e Horas',
  description = 'Python é uma linguagem de programação que permite manipular números, textos, datas e horas de maneira avançada. Com algumas funções e bibliotecas nativas, você pode realizar operações complexas usando esses tipos de dados.'
WHERE id = '019bed97-8aea-73f3-b20a-178e10d9d5c2';

UPDATE modules SET
  title = 'Funções',
  description = 'Este módulo aborda as funções em Python, um recurso extremamente importante para a criação de programas mais organizados, compreensíveis, testáveis e fáceis de manter.'
WHERE id = '019bed97-8b3a-774b-8f46-67a9eadf53bc';

UPDATE modules SET
  title = 'Coleções',
  description = 'A linguagem Python possui quatro tipos de coleções: listas, tuplas, dicionários e conjuntos. Neste módulo, são apresentadas técnicas avançadas e eficientes para manipulação de coleções em Python.'
WHERE id = '019bed97-8bbd-71f5-94bc-5df51089ee62';

UPDATE modules SET
  title = 'Arquivos, Módulos e Pacotes',
  description = 'Neste módulo, você aprenderá a trabalhar com arquivos, módulos e pacotes em Python. Você irá abrir, ler e criar arquivos, bem como usar os recursos de gerenciamento de arquivos para manipulá-los em um sistema de arquivos, copiando, movendo, excluindo, compactando e descompactando arquivos e diretórios. Além disso, você aprenderá a importar e a utilizar módulos e pacotes em Python, incluindo módulos e pacotes de terceiros e módulos e pacotes criados por você mesmo.'
WHERE id = '019bed97-8c63-767c-99aa-ae9e11ef9754';

UPDATE modules SET
  title = 'Programação Orientada a Objetos',
  description = 'Python é uma linguagem orientada a objetos, o que significa que ela permite a criação de objetos que podem interagir entre si por meio de métodos e que podem manter seus estados através de atributos. Neste módulo, vamos conhecer os recursos essenciais de programação orientada a objetos em Python.'
WHERE id = '019bed97-8ce1-751a-ad02-ee1ce193ed20';

UPDATE modules SET
  title = 'Tratamento de Exceções',
  description = 'Neste módulo, você aprenderá a lidar com erros inesperados que ocorrem durante a execução de programas Python. Dominar o tratamento de exceções é essencial para criar programas robustos que não falham abruptamente quando algo dá errado.'
WHERE id = '019bed97-8db8-74fe-91ac-0d2d0c4b9b1e';

UPDATE modules SET
  title = 'Programação Concorrente em Python',
  description = 'Aprenda técnicas de programação concorrente em Python, incluindo multiprocessing, multithreading e programação assíncrona para criar aplicações eficientes e responsivas.'
WHERE id = '019bed97-8e5d-7371-a75d-5263f094f086';

-- ============================================================
-- CORREÇÃO DAS AULAS (LESSONS) - Títulos
-- ============================================================

-- Usando UPDATE em massa com REPLACE para padrões comuns
UPDATE lessons SET title = REPLACE(title, 'Historico', 'Histórico')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Caracteristicas', 'Características')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Variaveis', 'Variáveis')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Basicos', 'Básicos')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Basica', 'Básica')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Colecoes', 'Coleções')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Matematicos', 'Matemáticos')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Saida', 'Saída')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Convencoes', 'Convenções')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Codigo', 'Código')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Praticas', 'Práticas')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Pratico', 'Prático')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Introducao', 'Introdução')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Logicos', 'Lógicos')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Comparacao', 'Comparação')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Ternario', 'Ternário')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Repeticao', 'Repetição')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Exercicios', 'Exercícios')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Operacoes', 'Operações')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Matematicas', 'Matemáticas')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Avancadas', 'Avançadas')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Metodos', 'Métodos')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Expressoes', 'Expressões')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Manipulacao', 'Manipulação')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Funcoes', 'Funções')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Parametros', 'Parâmetros')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Recursao', 'Recursão')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Indexacao', 'Indexação')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Dicionarios', 'Dicionários')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Modulo', 'Módulo')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Modulos', 'Módulos')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Diretorios', 'Diretórios')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Dependencias', 'Dependências')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Programacao', 'Programação')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Heranca', 'Herança')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Bancario', 'Bancário')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Excecoes', 'Exceções')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Assincrona', 'Assíncrona')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Concorrencia', 'Concorrência')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Paises', 'Países')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

-- Correções específicas com "às"
UPDATE lessons SET title = REPLACE(title, 'Introducao as', 'Introdução às')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

UPDATE lessons SET title = REPLACE(title, 'Introducao a ', 'Introdução à ')
WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');

-- ============================================================
-- CORREÇÃO DAS SEÇÕES (SECTIONS) - Títulos
-- ============================================================

-- Mesmas correções para seções
UPDATE sections SET title = REPLACE(title, 'Caracteristicas', 'Características')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Exercicio:', 'Exercício:')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Historico', 'Histórico')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Instalacao', 'Instalação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'O que sao', 'O que são')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Variaveis', 'Variáveis')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Reatribuicao', 'Reatribuição')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Numericos', 'Numéricos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Logicos', 'Lógicos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Funcao', 'Função')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Conversoes', 'Conversões')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Colecoes', 'Coleções')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Dicionarios', 'Dicionários')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Aritmeticos', 'Aritméticos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Basicos', 'Básicos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Basica', 'Básica')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Divisao', 'Divisão')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Modulo', 'Módulo')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Potencia', 'Potência')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Trigonometricas', 'Trigonométricas')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Conversao', 'Conversão')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Saida', 'Saída')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Formatacao', 'Formatação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Introducao', 'Introdução')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Convencoes', 'Convenções')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Espacamento', 'Espaçamento')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Indentacao', 'Indentação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Organizacao', 'Organização')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Praticas', 'Práticas')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Pratico', 'Prático')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Condicoes', 'Condições')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Numeros', 'Números')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Comparacao', 'Comparação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Comparacoes', 'Comparações')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Ternario', 'Ternário')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Padroes', 'Padrões')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Padrao', 'Padrão')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Semaforo', 'Semáforo')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Repeticao', 'Repetição')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Indice', 'Índice')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Media', 'Média')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Validacao', 'Validação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Instrucao', 'Instrução')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Lacos', 'Laços')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Multiplicacao', 'Multiplicação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Verificacao', 'Verificação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Numero', 'Número')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Revisao', 'Revisão')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Funcoes', 'Funções')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Metodos', 'Métodos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Expressoes', 'Expressões')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Manipulacao', 'Manipulação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Recursao', 'Recursão')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Indexacao', 'Indexação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Iteracao', 'Iteração')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Ordenacao', 'Ordenação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Avancado', 'Avançado')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Avancada', 'Avançada')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Avancados', 'Avançados')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Avancadas', 'Avançadas')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Diretorios', 'Diretórios')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Modulos', 'Módulos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Dependencias', 'Dependências')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Orientacao', 'Orientação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Heranca', 'Herança')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Hierarquia', 'Hierarquia')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Excecoes', 'Exceções')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Programacao', 'Programação')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Assincrona', 'Assíncrona')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Concorrencia', 'Concorrência')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Paises', 'Países')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Parametros', 'Parâmetros')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Codigo', 'Código')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Matematicos', 'Matemáticos')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Bancario', 'Bancário')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Operacoes', 'Operações')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

UPDATE sections SET title = REPLACE(title, 'Aplicacoes', 'Aplicações')
WHERE lesson_id IN (
  SELECT l.id FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e'
);

COMMIT;

-- Verificação
SELECT 'Correção concluída!' as resultado;
SELECT COUNT(*) as total_modulos FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e';
SELECT COUNT(*) as total_aulas FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');
SELECT COUNT(*) as total_secoes FROM sections WHERE lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = '019bed97-89a5-71cd-9a94-6296b1f2026e');
